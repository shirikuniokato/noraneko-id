package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User ユーザーモデル
type User struct {
	ID                       uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Email                    string     `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash             string     `gorm:"not null" json:"-"`
	Username                 string     `gorm:"uniqueIndex;not null" json:"username"`
	DisplayName              *string    `json:"display_name,omitempty"`
	EmailVerified            bool       `gorm:"default:false" json:"email_verified"`
	EmailVerificationToken   *string    `gorm:"index" json:"-"`
	EmailVerificationExpires *time.Time `json:"-"`
	PasswordResetToken       *string    `gorm:"index" json:"-"`
	PasswordResetExpires     *time.Time `json:"-"`
	LastLoginAt              *time.Time `json:"last_login_at,omitempty"`
	IsActive                 bool       `gorm:"default:true" json:"is_active"`
	CreatedAt                time.Time  `json:"created_at"`
	UpdatedAt                time.Time  `json:"updated_at"`
}

// OAuthClient OAuth2クライアントアプリケーションモデル
type OAuthClient struct {
	ID             uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ClientID       string     `gorm:"uniqueIndex;not null" json:"client_id"`
	ClientSecretHash string   `gorm:"not null" json:"-"`
	Name           string     `gorm:"not null" json:"name"`
	Description    *string    `json:"description,omitempty"`
	RedirectURIs   []string   `gorm:"type:text[]" json:"redirect_uris"`
	AllowedScopes  []string   `gorm:"type:text[];default:'{}'" json:"allowed_scopes"`
	IsConfidential bool       `gorm:"default:true" json:"is_confidential"`
	IsActive       bool       `gorm:"default:true" json:"is_active"`
	CreatedBy      *uuid.UUID `gorm:"type:uuid" json:"created_by,omitempty"`
	
	// UI設定フィールド
	LogoURL          *string `json:"logo_url,omitempty"`
	Website          *string `json:"website,omitempty"`
	PrivacyPolicyURL *string `json:"privacy_policy_url,omitempty"`
	TermsOfServiceURL *string `json:"terms_of_service_url,omitempty"`
	SupportEmail     *string `json:"support_email,omitempty"`
	BrandColor       *string `gorm:"default:'#4f46e5'" json:"brand_color,omitempty"`
	ConsentMessage   *string `json:"consent_message,omitempty"`
	
	// セキュリティ設定
	RequireConsent bool `gorm:"default:true" json:"require_consent"`
	TrustedClient  bool `gorm:"default:false" json:"trusted_client"`
	
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName overrides the table name used by OAuthClient to `o_auth_clients`
func (OAuthClient) TableName() string {
	return "o_auth_clients"
}

// OAuthAuthorizationCode OAuth2認可コードモデル
type OAuthAuthorizationCode struct {
	ID                    uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Code                  string    `gorm:"uniqueIndex;not null" json:"code"`
	ClientID              uuid.UUID `gorm:"type:uuid;not null" json:"client_id"`
	UserID                uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	RedirectURI           string    `gorm:"not null" json:"redirect_uri"`
	Scopes                []string  `gorm:"type:text[];default:'{}'" json:"scopes"`
	CodeChallenge         *string   `json:"code_challenge,omitempty"`
	CodeChallengeMethod   *string   `json:"code_challenge_method,omitempty"`
	ExpiresAt             time.Time `gorm:"not null;index" json:"expires_at"`
	UsedAt                *time.Time `json:"used_at,omitempty"`
	CreatedAt             time.Time `json:"created_at"`
}

// OAuthAccessToken OAuth2アクセストークンモデル
type OAuthAccessToken struct {
	ID        uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	TokenHash string     `gorm:"uniqueIndex;not null" json:"-"`
	ClientID  uuid.UUID  `gorm:"type:uuid;not null" json:"client_id"`
	UserID    uuid.UUID  `gorm:"type:uuid;not null" json:"user_id"`
	Scopes    []string   `gorm:"type:text[];default:'{}'" json:"scopes"`
	ExpiresAt time.Time  `gorm:"not null;index" json:"expires_at"`
	RevokedAt *time.Time `json:"revoked_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

// OAuthRefreshToken OAuth2リフレッシュトークンモデル
type OAuthRefreshToken struct {
	ID            uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	TokenHash     string     `gorm:"uniqueIndex;not null" json:"-"`
	AccessTokenID uuid.UUID  `gorm:"type:uuid;not null" json:"access_token_id"`
	ClientID      uuid.UUID  `gorm:"type:uuid;not null" json:"client_id"`
	UserID        uuid.UUID  `gorm:"type:uuid;not null" json:"user_id"`
	Scopes        []string   `gorm:"type:text[];default:'{}'" json:"scopes"`
	ExpiresAt     time.Time  `gorm:"not null;index" json:"expires_at"`
	RevokedAt     *time.Time `json:"revoked_at,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
}

// OAuthScope OAuth2スコープ定義モデル
type OAuthScope struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name        string    `gorm:"uniqueIndex;not null" json:"name"`
	Description *string   `json:"description,omitempty"`
	IsDefault   bool      `gorm:"default:false" json:"is_default"`
	CreatedAt   time.Time `json:"created_at"`
}

// UserSession ユーザーセッションモデル（第一者Cookie用）
type UserSession struct {
	ID               uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID           uuid.UUID  `gorm:"type:uuid;not null" json:"user_id"`
	SessionTokenHash string     `gorm:"uniqueIndex;not null" json:"-"`
	ExpiresAt        time.Time  `gorm:"not null;index" json:"expires_at"`
	UserAgent        *string    `json:"user_agent,omitempty"`
	IPAddress        *string    `gorm:"type:inet" json:"ip_address,omitempty"`
	RevokedAt        *time.Time `json:"revoked_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
}

// AdminRole 管理者権限モデル
type AdminRole struct {
	ID          uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID      uuid.UUID  `gorm:"type:uuid;not null" json:"user_id"`
	Role        string     `gorm:"not null" json:"role"`
	Permissions []string   `gorm:"type:text[];default:'{}'" json:"permissions"`
	GrantedBy   *uuid.UUID `gorm:"type:uuid" json:"granted_by,omitempty"`
	GrantedAt   time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"granted_at"`
	RevokedAt   *time.Time `json:"revoked_at,omitempty"`
}

// BeforeCreate GORM hook to set UUID if not set
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

func (c *OAuthClient) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

func (a *OAuthAuthorizationCode) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

func (t *OAuthAccessToken) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

func (r *OAuthRefreshToken) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

func (s *OAuthScope) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

func (s *UserSession) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

func (r *AdminRole) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}