package seed

import (
	"fmt"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"noraneko-id/internal/model"
	"gorm.io/gorm"
)

// AdminRoleSeeder 管理者権限のシーダー
type AdminRoleSeeder struct{}

// NewAdminRoleSeeder 新しい管理者権限シーダーを作成
func NewAdminRoleSeeder() *AdminRoleSeeder {
	return &AdminRoleSeeder{}
}

// Name シーダー名を返す
func (s *AdminRoleSeeder) Name() string {
	return "管理者権限"
}

// Seed 管理者権限データを投入
func (s *AdminRoleSeeder) Seed(db *gorm.DB) error {
	// 開発用クライアントのIDを取得
	var devClient model.OAuthClient
	if err := db.Where("client_id = ?", "dev-client-001").First(&devClient).Error; err != nil {
		return fmt.Errorf("開発用クライアントが見つかりません: %w", err)
	}

	// 管理者ユーザーを取得
	var adminUser model.User
	if err := db.Where("client_id = ? AND email = ?", devClient.ID, "admin@example.com").First(&adminUser).Error; err != nil {
		return fmt.Errorf("管理者ユーザーが見つかりません: %w", err)
	}

	// 管理者権限の設定
	adminRoles := []model.AdminRole{
		{
			UserID: adminUser.ID,
			Role:   "super_admin",
			Permissions: []string{
				"clients:read",
				"clients:write",
				"clients:delete",
				"users:read",
				"users:write",
				"users:delete",
				"tokens:read",
				"tokens:revoke",
				"scopes:read",
				"scopes:write",
				"admin:all",
			},
			GrantedBy: nil, // システムによる自動付与
		},
	}

	// テスト用に限定的な権限を持つ管理者も作成
	var user1 model.User
	if err := db.Where("client_id = ? AND email = ?", devClient.ID, "user1@example.com").First(&user1).Error; err == nil {
		adminRoles = append(adminRoles, model.AdminRole{
			UserID: user1.ID,
			Role:   "client_admin",
			Permissions: []string{
				"clients:read",
				"clients:write",
				"users:read",
			},
			GrantedBy: &adminUser.ID,
		})
	}

	for _, role := range adminRoles {
		// 既存の権限をチェック
		var existing model.AdminRole
		if err := db.Where("user_id = ? AND role = ? AND revoked_at IS NULL", role.UserID, role.Role).First(&existing).Error; err == nil {
			// 既に存在する場合はスキップ
			continue
		}

		// PostgreSQL配列として権限を設定
		role.ID = uuid.New()
		if err := db.Exec(`
			INSERT INTO admin_roles (id, user_id, role, permissions, granted_by, granted_at) 
			VALUES (?, ?, ?, ?, ?, NOW())
		`, role.ID, role.UserID, role.Role, pq.Array(role.Permissions), role.GrantedBy).Error; err != nil {
			return err
		}
	}

	return nil
}