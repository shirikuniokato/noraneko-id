package database

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// DatabaseConfig データベース設定
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// Connect データベース接続を初期化
func Connect(config DatabaseConfig) error {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		config.Host, config.Port, config.User, config.Password, config.DBName, config.SSLMode)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(getLogLevel()),
	})

	if err != nil {
		return fmt.Errorf("データベース接続に失敗しました: %v", err)
	}

	log.Println("データベースに正常に接続しました")
	return nil
}

// AutoMigrate データベーステーブルの自動マイグレーション
func AutoMigrate() error {
	// Temporarily disable ALL auto-migration to avoid GORM conflicts
	// All tables including UserAuthProvider have been migrated manually via SQL scripts
	log.Println("スキップ中: GORM自動マイグレーション（全テーブル手動SQLマイグレーション使用中）")
	
	// No auto-migration performed - all done via manual SQL scripts
	// This prevents GORM from trying to convert client_id types and causing conflicts
	
	// TODO: Re-enable selective GORM auto-migration after resolving foreign key conflicts

	log.Println("データベースマイグレーションが完了しました")
	return nil
}

// Close データベース接続を閉じる
func Close() error {
	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// getLogLevel 環境変数からログレベルを取得
func getLogLevel() logger.LogLevel {
	if os.Getenv("DEBUG") == "true" {
		return logger.Info
	}
	return logger.Silent
}

// GetDB データベースインスタンスを取得
func GetDB() *gorm.DB {
	return DB
}