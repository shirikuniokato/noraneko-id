package handler

import (
	"net/http"
	"time"

	"noraneko-id/internal/config"
	"noraneko-id/internal/model"
	"noraneko-id/pkg/database"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// AuthHandler 認証関連のハンドラー
type AuthHandler struct {
	config *config.Config
}

// NewAuthHandler 認証ハンドラーの新しいインスタンスを作成
func NewAuthHandler(cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		config: cfg,
	}
}

// LoginRequest ログインリクエストの構造体
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// RegisterRequest ユーザー登録リクエストの構造体
type RegisterRequest struct {
	Email       string `json:"email" binding:"required,email"`
	Password    string `json:"password" binding:"required,min=6"`
	Username    string `json:"username" binding:"required,min=3,max=50"`
	DisplayName string `json:"display_name,omitempty"`
}

// Login ユーザーログイン POST /auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": "リクエストの形式が正しくありません",
			"details": err.Error(),
		})
		return
	}

	// ユーザーの検索
	var user model.User
	db := database.GetDB()
	if err := db.Where("email = ? AND is_active = ?", req.Email, true).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "invalid_credentials",
			"message": "メールアドレスまたはパスワードが正しくありません",
		})
		return
	}

	// パスワードの検証
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "invalid_credentials",
			"message": "メールアドレスまたはパスワードが正しくありません",
		})
		return
	}

	// セッショントークンの生成
	sessionToken := uuid.New().String()
	sessionTokenHash := h.hashToken(sessionToken)

	// セッションの作成
	userAgent := c.Request.UserAgent()
	if len(userAgent) > 500 {
		userAgent = userAgent[:500]
	}
	clientIP := c.ClientIP()
	
	session := &model.UserSession{
		UserID:           user.ID,
		SessionTokenHash: sessionTokenHash,
		ExpiresAt:        time.Now().Add(24 * time.Hour), // 24時間有効
		UserAgent:        &userAgent,
		IPAddress:        &clientIP,
	}

	if err := db.Create(session).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "session_creation_failed",
			"message": "セッションの作成に失敗しました",
		})
		return
	}

	// 最終ログイン時刻の更新
	now := time.Now()
	user.LastLoginAt = &now
	db.Save(&user)

	// セッションクッキーの設定
	c.SetCookie("session_token", sessionToken, int(24*time.Hour.Seconds()), "/", "", false, true)

	// レスポンス
	c.JSON(http.StatusOK, gin.H{
		"message": "ログインに成功しました",
		"user": gin.H{
			"id":            user.ID,
			"email":         user.Email,
			"username":      user.Username,
			"display_name":  user.DisplayName,
			"email_verified": user.EmailVerified,
		},
	})
}

// Register ユーザー登録 POST /auth/register
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": "リクエストの形式が正しくありません",
			"details": err.Error(),
		})
		return
	}

	db := database.GetDB()

	// メールアドレスの重複チェック
	var existingUser model.User
	if err := db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error":   "email_already_exists",
			"message": "このメールアドレスは既に使用されています",
		})
		return
	}

	// ユーザー名の重複チェック
	if err := db.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error":   "username_already_exists",
			"message": "このユーザー名は既に使用されています",
		})
		return
	}

	// パスワードのハッシュ化
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "password_hash_failed",
			"message": "パスワードの処理に失敗しました",
		})
		return
	}

	// ユーザーの作成
	user := &model.User{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Username:     req.Username,
		DisplayName:  &req.DisplayName,
		IsActive:     true,
	}

	if req.DisplayName == "" {
		user.DisplayName = nil
	}

	if err := db.Create(user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "user_creation_failed",
			"message": "ユーザーの作成に失敗しました",
		})
		return
	}

	// レスポンス（パスワードハッシュは含めない）
	c.JSON(http.StatusCreated, gin.H{
		"message": "ユーザーの登録が完了しました",
		"user": gin.H{
			"id":            user.ID,
			"email":         user.Email,
			"username":      user.Username,
			"display_name":  user.DisplayName,
			"email_verified": user.EmailVerified,
		},
	})
}

// Logout ユーザーログアウト POST /auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
	sessionToken, err := c.Cookie("session_token")
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"message": "ログアウトしました",
		})
		return
	}

	// セッションの無効化
	sessionTokenHash := h.hashToken(sessionToken)
	db := database.GetDB()
	now := time.Now()
	
	db.Model(&model.UserSession{}).
		Where("session_token_hash = ? AND revoked_at IS NULL", sessionTokenHash).
		Update("revoked_at", now)

	// クッキーの削除
	c.SetCookie("session_token", "", -1, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"message": "ログアウトしました",
	})
}

// Profile ユーザープロフィール取得 GET /auth/profile
func (h *AuthHandler) Profile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "unauthorized",
			"message": "認証が必要です",
		})
		return
	}

	var user model.User
	db := database.GetDB()
	if err := db.Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "user_not_found",
			"message": "ユーザーが見つかりません",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":              user.ID,
			"email":           user.Email,
			"username":        user.Username,
			"display_name":    user.DisplayName,
			"email_verified":  user.EmailVerified,
			"last_login_at":   user.LastLoginAt,
			"created_at":      user.CreatedAt,
		},
	})
}

// Helper functions

// min 最小値を返す
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// hashToken トークンをハッシュ化（OAuth2ハンドラーと同じ実装）
func (h *AuthHandler) hashToken(token string) string {
	// この実装は oauth2.go と同じものを使用
	// 実際のプロダクションでは共通のユーティリティ関数として分離すべき
	hasher := bcrypt.DefaultCost
	hash, _ := bcrypt.GenerateFromPassword([]byte(token), hasher)
	return string(hash)
}