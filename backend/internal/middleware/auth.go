package middleware

import (
	"crypto/sha256"
	"encoding/hex"
	"log"
	"net/http"
	"time"

	"noraneko-id/internal/model"
	"noraneko-id/pkg/database"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware 認証ミドルウェア
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionToken, err := c.Cookie("session_token")
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "unauthorized",
				"message": "認証が必要です",
			})
			c.Abort()
			return
		}

		// セッションの検証
		sessionTokenHash := hashToken(sessionToken)
		var session model.UserSession
		db := database.GetDB()
		
		err = db.Where("session_token_hash = ? AND revoked_at IS NULL AND expires_at > ?", 
			sessionTokenHash, time.Now()).
			First(&session).Error
		
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "invalid_session",
				"message": "無効なセッションです",
			})
			c.Abort()
			return
		}

		// ユーザー情報を取得（クライアント情報も一緒に）
		var user model.User
		err = db.Preload("Client").Where("id = ?", session.UserID).First(&user).Error
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "user_not_found",
				"message": "ユーザーが見つかりません",
			})
			c.Abort()
			return
		}

		// ユーザーがアクティブかチェック
		if !user.IsActive {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "user_inactive",
				"message": "ユーザーアカウントが無効です",
			})
			c.Abort()
			return
		}

		// ユーザー情報をコンテキストに設定
		c.Set("user_id", user.ID)
		c.Set("user", user)
		c.Set("client_id", user.ClientID)
		c.Set("client", user.Client)
		c.Set("session_id", session.ID)

		c.Next()
	}
}

// OptionalAuthMiddleware オプション認証ミドルウェア（認証は必須ではない）
func OptionalAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionToken, err := c.Cookie("session_token")
		if err != nil {
			c.Next()
			return
		}

		// セッションの検証
		sessionTokenHash := hashToken(sessionToken)
		var session model.UserSession
		db := database.GetDB()
		
		err = db.Where("session_token_hash = ? AND revoked_at IS NULL AND expires_at > ?", 
			sessionTokenHash, time.Now()).
			First(&session).Error
		
		if err != nil {
			c.Next()
			return
		}

		// ユーザー情報を取得（クライアント情報も一緒に）
		var user model.User
		err = db.Preload("Client").Where("id = ?", session.UserID).First(&user).Error
		if err != nil {
			c.Next()
			return
		}

		// ユーザーがアクティブかチェック
		if !user.IsActive {
			c.Next()
			return
		}

		// ユーザー情報をコンテキストに設定
		c.Set("user_id", user.ID)
		c.Set("user", user)
		c.Set("client_id", user.ClientID)
		c.Set("client", user.Client)
		c.Set("session_id", session.ID)

		c.Next()
	}
}

// AdminAuthMiddleware 管理者認証ミドルウェア（基本認証は前提）
func AdminAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "unauthorized",
				"message": "認証が必要です",
			})
			c.Abort()
			return
		}

		// 管理者権限の確認
		var adminRole model.AdminRole
		db := database.GetDB()
		err := db.Where("user_id = ? AND revoked_at IS NULL", userID).First(&adminRole).Error
		if err != nil {
			// デバッグ用ログ
			log.Printf("Admin role check failed for user %v: %v", userID, err)
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "forbidden",
				"message": "管理者権限が必要です",
			})
			c.Abort()
			return
		}

		// 管理者情報をコンテキストに設定
		c.Set("admin_role", adminRole.Role)
		c.Set("admin_permissions", adminRole.Permissions)

		c.Next()
	}
}

// CORSMiddleware CORS ミドルウェア
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		
		// 許可するオリジンのリスト（環境変数から取得することも可能）
		allowedOrigins := []string{
			"http://localhost:3000",  // Next.js 管理画面
			"http://localhost:3001",  // Next.js デモアプリ  
			"http://localhost:8080",  // API サーバー自身（Swagger UI用）
		}
		
		// オリジンが許可リストに含まれているかチェック
		allowed := false
		for _, allowedOrigin := range allowedOrigins {
			if origin == allowedOrigin {
				allowed = true
				break
			}
		}
		
		// 開発環境では全てのlocalhostオリジンを許可
		if !allowed && origin != "" {
			if len(origin) >= 17 && origin[:17] == "http://localhost:" {
				allowed = true
			} else if len(origin) >= 16 && origin[:16] == "http://127.0.0.1:" {
				allowed = true
			}
		}
		
		// 許可されたオリジンの場合のみヘッダーを設定
		if allowed {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Access-Control-Allow-Credentials", "true")
		}
		
		c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Header("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// SecurityHeadersMiddleware セキュリティヘッダーミドルウェア
func SecurityHeadersMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// APIレスポンスには最小限のセキュリティヘッダーのみ設定
		// SPAでのCSP違反を避けるため、Content-Security-Policyは設定しない
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		
		// HTMLテンプレート（認証画面）の場合のみCSPを設定
		if c.Request.URL.Path == "/oauth2/authorize" && c.Request.Method == "GET" {
			c.Header("Content-Security-Policy", "default-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self' data:;")
		}
		
		c.Next()
	}
}

// RateLimitMiddleware レート制限ミドルウェア（シンプルな実装）
func RateLimitMiddleware() gin.HandlerFunc {
	// 実際のプロダクションではRedisなどを使用した本格的な実装が必要
	return func(c *gin.Context) {
		// TODO: 実装
		c.Next()
	}
}

// Helper functions

// hashToken トークンをハッシュ化
func hashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}