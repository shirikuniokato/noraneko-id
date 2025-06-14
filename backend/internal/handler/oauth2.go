package handler

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"strings"
	"time"

	"noraneko-id/internal/config"
	"noraneko-id/internal/model"
	"noraneko-id/pkg/database"
	"noraneko-id/pkg/jwt"
	"noraneko-id/pkg/oauth2"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// OAuth2Handler OAuth2 エンドポイントのハンドラー
type OAuth2Handler struct {
	oauth2Service *oauth2.OAuth2Service
	jwtService    *jwt.JWTService
	config        *config.Config
}

// NewOAuth2Handler OAuth2ハンドラーの新しいインスタンスを作成
func NewOAuth2Handler(cfg *config.Config) *OAuth2Handler {
	return &OAuth2Handler{
		oauth2Service: oauth2.NewOAuth2Service(),
		jwtService:    jwt.NewJWTService(cfg.JWT.Secret),
		config:        cfg,
	}
}

// Authorize OAuth2 認可エンドポイント GET /oauth2/authorize
// @Summary OAuth2認可エンドポイント
// @Description OAuth2認可コードフローの認可エンドポイントです。PKCEをサポートしています。
// @Tags OAuth2
// @Produce json
// @Param response_type query string true "レスポンスタイプ" Enums(code)
// @Param client_id query string true "クライアントID"
// @Param redirect_uri query string true "リダイレクトURI"
// @Param scope query string false "スコープ" default(openid)
// @Param state query string false "状態パラメータ"
// @Param code_challenge query string false "PKCEコードチャレンジ"
// @Param code_challenge_method query string false "PKCEチャレンジメソッド" Enums(S256) default(S256)
// @Success 302 "Redirect to authorization page or callback URL"
// @Failure 400 {object} map[string]interface{} "リクエストエラー"
// @Router /oauth2/authorize [get]
func (h *OAuth2Handler) Authorize(c *gin.Context) {
	var req oauth2.AuthorizeRequest
	
	// クエリパラメータから値を取得
	req.ResponseType = c.Query("response_type")
	req.ClientID = c.Query("client_id")
	req.RedirectURI = c.Query("redirect_uri")
	req.Scope = c.DefaultQuery("scope", "openid")
	req.State = c.Query("state")
	req.CodeChallenge = c.Query("code_challenge")
	req.CodeChallengeMethod = c.DefaultQuery("code_challenge_method", "S256")

	// リクエストの検証
	client, err := h.oauth2Service.ValidateAuthorizeRequest(&req)
	if err != nil {
		h.handleAuthorizeError(c, &req, "invalid_request", err.Error())
		return
	}

	// ユーザー認証の確認（セッションから取得）
	userID, exists := c.Get("user_id")
	if !exists {
		// ユーザーが未認証の場合、ログインページにリダイレクト
		loginURL := "/login?redirect_uri=" + c.Request.URL.String()
		c.Redirect(http.StatusFound, loginURL)
		return
	}

	userUUID, ok := userID.(uuid.UUID)
	if !ok {
		h.handleAuthorizeError(c, &req, "server_error", "ユーザーIDの取得に失敗しました")
		return
	}

	// 認可コードの生成
	authCode, err := h.oauth2Service.GenerateAuthorizationCode(userUUID, client, &req)
	if err != nil {
		h.handleAuthorizeError(c, &req, "server_error", err.Error())
		return
	}

	// リダイレクトURIの構築
	redirectURI, err := h.oauth2Service.BuildRedirectURI(req.RedirectURI, authCode.Code, req.State)
	if err != nil {
		h.handleAuthorizeError(c, &req, "server_error", err.Error())
		return
	}

	c.Redirect(http.StatusFound, redirectURI)
}

// Token OAuth2 トークンエンドポイント POST /oauth2/token
// @Summary OAuth2トークンエンドポイント
// @Description 認可コードやリフレッシュトークンを使ってアクセストークンを取得します。
// @Tags OAuth2
// @Accept json
// @Produce json
// @Param request body oauth2.TokenRequest true "トークンリクエスト"
// @Success 200 {object} map[string]interface{} "アクセストークンレスポンス"
// @Failure 400 {object} map[string]interface{} "リクエストエラー"
// @Failure 401 {object} map[string]interface{} "クライアント認証エラー"
// @Router /oauth2/token [post]
func (h *OAuth2Handler) Token(c *gin.Context) {
	var req oauth2.TokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":             "invalid_request",
			"error_description": "リクエストの形式が正しくありません",
		})
		return
	}

	// リクエストの検証
	authCode, client, err := h.oauth2Service.ValidateTokenRequest(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":             "invalid_grant",
			"error_description": err.Error(),
		})
		return
	}

	// クライアント認証（機密クライアントの場合）
	if client.IsConfidential {
		if !h.validateClientSecret(client.ClientSecretHash, req.ClientSecret) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":             "invalid_client",
				"error_description": "クライアント認証に失敗しました",
			})
			return
		}
	}

	// アクセストークンの生成
	accessToken, err := h.jwtService.GenerateAccessToken(
		authCode.UserID,
		authCode.ClientID,
		authCode.Scopes,
		h.config.OAuth2.AccessTokenExpirationHours,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":             "server_error",
			"error_description": "アクセストークンの生成に失敗しました",
		})
		return
	}

	// リフレッシュトークンの生成
	refreshToken := h.jwtService.GenerateRefreshToken()

	// トークンをデータベースに保存
	now := time.Now()
	accessTokenRecord := &model.OAuthAccessToken{
		TokenHash: h.hashToken(accessToken),
		ClientID:  authCode.ClientID,
		UserID:    authCode.UserID,
		Scopes:    authCode.Scopes,
		ExpiresAt: now.Add(time.Hour * time.Duration(h.config.OAuth2.AccessTokenExpirationHours)),
	}

	refreshTokenRecord := &model.OAuthRefreshToken{
		TokenHash: h.hashToken(refreshToken),
		ClientID:  authCode.ClientID,
		UserID:    authCode.UserID,
		Scopes:    authCode.Scopes,
		ExpiresAt: now.Add(time.Hour * 24 * time.Duration(h.config.OAuth2.RefreshTokenExpirationDays)),
	}

	db := database.GetDB()
	if err := db.Create(accessTokenRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":             "server_error",
			"error_description": "トークンの保存に失敗しました",
		})
		return
	}

	refreshTokenRecord.AccessTokenID = accessTokenRecord.ID
	if err := db.Create(refreshTokenRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":             "server_error",
			"error_description": "リフレッシュトークンの保存に失敗しました",
		})
		return
	}

	// 認可コードを使用済みとしてマーク
	if err := h.oauth2Service.MarkAuthorizationCodeAsUsed(authCode); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":             "server_error",
			"error_description": "認可コードの更新に失敗しました",
		})
		return
	}

	// レスポンスの生成
	response := oauth2.TokenResponse{
		AccessToken:  accessToken,
		TokenType:    "Bearer",
		ExpiresIn:    h.config.OAuth2.AccessTokenExpirationHours * 3600,
		RefreshToken: refreshToken,
		Scope:        strings.Join(authCode.Scopes, " "),
	}

	c.JSON(http.StatusOK, response)
}

// UserInfo OAuth2 ユーザー情報エンドポイント GET /oauth2/userinfo
// @Summary OAuth2ユーザー情報エンドポイント
// @Description アクセストークンを使ってユーザー情報を取得します。
// @Tags OAuth2
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{} "ユーザー情報"
// @Failure 401 {object} map[string]interface{} "認証エラー"
// @Failure 404 {object} map[string]interface{} "ユーザーが見つからない"
// @Router /oauth2/userinfo [get]
func (h *OAuth2Handler) UserInfo(c *gin.Context) {
	// Authorization ヘッダーからトークンを取得
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":             "invalid_token",
			"error_description": "Authorization ヘッダーが必要です",
		})
		return
	}

	// Bearer トークンの抽出
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":             "invalid_token",
			"error_description": "Bearer トークンが必要です",
		})
		return
	}

	token := parts[1]

	// トークンの検証
	claims, err := h.jwtService.ValidateAccessToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":             "invalid_token",
			"error_description": "無効なトークンです",
		})
		return
	}

	// ユーザー情報の取得
	var user model.User
	db := database.GetDB()
	if err := db.Where("id = ?", claims.UserID).First(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":             "server_error",
			"error_description": "ユーザー情報の取得に失敗しました",
		})
		return
	}

	// スコープに基づいてレスポンスを構築
	response := gin.H{
		"sub": user.ID.String(),
	}

	for _, scope := range claims.Scopes {
		switch scope {
		case "profile":
			response["username"] = user.Username
			if user.DisplayName != nil {
				response["name"] = *user.DisplayName
			}
		case "email":
			response["email"] = user.Email
			response["email_verified"] = user.EmailVerified
		}
	}

	c.JSON(http.StatusOK, response)
}

// Revoke OAuth2 トークン取り消しエンドポイント POST /oauth2/revoke
// @Summary OAuth2トークン無効化エンドポイント
// @Description アクセストークンまたはリフレッシュトークンを無効化します。
// @Tags OAuth2
// @Accept application/x-www-form-urlencoded
// @Produce json
// @Param token formData string true "無効化するトークン"
// @Success 200 {object} map[string]interface{} "無効化成功"
// @Failure 400 {object} map[string]interface{} "リクエストエラー"
// @Router /oauth2/revoke [post]
func (h *OAuth2Handler) Revoke(c *gin.Context) {
	token := c.PostForm("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":             "invalid_request",
			"error_description": "token パラメータが必要です",
		})
		return
	}

	tokenHash := h.hashToken(token)
	db := database.GetDB()
	now := time.Now()

	// アクセストークンの取り消し
	db.Model(&model.OAuthAccessToken{}).
		Where("token_hash = ? AND revoked_at IS NULL", tokenHash).
		Update("revoked_at", now)

	// リフレッシュトークンの取り消し
	db.Model(&model.OAuthRefreshToken{}).
		Where("token_hash = ? AND revoked_at IS NULL", tokenHash).
		Update("revoked_at", now)

	c.JSON(http.StatusOK, gin.H{
		"message": "トークンが正常に取り消されました",
	})
}

// Helper methods

// handleAuthorizeError 認可エンドポイントのエラーハンドリング
func (h *OAuth2Handler) handleAuthorizeError(c *gin.Context, req *oauth2.AuthorizeRequest, errorCode, errorDescription string) {
	if req.RedirectURI != "" {
		// リダイレクトURIが有効な場合はエラーをリダイレクト
		errorURI, err := h.oauth2Service.BuildErrorRedirectURI(req.RedirectURI, errorCode, errorDescription, req.State)
		if err == nil {
			c.Redirect(http.StatusFound, errorURI)
			return
		}
	}

	// リダイレクトできない場合はJSONエラーを返す
	c.JSON(http.StatusBadRequest, gin.H{
		"error":             errorCode,
		"error_description": errorDescription,
	})
}

// validateClientSecret クライアントシークレットを検証
func (h *OAuth2Handler) validateClientSecret(hashedSecret, providedSecret string) bool {
	hash := sha256.Sum256([]byte(providedSecret))
	return hashedSecret == hex.EncodeToString(hash[:])
}

// hashToken トークンをハッシュ化
func (h *OAuth2Handler) hashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}