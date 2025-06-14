package jwt

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestJWTService_GenerateAccessToken(t *testing.T) {
	service := NewJWTService("test-secret-key")

	userID := uuid.New()
	clientID := uuid.New()
	scopes := []string{"read", "write"}
	expirationHours := 1

	token, err := service.GenerateAccessToken(userID, clientID, scopes, expirationHours)

	assert.NoError(t, err)
	assert.NotEmpty(t, token)
	assert.Contains(t, token, ".")
}

func TestJWTService_ValidateAccessToken(t *testing.T) {
	service := NewJWTService("test-secret-key")

	userID := uuid.New()
	clientID := uuid.New()
	scopes := []string{"read", "write"}
	expirationHours := 1

	// トークンを生成
	token, err := service.GenerateAccessToken(userID, clientID, scopes, expirationHours)
	require.NoError(t, err)

	// トークンを検証
	claims, err := service.ValidateAccessToken(token)
	assert.NoError(t, err)
	assert.NotNil(t, claims)
	assert.Equal(t, userID, claims.UserID)
	assert.Equal(t, clientID, claims.ClientID)
	assert.Equal(t, scopes, claims.Scopes)
}

func TestJWTService_ValidateAccessToken_InvalidToken(t *testing.T) {
	service := NewJWTService("test-secret-key")

	// 無効なトークン
	claims, err := service.ValidateAccessToken("invalid-token")
	assert.Error(t, err)
	assert.Nil(t, claims)
}

func TestJWTService_ValidateAccessToken_WrongSecret(t *testing.T) {
	service1 := NewJWTService("secret1")
	service2 := NewJWTService("secret2")

	userID := uuid.New()
	clientID := uuid.New()
	scopes := []string{"read"}
	expirationHours := 1

	// service1でトークンを生成
	token, err := service1.GenerateAccessToken(userID, clientID, scopes, expirationHours)
	require.NoError(t, err)

	// service2で検証（異なる秘密鍵）
	claims, err := service2.ValidateAccessToken(token)
	assert.Error(t, err)
	assert.Nil(t, claims)
}

func TestJWTService_ValidateAccessToken_ExpiredToken(t *testing.T) {
	service := NewJWTService("test-secret-key")

	userID := uuid.New()
	clientID := uuid.New()
	scopes := []string{"read"}
	
	// 有効期限を過去に設定してトークンを生成
	token, err := service.GenerateAccessToken(userID, clientID, scopes, -1)
	require.NoError(t, err)

	// 少し待ってから検証
	time.Sleep(100 * time.Millisecond)

	claims, err := service.ValidateAccessToken(token)
	assert.Error(t, err)
	assert.Nil(t, claims)
	assert.Contains(t, err.Error(), "expired")
}

func TestJWTService_RefreshToken(t *testing.T) {
	service := NewJWTService("test-secret-key")

	token1 := service.GenerateRefreshToken()
	token2 := service.GenerateRefreshToken()

	assert.NotEmpty(t, token1)
	assert.NotEmpty(t, token2)
	assert.NotEqual(t, token1, token2) // 異なるトークンが生成される
	assert.Len(t, token1, 36) // UUID形式
}

func TestNewJWTService(t *testing.T) {
	secret := "test-secret"
	service := NewJWTService(secret)

	assert.NotNil(t, service)
	assert.Equal(t, []byte(secret), service.secretKey)
}

func TestJWTService_EmptySecret(t *testing.T) {
	service := NewJWTService("")

	userID := uuid.New()
	clientID := uuid.New()
	scopes := []string{"read"}
	expirationHours := 1

	// 空の秘密鍵でもトークン生成は成功する（警告レベル）
	token, err := service.GenerateAccessToken(userID, clientID, scopes, expirationHours)
	assert.NoError(t, err)
	assert.NotEmpty(t, token)
}