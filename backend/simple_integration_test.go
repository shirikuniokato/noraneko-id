package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"noraneko-id/internal/config"
	"noraneko-id/internal/handler"
	"noraneko-id/pkg/database"
	"noraneko-id/pkg/oauth2"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// setupSimpleTestServer 簡単なテスト用サーバーをセットアップ
func setupSimpleTestServer(t *testing.T) *gin.Engine {
	gin.SetMode(gin.TestMode)
	
	// データベース接続を確立
	dbConfig := database.DatabaseConfig{
		Host:     "localhost",
		Port:     "5432",
		User:     "noraneko",
		Password: "dev_password",
		DBName:   "noraneko_test",
		SSLMode:  "disable",
	}

	if err := database.Connect(dbConfig); err != nil {
		t.Skipf("Could not connect to test database: %v", err)
	}

	if err := database.AutoMigrate(); err != nil {
		t.Skipf("Could not migrate test database: %v", err)
	}
	
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret: "simple-test-secret-key",
		},
		OAuth2: config.OAuth2Config{
			AccessTokenExpirationHours: 1,
			RefreshTokenExpirationDays: 30,
		},
	}

	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// ハンドラーの初期化
	authHandler := handler.NewAuthHandler(cfg)
	oauth2Handler := handler.NewOAuth2Handler(cfg)
	clientHandler := handler.NewClientHandler(cfg)

	// 基本的なルーティング設定（認証ミドルウェアなし）
	auth := router.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
	}

	oauth2Group := router.Group("/oauth2")
	{
		oauth2Group.POST("/token", oauth2Handler.Token)
		oauth2Group.GET("/userinfo", oauth2Handler.UserInfo)
		oauth2Group.POST("/revoke", oauth2Handler.Revoke)
		oauth2Group.GET("/client-info/:client_id", oauth2Handler.GetClientInfo)
	}

	admin := router.Group("/admin")
	{
		admin.POST("/clients", clientHandler.CreateClient)
		admin.GET("/clients", clientHandler.GetClients)
	}

	return router
}

// TestBasicEndpoints 基本的なエンドポイントのテスト
func TestBasicEndpoints(t *testing.T) {
	router := setupSimpleTestServer(t)

	t.Run("User Registration", func(t *testing.T) {
		regReq := handler.RegisterRequest{
			Email:       fmt.Sprintf("test-%d@example.com", 1),
			Password:    "testpassword123",
			Username:    fmt.Sprintf("testuser-%d", 1),
			DisplayName: "Test User",
		}

		jsonData, _ := json.Marshal(regReq)
		req := httptest.NewRequest("POST", "/auth/register", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.Contains(t, response["message"], "登録が完了しました")
	})

	t.Run("User Login", func(t *testing.T) {
		// 先にユーザー登録
		regReq := handler.RegisterRequest{
			Email:       fmt.Sprintf("test-%d@example.com", 2),
			Password:    "testpassword123",
			Username:    fmt.Sprintf("testuser-%d", 2),
			DisplayName: "Test User 2",
		}

		jsonData, _ := json.Marshal(regReq)
		req := httptest.NewRequest("POST", "/auth/register", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		require.Equal(t, http.StatusCreated, w.Code)

		// ログイン
		loginReq := handler.LoginRequest{
			Email:    regReq.Email,
			Password: regReq.Password,
		}

		jsonData, _ = json.Marshal(loginReq)
		req = httptest.NewRequest("POST", "/auth/login", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")

		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.Contains(t, response["message"], "ログインに成功しました")
	})

	t.Run("OAuth2 Token Invalid Request", func(t *testing.T) {
		tokenReq := oauth2.TokenRequest{
			GrantType: "invalid_grant_type",
			ClientID:  "test-client",
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
		assert.Equal(t, "unsupported_grant_type", response["error"])
	})

	t.Run("OAuth2 UserInfo No Token", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/oauth2/userinfo", nil)

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.Equal(t, "invalid_token", response["error"])
	})

	t.Run("OAuth2 Client Info Not Found", func(t *testing.T) {
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

// TestOAuth2ValidationFlow OAuth2の基本的なバリデーションフローのテスト
func TestOAuth2ValidationFlow(t *testing.T) {
	router := setupSimpleTestServer(t)

	testCases := []struct {
		name           string
		request        oauth2.TokenRequest
		expectedStatus int
		expectedError  string
	}{
		{
			name: "Missing Grant Type",
			request: oauth2.TokenRequest{
				ClientID: "test-client",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "invalid_request",
		},
		{
			name: "Missing Client ID",
			request: oauth2.TokenRequest{
				GrantType: "authorization_code",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "invalid_request",
		},
		{
			name: "Authorization Code Grant Missing Code",
			request: oauth2.TokenRequest{
				GrantType: "authorization_code",
				ClientID:  "test-client",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "invalid_grant",
		},
		{
			name: "Refresh Token Grant Missing Token",
			request: oauth2.TokenRequest{
				GrantType: "refresh_token",
				ClientID:  "test-client",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "invalid_grant",
		},
		{
			name: "Unsupported Grant Type",
			request: oauth2.TokenRequest{
				GrantType: "client_credentials",
				ClientID:  "test-client",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "unsupported_grant_type",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			jsonData, _ := json.Marshal(tc.request)
			req := httptest.NewRequest("POST", "/oauth2/token", bytes.NewBuffer(jsonData))
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tc.expectedStatus, w.Code)

			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			require.NoError(t, err)
			assert.Equal(t, tc.expectedError, response["error"])
		})
	}
}

// TestJWTIntegration JWTトークンの統合テスト
func TestJWTIntegration(t *testing.T) {
	router := setupSimpleTestServer(t)

	// 実際のユーザーを作成
	regReq := handler.RegisterRequest{
		Email:       "jwt-test@example.com",
		Password:    "testpassword123",
		Username:    "jwttest",
		DisplayName: "JWT Test User",
	}

	jsonData, _ := json.Marshal(regReq)
	req := httptest.NewRequest("POST", "/auth/register", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	require.Equal(t, http.StatusCreated, w.Code)

	// ユーザーのセッション情報を取得してJWTトークンをテスト
	// 注意: これは簡略化されたテストであり、実際のOAuth2フローは別途テストが必要

	t.Run("Invalid Bearer Token Format", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/oauth2/userinfo", nil)
		req.Header.Set("Authorization", "InvalidFormat token-here")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.Equal(t, "invalid_token", response["error"])
		assert.Contains(t, response["error_description"], "Bearer トークンが必要です")
	})

	t.Run("Invalid JWT Token", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/oauth2/userinfo", nil)
		req.Header.Set("Authorization", "Bearer invalid.jwt.token")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.Equal(t, "invalid_token", response["error"])
		assert.Contains(t, response["error_description"], "無効なトークンです")
	})
}