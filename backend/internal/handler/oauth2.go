package handler

import (
	"crypto/sha256"
	"encoding/hex"
	"log"
	"net/http"
	"net/url"
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
// @Description OAuth2認可コードフローの認可エンドポイントです。PKCEとSNS連携プロバイダーをサポートしています。
// @Tags OAuth2
// @Produce json
// @Param response_type query string true "レスポンスタイプ" Enums(code)
// @Param client_id query string true "クライアントID"
// @Param redirect_uri query string true "リダイレクトURI"
// @Param scope query string false "スコープ" default(openid)
// @Param state query string false "状態パラメータ"
// @Param code_challenge query string false "PKCEコードチャレンジ"
// @Param code_challenge_method query string false "PKCEチャレンジメソッド" Enums(S256) default(S256)
// @Param identity_provider query string false "SNS連携プロバイダー" Enums(google,github,line,apple,twitter)
// @Success 302 "Redirect to authorization page, SNS provider, or callback URL"
// @Failure 400 {object} map[string]interface{} "リクエストエラー"
// @Router /oauth2/authorize [get]
func (h *OAuth2Handler) Authorize(c *gin.Context) {
	if c.Request.Method == "GET" {
		h.handleAuthorizeGET(c)
	} else if c.Request.Method == "POST" {
		h.handleAuthorizePOST(c)
	} else {
		c.JSON(http.StatusMethodNotAllowed, gin.H{
			"error": "method_not_allowed",
			"message": "認可エンドポイントはGETとPOSTのみサポートしています",
		})
	}
}

// handleAuthorizeGET 認可リクエストの処理（同意画面表示）
func (h *OAuth2Handler) handleAuthorizeGET(c *gin.Context) {
	var req oauth2.AuthorizeRequest
	
	// GETパラメータから値を取得
	req.ResponseType = c.Query("response_type")
	req.ClientID = c.Query("client_id")
	req.RedirectURI = c.Query("redirect_uri")
	req.Scope = c.DefaultQuery("scope", "openid")
	req.State = c.Query("state")
	req.CodeChallenge = c.Query("code_challenge")
	req.CodeChallengeMethod = c.DefaultQuery("code_challenge_method", "S256")
	req.IdentityProvider = c.Query("identity_provider")

	// リクエストの検証
	log.Printf("Authorization request: ClientID=%s, RedirectURI=%s, ResponseType=%s, IdentityProvider=%s", req.ClientID, req.RedirectURI, req.ResponseType, req.IdentityProvider)
	client, err := h.oauth2Service.ValidateAuthorizeRequest(&req)
	if err != nil {
		log.Printf("Authorization validation failed: %v", err)
		h.handleAuthorizeError(c, &req, "invalid_request", err.Error())
		return
	}

	// SNS連携プロバイダーが指定されている場合はSNS認証フローにリダイレクト
	if req.IdentityProvider != "" {
		h.handleSNSProviderFlow(c, &req, client)
		return
	}

	// ユーザー認証の確認（セッションから取得）
	userID, exists := c.Get("user_id")
	if !exists {
		// ユーザーが未認証の場合、ログインページにリダイレクト
		loginURL := "/login?redirect_uri=" + url.QueryEscape(c.Request.URL.String())
		c.Redirect(http.StatusFound, loginURL)
		return
	}

	userUUID, ok := userID.(uuid.UUID)
	if !ok {
		h.handleAuthorizeError(c, &req, "server_error", "ユーザーIDの取得に失敗しました")
		return
	}

	// マルチテナント検証: ユーザーがこのクライアントに属しているかチェック
	var userRecord model.User
	db := database.GetDB()
	if err := db.Where("id = ? AND client_id = ? AND is_active = ?", userUUID, client.ID, true).First(&userRecord).Error; err != nil {
		log.Printf("Multi-tenant validation failed: user %v does not belong to client %v", userUUID, client.ID)
		h.handleAuthorizeError(c, &req, "access_denied", "ユーザーがこのクライアントに属していません")
		return
	}

	// 信頼済みクライアントまたは同意不要クライアントの場合はスキップ
	if client.TrustedClient || !client.RequireConsent {
		authCode, err := h.oauth2Service.GenerateAuthorizationCode(userUUID, client, &req)
		if err != nil {
			h.handleAuthorizeError(c, &req, "server_error", err.Error())
			return
		}

		redirectURI, err := h.oauth2Service.BuildRedirectURI(req.RedirectURI, authCode.Code, req.State)
		if err != nil {
			h.handleAuthorizeError(c, &req, "server_error", err.Error())
			return
		}

		c.Redirect(http.StatusFound, redirectURI)
		return
	}

	// ユーザー同意画面を表示
	h.showAuthorizePage(c, &req, client, userUUID)
}

// handleAuthorizePOST 同意画面からのフォーム送信処理
func (h *OAuth2Handler) handleAuthorizePOST(c *gin.Context) {
	var req oauth2.AuthorizeRequest
	
	// POSTフォームデータから値を取得
	req.ResponseType = c.PostForm("response_type")
	req.ClientID = c.PostForm("client_id")
	req.RedirectURI = c.PostForm("redirect_uri")
	req.Scope = c.DefaultPostForm("scope", "openid")
	req.State = c.PostForm("state")
	req.CodeChallenge = c.PostForm("code_challenge")
	req.CodeChallengeMethod = c.DefaultPostForm("code_challenge_method", "S256")
	req.IdentityProvider = c.PostForm("identity_provider")

	// リクエストの検証
	log.Printf("Authorization POST request: ClientID=%s, RedirectURI=%s, ResponseType=%s", req.ClientID, req.RedirectURI, req.ResponseType)
	client, err := h.oauth2Service.ValidateAuthorizeRequest(&req)
	if err != nil {
		log.Printf("Authorization validation failed: %v", err)
		h.handleAuthorizeError(c, &req, "invalid_request", err.Error())
		return
	}

	// ユーザー認証の確認
	userID, exists := c.Get("user_id")
	if !exists {
		h.handleAuthorizeError(c, &req, "access_denied", "ユーザー認証が必要です")
		return
	}

	userUUID, ok := userID.(uuid.UUID)
	if !ok {
		h.handleAuthorizeError(c, &req, "server_error", "ユーザーIDの取得に失敗しました")
		return
	}

	// マルチテナント検証: ユーザーがこのクライアントに属しているかチェック
	var userRecord model.User
	db := database.GetDB()
	if err := db.Where("id = ? AND client_id = ? AND is_active = ?", userUUID, client.ID, true).First(&userRecord).Error; err != nil {
		log.Printf("Multi-tenant validation failed in POST: user %v does not belong to client %v", userUUID, client.ID)
		h.handleAuthorizeError(c, &req, "access_denied", "ユーザーがこのクライアントに属していません")
		return
	}

	// ユーザーの同意結果を処理
	approve := c.PostForm("approve")
	if approve == "true" {
		// 同意の場合、認可コードを生成
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
		return
	} else {
		// 拒否の場合、エラーレスポンス
		h.handleAuthorizeError(c, &req, "access_denied", "ユーザーがアクセスを拒否しました")
		return
	}
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
	
	// OAuth2仕様に従い、application/x-www-form-urlencodedとJSONの両方をサポート
	contentType := c.GetHeader("Content-Type")
	if strings.Contains(contentType, "application/x-www-form-urlencoded") {
		// フォームデータから取得
		req.GrantType = c.PostForm("grant_type")
		req.Code = c.PostForm("code")
		req.RedirectURI = c.PostForm("redirect_uri")
		req.ClientID = c.PostForm("client_id")
		req.ClientSecret = c.PostForm("client_secret")
		req.CodeVerifier = c.PostForm("code_verifier")
		req.RefreshToken = c.PostForm("refresh_token")
	} else {
		// JSONから取得
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":             "invalid_request",
				"error_description": "リクエストの形式が正しくありません",
			})
			return
		}
	}
	
	// デバッグログ
	log.Printf("Token request: GrantType=%s, Code=%s, ClientID=%s, RedirectURI=%s", req.GrantType, req.Code, req.ClientID, req.RedirectURI)

	switch req.GrantType {
	case "authorization_code":
		h.handleAuthorizationCodeGrant(c, &req)
	case "refresh_token":
		h.handleRefreshTokenGrant(c, &req)
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"error":             "unsupported_grant_type",
			"error_description": "サポートされていないグラントタイプです: " + req.GrantType,
		})
	}
}

// handleAuthorizationCodeGrant Authorization Code グラントを処理
func (h *OAuth2Handler) handleAuthorizationCodeGrant(c *gin.Context, req *oauth2.TokenRequest) {
	// リクエストの検証
	authCode, client, err := h.oauth2Service.ValidateTokenRequest(req)
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
	scopes := strings.Fields(authCode.Scopes)
	accessToken, err := h.jwtService.GenerateAccessToken(
		authCode.UserID,
		authCode.ClientID,
		scopes,
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
		Scope:        authCode.Scopes,
	}

	c.JSON(http.StatusOK, response)
}

// handleRefreshTokenGrant Refresh Token グラントを処理
func (h *OAuth2Handler) handleRefreshTokenGrant(c *gin.Context, req *oauth2.TokenRequest) {
	// リフレッシュトークンの検証
	refreshTokenInfo, client, err := h.oauth2Service.ValidateRefreshTokenGrant(req)
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

	// 古いリフレッシュトークンを無効化（セキュリティのため）
	if err := h.oauth2Service.RevokeRefreshToken(refreshTokenInfo.RefreshToken); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":             "server_error",
			"error_description": "リフレッシュトークンの無効化に失敗しました",
		})
		return
	}

	// 新しいアクセストークンの生成
	accessToken, err := h.jwtService.GenerateAccessToken(
		refreshTokenInfo.UserID,
		client.ID,
		refreshTokenInfo.Scopes,
		h.config.OAuth2.AccessTokenExpirationHours,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":             "server_error",
			"error_description": "アクセストークンの生成に失敗しました",
		})
		return
	}

	// 新しいリフレッシュトークンの生成（トークンローテーション）
	newRefreshToken := h.jwtService.GenerateRefreshToken()

	// トークンをデータベースに保存
	now := time.Now()
	accessTokenRecord := &model.OAuthAccessToken{
		TokenHash: h.hashToken(accessToken),
		ClientID:  client.ID,
		UserID:    refreshTokenInfo.UserID,
		Scopes:    strings.Join(refreshTokenInfo.Scopes, " "),
		ExpiresAt: now.Add(time.Hour * time.Duration(h.config.OAuth2.AccessTokenExpirationHours)),
	}

	newRefreshTokenRecord := &model.OAuthRefreshToken{
		TokenHash: h.hashToken(newRefreshToken),
		ClientID:  client.ID,
		UserID:    refreshTokenInfo.UserID,
		Scopes:    strings.Join(refreshTokenInfo.Scopes, " "),
		ExpiresAt: now.Add(time.Hour * 24 * time.Duration(h.config.OAuth2.RefreshTokenExpirationDays)),
	}

	db := database.GetDB()
	if err := db.Create(accessTokenRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":             "server_error",
			"error_description": "アクセストークンの保存に失敗しました",
		})
		return
	}

	newRefreshTokenRecord.AccessTokenID = accessTokenRecord.ID
	if err := db.Create(newRefreshTokenRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":             "server_error",
			"error_description": "リフレッシュトークンの保存に失敗しました",
		})
		return
	}

	// レスポンスの生成
	response := oauth2.TokenResponse{
		AccessToken:  accessToken,
		TokenType:    "Bearer",
		ExpiresIn:    h.config.OAuth2.AccessTokenExpirationHours * 3600,
		RefreshToken: newRefreshToken,
		Scope:        strings.Join(refreshTokenInfo.Scopes, " "),
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

// showAuthorizePage 認可画面を表示
func (h *OAuth2Handler) showAuthorizePage(c *gin.Context, req *oauth2.AuthorizeRequest, client *model.OAuthClient, userID uuid.UUID) {
	// ユーザー情報を取得
	var user model.User
	db := database.GetDB()
	if err := db.Where("id = ?", userID).First(&user).Error; err != nil {
		h.handleAuthorizeError(c, req, "server_error", "ユーザー情報の取得に失敗しました")
		return
	}

	// スコープの説明を生成
	scopes := h.generateScopeDescriptions(req.Scope)

	// クエリパラメータを取得（POSTフォームで送信するため）
	queryParams := make(map[string]string)
	for key, values := range c.Request.URL.Query() {
		if len(values) > 0 {
			queryParams[key] = values[0]
		}
	}

	// テンプレートデータ
	templateData := gin.H{
		"Client":      client,
		"User":        user,
		"Scopes":      scopes,
		"QueryParams": queryParams,
	}

	c.HTML(http.StatusOK, "authorize.html", templateData)
}

// generateScopeDescriptions スコープの説明を生成
func (h *OAuth2Handler) generateScopeDescriptions(scopeString string) []gin.H {
	scopes := strings.Fields(scopeString)
	descriptions := make([]gin.H, 0, len(scopes))

	scopeDescMap := map[string]string{
		"openid":  "あなたの基本的なプロフィール情報（ユーザーID）",
		"profile": "あなたのプロフィール情報（ユーザー名、表示名）",
		"email":   "あなたのメールアドレス",
		"read":    "あなたの情報を読み取り",
		"write":   "あなたの情報を更新",
	}

	for _, scope := range scopes {
		description := scopeDescMap[scope]
		if description == "" {
			description = scope + "スコープ"
		}
		descriptions = append(descriptions, gin.H{
			"Name":        scope,
			"Description": description,
		})
	}

	return descriptions
}

// GetClientInfo クライアント情報取得エンドポイント GET /oauth2/client-info/:client_id
// @Summary クライアント情報取得
// @Description OAuth2クライアントの公開情報を取得します（認可画面用）
// @Tags OAuth2
// @Produce json
// @Param client_id path string true "クライアントID"
// @Success 200 {object} map[string]interface{} "クライアント情報"
// @Failure 404 {object} map[string]interface{} "クライアントが見つかりません"
// @Router /oauth2/client-info/{client_id} [get]
func (h *OAuth2Handler) GetClientInfo(c *gin.Context) {
	clientID := c.Param("client_id")
	if clientID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "client_id is required",
		})
		return
	}

	// データベースからクライアント情報を取得  
	var client model.OAuthClient
	db := database.GetDB()
	
	if err := db.Where("client_id = ?", clientID).First(&client).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Client not found",
		})
		return
	}

	// 公開情報のみを返す（シークレットは含めない）
	redirectURI := ""
	if len(client.RedirectURIs) > 0 {
		redirectURI = client.RedirectURIs[0]
	}
	
	c.JSON(http.StatusOK, gin.H{
		"id":           client.ID,
		"name":         client.Name,
		"description":  client.Description,
		"redirect_uri": redirectURI,
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

// handleSNSProviderFlow SNS連携プロバイダーフロー処理
func (h *OAuth2Handler) handleSNSProviderFlow(c *gin.Context, req *oauth2.AuthorizeRequest, client *model.OAuthClient) {
	// プロバイダーの有効性をチェック
	if !h.isValidSNSProvider(req.IdentityProvider) {
		h.handleAuthorizeError(c, req, "invalid_request", "サポートされていないプロバイダーです: "+req.IdentityProvider)
		return
	}

	// プロバイダーが利用可能かチェック
	if !h.isProviderAvailable(req.IdentityProvider) {
		h.handleAuthorizeError(c, req, "unsupported_provider", req.IdentityProvider+"プロバイダーは将来実装予定です")
		return
	}

	// 将来実装: プロバイダー別の認証フロー
	switch req.IdentityProvider {
	case model.ProviderTypeGoogle:
		h.initiateGoogleAuth(c, req, client)
	case model.ProviderTypeGitHub:
		h.initiateGitHubAuth(c, req, client)
	case model.ProviderTypeLINE:
		h.initiateLINEAuth(c, req, client)
	case model.ProviderTypeApple:
		h.initiateAppleAuth(c, req, client)
	case model.ProviderTypeTwitter:
		h.initiateTwitterAuth(c, req, client)
	default:
		h.handleAuthorizeError(c, req, "unsupported_provider", "未対応のプロバイダーです: "+req.IdentityProvider)
	}
}

// isValidSNSProvider 有効なSNSプロバイダーかどうかをチェック
func (h *OAuth2Handler) isValidSNSProvider(provider string) bool {
	validProviders := []string{
		model.ProviderTypeGoogle,
		model.ProviderTypeGitHub,
		model.ProviderTypeLINE,
		model.ProviderTypeApple,
		model.ProviderTypeTwitter,
	}

	for _, validProvider := range validProviders {
		if provider == validProvider {
			return true
		}
	}
	return false
}

// isProviderAvailable プロバイダーが利用可能かどうかをチェック
func (h *OAuth2Handler) isProviderAvailable(provider string) bool {
	switch provider {
	case model.ProviderTypeGoogle, model.ProviderTypeGitHub, model.ProviderTypeLINE:
		return false // 将来実装予定
	case model.ProviderTypeApple, model.ProviderTypeTwitter:
		return false // 将来実装予定
	default:
		return false
	}
}

// 将来実装予定: プロバイダー別認証開始メソッド

func (h *OAuth2Handler) initiateGoogleAuth(c *gin.Context, req *oauth2.AuthorizeRequest, client *model.OAuthClient) {
	// Google OAuth2認証フローの実装（将来）
	h.handleAuthorizeError(c, req, "not_implemented", "Googleプロバイダーは将来実装予定です")
}

func (h *OAuth2Handler) initiateGitHubAuth(c *gin.Context, req *oauth2.AuthorizeRequest, client *model.OAuthClient) {
	// GitHub OAuth2認証フローの実装（将来）
	h.handleAuthorizeError(c, req, "not_implemented", "GitHubプロバイダーは将来実装予定です")
}

func (h *OAuth2Handler) initiateLINEAuth(c *gin.Context, req *oauth2.AuthorizeRequest, client *model.OAuthClient) {
	// LINE Login認証フローの実装（将来）
	h.handleAuthorizeError(c, req, "not_implemented", "LINEプロバイダーは将来実装予定です")
}

func (h *OAuth2Handler) initiateAppleAuth(c *gin.Context, req *oauth2.AuthorizeRequest, client *model.OAuthClient) {
	// Sign in with Apple認証フローの実装（将来）
	h.handleAuthorizeError(c, req, "not_implemented", "Appleプロバイダーは将来実装予定です")
}

func (h *OAuth2Handler) initiateTwitterAuth(c *gin.Context, req *oauth2.AuthorizeRequest, client *model.OAuthClient) {
	// Twitter OAuth認証フローの実装（将来）
	h.handleAuthorizeError(c, req, "not_implemented", "Twitterプロバイダーは将来実装予定です")
}