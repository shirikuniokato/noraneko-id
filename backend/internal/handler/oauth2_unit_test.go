package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"noraneko-id/internal/config"
	"noraneko-id/pkg/oauth2"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// setupTestOAuth2HandlerUnit データベース不要な単体テスト用のハンドラーセットアップ
func setupTestOAuth2HandlerUnit() *OAuth2Handler {
	gin.SetMode(gin.TestMode)
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret: "test-secret-key-for-unit-tests",
		},
		OAuth2: config.OAuth2Config{
			AccessTokenExpirationHours: 1,
			RefreshTokenExpirationDays: 30,
		},
	}
	return NewOAuth2Handler(cfg)
}

func TestOAuth2Handler_NewOAuth2Handler(t *testing.T) {
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret: "test-secret",
		},
		OAuth2: config.OAuth2Config{
			AccessTokenExpirationHours: 1,
			RefreshTokenExpirationDays: 30,
		},
	}

	handler := NewOAuth2Handler(cfg)

	assert.NotNil(t, handler)
	assert.NotNil(t, handler.oauth2Service)
	assert.NotNil(t, handler.jwtService)
	assert.Equal(t, cfg, handler.config)
}

func TestOAuth2Handler_Token_InvalidJSON(t *testing.T) {
	handler := setupTestOAuth2HandlerUnit()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	// 無効なJSONを送信
	req := httptest.NewRequest("POST", "/oauth2/token", bytes.NewBufferString("invalid json"))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	handler.Token(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Equal(t, "invalid_request", response["error"])
	assert.Contains(t, response["error_description"], "リクエストの形式が正しくありません")
}

func TestOAuth2Handler_Token_UnsupportedGrantType_Unit(t *testing.T) {
	handler := setupTestOAuth2HandlerUnit()

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
	assert.Contains(t, response["error_description"], "unsupported_grant")
}

func TestOAuth2Handler_Token_FormEncodedParsing(t *testing.T) {
	handler := setupTestOAuth2HandlerUnit()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	// フォーム形式のリクエスト
	formData := url.Values{}
	formData.Set("grant_type", "authorization_code")
	formData.Set("code", "test-code")
	formData.Set("client_id", "test-client-id")
	formData.Set("redirect_uri", "http://localhost:3000/auth/callback")

	req := httptest.NewRequest("POST", "/oauth2/token", strings.NewReader(formData.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	c.Request = req

	handler.Token(c)

	// データベースがないためinvalid_grantエラーになるが、パースは成功している
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	// パースエラーではなく、データベースエラーまたは認可コード検証エラーになることを確認
	assert.Equal(t, "invalid_grant", response["error"])
	// データベースが利用できない場合とコードが見つからない場合のどちらでも可
	assert.True(t, 
		strings.Contains(response["error_description"].(string), "データベースが利用できません") ||
		strings.Contains(response["error_description"].(string), "認可コードが見つかりません"),
	)
}

func TestOAuth2Handler_UserInfo_NoAuthHeader(t *testing.T) {
	handler := setupTestOAuth2HandlerUnit()

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
	assert.Contains(t, response["error_description"], "Authorization ヘッダーが必要です")
}

func TestOAuth2Handler_UserInfo_InvalidBearerToken(t *testing.T) {
	handler := setupTestOAuth2HandlerUnit()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	req := httptest.NewRequest("GET", "/oauth2/userinfo", nil)
	req.Header.Set("Authorization", "InvalidFormat token")
	c.Request = req

	handler.UserInfo(c)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, "invalid_token", response["error"])
	assert.Contains(t, response["error_description"], "Bearer トークンが必要です")
}

func TestOAuth2Handler_UserInfo_InvalidToken_Unit(t *testing.T) {
	handler := setupTestOAuth2HandlerUnit()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	req := httptest.NewRequest("GET", "/oauth2/userinfo", nil)
	req.Header.Set("Authorization", "Bearer invalid-jwt-token")
	c.Request = req

	handler.UserInfo(c)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, "invalid_token", response["error"])
	assert.Contains(t, response["error_description"], "無効なトークンです")
}

func TestOAuth2Handler_Revoke_MissingToken_Unit(t *testing.T) {
	handler := setupTestOAuth2HandlerUnit()

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
	assert.Contains(t, response["error_description"], "token パラメータが必要です")
}

func TestOAuth2Handler_GetClientInfo_MissingClientID(t *testing.T) {
	handler := setupTestOAuth2HandlerUnit()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = []gin.Param{{Key: "client_id", Value: ""}}

	req := httptest.NewRequest("GET", "/oauth2/client-info/", nil)
	c.Request = req

	handler.GetClientInfo(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, "client_id is required", response["error"])
}

func TestOAuth2Handler_hashToken_Unit(t *testing.T) {
	handler := setupTestOAuth2HandlerUnit()

	testCases := []struct {
		name  string
		input string
	}{
		{
			name:  "通常のトークン",
			input: "test-token-12345",
		},
		{
			name:  "空の文字列",
			input: "",
		},
		{
			name:  "長いトークン",
			input: "very-long-token-string-with-many-characters-to-test-hashing-functionality",
		},
		{
			name:  "特殊文字を含むトークン",
			input: "token-with-special-chars!@#$%^&*()_+-=[]{}|;':\",./<>?",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := handler.hashToken(tc.input)
			
			// SHA256ハッシュは64文字のhex文字列
			assert.Len(t, result, 64)
			
			// 同じ入力は同じハッシュになることを確認
			result2 := handler.hashToken(tc.input)
			assert.Equal(t, result, result2)
			
			// 異なる入力は異なるハッシュになることを確認
			if tc.input != "" {
				differentResult := handler.hashToken(tc.input + "different")
				assert.NotEqual(t, result, differentResult)
			}
		})
	}
}

func TestOAuth2Handler_validateClientSecret(t *testing.T) {
	handler := setupTestOAuth2HandlerUnit()

	// 正しいシークレットのハッシュを作成
	correctSecret := "correct-secret"
	correctHash := handler.hashToken(correctSecret)

	testCases := []struct {
		name           string
		hashedSecret   string
		providedSecret string
		expectedValid  bool
	}{
		{
			name:           "正しいシークレット",
			hashedSecret:   correctHash,
			providedSecret: correctSecret,
			expectedValid:  true,
		},
		{
			name:           "間違ったシークレット",
			hashedSecret:   correctHash,
			providedSecret: "wrong-secret",
			expectedValid:  false,
		},
		{
			name:           "空のシークレット",
			hashedSecret:   correctHash,
			providedSecret: "",
			expectedValid:  false,
		},
		{
			name:           "空のハッシュ",
			hashedSecret:   "",
			providedSecret: correctSecret,
			expectedValid:  false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := handler.validateClientSecret(tc.hashedSecret, tc.providedSecret)
			assert.Equal(t, tc.expectedValid, result)
		})
	}
}

func TestOAuth2Handler_MethodNotAllowed(t *testing.T) {
	handler := setupTestOAuth2HandlerUnit()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	req := httptest.NewRequest("DELETE", "/oauth2/authorize", nil)
	c.Request = req

	handler.Authorize(c)

	assert.Equal(t, http.StatusMethodNotAllowed, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, "method_not_allowed", response["error"])
	assert.Contains(t, response["message"], "GETとPOSTのみサポート")
}