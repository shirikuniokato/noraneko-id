package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config アプリケーション設定
type Config struct {
	Database    DatabaseConfig
	JWT         JWTConfig
	OAuth2      OAuth2Config
	Server      ServerConfig
	Environment string
	Debug       bool
}

// DatabaseConfig データベース設定
type DatabaseConfig struct {
	URL      string
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// JWTConfig JWT設定
type JWTConfig struct {
	Secret           string
	ExpirationHours  int
}

// OAuth2Config OAuth2設定
type OAuth2Config struct {
	AuthCodeExpirationMinutes    int
	AccessTokenExpirationHours   int
	RefreshTokenExpirationDays   int
}

// ServerConfig サーバー設定
type ServerConfig struct {
	Port string
	Host string
}

// Load 設定を読み込む
func Load() (*Config, error) {
	// .envファイルを読み込む（存在する場合）
	if err := godotenv.Load(); err != nil {
		log.Println(".env ファイルが見つかりません。環境変数から設定を読み込みます。")
	}

	config := &Config{
		Database: DatabaseConfig{
			URL:      getEnv("DATABASE_URL", ""),
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "noraneko"),
			Password: getEnv("DB_PASSWORD", "dev_password"),
			DBName:   getEnv("DB_NAME", "noraneko_id"),
			SSLMode:  getEnv("DB_SSL_MODE", "disable"),
		},
		JWT: JWTConfig{
			Secret:          getEnv("JWT_SECRET", "your-super-secret-jwt-key-change-this-in-production"),
			ExpirationHours: getEnvAsInt("JWT_EXPIRATION_HOURS", 24),
		},
		OAuth2: OAuth2Config{
			AuthCodeExpirationMinutes:  getEnvAsInt("OAUTH2_AUTH_CODE_EXPIRATION_MINUTES", 10),
			AccessTokenExpirationHours: getEnvAsInt("OAUTH2_ACCESS_TOKEN_EXPIRATION_HOURS", 1),
			RefreshTokenExpirationDays: getEnvAsInt("OAUTH2_REFRESH_TOKEN_EXPIRATION_DAYS", 30),
		},
		Server: ServerConfig{
			Port: getEnv("SERVER_PORT", "8080"),
			Host: getEnv("SERVER_HOST", "localhost"),
		},
		Environment: getEnv("ENVIRONMENT", "development"),
		Debug:       getEnvAsBool("DEBUG", true),
	}

	return config, nil
}

// getEnv 環境変数を取得し、デフォルト値を返す
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvAsInt 環境変数を整数として取得し、デフォルト値を返す
func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

// getEnvAsBool 環境変数をbooleanとして取得し、デフォルト値を返す
func getEnvAsBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}