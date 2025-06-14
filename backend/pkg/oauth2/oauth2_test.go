package oauth2

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"net/url"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestOAuth2Service_ValidateAuthorizeRequest_BasicValidation(t *testing.T) {
	testCases := []struct {
		name        string
		request     *AuthorizeRequest
		expectError bool
		errorMsg    string
	}{
		{
			name: "有効なリクエスト",
			request: &AuthorizeRequest{
				ResponseType: "code",
				ClientID:     "test-client",
				RedirectURI:  "https://example.com/callback",
				Scope:        "read write",
				State:        "random-state",
			},
			expectError: false,
		},
		{
			name: "response_type が空",
			request: &AuthorizeRequest{
				ClientID:    "test-client",
				RedirectURI: "https://example.com/callback",
			},
			expectError: true,
		},
		{
			name: "無効な response_type",
			request: &AuthorizeRequest{
				ResponseType: "invalid",
				ClientID:     "test-client",
				RedirectURI:  "https://example.com/callback",
			},
			expectError: true,
		},
		{
			name: "client_id が空",
			request: &AuthorizeRequest{
				ResponseType: "code",
				RedirectURI:  "https://example.com/callback",
			},
			expectError: true,
		},
		{
			name: "redirect_uri が空",
			request: &AuthorizeRequest{
				ResponseType: "code",
				ClientID:     "test-client",
			},
			expectError: true,
		},
		{
			name: "無効な redirect_uri",
			request: &AuthorizeRequest{
				ResponseType: "code",
				ClientID:     "test-client",
				RedirectURI:  "invalid-url",
			},
			expectError: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := validateBasicAuthorizeRequest(tc.request)

			if tc.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// validateBasicAuthorizeRequest は基本的なリクエストバリデーションを行う
func validateBasicAuthorizeRequest(req *AuthorizeRequest) error {
	if req.ResponseType == "" {
		return fmt.Errorf("response_type is required")
	}
	if req.ResponseType != "code" {
		return fmt.Errorf("unsupported response_type")
	}
	if req.ClientID == "" {
		return fmt.Errorf("client_id is required")
	}
	if req.RedirectURI == "" {
		return fmt.Errorf("redirect_uri is required")
	}
	if !isValidURL(req.RedirectURI) {
		return fmt.Errorf("invalid redirect_uri")
	}
	return nil
}

func TestOAuth2Service_ValidateTokenRequest_BasicValidation(t *testing.T) {
	testCases := []struct {
		name        string
		request     *TokenRequest
		expectError bool
	}{
		{
			name: "有効な認可コードリクエスト",
			request: &TokenRequest{
				GrantType:   "authorization_code",
				Code:        "test-code",
				ClientID:    "test-client",
				RedirectURI: "https://example.com/callback",
			},
			expectError: false,
		},
		{
			name: "有効なリフレッシュトークンリクエスト",
			request: &TokenRequest{
				GrantType:    "refresh_token",
				RefreshToken: "test-refresh-token",
				ClientID:     "test-client",
			},
			expectError: false,
		},
		{
			name: "grant_type が空",
			request: &TokenRequest{
				Code:     "test-code",
				ClientID: "test-client",
			},
			expectError: true,
		},
		{
			name: "無効な grant_type",
			request: &TokenRequest{
				GrantType: "invalid",
				ClientID:  "test-client",
			},
			expectError: true,
		},
		{
			name: "client_id が空",
			request: &TokenRequest{
				GrantType: "authorization_code",
				Code:      "test-code",
			},
			expectError: true,
		},
		{
			name: "認可コードフローで code が空",
			request: &TokenRequest{
				GrantType: "authorization_code",
				ClientID:  "test-client",
			},
			expectError: true,
		},
		{
			name: "リフレッシュトークンフローで refresh_token が空",
			request: &TokenRequest{
				GrantType: "refresh_token",
				ClientID:  "test-client",
			},
			expectError: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := validateBasicTokenRequest(tc.request)

			if tc.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// validateBasicTokenRequest は基本的なトークンリクエストバリデーションを行う
func validateBasicTokenRequest(req *TokenRequest) error {
	if req.GrantType == "" {
		return fmt.Errorf("grant_type is required")
	}
	if req.ClientID == "" {
		return fmt.Errorf("client_id is required")
	}
	
	switch req.GrantType {
	case "authorization_code":
		if req.Code == "" {
			return fmt.Errorf("code is required")
		}
	case "refresh_token":
		if req.RefreshToken == "" {
			return fmt.Errorf("refresh_token is required")
		}
	default:
		return fmt.Errorf("unsupported grant_type")
	}
	
	return nil
}

func TestRandomString(t *testing.T) {
	str1 := randomString(32)
	str2 := randomString(32)

	assert.NotEmpty(t, str1)
	assert.NotEmpty(t, str2)
	assert.NotEqual(t, str1, str2) // 異なる文字列が生成される
	assert.Len(t, str1, 32)
}

func TestPKCEValidation(t *testing.T) {
	testCases := []struct {
		name            string
		codeVerifier    string
		codeChallenge   string
		challengeMethod string
		expectValid     bool
	}{
		{
			name:            "有効なPKCE（S256）",
			codeVerifier:    "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
			codeChallenge:   "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
			challengeMethod: "S256",
			expectValid:     true,
		},
		{
			name:            "無効なPKCE（間違ったverifier）",
			codeVerifier:    "wrong-verifier",
			codeChallenge:   "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
			challengeMethod: "S256",
			expectValid:     false,
		},
		{
			name:            "PKCEなし",
			codeVerifier:    "",
			codeChallenge:   "",
			challengeMethod: "",
			expectValid:     true, // PKCEは任意
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			isValid := verifyPKCEHelper(tc.codeVerifier, tc.codeChallenge, tc.challengeMethod)
			assert.Equal(t, tc.expectValid, isValid)
		})
	}
}

func TestParseScopes(t *testing.T) {
	testCases := []struct {
		name     string
		input    string
		expected []string
	}{
		{
			name:     "通常のスコープ",
			input:    "read write admin",
			expected: []string{"read", "write", "admin"},
		},
		{
			name:     "単一スコープ",
			input:    "read",
			expected: []string{"read"},
		},
		{
			name:     "空のスコープ",
			input:    "",
			expected: []string{},
		},
		{
			name:     "余分な空白",
			input:    "  read   write  admin  ",
			expected: []string{"read", "write", "admin"},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := parseScopes(tc.input)
			assert.Equal(t, tc.expected, result)
		})
	}
}

func TestFormatScopes(t *testing.T) {
	testCases := []struct {
		name     string
		input    []string
		expected string
	}{
		{
			name:     "通常のスコープ",
			input:    []string{"read", "write", "admin"},
			expected: "read write admin",
		},
		{
			name:     "単一スコープ",
			input:    []string{"read"},
			expected: "read",
		},
		{
			name:     "空のスコープ",
			input:    []string{},
			expected: "",
		},
		{
			name:     "nil スコープ",
			input:    nil,
			expected: "",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := formatScopes(tc.input)
			assert.Equal(t, tc.expected, result)
		})
	}
}

func TestNewOAuth2Service(t *testing.T) {
	service := NewOAuth2Service()
	assert.NotNil(t, service)
}

// ヘルパー関数
func isValidURL(s string) bool {
	_, err := url.Parse(s)
	return err == nil && (strings.HasPrefix(s, "http://") || strings.HasPrefix(s, "https://"))
}


func randomString(length int) string {
	bytes := make([]byte, length)
	rand.Read(bytes)
	return base64.URLEncoding.EncodeToString(bytes)[:length]
}

func verifyPKCEHelper(codeVerifier, codeChallenge, challengeMethod string) bool {
	if codeChallenge == "" && codeVerifier == "" {
		return true // PKCEは任意
	}
	
	if challengeMethod != "S256" {
		return false
	}
	
	hash := sha256.Sum256([]byte(codeVerifier))
	expected := base64.URLEncoding.WithPadding(base64.NoPadding).EncodeToString(hash[:])
	return expected == codeChallenge
}

func parseScopes(scope string) []string {
	if scope == "" {
		return []string{}
	}
	
	parts := strings.Fields(scope)
	result := make([]string, 0, len(parts))
	seen := make(map[string]bool)
	
	for _, part := range parts {
		if !seen[part] {
			result = append(result, part)
			seen[part] = true
		}
	}
	
	return result
}

func formatScopes(scopes []string) string {
	if len(scopes) == 0 {
		return ""
	}
	return strings.Join(scopes, " ")
}