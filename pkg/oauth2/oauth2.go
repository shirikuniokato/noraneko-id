package oauth2

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"net/url"
	"strings"
	"time"

	"noraneko-id/internal/model"
	"noraneko-id/pkg/database"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// OAuth2Service OAuth2 関連の処理を行うサービス
type OAuth2Service struct {
	db *gorm.DB
}

// NewOAuth2Service OAuth2サービスの新しいインスタンスを作成
func NewOAuth2Service() *OAuth2Service {
	return &OAuth2Service{
		db: database.GetDB(),
	}
}

// AuthorizeRequest OAuth2 認可リクエストの構造体
type AuthorizeRequest struct {
	ResponseType         string `json:"response_type" binding:"required"`
	ClientID             string `json:"client_id" binding:"required"`
	RedirectURI          string `json:"redirect_uri" binding:"required"`
	Scope                string `json:"scope"`
	State                string `json:"state"`
	CodeChallenge        string `json:"code_challenge"`
	CodeChallengeMethod  string `json:"code_challenge_method"`
}

// TokenRequest OAuth2 トークンリクエストの構造体
type TokenRequest struct {
	GrantType    string `json:"grant_type" binding:"required"`
	Code         string `json:"code"`
	RedirectURI  string `json:"redirect_uri"`
	ClientID     string `json:"client_id" binding:"required"`
	ClientSecret string `json:"client_secret"`
	CodeVerifier string `json:"code_verifier"`
	RefreshToken string `json:"refresh_token"`
}

// TokenResponse OAuth2 トークンレスポンスの構造体
type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token,omitempty"`
	Scope        string `json:"scope,omitempty"`
}

// ValidateAuthorizeRequest OAuth2 認可リクエストを検証
func (s *OAuth2Service) ValidateAuthorizeRequest(req *AuthorizeRequest) (*model.OAuthClient, error) {
	// response_type の検証
	if req.ResponseType != "code" {
		return nil, fmt.Errorf("サポートされていない response_type です: %s", req.ResponseType)
	}

	// クライアントの検証
	var client model.OAuthClient
	clientUUID, err := uuid.Parse(req.ClientID)
	if err != nil {
		return nil, fmt.Errorf("無効な client_id 形式です")
	}

	err = s.db.Where("client_id = ? AND is_active = ?", clientUUID.String(), true).First(&client).Error
	if err != nil {
		return nil, fmt.Errorf("クライアントが見つかりません")
	}

	// リダイレクトURIの検証
	if !s.isValidRedirectURI(req.RedirectURI, client.RedirectURIs) {
		return nil, fmt.Errorf("無効な redirect_uri です")
	}

	// スコープの検証
	requestedScopes := strings.Fields(req.Scope)
	if !s.isValidScopes(requestedScopes, client.AllowedScopes) {
		return nil, fmt.Errorf("無効なスコープが含まれています")
	}

	// PKCE の検証（オプション）
	if req.CodeChallenge != "" {
		if req.CodeChallengeMethod != "S256" && req.CodeChallengeMethod != "plain" {
			return nil, fmt.Errorf("サポートされていない code_challenge_method です")
		}
	}

	return &client, nil
}

// GenerateAuthorizationCode 認可コードを生成
func (s *OAuth2Service) GenerateAuthorizationCode(userID uuid.UUID, client *model.OAuthClient, req *AuthorizeRequest) (*model.OAuthAuthorizationCode, error) {
	// 認可コードの生成
	code, err := s.generateSecureCode()
	if err != nil {
		return nil, fmt.Errorf("認可コードの生成に失敗しました: %v", err)
	}

	// スコープの処理
	scopes := strings.Fields(req.Scope)
	if len(scopes) == 0 {
		scopes = []string{"openid"} // デフォルトスコープ
	}

	// 認可コードの保存
	authCode := &model.OAuthAuthorizationCode{
		Code:                  code,
		ClientID:              client.ID,
		UserID:                userID,
		RedirectURI:           req.RedirectURI,
		Scopes:                scopes,
		CodeChallenge:         &req.CodeChallenge,
		CodeChallengeMethod:   &req.CodeChallengeMethod,
		ExpiresAt:             time.Now().Add(10 * time.Minute), // 10分で有効期限切れ
	}

	if req.CodeChallenge == "" {
		authCode.CodeChallenge = nil
		authCode.CodeChallengeMethod = nil
	}

	err = s.db.Create(authCode).Error
	if err != nil {
		return nil, fmt.Errorf("認可コードの保存に失敗しました: %v", err)
	}

	return authCode, nil
}

// ValidateTokenRequest OAuth2 トークンリクエストを検証
func (s *OAuth2Service) ValidateTokenRequest(req *TokenRequest) (*model.OAuthAuthorizationCode, *model.OAuthClient, error) {
	switch req.GrantType {
	case "authorization_code":
		return s.validateAuthorizationCodeGrant(req)
	case "refresh_token":
		return nil, nil, fmt.Errorf("refresh_token グラントは未実装です")
	default:
		return nil, nil, fmt.Errorf("サポートされていない grant_type です: %s", req.GrantType)
	}
}

// validateAuthorizationCodeGrant 認可コードグラントを検証
func (s *OAuth2Service) validateAuthorizationCodeGrant(req *TokenRequest) (*model.OAuthAuthorizationCode, *model.OAuthClient, error) {
	// 認可コードの検証
	var authCode model.OAuthAuthorizationCode
	err := s.db.Where("code = ? AND used_at IS NULL", req.Code).First(&authCode).Error
	if err != nil {
		return nil, nil, fmt.Errorf("認可コードが見つかりません")
	}

	// 有効期限の確認
	if time.Now().After(authCode.ExpiresAt) {
		return nil, nil, fmt.Errorf("認可コードの有効期限が切れています")
	}

	// クライアントの検証
	var client model.OAuthClient
	err = s.db.Where("id = ? AND is_active = ?", authCode.ClientID, true).First(&client).Error
	if err != nil {
		return nil, nil, fmt.Errorf("クライアントが見つかりません")
	}

	// client_id の確認
	if client.ClientID != req.ClientID {
		return nil, nil, fmt.Errorf("client_id が一致しません")
	}

	// redirect_uri の確認
	if authCode.RedirectURI != req.RedirectURI {
		return nil, nil, fmt.Errorf("redirect_uri が一致しません")
	}

	// PKCE の検証
	if authCode.CodeChallenge != nil && *authCode.CodeChallenge != "" {
		if req.CodeVerifier == "" {
			return nil, nil, fmt.Errorf("code_verifier が必要です")
		}
		if !s.verifyPKCE(*authCode.CodeChallenge, *authCode.CodeChallengeMethod, req.CodeVerifier) {
			return nil, nil, fmt.Errorf("PKCE の検証に失敗しました")
		}
	}

	return &authCode, &client, nil
}

// MarkAuthorizationCodeAsUsed 認可コードを使用済みとしてマーク
func (s *OAuth2Service) MarkAuthorizationCodeAsUsed(authCode *model.OAuthAuthorizationCode) error {
	now := time.Now()
	authCode.UsedAt = &now
	return s.db.Save(authCode).Error
}

// Helper functions

// generateSecureCode セキュアな認可コードを生成
func (s *OAuth2Service) generateSecureCode() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}

// isValidRedirectURI リダイレクトURIが有効かチェック
func (s *OAuth2Service) isValidRedirectURI(redirectURI string, allowedURIs []string) bool {
	for _, allowedURI := range allowedURIs {
		if redirectURI == allowedURI {
			return true
		}
	}
	return false
}

// isValidScopes スコープが有効かチェック
func (s *OAuth2Service) isValidScopes(requestedScopes, allowedScopes []string) bool {
	for _, requestedScope := range requestedScopes {
		found := false
		for _, allowedScope := range allowedScopes {
			if requestedScope == allowedScope {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}
	return true
}

// verifyPKCE PKCE の検証
func (s *OAuth2Service) verifyPKCE(codeChallenge, codeChallengeMethod, codeVerifier string) bool {
	switch codeChallengeMethod {
	case "plain":
		return codeChallenge == codeVerifier
	case "S256":
		hash := sha256.Sum256([]byte(codeVerifier))
		encoded := base64.URLEncoding.WithPadding(base64.NoPadding).EncodeToString(hash[:])
		return codeChallenge == encoded
	default:
		return false
	}
}

// BuildRedirectURI リダイレクトURIを構築
func (s *OAuth2Service) BuildRedirectURI(baseURI, code, state string) (string, error) {
	u, err := url.Parse(baseURI)
	if err != nil {
		return "", fmt.Errorf("無効なリダイレクトURIです: %v", err)
	}

	q := u.Query()
	q.Set("code", code)
	if state != "" {
		q.Set("state", state)
	}
	u.RawQuery = q.Encode()

	return u.String(), nil
}

// BuildErrorRedirectURI エラー用のリダイレクトURIを構築
func (s *OAuth2Service) BuildErrorRedirectURI(baseURI, errorCode, errorDescription, state string) (string, error) {
	u, err := url.Parse(baseURI)
	if err != nil {
		return "", fmt.Errorf("無効なリダイレクトURIです: %v", err)
	}

	q := u.Query()
	q.Set("error", errorCode)
	if errorDescription != "" {
		q.Set("error_description", errorDescription)
	}
	if state != "" {
		q.Set("state", state)
	}
	u.RawQuery = q.Encode()

	return u.String(), nil
}