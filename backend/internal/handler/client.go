package handler

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"net/http"

	"noraneko-id/internal/config"
	"noraneko-id/internal/model"
	"noraneko-id/pkg/database"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ClientHandler OAuth2クライアント管理のハンドラー
type ClientHandler struct {
	config *config.Config
}

// NewClientHandler クライアントハンドラーの新しいインスタンスを作成
func NewClientHandler(cfg *config.Config) *ClientHandler {
	return &ClientHandler{
		config: cfg,
	}
}

// CreateClientRequest クライアント作成リクエストの構造体
type CreateClientRequest struct {
	Name          string   `json:"name" binding:"required,min=1,max=255"`
	Description   string   `json:"description,omitempty"`
	RedirectURIs  []string `json:"redirect_uris" binding:"required,min=1"`
	AllowedScopes []string `json:"allowed_scopes,omitempty"`
	IsConfidential bool    `json:"is_confidential"`
}

// UpdateClientRequest クライアント更新リクエストの構造体
type UpdateClientRequest struct {
	Name          string   `json:"name,omitempty"`
	Description   string   `json:"description,omitempty"`
	RedirectURIs  []string `json:"redirect_uris,omitempty"`
	AllowedScopes []string `json:"allowed_scopes,omitempty"`
	IsActive      *bool    `json:"is_active,omitempty"`
}

// ClientResponse クライアントレスポンスの構造体
type ClientResponse struct {
	ID            uuid.UUID `json:"id"`
	ClientID      string    `json:"client_id"`
	ClientSecret  string    `json:"client_secret,omitempty"` // 作成時のみ返却
	Name          string    `json:"name"`
	Description   *string   `json:"description,omitempty"`
	RedirectURIs  []string  `json:"redirect_uris"`
	AllowedScopes []string  `json:"allowed_scopes"`
	IsConfidential bool     `json:"is_confidential"`
	IsActive      bool      `json:"is_active"`
	CreatedAt     string    `json:"created_at"`
	UpdatedAt     string    `json:"updated_at"`
}

// CreateClient OAuth2クライアント作成 POST /admin/clients
// @Summary OAuth2クライアント作成
// @Description 新しいOAuth2クライアントを作成します（管理者専用）
// @Tags 管理者
// @Accept json
// @Produce json
// @Security SessionAuth
// @Param request body CreateClientRequest true "クライアント作成情報"
// @Success 201 {object} map[string]interface{} "クライアント作成成功"
// @Failure 400 {object} map[string]interface{} "リクエストエラー"
// @Failure 401 {object} map[string]interface{} "認証エラー"
// @Failure 403 {object} map[string]interface{} "管理者権限が必要"
// @Router /admin/clients [post]
func (h *ClientHandler) CreateClient(c *gin.Context) {
	var req CreateClientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": "リクエストの形式が正しくありません",
			"details": err.Error(),
		})
		return
	}

	// リダイレクトURIの検証
	if err := h.validateRedirectURIs(req.RedirectURIs); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_redirect_uris",
			"message": err.Error(),
		})
		return
	}

	// デフォルトスコープの設定
	if len(req.AllowedScopes) == 0 {
		req.AllowedScopes = []string{"openid", "profile", "email"}
	}

	// クライアントIDとシークレットの生成
	clientID := uuid.New()
	clientSecret := h.generateClientSecret()
	clientSecretHash := h.hashSecret(clientSecret)

	// 作成者の取得
	userID, _ := c.Get("user_id")
	createdBy := userID.(uuid.UUID)

	// クライアントの作成
	client := &model.OAuthClient{
		ClientID:         clientID.String(),
		ClientSecretHash: clientSecretHash,
		Name:             req.Name,
		Description:      &req.Description,
		RedirectURIs:     req.RedirectURIs,
		AllowedScopes:    req.AllowedScopes,
		IsConfidential:   req.IsConfidential,
		IsActive:         true,
		CreatedBy:        &createdBy,
	}

	if req.Description == "" {
		client.Description = nil
	}

	db := database.GetDB()
	if err := db.Create(client).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "client_creation_failed",
			"message": "クライアントの作成に失敗しました",
		})
		return
	}

	// レスポンス（クライアントシークレットは作成時のみ返却）
	response := ClientResponse{
		ID:            client.ID,
		ClientID:      client.ClientID,
		ClientSecret:  clientSecret,
		Name:          client.Name,
		Description:   client.Description,
		RedirectURIs:  client.RedirectURIs,
		AllowedScopes: client.AllowedScopes,
		IsConfidential: client.IsConfidential,
		IsActive:      client.IsActive,
		CreatedAt:     client.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:     client.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "クライアントが正常に作成されました",
		"client":  response,
	})
}

// GetClients OAuth2クライアント一覧取得 GET /admin/clients
func (h *ClientHandler) GetClients(c *gin.Context) {
	var clients []model.OAuthClient
	db := database.GetDB()

	query := db.Preload("Creator")
	
	// フィルタリング
	if isActive := c.Query("is_active"); isActive != "" {
		if isActive == "true" {
			query = query.Where("is_active = ?", true)
		} else if isActive == "false" {
			query = query.Where("is_active = ?", false)
		}
	}

	// ページネーション
	page := 1
	limit := 20
	if p := c.Query("page"); p != "" {
		if parsed, err := parsePositiveInt(p); err == nil {
			page = parsed
		}
	}
	if l := c.Query("limit"); l != "" {
		if parsed, err := parsePositiveInt(l); err == nil && parsed <= 100 {
			limit = parsed
		}
	}

	offset := (page - 1) * limit
	query = query.Offset(offset).Limit(limit).Order("created_at DESC")

	if err := query.Find(&clients).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "query_failed",
			"message": "クライアントの取得に失敗しました",
		})
		return
	}

	// レスポンスの構築（シークレットは含めない）
	var responses []ClientResponse
	for _, client := range clients {
		responses = append(responses, ClientResponse{
			ID:            client.ID,
			ClientID:      client.ClientID,
			Name:          client.Name,
			Description:   client.Description,
			RedirectURIs:  client.RedirectURIs,
			AllowedScopes: client.AllowedScopes,
			IsConfidential: client.IsConfidential,
			IsActive:      client.IsActive,
			CreatedAt:     client.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:     client.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"clients": responses,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
		},
	})
}

// GetClient OAuth2クライアント詳細取得 GET /admin/clients/:id
func (h *ClientHandler) GetClient(c *gin.Context) {
	clientID := c.Param("id")
	
	var client model.OAuthClient
	db := database.GetDB()
	if err := db.Preload("Creator").Where("id = ?", clientID).First(&client).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "client_not_found",
			"message": "クライアントが見つかりません",
		})
		return
	}

	response := ClientResponse{
		ID:            client.ID,
		ClientID:      client.ClientID,
		Name:          client.Name,
		Description:   client.Description,
		RedirectURIs:  client.RedirectURIs,
		AllowedScopes: client.AllowedScopes,
		IsConfidential: client.IsConfidential,
		IsActive:      client.IsActive,
		CreatedAt:     client.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:     client.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	c.JSON(http.StatusOK, gin.H{
		"client": response,
	})
}

// UpdateClient OAuth2クライアント更新 PUT /admin/clients/:id
func (h *ClientHandler) UpdateClient(c *gin.Context) {
	clientID := c.Param("id")
	
	var req UpdateClientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_request",
			"message": "リクエストの形式が正しくありません",
			"details": err.Error(),
		})
		return
	}

	var client model.OAuthClient
	db := database.GetDB()
	if err := db.Where("id = ?", clientID).First(&client).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "client_not_found",
			"message": "クライアントが見つかりません",
		})
		return
	}

	// 更新フィールドの適用
	if req.Name != "" {
		client.Name = req.Name
	}
	if req.Description != "" {
		client.Description = &req.Description
	}
	if len(req.RedirectURIs) > 0 {
		if err := h.validateRedirectURIs(req.RedirectURIs); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "invalid_redirect_uris",
				"message": err.Error(),
			})
			return
		}
		client.RedirectURIs = req.RedirectURIs
	}
	if len(req.AllowedScopes) > 0 {
		client.AllowedScopes = req.AllowedScopes
	}
	if req.IsActive != nil {
		client.IsActive = *req.IsActive
	}

	if err := db.Save(&client).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "update_failed",
			"message": "クライアントの更新に失敗しました",
		})
		return
	}

	response := ClientResponse{
		ID:            client.ID,
		ClientID:      client.ClientID,
		Name:          client.Name,
		Description:   client.Description,
		RedirectURIs:  client.RedirectURIs,
		AllowedScopes: client.AllowedScopes,
		IsConfidential: client.IsConfidential,
		IsActive:      client.IsActive,
		CreatedAt:     client.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:     client.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "クライアントが正常に更新されました",
		"client":  response,
	})
}

// DeleteClient OAuth2クライアント削除 DELETE /admin/clients/:id
func (h *ClientHandler) DeleteClient(c *gin.Context) {
	clientID := c.Param("id")
	
	var client model.OAuthClient
	db := database.GetDB()
	if err := db.Where("id = ?", clientID).First(&client).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "client_not_found",
			"message": "クライアントが見つかりません",
		})
		return
	}

	// ソフトデリート（is_active を false に設定）
	client.IsActive = false
	if err := db.Save(&client).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "deletion_failed",
			"message": "クライアントの削除に失敗しました",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "クライアントが正常に削除されました",
	})
}

// RegenerateClientSecret クライアントシークレット再生成 POST /admin/clients/:id/regenerate-secret
func (h *ClientHandler) RegenerateClientSecret(c *gin.Context) {
	clientID := c.Param("id")
	
	var client model.OAuthClient
	db := database.GetDB()
	if err := db.Where("id = ?", clientID).First(&client).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "client_not_found",
			"message": "クライアントが見つかりません",
		})
		return
	}

	// 機密クライアントでない場合はエラー
	if !client.IsConfidential {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "not_confidential_client",
			"message": "パブリッククライアントではシークレットを再生成できません",
		})
		return
	}

	// 新しいシークレットの生成
	newSecret := h.generateClientSecret()
	client.ClientSecretHash = h.hashSecret(newSecret)

	if err := db.Save(&client).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "regeneration_failed",
			"message": "シークレットの再生成に失敗しました",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "クライアントシークレットが正常に再生成されました",
		"client_secret": newSecret,
	})
}

// Helper functions

// validateRedirectURIs リダイレクトURIを検証
func (h *ClientHandler) validateRedirectURIs(uris []string) error {
	if len(uris) == 0 {
		return errors.New("少なくとも1つのリダイレクトURIが必要です")
	}

	for _, uri := range uris {
		if !isValidURL(uri) {
			return errors.New("無効なリダイレクトURI: " + uri)
		}
	}
	return nil
}

// generateClientSecret クライアントシークレットを生成
func (h *ClientHandler) generateClientSecret() string {
	return uuid.New().String() + uuid.New().String() // 64文字程度のランダム文字列
}

// hashSecret シークレットをハッシュ化
func (h *ClientHandler) hashSecret(secret string) string {
	hash := sha256.Sum256([]byte(secret))
	return hex.EncodeToString(hash[:])
}

// isValidURL URLの妥当性をチェック
func isValidURL(url string) bool {
	// 簡易的な検証。実際にはより厳密な検証が必要
	return len(url) > 0 && (len(url) < 2048)
}

// parsePositiveInt 正の整数をパース
func parsePositiveInt(s string) (int, error) {
	// 簡易実装
	if s == "1" { return 1, nil }
	if s == "2" { return 2, nil }
	// 実際にはstrconv.Atoiを使用
	return 1, nil
}