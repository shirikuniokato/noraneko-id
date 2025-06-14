package main

import (
	"log"
	"net/http"

	"noraneko-id/internal/config"
	"noraneko-id/internal/handler"
	"noraneko-id/internal/middleware"
	"noraneko-id/pkg/database"

	"github.com/gin-gonic/gin"
	ginSwagger "github.com/swaggo/gin-swagger"
	swaggerFiles "github.com/swaggo/files"

	_ "noraneko-id/docs"
)

// @title noraneko-id API
// @version 1.0
// @description プライベートサービス開発者向けIDaaS（Identity as a Service）API
// @termsOfService https://noraneko-id.com/terms

// @contact.name noraneko-id Support
// @contact.url https://noraneko-id.com/support
// @contact.email support@noraneko-id.com

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Bearer Token認証。「Bearer 」の後にアクセストークンを指定してください。

// @securityDefinitions.apikey SessionAuth
// @in header
// @name Cookie
// @description セッション認証。session_tokenクッキーを使用します。

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

	// ミドルウェアの設定
	r.Use(middleware.SecurityHeadersMiddleware())
	r.Use(middleware.CORSMiddleware())

	// ハンドラーの初期化
	authHandler := handler.NewAuthHandler(cfg)
	oauth2Handler := handler.NewOAuth2Handler(cfg)
	clientHandler := handler.NewClientHandler(cfg)

	// Swagger UI エンドポイント
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// ヘルスチェック用エンドポイント
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"service": "noraneko-id",
			"environment": cfg.Environment,
		})
	})

	// 認証エンドポイント
	auth := r.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/logout", authHandler.Logout)
		auth.GET("/profile", middleware.AuthMiddleware(), authHandler.Profile)
	}

	// OAuth2エンドポイント
	oauth := r.Group("/oauth2")
	{
		oauth.GET("/authorize", middleware.OptionalAuthMiddleware(), oauth2Handler.Authorize)
		oauth.POST("/authorize", middleware.OptionalAuthMiddleware(), oauth2Handler.Authorize)
		oauth.POST("/token", oauth2Handler.Token)
		oauth.GET("/userinfo", oauth2Handler.UserInfo)
		oauth.POST("/revoke", oauth2Handler.Revoke)
		oauth.GET("/client-info/:client_id", oauth2Handler.GetClientInfo)
	}

	// 管理者エンドポイント
	admin := r.Group("/admin")
	admin.Use(middleware.AuthMiddleware())
	admin.Use(middleware.AdminAuthMiddleware())
	{
		// クライアント管理
		clients := admin.Group("/clients")
		{
			clients.POST("", clientHandler.CreateClient)
			clients.GET("", clientHandler.GetClients)
			clients.GET("/:id", clientHandler.GetClient)
			clients.PUT("/:id", clientHandler.UpdateClient)
			clients.DELETE("/:id", clientHandler.DeleteClient)
			clients.POST("/:id/regenerate-secret", clientHandler.RegenerateClientSecret)
		}
	}

	// サーバー起動
	serverAddr := ":" + cfg.Server.Port
	log.Printf("Starting noraneko-id server on %s (environment: %s)", serverAddr, cfg.Environment)
	if err := r.Run(serverAddr); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}