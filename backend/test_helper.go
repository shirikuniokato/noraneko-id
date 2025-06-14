package main

import (
	"log"
	"os"
	"testing"

	"noraneko-id/internal/config"
	"noraneko-id/pkg/database"
)

// setupTestDatabase テスト用のデータベース設定
func setupTestDatabase() {
	cfg := &config.Config{
		Database: config.DatabaseConfig{
			Host:     "localhost",
			Port:     "5432",
			User:     "noraneko",
			Password: "dev_password", 
			DBName:   "noraneko_test",
			SSLMode:  "disable",
		},
	}

	dbConfig := database.DatabaseConfig{
		Host:     cfg.Database.Host,
		Port:     cfg.Database.Port,
		User:     cfg.Database.User,
		Password: cfg.Database.Password,
		DBName:   cfg.Database.DBName,
		SSLMode:  cfg.Database.SSLMode,
	}

	if err := database.Connect(dbConfig); err != nil {
		log.Printf("Warning: Could not connect to test database: %v", err)
		log.Printf("Some integration tests may fail. Make sure PostgreSQL is running.")
		return
	}

	if err := database.AutoMigrate(); err != nil {
		log.Printf("Warning: Could not migrate test database: %v", err)
	}
}

// teardownTestDatabase テスト後のクリーンアップ
func teardownTestDatabase() {
	if database.GetDB() != nil {
		database.Close()
	}
}

// TestMain テスト実行前後の処理
func TestMain(m *testing.M) {
	setupTestDatabase()
	code := m.Run()
	teardownTestDatabase()
	os.Exit(code)
}