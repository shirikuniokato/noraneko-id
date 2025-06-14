package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// ヘルスチェック用エンドポイント
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"service": "noraneko-id",
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
	log.Println("Starting noraneko-id server on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}