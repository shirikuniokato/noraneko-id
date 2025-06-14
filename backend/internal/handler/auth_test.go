package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"noraneko-id/internal/config"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestAuthHandler() *AuthHandler {
	gin.SetMode(gin.TestMode)
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret: "test-secret",
		},
	}
	return NewAuthHandler(cfg)
}

func TestLoginRequest_Validation(t *testing.T) {
	testCases := []struct {
		name           string
		request        LoginRequest
		expectValid    bool
		expectedErrors []string
	}{
		{
			name: "有効なリクエスト",
			request: LoginRequest{
				Email:    "test@example.com",
				Password: "password123",
			},
			expectValid: true,
		},
		{
			name: "無効なメールアドレス",
			request: LoginRequest{
				Email:    "invalid-email",
				Password: "password123",
			},
			expectValid:    false,
			expectedErrors: []string{"Email"},
		},
		{
			name: "短すぎるパスワード",
			request: LoginRequest{
				Email:    "test@example.com",
				Password: "123",
			},
			expectValid:    false,
			expectedErrors: []string{"Password"},
		},
		{
			name: "空のメールアドレス",
			request: LoginRequest{
				Email:    "",
				Password: "password123",
			},
			expectValid:    false,
			expectedErrors: []string{"Email"},
		},
		{
			name: "空のパスワード",
			request: LoginRequest{
				Email:    "test@example.com",
				Password: "",
			},
			expectValid:    false,
			expectedErrors: []string{"Password"},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Ginのコンテキストを作成してバリデーション
			gin.SetMode(gin.TestMode)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			jsonData, _ := json.Marshal(tc.request)
			c.Request = httptest.NewRequest("POST", "/auth/login", bytes.NewBuffer(jsonData))
			c.Request.Header.Set("Content-Type", "application/json")

			var req LoginRequest
			err := c.ShouldBindJSON(&req)

			if tc.expectValid {
				assert.NoError(t, err)
				assert.Equal(t, tc.request.Email, req.Email)
				assert.Equal(t, tc.request.Password, req.Password)
			} else {
				assert.Error(t, err)
				// エラーメッセージに期待するフィールドが含まれているかチェック
				errorMsg := err.Error()
				for _, expectedError := range tc.expectedErrors {
					assert.Contains(t, errorMsg, expectedError)
				}
			}
		})
	}
}

func TestRegisterRequest_Validation(t *testing.T) {
	testCases := []struct {
		name           string
		request        RegisterRequest
		expectValid    bool
		expectedErrors []string
	}{
		{
			name: "有効なリクエスト",
			request: RegisterRequest{
				Email:       "test@example.com",
				Password:    "password123",
				Username:    "testuser",
				DisplayName: "Test User",
			},
			expectValid: true,
		},
		{
			name: "表示名なし（任意項目）",
			request: RegisterRequest{
				Email:    "test@example.com",
				Password: "password123",
				Username: "testuser",
			},
			expectValid: true,
		},
		{
			name: "無効なメールアドレス",
			request: RegisterRequest{
				Email:    "invalid-email",
				Password: "password123",
				Username: "testuser",
			},
			expectValid:    false,
			expectedErrors: []string{"Email"},
		},
		{
			name: "短すぎるユーザー名",
			request: RegisterRequest{
				Email:    "test@example.com",
				Password: "password123",
				Username: "ab",
			},
			expectValid:    false,
			expectedErrors: []string{"Username"},
		},
		{
			name: "長すぎるユーザー名",
			request: RegisterRequest{
				Email:    "test@example.com",
				Password: "password123",
				Username: "this-is-a-very-long-username-that-exceeds-the-maximum-length-limit",
			},
			expectValid:    false,
			expectedErrors: []string{"Username"},
		},
		{
			name: "空のユーザー名",
			request: RegisterRequest{
				Email:    "test@example.com",
				Password: "password123",
				Username: "",
			},
			expectValid:    false,
			expectedErrors: []string{"Username"},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			gin.SetMode(gin.TestMode)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			jsonData, _ := json.Marshal(tc.request)
			c.Request = httptest.NewRequest("POST", "/auth/register", bytes.NewBuffer(jsonData))
			c.Request.Header.Set("Content-Type", "application/json")

			var req RegisterRequest
			err := c.ShouldBindJSON(&req)

			if tc.expectValid {
				assert.NoError(t, err)
				assert.Equal(t, tc.request.Email, req.Email)
				assert.Equal(t, tc.request.Username, req.Username)
			} else {
				assert.Error(t, err)
				errorMsg := err.Error()
				for _, expectedError := range tc.expectedErrors {
					assert.Contains(t, errorMsg, expectedError)
				}
			}
		})
	}
}

func TestAuthHandler_hashToken(t *testing.T) {
	handler := setupTestAuthHandler()

	testCases := []struct {
		name  string
		input string
	}{
		{
			name:  "通常のトークン",
			input: "test-token",
		},
		{
			name:  "空の文字列",
			input: "",
		},
		{
			name:  "同じ入力は同じハッシュ",
			input: "same-input",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := handler.hashToken(tc.input)
			assert.Len(t, result, 64) // SHA256ハッシュは64文字
			
			// 同じ入力は同じハッシュになることを確認
			result2 := handler.hashToken(tc.input)
			assert.Equal(t, result, result2)
		})
	}
}

func TestAuthHandler_NewAuthHandler(t *testing.T) {
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret: "test-secret",
		},
	}

	handler := NewAuthHandler(cfg)

	assert.NotNil(t, handler)
	assert.Equal(t, cfg, handler.config)
}

// 実際のHTTPハンドラーテストの例
func TestAuthHandler_Login_InvalidJSON(t *testing.T) {
	handler := setupTestAuthHandler()

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	// 無効なJSONを送信
	c.Request = httptest.NewRequest("POST", "/auth/login", bytes.NewBufferString("invalid json"))
	c.Request.Header.Set("Content-Type", "application/json")

	handler.Login(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Equal(t, "invalid_request", response["error"])
}

func TestAuthHandler_Register_InvalidJSON(t *testing.T) {
	handler := setupTestAuthHandler()

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	// 無効なJSONを送信
	c.Request = httptest.NewRequest("POST", "/auth/register", bytes.NewBufferString("invalid json"))
	c.Request.Header.Set("Content-Type", "application/json")

	handler.Register(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Equal(t, "invalid_request", response["error"])
}

// プロフィール取得のテスト（認証が必要）
func TestAuthHandler_Profile_NoAuth(t *testing.T) {
	handler := setupTestAuthHandler()

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("GET", "/auth/profile", nil)

	// user_idが設定されていない状態でテスト
	handler.Profile(c)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Equal(t, "unauthorized", response["error"])
}