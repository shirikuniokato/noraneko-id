package seed

import (
	"noraneko-id/internal/model"
	"gorm.io/gorm"
)

// ScopeSeeder OAuth2スコープのシーダー
type ScopeSeeder struct{}

// NewScopeSeeder 新しいスコープシーダーを作成
func NewScopeSeeder() *ScopeSeeder {
	return &ScopeSeeder{}
}

// Name シーダー名を返す
func (s *ScopeSeeder) Name() string {
	return "OAuthスコープ"
}

// Seed スコープデータを投入
func (s *ScopeSeeder) Seed(db *gorm.DB) error {
	scopes := []model.OAuthScope{
		{
			Name:        "openid",
			Description: StringPtr("OpenID Connect認証"),
			IsDefault:   true,
		},
		{
			Name:        "profile",
			Description: StringPtr("プロフィール情報（名前、プロフィール画像など）へのアクセス"),
			IsDefault:   true,
		},
		{
			Name:        "email",
			Description: StringPtr("メールアドレスへのアクセス"),
			IsDefault:   true,
		},
		{
			Name:        "offline_access",
			Description: StringPtr("オフラインアクセス（リフレッシュトークンの発行）"),
			IsDefault:   false,
		},
		{
			Name:        "admin",
			Description: StringPtr("管理者機能へのアクセス"),
			IsDefault:   false,
		},
	}

	for _, scope := range scopes {
		// 既存のスコープをチェック
		var existing model.OAuthScope
		if err := db.Where("name = ?", scope.Name).First(&existing).Error; err == nil {
			// 既に存在する場合はスキップ
			continue
		}

		// 新規作成
		if err := db.Create(&scope).Error; err != nil {
			return err
		}
	}

	return nil
}