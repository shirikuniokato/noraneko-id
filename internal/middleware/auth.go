package middleware

import (
	"net/http"
	"time"

	"noraneko-id/internal/model"
	"noraneko-id/pkg/database"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
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
			Preload("User").
			First(&session).Error
		
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "invalid_session",
				"message": "無効なセッションです",
			})
			c.Abort()
			return
		}

		// ユーザーがアクティブかチェック
		if !session.User.IsActive {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "user_inactive",
				"message": "ユーザーアカウントが無効です",
			})
			c.Abort()
			return
		}

		// ユーザー情報をコンテキストに設定
		c.Set("user_id", session.User.ID)
		c.Set("user", session.User)
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
			Preload("User").
			First(&session).Error
		
		if err != nil {
			c.Next()
			return
		}

		// ユーザーがアクティブかチェック
		if !session.User.IsActive {
			c.Next()
			return
		}

		// ユーザー情報をコンテキストに設定
		c.Set("user_id", session.User.ID)
		c.Set("user", session.User)
		c.Set("session_id", session.ID)

		c.Next()
	}
}

// AdminAuthMiddleware 管理者認証ミドルウェア
func AdminAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 基本認証をまず実行
		AuthMiddleware()(c)
		if c.IsAborted() {
			return
		}

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
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Credentials", "true")
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
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Content-Security-Policy", "default-src 'self'")
		
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
	hash, _ := bcrypt.GenerateFromPassword([]byte(token), bcrypt.DefaultCost)
	return string(hash)
}