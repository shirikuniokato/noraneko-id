package seed

import (
	"crypto/rand"
	"encoding/base64"

	"github.com/lib/pq"
	"noraneko-id/internal/model"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// ClientSeeder OAuth2クライアントのシーダー
type ClientSeeder struct{}

// NewClientSeeder 新しいクライアントシーダーを作成
func NewClientSeeder() *ClientSeeder {
	return &ClientSeeder{}
}

// Name シーダー名を返す
func (s *ClientSeeder) Name() string {
	return "OAuth2クライアント"
}

// Seed クライアントデータを投入
func (s *ClientSeeder) Seed(db *gorm.DB) error {
	// 開発用クライアントシークレット（本番環境では環境変数から取得すべき）
	devClientSecret := "dev-secret-please-change-in-production"
	hashedSecret, err := bcrypt.GenerateFromPassword([]byte(devClientSecret), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	clients := []model.OAuthClient{
		{
			ClientID:         "dev-client-001",
			ClientSecretHash: string(hashedSecret),
			Name:             "開発用クライアント",
			Description:      StringPtr("ローカル開発環境用のテストクライアント"),
			RedirectURIs: pq.StringArray{
				"http://localhost:3000/callback",
				"http://localhost:3001/callback",
				"http://localhost:8080/callback",
			},
			AllowedScopes: pq.StringArray{
				"openid",
				"profile",
				"email",
				"offline_access",
			},
			IsConfidential: true,
			IsActive:       true,
			LogoURL:        StringPtr("https://via.placeholder.com/150"),
			Website:        StringPtr("http://localhost:3000"),
			SupportEmail:   StringPtr("dev@example.com"),
			BrandColor:     StringPtr("#4f46e5"),
			ConsentMessage: StringPtr("このアプリケーションがあなたのプロフィール情報にアクセスすることを許可しますか？"),
			RequireConsent: true,
			TrustedClient:  false,
		},
		{
			ClientID:         "test-spa-client",
			ClientSecretHash: "", // SPAクライアントなのでシークレットなし
			Name:             "テストSPAクライアント",
			Description:      StringPtr("Single Page Application用のパブリッククライアント"),
			RedirectURIs: pq.StringArray{
				"http://localhost:5173/auth/callback",
				"http://localhost:5174/auth/callback",
			},
			AllowedScopes: pq.StringArray{
				"openid",
				"profile",
				"email",
			},
			IsConfidential: false, // パブリッククライアント
			IsActive:       true,
			LogoURL:        StringPtr("https://via.placeholder.com/150"),
			Website:        StringPtr("http://localhost:5173"),
			SupportEmail:   StringPtr("spa@example.com"),
			BrandColor:     StringPtr("#10b981"),
			ConsentMessage: StringPtr("このSPAアプリケーションがあなたの情報にアクセスすることを許可しますか？"),
			RequireConsent: true,
			TrustedClient:  false,
		},
		{
			ClientID:         "admin-dashboard-001",
			ClientSecretHash: "", // 管理ダッシュボード用SPAクライアント
			Name:             "管理ダッシュボード",
			Description:      StringPtr("Noraneko ID管理画面用のパブリッククライアント"),
			RedirectURIs: pq.StringArray{
				"http://localhost:3000/auth/callback",
				"http://localhost:3001/auth/callback",
			},
			AllowedScopes: pq.StringArray{
				"openid",
				"profile",
				"email",
				"admin",
			},
			IsConfidential: false, // パブリッククライアント
			IsActive:       true,
			LogoURL:        StringPtr("https://via.placeholder.com/150"),
			Website:        StringPtr("http://localhost:3000"),
			SupportEmail:   StringPtr("admin@example.com"),
			BrandColor:     StringPtr("#6366f1"),
			ConsentMessage: StringPtr("管理ダッシュボードがあなたの管理者権限でアクセスすることを許可しますか？"),
			RequireConsent: false, // 管理ダッシュボードなので同意不要
			TrustedClient:  true,  // 信頼されたクライアント
		},
	}

	for _, client := range clients {
		// 既存のクライアントをチェック
		var existing model.OAuthClient
		if err := db.Where("client_id = ?", client.ClientID).First(&existing).Error; err == nil {
			// 既に存在する場合はスキップ
			continue
		}

		// 新規作成
		if err := db.Create(&client).Error; err != nil {
			return err
		}
	}

	return nil
}

// generateClientID ランダムなクライアントIDを生成
func generateClientID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}

// generateClientSecret ランダムなクライアントシークレットを生成
func generateClientSecret() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}