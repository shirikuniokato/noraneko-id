package seed

import (
	"fmt"
	"log"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Seeder シーダーインターフェース
type Seeder interface {
	Seed(db *gorm.DB) error
	Name() string
}

// Runner シーダー実行管理
type Runner struct {
	db      *gorm.DB
	seeders []Seeder
}

// NewRunner 新しいシーダーランナーを作成
func NewRunner(db *gorm.DB) *Runner {
	return &Runner{
		db: db,
		seeders: []Seeder{
			NewScopeSeeder(),
			NewClientSeeder(),
			NewUserSeeder(),
			NewAdminRoleSeeder(),
		},
	}
}

// Run 全てのシーダーを実行
func (r *Runner) Run() error {
	log.Println("🌱 種データの投入を開始します...")

	for _, seeder := range r.seeders {
		log.Printf("📦 %s の実行中...", seeder.Name())
		if err := seeder.Seed(r.db); err != nil {
			return fmt.Errorf("%s の実行に失敗しました: %w", seeder.Name(), err)
		}
		log.Printf("✅ %s が完了しました", seeder.Name())
	}

	log.Println("🎉 全ての種データの投入が完了しました！")
	return nil
}

// RunSpecific 特定のシーダーのみを実行
func (r *Runner) RunSpecific(names []string) error {
	nameMap := make(map[string]bool)
	for _, name := range names {
		nameMap[name] = true
	}

	for _, seeder := range r.seeders {
		if nameMap[seeder.Name()] {
			log.Printf("📦 %s の実行中...", seeder.Name())
			if err := seeder.Seed(r.db); err != nil {
				return fmt.Errorf("%s の実行に失敗しました: %w", seeder.Name(), err)
			}
			log.Printf("✅ %s が完了しました", seeder.Name())
		}
	}

	return nil
}

// 共通ユーティリティ関数

// GenerateUUID UUID生成のヘルパー
func GenerateUUID() uuid.UUID {
	return uuid.New()
}

// StringPtr 文字列ポインタ生成のヘルパー
func StringPtr(s string) *string {
	return &s
}

// UUIDPtr UUIDポインタ生成のヘルパー
func UUIDPtr(u uuid.UUID) *uuid.UUID {
	return &u
}