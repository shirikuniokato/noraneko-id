package model

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
	"gorm.io/datatypes"
)

// User ユーザーモデル
type User struct {
	ID                       uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ClientID                 uuid.UUID  `gorm:"type:uuid;not null;index:idx_users_client_email,priority:1;index:idx_users_client_username,priority:1" json:"client_id"`
	Email                    string     `gorm:"not null;index:idx_users_client_email,priority:2" json:"email"`
	PasswordHash             *string    `gorm:"type:text" json:"-"` // nullable for SNS-only users
	Username                 string     `gorm:"not null;index:idx_users_client_username,priority:2" json:"username"`
	DisplayName              *string    `json:"display_name,omitempty"`
	ProfileImageURL          *string    `json:"profile_image_url,omitempty"` // from SNS providers
	EmailVerified            bool       `gorm:"default:false" json:"email_verified"`
	EmailVerificationToken   *string    `gorm:"index" json:"-"`
	EmailVerificationExpires *time.Time `json:"-"`
	PasswordResetToken       *string    `gorm:"index" json:"-"`
	PasswordResetExpires     *time.Time `json:"-"`
	LastLoginAt              *time.Time `json:"last_login_at,omitempty"`
	IsActive                 bool       `gorm:"default:true" json:"is_active"`
	CreatedAt                time.Time  `json:"created_at"`
	UpdatedAt                time.Time  `json:"updated_at"`
	
	// Relations
	Client OAuthClient `gorm:"foreignKey:ClientID" json:"-"`
}

// OAuthClient OAuth2クライアントアプリケーションモデル
type OAuthClient struct {
	ID             uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ClientID       string     `gorm:"uniqueIndex;not null" json:"client_id"`
	ClientSecretHash string   `gorm:"not null" json:"-"`
	Name           string     `gorm:"not null" json:"name"`
	Description    *string    `json:"description,omitempty"`
	RedirectURIs   pq.StringArray `gorm:"type:text[]" json:"redirect_uris"`
	AllowedScopes  pq.StringArray `gorm:"type:text[];default:'{}'" json:"allowed_scopes"`
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
	Scopes                string  `gorm:"type:text" json:"scopes"`
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
	Scopes    string   `gorm:"type:text" json:"scopes"`
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
	Scopes        string   `gorm:"type:text" json:"scopes"`
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

// 認証プロバイダータイプの定数
const (
	ProviderTypePassword = "password" // パスワード認証
	ProviderTypeGoogle   = "google"   // Google OAuth2
	ProviderTypeGitHub   = "github"   // GitHub OAuth2
	ProviderTypeLINE     = "line"     // LINE Login
	ProviderTypeApple    = "apple"    // Sign in with Apple
	ProviderTypeTwitter  = "twitter"  // Twitter OAuth
)

// GetSupportedProviders サポートされている認証プロバイダー一覧を取得
func GetSupportedProviders() []string {
	return []string{
		ProviderTypePassword,
		ProviderTypeGoogle,
		ProviderTypeGitHub,
		ProviderTypeLINE,
		ProviderTypeApple,
		ProviderTypeTwitter,
	}
}

// UserAuthProvider ユーザー認証プロバイダーモデル（SNS連携用）
type UserAuthProvider struct {
	ID             uuid.UUID              `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID         uuid.UUID              `gorm:"type:uuid;not null;index:idx_user_auth_providers_user_provider,priority:1" json:"user_id"`
	ProviderType   string                 `gorm:"not null;index:idx_user_auth_providers_user_provider,priority:2;index:idx_user_auth_providers_provider_id,priority:1" json:"provider_type"` // ProviderType定数を使用
	ProviderUserID *string                `gorm:"index:idx_user_auth_providers_provider_id,priority:2" json:"provider_user_id,omitempty"` // 外部プロバイダーのユーザーID
	ProviderEmail  *string                `json:"provider_email,omitempty"` // プロバイダーからのメールアドレス
	ProviderData   datatypes.JSON         `gorm:"type:jsonb" json:"provider_data,omitempty"` // 追加プロバイダーデータ（アバター、表示名等）
	IsVerified     bool                   `gorm:"default:false" json:"is_verified"`
	LastUsedAt     *time.Time             `json:"last_used_at,omitempty"`
	CreatedAt      time.Time              `json:"created_at"`
	UpdatedAt      time.Time              `json:"updated_at"`
	
	// Relations
	User User `gorm:"foreignKey:UserID" json:"-"`
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

func (p *UserAuthProvider) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

func (r *AdminRole) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}