package main

import (
	"log"
	"net/http"

	"noraneko-id/internal/config"
	"noraneko-id/pkg/database"

	"github.com/gin-gonic/gin"
)

func main() {
	// 設定の読み込み
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("設定の読み込みに失敗しました:", err)
	}

	// データベース接続
	dbConfig := database.DatabaseConfig{
		Host:     cfg.Database.Host,
		Port:     cfg.Database.Port,
		User:     cfg.Database.User,
		Password: cfg.Database.Password,
		DBName:   cfg.Database.DBName,
		SSLMode:  cfg.Database.SSLMode,
	}

	if err := database.Connect(dbConfig); err != nil {
		log.Fatal("データベース接続に失敗しました:", err)
	}
	defer database.Close()

	// オートマイグレーション実行
	if err := database.AutoMigrate(); err != nil {
		log.Fatal("データベースマイグレーションに失敗しました:", err)
	}

	// Gin モードの設定
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// ヘルスチェック用エンドポイント
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"service": "noraneko-id",
			"environment": cfg.Environment,
		})
	})

	// OAuth2エンドポイント（プレースホルダー）
	oauth := r.Group("/oauth2")
	{
		oauth.GET("/authorize", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "OAuth2 authorize endpoint"})
		})
		oauth.POST("/token", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "OAuth2 token endpoint"})
		})
		oauth.GET("/userinfo", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "OAuth2 userinfo endpoint"})
		})
		oauth.POST("/revoke", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "OAuth2 revoke endpoint"})
		})
	}

	// サーバー起動
	serverAddr := ":" + cfg.Server.Port
	log.Printf("Starting noraneko-id server on %s (environment: %s)", serverAddr, cfg.Environment)
	if err := r.Run(serverAddr); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}