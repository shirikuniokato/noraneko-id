package jwt

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// JWTService JWT トークンの生成と検証を行うサービス
type JWTService struct {
	secretKey []byte
}

// Claims JWT クレーム構造体
type Claims struct {
	UserID   uuid.UUID `json:"user_id"`
	ClientID uuid.UUID `json:"client_id"`
	Scopes   []string  `json:"scopes"`
	jwt.RegisteredClaims
}

// NewJWTService JWTサービスの新しいインスタンスを作成
func NewJWTService(secretKey string) *JWTService {
	return &JWTService{
		secretKey: []byte(secretKey),
	}
}

// GenerateAccessToken アクセストークンを生成
func (j *JWTService) GenerateAccessToken(userID, clientID uuid.UUID, scopes []string, expirationHours int) (string, error) {
	claims := &Claims{
		UserID:   userID,
		ClientID: clientID,
		Scopes:   scopes,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * time.Duration(expirationHours))),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "noraneko-id",
			Subject:   userID.String(),
			ID:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(j.secretKey)
}

// ValidateAccessToken アクセストークンを検証
func (j *JWTService) ValidateAccessToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("予期しない署名方法: %v", token.Header["alg"])
		}
		return j.secretKey, nil
	})

	if err != nil {
		return nil, fmt.Errorf("トークンの解析に失敗しました: %v", err)
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("無効なトークンです")
}

// GenerateRefreshToken リフレッシュトークンを生成（シンプルなランダム文字列）
func (j *JWTService) GenerateRefreshToken() string {
	return uuid.New().String()
}