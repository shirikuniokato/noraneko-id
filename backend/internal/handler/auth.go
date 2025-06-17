package handler

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"net/url"
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
	Email    string `json:"email" binding:"required,email" example:"user@example.com"` // メールアドレス
	Password string `json:"password" binding:"required,min=6" example:"password123"` // パスワード（6文字以上）
	ClientID string `json:"client_id" binding:"required" example:"demo-client"` // クライアントID（マルチテナント対応）
}

// RegisterRequest ユーザー登録リクエストの構造体
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email" example:"user@example.com"` // メールアドレス
	Password string `json:"password" binding:"required,min=6" example:"password123"` // パスワード（6文字以上）
	ClientID string `json:"client_id" binding:"required" example:"demo-client"` // クライアントID（マルチテナント対応）
}

// Login ユーザーログイン POST /auth/login
// @Summary ユーザーログイン
// @Description メールアドレスとパスワードでユーザーログインを行います
// @Tags 認証
// @Accept json
// @Produce json
// @Param request body LoginRequest true "ログイン情報"
// @Success 200 {object} map[string]interface{} "ログイン成功"
// @Failure 400 {object} map[string]interface{} "リクエストエラー"
// @Failure 401 {object} map[string]interface{} "認証エラー"
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	
	// Content-Typeでリクエスト形式を判定
	contentType := c.GetHeader("Content-Type")
	isFormRequest := contentType == "application/x-www-form-urlencoded"
	
	if isFormRequest {
		// HTMLフォームからのリクエスト
		req.Email = c.PostForm("email")
		req.Password = c.PostForm("password")
		req.ClientID = c.PostForm("client_id")
		if req.Email == "" || req.Password == "" || req.ClientID == "" {
			redirectURI := c.PostForm("redirect_uri")
			// TODO: 業界標準に合わせてstate tokenに暗号化することを検討
			// 現在は開発段階のためURLパラメータ直接渡しを継続
			loginURL := "/login?error=" + url.QueryEscape("メールアドレス、パスワードを入力してください")
			if redirectURI != "" {
				loginURL += "&redirect_uri=" + url.QueryEscape(redirectURI)
			}
			if req.ClientID != "" {
				loginURL += "&client_id=" + url.QueryEscape(req.ClientID)
			}
			c.Redirect(http.StatusFound, loginURL)
			return
		}
	} else {
		// JSONリクエスト
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "invalid_request",
				"message": "リクエストの形式が正しくありません",
				"details": err.Error(),
			})
			return
		}
	}

	// クライアントの検索と検証
	var client model.OAuthClient
	db := database.GetDB()
	if err := db.Where("client_id = ? AND is_active = ?", req.ClientID, true).First(&client).Error; err != nil {
		if isFormRequest {
			redirectURI := c.PostForm("redirect_uri")
			loginURL := "/login?error=" + url.QueryEscape("無効なクライアントIDです")
			if redirectURI != "" {
				loginURL += "&redirect_uri=" + url.QueryEscape(redirectURI)
			}
			if req.ClientID != "" {
				loginURL += "&client_id=" + url.QueryEscape(req.ClientID)
			}
			c.Redirect(http.StatusFound, loginURL)
		} else {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "invalid_client",
				"message": "無効なクライアントIDです",
			})
		}
		return
	}

	// ユーザーの検索（クライアントスコープ内）
	var user model.User
	if err := db.Where("client_id = ? AND email = ? AND is_active = ?", client.ID, req.Email, true).First(&user).Error; err != nil {
		if isFormRequest {
			redirectURI := c.PostForm("redirect_uri")
			loginURL := "/login?error=" + url.QueryEscape("メールアドレスまたはパスワードが正しくありません")
			if redirectURI != "" {
				loginURL += "&redirect_uri=" + url.QueryEscape(redirectURI)
			}
			if req.ClientID != "" {
				loginURL += "&client_id=" + url.QueryEscape(req.ClientID)
			}
			c.Redirect(http.StatusFound, loginURL)
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "invalid_credentials",
				"message": "メールアドレスまたはパスワードが正しくありません",
			})
		}
		return
	}

	// パスワードの検証（SNSユーザーの場合はパスワードなし）
	if user.PasswordHash == nil {
		if isFormRequest {
			redirectURI := c.PostForm("redirect_uri")
			loginURL := "/login?error=" + url.QueryEscape("このアカウントはパスワードログインに対応していません")
			if redirectURI != "" {
				loginURL += "&redirect_uri=" + url.QueryEscape(redirectURI)
			}
			if req.ClientID != "" {
				loginURL += "&client_id=" + url.QueryEscape(req.ClientID)
			}
			c.Redirect(http.StatusFound, loginURL)
		} else {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "password_not_supported",
				"message": "このアカウントはパスワードログインに対応していません",
			})
		}
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(req.Password)); err != nil {
		if isFormRequest {
			redirectURI := c.PostForm("redirect_uri")
			loginURL := "/login?error=" + url.QueryEscape("メールアドレスまたはパスワードが正しくありません")
			if redirectURI != "" {
				loginURL += "&redirect_uri=" + url.QueryEscape(redirectURI)
			}
			if req.ClientID != "" {
				loginURL += "&client_id=" + url.QueryEscape(req.ClientID)
			}
			c.Redirect(http.StatusFound, loginURL)
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "invalid_credentials",
				"message": "メールアドレスまたはパスワードが正しくありません",
			})
		}
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
	// SameSite=Laxで異なるオリジンからの認証フローに対応
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("session_token", sessionToken, int(24*time.Hour.Seconds()), "/", "", false, true)

	// レスポンス
	if isFormRequest {
		// HTMLフォームからのリクエストの場合はリダイレクト
		redirectURI := c.PostForm("redirect_uri")
		if redirectURI != "" {
			c.Redirect(http.StatusFound, redirectURI)
		} else {
			c.Redirect(http.StatusFound, "/")
		}
	} else {
		// JSONリクエストの場合はJSONレスポンス
		c.JSON(http.StatusOK, gin.H{
			"message": "ログインに成功しました",
			"user": gin.H{
				"id":            user.ID,
				"client_id":     client.ClientID,
				"email":         user.Email,
				"username":      user.Username,
				"display_name":  h.getSafeDisplayName(&user),
				"email_verified": user.EmailVerified,
			},
		})
	}
}

// Register ユーザー登録 POST /auth/register
// @Summary ユーザー新規登録
// @Description 新しいユーザーアカウントを作成します
// @Tags 認証
// @Accept json
// @Produce json
// @Param request body RegisterRequest true "ユーザー登録情報"
// @Success 201 {object} map[string]interface{} "ユーザー作成成功"
// @Failure 400 {object} map[string]interface{} "リクエストエラー"
// @Failure 409 {object} map[string]interface{} "ユーザー既に存在"
// @Router /auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	
	// Content-Typeでリクエスト形式を判定
	contentType := c.GetHeader("Content-Type")
	isFormRequest := contentType == "application/x-www-form-urlencoded"
	
	if isFormRequest {
		// HTMLフォームからのリクエスト
		req.Email = c.PostForm("email")
		req.Password = c.PostForm("password")
		req.ClientID = c.PostForm("client_id")
		if req.Email == "" || req.Password == "" || req.ClientID == "" {
			redirectURI := c.PostForm("redirect_uri")
			registerURL := "/register?error=" + url.QueryEscape("必要な項目をすべて入力してください")
			if redirectURI != "" {
				registerURL += "&redirect_uri=" + url.QueryEscape(redirectURI)
			}
			if req.ClientID != "" {
				registerURL += "&client_id=" + url.QueryEscape(req.ClientID)
			}
			c.Redirect(http.StatusFound, registerURL)
			return
		}
	} else {
		// JSONリクエスト
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "invalid_request",
				"message": "リクエストの形式が正しくありません",
				"details": err.Error(),
			})
			return
		}
	}

	db := database.GetDB()

	// クライアントの検索と検証
	var client model.OAuthClient
	if err := db.Where("client_id = ? AND is_active = ?", req.ClientID, true).First(&client).Error; err != nil {
		if isFormRequest {
			redirectURI := c.PostForm("redirect_uri")
			registerURL := "/register?error=" + url.QueryEscape("無効なクライアントIDです")
			if redirectURI != "" {
				registerURL += "&redirect_uri=" + url.QueryEscape(redirectURI)
			}
			c.Redirect(http.StatusFound, registerURL)
		} else {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "invalid_client",
				"message": "無効なクライアントIDです",
			})
		}
		return
	}

	// メールアドレスの重複チェック（クライアントスコープ内）
	var existingUser model.User
	if err := db.Where("client_id = ? AND email = ?", client.ID, req.Email).First(&existingUser).Error; err == nil {
		if isFormRequest {
			redirectURI := c.PostForm("redirect_uri")
			registerURL := "/register?error=" + url.QueryEscape("このメールアドレスは既に使用されています")
			if redirectURI != "" {
				registerURL += "&redirect_uri=" + url.QueryEscape(redirectURI)
			}
			if req.ClientID != "" {
				registerURL += "&client_id=" + url.QueryEscape(req.ClientID)
			}
			c.Redirect(http.StatusFound, registerURL)
		} else {
			c.JSON(http.StatusConflict, gin.H{
				"error":   "email_already_exists",
				"message": "このメールアドレスは既に使用されています",
			})
		}
		return
	}

	// ユーザー名の自動生成（システム内部識別子）
	generatedUsername := h.generateUsername()

	// パスワードのハッシュ化
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		if isFormRequest {
			redirectURI := c.PostForm("redirect_uri")
			registerURL := "/register?error=" + url.QueryEscape("パスワードの処理に失敗しました")
			if redirectURI != "" {
				registerURL += "&redirect_uri=" + url.QueryEscape(redirectURI)
			}
			if req.ClientID != "" {
				registerURL += "&client_id=" + url.QueryEscape(req.ClientID)
			}
			c.Redirect(http.StatusFound, registerURL)
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "password_hash_failed",
				"message": "パスワードの処理に失敗しました",
			})
		}
		return
	}

	// ユーザーの作成（マルチテナント対応）
	hashedPasswordStr := string(hashedPassword)
	user := &model.User{
		ClientID:     client.ID,
		Email:        req.Email,
		PasswordHash: &hashedPasswordStr,
		Username:     generatedUsername,
		DisplayName:  nil, // 表示名は登録後に設定
		IsActive:     true,
	}

	if err := db.Create(user).Error; err != nil {
		if isFormRequest {
			redirectURI := c.PostForm("redirect_uri")
			registerURL := "/register?error=" + url.QueryEscape("ユーザーの作成に失敗しました")
			if redirectURI != "" {
				registerURL += "&redirect_uri=" + url.QueryEscape(redirectURI)
			}
			if req.ClientID != "" {
				registerURL += "&client_id=" + url.QueryEscape(req.ClientID)
			}
			c.Redirect(http.StatusFound, registerURL)
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "user_creation_failed",
				"message": "ユーザーの作成に失敗しました",
			})
		}
		return
	}

	// UserAuthProviderレコードの作成（パスワード認証用）
	provider := &model.UserAuthProvider{
		UserID:        user.ID,
		ProviderType:  model.ProviderTypePassword,
		ProviderEmail: &user.Email,
		IsVerified:    false, // メール検証が必要
	}

	if err := db.Create(provider).Error; err != nil {
		if isFormRequest {
			redirectURI := c.PostForm("redirect_uri")
			registerURL := "/register?error=" + url.QueryEscape("認証プロバイダーの作成に失敗しました")
			if redirectURI != "" {
				registerURL += "&redirect_uri=" + url.QueryEscape(redirectURI)
			}
			if req.ClientID != "" {
				registerURL += "&client_id=" + url.QueryEscape(req.ClientID)
			}
			c.Redirect(http.StatusFound, registerURL)
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "provider_creation_failed",
				"message": "認証プロバイダーの作成に失敗しました",
			})
		}
		return
	}

	// レスポンス
	if isFormRequest {
		// HTMLフォームからのリクエストの場合はリダイレクト
		redirectURI := c.PostForm("redirect_uri")
		if redirectURI != "" {
			c.Redirect(http.StatusFound, redirectURI)
		} else {
			// ログインページにリダイレクト（登録完了）
			loginURL := "/login?message=" + url.QueryEscape("ユーザー登録が完了しました。ログインしてください。")
			if req.ClientID != "" {
				loginURL += "&client_id=" + url.QueryEscape(req.ClientID)
			}
			c.Redirect(http.StatusFound, loginURL)
		}
	} else {
		// JSONリクエストの場合はJSONレスポンス
		c.JSON(http.StatusCreated, gin.H{
			"message": "ユーザーの登録が完了しました",
			"user": gin.H{
				"id":            user.ID,
				"client_id":     client.ClientID,
				"email":         user.Email,
				"username":      user.Username,
				"display_name":  h.getSafeDisplayName(user),
				"email_verified": user.EmailVerified,
			},
		})
	}
}

// Logout ユーザーログアウト POST /auth/logout
// @Summary ユーザーログアウト
// @Description 現在のセッションを無効化してログアウトします
// @Tags 認証
// @Produce json
// @Success 200 {object} map[string]interface{} "ログアウト成功"
// @Router /auth/logout [post]
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
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("session_token", "", -1, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"message": "ログアウトしました",
	})
}

// Profile ユーザープロフィール取得 GET /auth/profile
// @Summary ユーザープロフィール取得
// @Description ログイン中のユーザーのプロフィール情報を取得します
// @Tags 認証
// @Produce json
// @Security SessionAuth
// @Success 200 {object} map[string]interface{} "ユーザープロフィール"
// @Failure 401 {object} map[string]interface{} "認証エラー"
// @Failure 404 {object} map[string]interface{} "ユーザーが見つからない"
// @Router /auth/profile [get]
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
	if err := db.Preload("Client").Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "user_not_found",
			"message": "ユーザーが見つかりません",
		})
		return
	}

	// ユーザーの認証プロバイダー情報を取得
	var providers []model.UserAuthProvider
	db.Where("user_id = ?", userID).Find(&providers)

	// プロバイダー情報を整理
	providerList := make([]gin.H, 0, len(providers))
	for _, provider := range providers {
		providerInfo := gin.H{
			"type":         provider.ProviderType,
			"verified":     provider.IsVerified,
			"last_used_at": provider.LastUsedAt,
			"created_at":   provider.CreatedAt,
		}
		
		// SNSプロバイダーの場合は追加情報を含める
		if provider.ProviderType != model.ProviderTypePassword {
			if provider.ProviderEmail != nil {
				providerInfo["provider_email"] = *provider.ProviderEmail
			}
			if provider.ProviderUserID != nil {
				providerInfo["provider_user_id"] = *provider.ProviderUserID
			}
			if provider.ProviderData != nil {
				providerInfo["provider_data"] = provider.ProviderData
			}
		}
		
		providerList = append(providerList, providerInfo)
	}

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":              user.ID,
			"client_id":       user.Client.ClientID,
			"email":           user.Email,
			"username":        user.Username,
			"display_name":    h.getSafeDisplayName(&user),
			"profile_image_url": user.ProfileImageURL,
			"email_verified":  user.EmailVerified,
			"last_login_at":   user.LastLoginAt,
			"created_at":      user.CreatedAt,
			"auth_providers":  providerList,
		},
	})
}

// GetSupportedProviders サポートされている認証プロバイダー一覧を取得 GET /auth/providers
// @Summary サポートされている認証プロバイダー一覧取得
// @Description システムがサポートしている認証プロバイダーの一覧を取得します
// @Tags 認証
// @Produce json
// @Success 200 {object} map[string]interface{} "サポートされているプロバイダー一覧"
// @Router /auth/providers [get]
func (h *AuthHandler) GetSupportedProviders(c *gin.Context) {
	providers := model.GetSupportedProviders()
	
	// プロバイダー情報を整理
	providerInfo := make([]gin.H, 0, len(providers))
	for _, provider := range providers {
		info := gin.H{
			"type": provider,
			"name": getProviderDisplayName(provider),
			"available": isProviderAvailable(provider),
		}
		providerInfo = append(providerInfo, info)
	}
	
	c.JSON(http.StatusOK, gin.H{
		"providers": providerInfo,
		"total": len(providers),
	})
}

// プロバイダーの表示名を取得
func getProviderDisplayName(providerType string) string {
	switch providerType {
	case model.ProviderTypePassword:
		return "パスワード認証"
	case model.ProviderTypeGoogle:
		return "Google"
	case model.ProviderTypeGitHub:
		return "GitHub"
	case model.ProviderTypeLINE:
		return "LINE"
	case model.ProviderTypeApple:
		return "Apple"
	case model.ProviderTypeTwitter:
		return "Twitter"
	default:
		return providerType
	}
}

// プロバイダーが利用可能かどうかをチェック
func isProviderAvailable(providerType string) bool {
	switch providerType {
	case model.ProviderTypePassword:
		return true // パスワード認証は常に利用可能
	case model.ProviderTypeGoogle, model.ProviderTypeGitHub, model.ProviderTypeLINE:
		return false // 将来実装予定
	case model.ProviderTypeApple, model.ProviderTypeTwitter:
		return false // 将来実装予定
	default:
		return false
	}
}


// LoginPage ログインページ表示 GET /login
func (h *AuthHandler) LoginPage(c *gin.Context) {
	redirectURI := c.Query("redirect_uri")
	clientID := c.Query("client_id")
	errorMsg := c.Query("error")
	message := c.Query("message")
	
	c.HTML(http.StatusOK, "login.html", gin.H{
		"redirect_uri": redirectURI,
		"client_id":    clientID,
		"error":        errorMsg,
		"message":      message,
	})
}

// RegisterPage 新規登録ページ表示 GET /register
func (h *AuthHandler) RegisterPage(c *gin.Context) {
	redirectURI := c.Query("redirect_uri")
	clientID := c.Query("client_id")
	errorMsg := c.Query("error")
	
	c.HTML(http.StatusOK, "register.html", gin.H{
		"redirect_uri": redirectURI,
		"client_id":    clientID,
		"error":        errorMsg,
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
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}

// generateUsername システム内部識別用ユーザー名を自動生成
func (h *AuthHandler) generateUsername() string {
	return "user_" + uuid.New().String()[:8]
}

// getSafeDisplayName 表示名の安全なフォールバック取得
func (h *AuthHandler) getSafeDisplayName(user *model.User) string {
	if user.DisplayName != nil && *user.DisplayName != "" {
		return *user.DisplayName
	}
	return "名前未設定"
}