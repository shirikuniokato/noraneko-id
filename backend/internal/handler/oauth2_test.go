package handler

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"noraneko-id/internal/config"
	"noraneko-id/internal/model"
	"noraneko-id/pkg/database"
	"noraneko-id/pkg/oauth2"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestOAuth2Handler() *OAuth2Handler {
	gin.SetMode(gin.TestMode)
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret: "test-secret-key-for-oauth2-tests",
		},
		OAuth2: config.OAuth2Config{
			AccessTokenExpirationHours:  1,
			RefreshTokenExpirationDays:  30,
		},
	}
	return NewOAuth2Handler(cfg)
}

func createTestOAuthClient() *model.OAuthClient {
	clientSecret := "test-secret"
	hash := sha256.Sum256([]byte(clientSecret))
	hashedSecret := hex.EncodeToString(hash[:])

	return &model.OAuthClient{
		ID:               uuid.New(),
		ClientID:         "test-client-id",
		ClientSecretHash: hashedSecret,
		Name:             "Test Client",
		Description:      stringPtr("Test OAuth2 Client"),
		RedirectURIs:     pq.StringArray{"http://localhost:3000/auth/callback"},
		AllowedScopes:    pq.StringArray{"openid", "profile", "email"},
		IsConfidential:   false, // Public client for easier testing
		IsActive:         true,
		RequireConsent:   false, // Skip consent for easier testing
		TrustedClient:    true,  // Trusted client for easier testing
	}
}

func createTestUser() *model.User {
	return &model.User{
		ID:            uuid.New(),
		Email:         "test@example.com",
		Username:      "testuser",
		DisplayName:   stringPtr("Test User"),
		EmailVerified: true,
		IsActive:      true,
	}
}

func stringPtr(s string) *string {
	return &s
}

func TestOAuth2Handler_Authorize_GET_ValidRequest(t *testing.T) {
	handler := setupTestOAuth2Handler()
	
	// テスト用クライアントとユーザーを作成
	testClient := createTestOAuthClient()
	testUser := createTestUser()
	
	// データベースが利用可能な場合のみ実行
	if database.GetDB() == nil {
		t.Skip("Database not available for integration test")
	}
	
	// テストデータを挿入
	db := database.GetDB()
	require.NoError(t, db.Create(testClient).Error)
	require.NoError(t, db.Create(testUser).Error)
	
	// クリーンアップ
	defer func() {
		db.Delete(testClient)
		db.Delete(testUser)
	}()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	// 認可リクエストのパラメータを設定
	req := httptest.NewRequest("GET", "/oauth2/authorize?response_type=code&client_id=test-client-id&redirect_uri=http://localhost:3000/auth/callback&scope=openid+profile&state=test-state", nil)
	c.Request = req
	
	// ユーザーが認証済みとしてセット
	c.Set("user_id", testUser.ID)
	
	handler.Authorize(c)
	
	// 信頼済みクライアントなので、コールバックURLにリダイレクトされる
	assert.Equal(t, http.StatusFound, w.Code)
	
	location := w.Header().Get("Location")
	assert.Contains(t, location, "http://localhost:3000/auth/callback")
	assert.Contains(t, location, "code=")
	assert.Contains(t, location, "state=test-state")
}

func TestOAuth2Handler_Authorize_GET_UnauthorizedUser(t *testing.T) {
	handler := setupTestOAuth2Handler()
	
	if database.GetDB() == nil {
		t.Skip("Database not available for integration test")
	}
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	req := httptest.NewRequest("GET", "/oauth2/authorize?response_type=code&client_id=test-client-id&redirect_uri=http://localhost:3000/auth/callback", nil)
	c.Request = req
	
	// ユーザーが認証されていない状態
	handler.Authorize(c)
	
	// ログインページにリダイレクトされる
	assert.Equal(t, http.StatusFound, w.Code)
	
	location := w.Header().Get("Location")
	assert.Contains(t, location, "/login")
}

func TestOAuth2Handler_Authorize_InvalidResponseType(t *testing.T) {
	handler := setupTestOAuth2Handler()
	
	if database.GetDB() == nil {
		t.Skip("Database not available for integration test")
	}
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	req := httptest.NewRequest("GET", "/oauth2/authorize?response_type=token&client_id=test-client-id&redirect_uri=http://localhost:3000/auth/callback", nil)
	c.Request = req
	
	handler.Authorize(c)
	
	// エラーレスポンスまたはリダイレクト
	assert.True(t, w.Code == http.StatusBadRequest || w.Code == http.StatusFound)
}

func TestOAuth2Handler_Token_AuthorizationCodeGrant(t *testing.T) {
	handler := setupTestOAuth2Handler()
	
	if database.GetDB() == nil {
		t.Skip("Database not available for integration test")
	}
	
	// テスト用データを作成
	testClient := createTestOAuthClient()
	testUser := createTestUser()
	
	db := database.GetDB()
	require.NoError(t, db.Create(testClient).Error)
	require.NoError(t, db.Create(testUser).Error)
	
	// 認可コードを作成
	authCode := &model.OAuthAuthorizationCode{
		Code:        "test-authorization-code",
		ClientID:    testClient.ID,
		UserID:      testUser.ID,
		RedirectURI: "http://localhost:3000/auth/callback",
		Scopes:      "openid profile",
		ExpiresAt:   time.Now().Add(10 * time.Minute),
	}
	require.NoError(t, db.Create(authCode).Error)
	
	// クリーンアップ
	defer func() {
		db.Delete(authCode)
		db.Delete(testClient)
		db.Delete(testUser)
	}()
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	// トークンリクエストのJSONを作成
	tokenReq := oauth2.TokenRequest{
		GrantType:   "authorization_code",
		Code:        "test-authorization-code",
		ClientID:    "test-client-id",
		RedirectURI: "http://localhost:3000/auth/callback",
	}
	
	jsonData, _ := json.Marshal(tokenReq)
	req := httptest.NewRequest("POST", "/oauth2/token", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req
	
	handler.Token(c)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response oauth2.TokenResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	
	assert.NotEmpty(t, response.AccessToken)
	assert.Equal(t, "Bearer", response.TokenType)
	assert.NotEmpty(t, response.RefreshToken)
	assert.Equal(t, "openid profile", response.Scope)
}

func TestOAuth2Handler_Token_FormEncodedRequest(t *testing.T) {
	handler := setupTestOAuth2Handler()
	
	if database.GetDB() == nil {
		t.Skip("Database not available for integration test")
	}
	
	// テスト用データを作成
	testClient := createTestOAuthClient()
	testUser := createTestUser()
	
	db := database.GetDB()
	require.NoError(t, db.Create(testClient).Error)
	require.NoError(t, db.Create(testUser).Error)
	
	// 認可コードを作成
	authCode := &model.OAuthAuthorizationCode{
		Code:        "test-authorization-code-form",
		ClientID:    testClient.ID,
		UserID:      testUser.ID,
		RedirectURI: "http://localhost:3000/auth/callback",
		Scopes:      "openid",
		ExpiresAt:   time.Now().Add(10 * time.Minute),
	}
	require.NoError(t, db.Create(authCode).Error)
	
	// クリーンアップ
	defer func() {
		db.Delete(authCode)
		db.Delete(testClient)
		db.Delete(testUser)
	}()
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	// フォーム形式のリクエスト
	formData := url.Values{}
	formData.Set("grant_type", "authorization_code")
	formData.Set("code", "test-authorization-code-form")
	formData.Set("client_id", "test-client-id")
	formData.Set("redirect_uri", "http://localhost:3000/auth/callback")
	
	req := httptest.NewRequest("POST", "/oauth2/token", strings.NewReader(formData.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	c.Request = req
	
	handler.Token(c)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response oauth2.TokenResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	
	assert.NotEmpty(t, response.AccessToken)
	assert.Equal(t, "Bearer", response.TokenType)
}

func TestOAuth2Handler_Token_InvalidCode(t *testing.T) {
	handler := setupTestOAuth2Handler()
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	tokenReq := oauth2.TokenRequest{
		GrantType:   "authorization_code",
		Code:        "invalid-code",
		ClientID:    "test-client-id",
		RedirectURI: "http://localhost:3000/auth/callback",
	}
	
	jsonData, _ := json.Marshal(tokenReq)
	req := httptest.NewRequest("POST", "/oauth2/token", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req
	
	handler.Token(c)
	
	assert.Equal(t, http.StatusBadRequest, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	
	assert.Equal(t, "invalid_grant", response["error"])
}

func TestOAuth2Handler_Token_UnsupportedGrantType(t *testing.T) {
	handler := setupTestOAuth2Handler()
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	tokenReq := oauth2.TokenRequest{
		GrantType: "unsupported_grant",
		ClientID:  "test-client-id",
	}
	
	jsonData, _ := json.Marshal(tokenReq)
	req := httptest.NewRequest("POST", "/oauth2/token", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req
	
	handler.Token(c)
	
	assert.Equal(t, http.StatusBadRequest, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	
	assert.Equal(t, "unsupported_grant_type", response["error"])
}

func TestOAuth2Handler_UserInfo_ValidToken(t *testing.T) {
	handler := setupTestOAuth2Handler()
	
	if database.GetDB() == nil {
		t.Skip("Database not available for integration test")
	}
	
	// テスト用ユーザーを作成
	testUser := createTestUser()
	
	db := database.GetDB()
	require.NoError(t, db.Create(testUser).Error)
	
	defer func() {
		db.Delete(testUser)
	}()
	
	// JWTトークンを生成
	scopes := []string{"openid", "profile", "email"}
	accessToken, err := handler.jwtService.GenerateAccessToken(testUser.ID, uuid.New(), scopes, 1)
	require.NoError(t, err)
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	req := httptest.NewRequest("GET", "/oauth2/userinfo", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	c.Request = req
	
	handler.UserInfo(c)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	
	assert.Equal(t, testUser.ID.String(), response["sub"])
	assert.Equal(t, testUser.Username, response["username"])
	assert.Equal(t, testUser.Email, response["email"])
	assert.Equal(t, true, response["email_verified"])
}

func TestOAuth2Handler_UserInfo_MissingToken(t *testing.T) {
	handler := setupTestOAuth2Handler()
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	req := httptest.NewRequest("GET", "/oauth2/userinfo", nil)
	c.Request = req
	
	handler.UserInfo(c)
	
	assert.Equal(t, http.StatusUnauthorized, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	
	assert.Equal(t, "invalid_token", response["error"])
}

func TestOAuth2Handler_UserInfo_InvalidToken(t *testing.T) {
	handler := setupTestOAuth2Handler()
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	req := httptest.NewRequest("GET", "/oauth2/userinfo", nil)
	req.Header.Set("Authorization", "Bearer invalid-token")
	c.Request = req
	
	handler.UserInfo(c)
	
	assert.Equal(t, http.StatusUnauthorized, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	
	assert.Equal(t, "invalid_token", response["error"])
}

func TestOAuth2Handler_Revoke_ValidToken(t *testing.T) {
	handler := setupTestOAuth2Handler()
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	formData := url.Values{}
	formData.Set("token", "test-token-to-revoke")
	
	req := httptest.NewRequest("POST", "/oauth2/revoke", strings.NewReader(formData.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	c.Request = req
	
	handler.Revoke(c)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	
	assert.Contains(t, response["message"], "取り消されました")
}

func TestOAuth2Handler_Revoke_MissingToken(t *testing.T) {
	handler := setupTestOAuth2Handler()
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	req := httptest.NewRequest("POST", "/oauth2/revoke", strings.NewReader(""))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	c.Request = req
	
	handler.Revoke(c)
	
	assert.Equal(t, http.StatusBadRequest, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	
	assert.Equal(t, "invalid_request", response["error"])
}

func TestOAuth2Handler_GetClientInfo_ValidClient(t *testing.T) {
	handler := setupTestOAuth2Handler()
	
	if database.GetDB() == nil {
		t.Skip("Database not available for integration test")
	}
	
	// テスト用クライアントを作成
	testClient := createTestOAuthClient()
	
	db := database.GetDB()
	require.NoError(t, db.Create(testClient).Error)
	
	defer func() {
		db.Delete(testClient)
	}()
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = []gin.Param{{Key: "client_id", Value: "test-client-id"}}
	
	req := httptest.NewRequest("GET", "/oauth2/client-info/test-client-id", nil)
	c.Request = req
	
	handler.GetClientInfo(c)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	
	assert.Equal(t, "Test Client", response["name"])
	assert.Equal(t, "Test OAuth2 Client", response["description"])
	assert.Equal(t, "http://localhost:3000/auth/callback", response["redirect_uri"])
}

func TestOAuth2Handler_GetClientInfo_NotFound(t *testing.T) {
	handler := setupTestOAuth2Handler()
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = []gin.Param{{Key: "client_id", Value: "non-existent-client"}}
	
	req := httptest.NewRequest("GET", "/oauth2/client-info/non-existent-client", nil)
	c.Request = req
	
	handler.GetClientInfo(c)
	
	assert.Equal(t, http.StatusNotFound, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	
	assert.Equal(t, "Client not found", response["error"])
}

func TestOAuth2Handler_RefreshTokenGrant(t *testing.T) {
	handler := setupTestOAuth2Handler()
	
	if database.GetDB() == nil {
		t.Skip("Database not available for integration test")
	}
	
	// テスト用データを作成
	testClient := createTestOAuthClient()
	testUser := createTestUser()
	
	db := database.GetDB()
	require.NoError(t, db.Create(testClient).Error)
	require.NoError(t, db.Create(testUser).Error)
	
	// アクセストークンとリフレッシュトークンを作成
	refreshToken := handler.jwtService.GenerateRefreshToken()
	tokenHash := handler.hashToken(refreshToken)
	
	accessTokenRecord := &model.OAuthAccessToken{
		TokenHash: "dummy-access-token-hash",
		ClientID:  testClient.ID,
		UserID:    testUser.ID,
		Scopes:    "openid profile",
		ExpiresAt: time.Now().Add(1 * time.Hour),
	}
	require.NoError(t, db.Create(accessTokenRecord).Error)
	
	refreshTokenRecord := &model.OAuthRefreshToken{
		TokenHash:     tokenHash,
		AccessTokenID: accessTokenRecord.ID,
		ClientID:      testClient.ID,
		UserID:        testUser.ID,
		Scopes:        "openid profile",
		ExpiresAt:     time.Now().Add(24 * time.Hour),
	}
	require.NoError(t, db.Create(refreshTokenRecord).Error)
	
	// クリーンアップ
	defer func() {
		db.Delete(refreshTokenRecord)
		db.Delete(accessTokenRecord)
		db.Delete(testClient)
		db.Delete(testUser)
	}()
	
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	
	// リフレッシュトークンリクエスト
	tokenReq := oauth2.TokenRequest{
		GrantType:    "refresh_token",
		RefreshToken: refreshToken,
		ClientID:     "test-client-id",
	}
	
	jsonData, _ := json.Marshal(tokenReq)
	req := httptest.NewRequest("POST", "/oauth2/token", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req
	
	handler.Token(c)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response oauth2.TokenResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	
	assert.NotEmpty(t, response.AccessToken)
	assert.Equal(t, "Bearer", response.TokenType)
	assert.NotEmpty(t, response.RefreshToken)
	assert.NotEqual(t, refreshToken, response.RefreshToken) // 新しいリフレッシュトークンが生成される
	assert.Equal(t, "openid profile", response.Scope)
}