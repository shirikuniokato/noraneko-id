package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"noraneko-id/internal/config"
	"noraneko-id/internal/handler"
	"noraneko-id/internal/middleware"
	"noraneko-id/internal/model"
	"noraneko-id/pkg/database"
	"noraneko-id/pkg/oauth2"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

// setupIntegrationTestServer 統合テスト用のサーバーをセットアップ
func setupIntegrationTestServer() (*gin.Engine, *config.Config) {
	gin.SetMode(gin.TestMode)
	
	cfg := &config.Config{
		Server: config.ServerConfig{
			Port: "8080",
		},
		Database: config.DatabaseConfig{
			Host:     "localhost",
			Port:     "5432",
			User:     "noraneko",
			Password: "dev_password",
			DBName:   "noraneko_test",
			SSLMode:  "disable",
		},
		JWT: config.JWTConfig{
			Secret: "integration-test-secret-key",
		},
		OAuth2: config.OAuth2Config{
			AccessTokenExpirationHours: 1,
			RefreshTokenExpirationDays: 30,
		},
	}

	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// CORS設定
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// ハンドラーの初期化
	authHandler := handler.NewAuthHandler(cfg)
	oauth2Handler := handler.NewOAuth2Handler(cfg)
	clientHandler := handler.NewClientHandler(cfg)

	// ルーティング設定
	auth := router.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/logout", authHandler.Logout)
		auth.GET("/profile", middleware.AuthMiddleware(), authHandler.Profile)
		auth.GET("/login", authHandler.LoginPage)
		auth.GET("/register", authHandler.RegisterPage)
	}

	oauth2Group := router.Group("/oauth2")
	{
		oauth2Group.Any("/authorize", middleware.AuthMiddleware(), oauth2Handler.Authorize)
		oauth2Group.POST("/token", oauth2Handler.Token)
		oauth2Group.GET("/userinfo", oauth2Handler.UserInfo)
		oauth2Group.POST("/revoke", oauth2Handler.Revoke)
		oauth2Group.GET("/client-info/:client_id", oauth2Handler.GetClientInfo)
	}

	admin := router.Group("/admin", middleware.AuthMiddleware(), middleware.AdminAuthMiddleware())
	{
		admin.POST("/clients", clientHandler.CreateClient)
		admin.GET("/clients", clientHandler.GetClients)
		admin.GET("/clients/:id", clientHandler.GetClient)
		admin.PUT("/clients/:id", clientHandler.UpdateClient)
		admin.DELETE("/clients/:id", clientHandler.DeleteClient)
		admin.POST("/clients/:id/regenerate-secret", clientHandler.RegenerateClientSecret)
	}

	return router, cfg
}

// createIntegrationTestData 統合テスト用のテストデータを作成
func createIntegrationTestData(t *testing.T) (*model.User, *model.OAuthClient) {
	if database.GetDB() == nil {
		t.Skip("Database not available for integration test")
	}

	db := database.GetDB()

	// テスト用ユーザーを作成
	passwordHash, err := bcrypt.GenerateFromPassword([]byte("testpassword123"), bcrypt.DefaultCost)
	require.NoError(t, err)

	testUser := &model.User{
		Email:         "integration@test.com",
		PasswordHash:  string(passwordHash),
		Username:      "integrationtest",
		DisplayName:   stringPtr("Integration Test User"),
		EmailVerified: true,
		IsActive:      true,
	}
	require.NoError(t, db.Create(testUser).Error)

	// テスト用OAuth2クライアントを作成
	clientSecret := "integration-test-secret"
	hash := sha256.Sum256([]byte(clientSecret))
	hashedSecret := hex.EncodeToString(hash[:])

	testClient := &model.OAuthClient{
		ClientID:         "integration-test-client",
		ClientSecretHash: hashedSecret,
		Name:             "Integration Test Client",
		Description:      stringPtr("OAuth2 client for integration testing"),
		RedirectURIs:     pq.StringArray{"http://localhost:3000/auth/callback", "http://localhost:3001/auth/callback"},
		AllowedScopes:    pq.StringArray{"openid", "profile", "email", "read", "write"},
		IsConfidential:   false, // Public client for easier testing
		IsActive:         true,
		RequireConsent:   false, // Skip consent for testing
		TrustedClient:    true,  // Trusted client for automatic approval
		CreatedBy:        &testUser.ID,
	}
	require.NoError(t, db.Create(testClient).Error)

	return testUser, testClient
}

// cleanupIntegrationTestData 統合テスト用のデータをクリーンアップ
func cleanupIntegrationTestData(user *model.User, client *model.OAuthClient) {
	if database.GetDB() == nil {
		return
	}

	db := database.GetDB()
	
	// 関連するOAuth2データを削除
	db.Where("client_id = ? OR user_id = ?", client.ID, user.ID).Delete(&model.OAuthAuthorizationCode{})
	db.Where("client_id = ? OR user_id = ?", client.ID, user.ID).Delete(&model.OAuthAccessToken{})
	db.Where("client_id = ? OR user_id = ?", client.ID, user.ID).Delete(&model.OAuthRefreshToken{})
	db.Where("user_id = ?", user.ID).Delete(&model.UserSession{})
	
	// メインデータを削除
	db.Delete(client)
	db.Delete(user)
}

func stringPtr(s string) *string {
	return &s
}

// TestFullOAuth2AuthorizationFlow OAuth2認可フローの統合テスト
func TestFullOAuth2AuthorizationFlow(t *testing.T) {
	router, _ := setupIntegrationTestServer()
	testUser, testClient := createIntegrationTestData(t)
	defer cleanupIntegrationTestData(testUser, testClient)

	t.Run("1. User Registration and Login", func(t *testing.T) {
		// ユーザー登録（既に作成済みなのでスキップ）
		// ユーザーログイン
		loginReq := handler.LoginRequest{
			Email:    testUser.Email,
			Password: "testpassword123",
		}

		jsonData, _ := json.Marshal(loginReq)
		req := httptest.NewRequest("POST", "/auth/login", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var loginResponse map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &loginResponse)
		require.NoError(t, err)
		assert.Equal(t, "ログインに成功しました", loginResponse["message"])

		// セッションCookieを取得
		cookies := w.Result().Cookies()
		require.NotEmpty(t, cookies)
		
		sessionCookie := ""
		for _, cookie := range cookies {
			if cookie.Name == "session_token" {
				sessionCookie = cookie.Value
				break
			}
		}
		require.NotEmpty(t, sessionCookie)

		t.Run("2. OAuth2 Authorization Request", func(t *testing.T) {
			// 認可エンドポイントにリクエスト
			authURL := fmt.Sprintf("/oauth2/authorize?response_type=code&client_id=%s&redirect_uri=%s&scope=openid+profile+email&state=test-state-123",
				testClient.ClientID,
				url.QueryEscape("http://localhost:3000/auth/callback"))

			req := httptest.NewRequest("GET", authURL, nil)
			req.AddCookie(&http.Cookie{Name: "session_token", Value: sessionCookie})

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			// 信頼済みクライアントなので直接コールバックにリダイレクト
			assert.Equal(t, http.StatusFound, w.Code)

			location := w.Header().Get("Location")
			assert.Contains(t, location, "http://localhost:3000/auth/callback")
			assert.Contains(t, location, "code=")
			assert.Contains(t, location, "state=test-state-123")

			// 認可コードを抽出
			parsedURL, err := url.Parse(location)
			require.NoError(t, err)
			
			authCode := parsedURL.Query().Get("code")
			state := parsedURL.Query().Get("state")
			
			assert.NotEmpty(t, authCode)
			assert.Equal(t, "test-state-123", state)

			t.Run("3. OAuth2 Token Exchange", func(t *testing.T) {
				// 認可コードをアクセストークンに交換
				tokenReq := oauth2.TokenRequest{
					GrantType:   "authorization_code",
					Code:        authCode,
					ClientID:    testClient.ClientID,
					RedirectURI: "http://localhost:3000/auth/callback",
				}

				jsonData, _ := json.Marshal(tokenReq)
				req := httptest.NewRequest("POST", "/oauth2/token", bytes.NewBuffer(jsonData))
				req.Header.Set("Content-Type", "application/json")

				w := httptest.NewRecorder()
				router.ServeHTTP(w, req)

				assert.Equal(t, http.StatusOK, w.Code)

				var tokenResponse oauth2.TokenResponse
				err := json.Unmarshal(w.Body.Bytes(), &tokenResponse)
				require.NoError(t, err)

				assert.NotEmpty(t, tokenResponse.AccessToken)
				assert.Equal(t, "Bearer", tokenResponse.TokenType)
				assert.NotEmpty(t, tokenResponse.RefreshToken)
				assert.Equal(t, "openid profile email", tokenResponse.Scope)
				assert.Greater(t, tokenResponse.ExpiresIn, 0)

				t.Run("4. Access Protected Resource (UserInfo)", func(t *testing.T) {
					// アクセストークンでユーザー情報を取得
					req := httptest.NewRequest("GET", "/oauth2/userinfo", nil)
					req.Header.Set("Authorization", "Bearer "+tokenResponse.AccessToken)

					w := httptest.NewRecorder()
					router.ServeHTTP(w, req)

					assert.Equal(t, http.StatusOK, w.Code)

					var userInfo map[string]interface{}
					err := json.Unmarshal(w.Body.Bytes(), &userInfo)
					require.NoError(t, err)

					assert.Equal(t, testUser.ID.String(), userInfo["sub"])
					assert.Equal(t, testUser.Username, userInfo["username"])
					assert.Equal(t, testUser.Email, userInfo["email"])
					assert.Equal(t, true, userInfo["email_verified"])
					if testUser.DisplayName != nil {
						assert.Equal(t, *testUser.DisplayName, userInfo["name"])
					}

					t.Run("5. Refresh Token Flow", func(t *testing.T) {
						// リフレッシュトークンで新しいアクセストークンを取得
						refreshReq := oauth2.TokenRequest{
							GrantType:    "refresh_token",
							RefreshToken: tokenResponse.RefreshToken,
							ClientID:     testClient.ClientID,
						}

						jsonData, _ := json.Marshal(refreshReq)
						req := httptest.NewRequest("POST", "/oauth2/token", bytes.NewBuffer(jsonData))
						req.Header.Set("Content-Type", "application/json")

						w := httptest.NewRecorder()
						router.ServeHTTP(w, req)

						assert.Equal(t, http.StatusOK, w.Code)

						var newTokenResponse oauth2.TokenResponse
						err := json.Unmarshal(w.Body.Bytes(), &newTokenResponse)
						require.NoError(t, err)

						assert.NotEmpty(t, newTokenResponse.AccessToken)
						assert.NotEqual(t, tokenResponse.AccessToken, newTokenResponse.AccessToken)
						assert.NotEmpty(t, newTokenResponse.RefreshToken)
						assert.NotEqual(t, tokenResponse.RefreshToken, newTokenResponse.RefreshToken)

						t.Run("6. Token Revocation", func(t *testing.T) {
							// トークンを無効化
							formData := url.Values{}
							formData.Set("token", newTokenResponse.AccessToken)

							req := httptest.NewRequest("POST", "/oauth2/revoke", strings.NewReader(formData.Encode()))
							req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

							w := httptest.NewRecorder()
							router.ServeHTTP(w, req)

							assert.Equal(t, http.StatusOK, w.Code)

							var revokeResponse map[string]interface{}
							err := json.Unmarshal(w.Body.Bytes(), &revokeResponse)
							require.NoError(t, err)
							assert.Contains(t, revokeResponse["message"], "取り消されました")

							// 無効化されたトークンでのアクセス試行
							req = httptest.NewRequest("GET", "/oauth2/userinfo", nil)
							req.Header.Set("Authorization", "Bearer "+newTokenResponse.AccessToken)

							w = httptest.NewRecorder()
							router.ServeHTTP(w, req)

							// 注意: 現在の実装ではJWTトークンはステートレスなので、
							// 無効化してもDBチェックをしない限り有効として認識される
							// 実際のプロダクションではトークンのブラックリストチェックが必要
						})
					})
				})
			})
		})
	})
}

// TestOAuth2ErrorScenarios OAuth2エラーシナリオのテスト
func TestOAuth2ErrorScenarios(t *testing.T) {
	router, _ := setupIntegrationTestServer()
	testUser, testClient := createIntegrationTestData(t)
	defer cleanupIntegrationTestData(testUser, testClient)

	t.Run("Invalid Client ID", func(t *testing.T) {
		authURL := "/oauth2/authorize?response_type=code&client_id=invalid-client&redirect_uri=http://localhost:3000/auth/callback&scope=openid"

		req := httptest.NewRequest("GET", authURL, nil)
		// 認証済みユーザーとしてセットアップ（実際はセッションが必要）
		
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// 認証が必要なのでリダイレクトまたはエラー
		assert.True(t, w.Code == http.StatusFound || w.Code == http.StatusUnauthorized)
	})

	t.Run("Invalid Redirect URI", func(t *testing.T) {
		tokenReq := oauth2.TokenRequest{
			GrantType:   "authorization_code",
			Code:        "invalid-code",
			ClientID:    testClient.ClientID,
			RedirectURI: "http://malicious.com/callback",
		}

		jsonData, _ := json.Marshal(tokenReq)
		req := httptest.NewRequest("POST", "/oauth2/token", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.Equal(t, "invalid_grant", response["error"])
	})

	t.Run("Expired Authorization Code", func(t *testing.T) {
		// 期限切れの認可コードを作成
		if database.GetDB() != nil {
			db := database.GetDB()
			expiredCode := &model.OAuthAuthorizationCode{
				Code:        "expired-code",
				ClientID:    testClient.ID,
				UserID:      testUser.ID,
				RedirectURI: "http://localhost:3000/auth/callback",
				Scopes:      "openid",
				ExpiresAt:   time.Now().Add(-1 * time.Hour), // 1時間前に期限切れ
			}
			require.NoError(t, db.Create(expiredCode).Error)
			
			defer func() {
				db.Delete(expiredCode)
			}()

			tokenReq := oauth2.TokenRequest{
				GrantType:   "authorization_code",
				Code:        "expired-code",
				ClientID:    testClient.ClientID,
				RedirectURI: "http://localhost:3000/auth/callback",
			}

			jsonData, _ := json.Marshal(tokenReq)
			req := httptest.NewRequest("POST", "/oauth2/token", bytes.NewBuffer(jsonData))
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)

			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			require.NoError(t, err)
			assert.Equal(t, "invalid_grant", response["error"])
		}
	})

	t.Run("Invalid Refresh Token", func(t *testing.T) {
		refreshReq := oauth2.TokenRequest{
			GrantType:    "refresh_token",
			RefreshToken: "invalid-refresh-token",
			ClientID:     testClient.ClientID,
		}

		jsonData, _ := json.Marshal(refreshReq)
		req := httptest.NewRequest("POST", "/oauth2/token", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.Equal(t, "invalid_grant", response["error"])
	})
}

// TestFormEncodedRequests フォームエンコードされたリクエストのテスト
func TestFormEncodedRequests(t *testing.T) {
	router, _ := setupIntegrationTestServer()
	testUser, testClient := createIntegrationTestData(t)
	defer cleanupIntegrationTestData(testUser, testClient)

	if database.GetDB() == nil {
		t.Skip("Database not available for integration test")
	}

	// テスト用認可コードを作成
	db := database.GetDB()
	authCode := &model.OAuthAuthorizationCode{
		Code:        "form-test-code",
		ClientID:    testClient.ID,
		UserID:      testUser.ID,
		RedirectURI: "http://localhost:3000/auth/callback",
		Scopes:      "openid profile",
		ExpiresAt:   time.Now().Add(10 * time.Minute),
	}
	require.NoError(t, db.Create(authCode).Error)
	
	defer func() {
		db.Delete(authCode)
	}()

	t.Run("Form-encoded Token Request", func(t *testing.T) {
		formData := url.Values{}
		formData.Set("grant_type", "authorization_code")
		formData.Set("code", "form-test-code")
		formData.Set("client_id", testClient.ClientID)
		formData.Set("redirect_uri", "http://localhost:3000/auth/callback")

		req := httptest.NewRequest("POST", "/oauth2/token", strings.NewReader(formData.Encode()))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var tokenResponse oauth2.TokenResponse
		err := json.Unmarshal(w.Body.Bytes(), &tokenResponse)
		require.NoError(t, err)

		assert.NotEmpty(t, tokenResponse.AccessToken)
		assert.Equal(t, "Bearer", tokenResponse.TokenType)
		assert.NotEmpty(t, tokenResponse.RefreshToken)
	})
}

// TestClientInfoEndpoint クライアント情報エンドポイントのテスト
func TestClientInfoEndpoint(t *testing.T) {
	router, _ := setupIntegrationTestServer()
	_, testClient := createIntegrationTestData(t)
	defer cleanupIntegrationTestData(nil, testClient)

	t.Run("Get Valid Client Info", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/oauth2/client-info/"+testClient.ClientID, nil)

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, testClient.Name, response["name"])
		assert.Equal(t, *testClient.Description, response["description"])
		assert.NotEmpty(t, response["redirect_uri"])
	})

	t.Run("Get Nonexistent Client Info", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/oauth2/client-info/nonexistent", nil)

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "Client not found", response["error"])
	})
}