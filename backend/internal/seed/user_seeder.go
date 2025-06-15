package seed

import (
	"fmt"

	"github.com/google/uuid"
	"noraneko-id/internal/model"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// UserSeeder ユーザーのシーダー
type UserSeeder struct{}

// NewUserSeeder 新しいユーザーシーダーを作成
func NewUserSeeder() *UserSeeder {
	return &UserSeeder{}
}

// Name シーダー名を返す
func (s *UserSeeder) Name() string {
	return "ユーザー"
}

// Seed ユーザーデータを投入
func (s *UserSeeder) Seed(db *gorm.DB) error {
	// 開発用クライアントのIDを取得
	var devClient model.OAuthClient
	if err := db.Where("client_id = ?", "dev-client-001").First(&devClient).Error; err != nil {
		return fmt.Errorf("開発用クライアントが見つかりません: %w", err)
	}

	// デフォルトパスワード（本番環境では使用しないこと）
	defaultPassword := "password123"
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(defaultPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	hashedPasswordStr := string(hashedPassword)

	users := []model.User{
		{
			ClientID:      devClient.ID,
			Email:         "admin@example.com",
			PasswordHash:  &hashedPasswordStr,
			Username:      "admin_" + uuid.New().String()[:8],
			DisplayName:   StringPtr("システム管理者"),
			EmailVerified: true,
			IsActive:      true,
		},
		{
			ClientID:      devClient.ID,
			Email:         "user1@example.com",
			PasswordHash:  &hashedPasswordStr,
			Username:      "user1_" + uuid.New().String()[:8],
			DisplayName:   StringPtr("テストユーザー1"),
			EmailVerified: true,
			IsActive:      true,
		},
		{
			ClientID:      devClient.ID,
			Email:         "user2@example.com",
			PasswordHash:  &hashedPasswordStr,
			Username:      "user2_" + uuid.New().String()[:8],
			DisplayName:   StringPtr("テストユーザー2"),
			EmailVerified: true,
			IsActive:      true,
		},
		{
			ClientID:      devClient.ID,
			Email:         "unverified@example.com",
			PasswordHash:  &hashedPasswordStr,
			Username:      "unverified_" + uuid.New().String()[:8],
			DisplayName:   StringPtr("未検証ユーザー"),
			EmailVerified: false, // メール未検証
			IsActive:      true,
		},
		{
			ClientID:      devClient.ID,
			Email:         "inactive@example.com",
			PasswordHash:  &hashedPasswordStr,
			Username:      "inactive_" + uuid.New().String()[:8],
			DisplayName:   StringPtr("無効化されたユーザー"),
			EmailVerified: true,
			IsActive:      false, // 無効化されたアカウント
		},
	}

	for _, user := range users {
		// 既存のユーザーをチェック（同一クライアント内でのメールアドレス重複確認）
		var existing model.User
		if err := db.Where("client_id = ? AND email = ?", user.ClientID, user.Email).First(&existing).Error; err == nil {
			// 既に存在する場合はスキップ
			continue
		}

		// 新規作成
		if err := db.Create(&user).Error; err != nil {
			return err
		}
	}

	return nil
}