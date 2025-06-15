package main

import (
	"flag"
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
	"noraneko-id/internal/config"
	"noraneko-id/internal/seed"
	"noraneko-id/pkg/database"
)

func main() {
	// コマンドラインフラグ
	var (
		envFile  = flag.String("env", ".env", "環境変数ファイルのパス")
		specific = flag.String("only", "", "実行するシーダーを指定（カンマ区切り）")
		help     = flag.Bool("help", false, "ヘルプを表示")
	)
	flag.Parse()

	if *help {
		printHelp()
		return
	}

	// 環境変数の読み込み
	if err := godotenv.Load(*envFile); err != nil {
		log.Printf("警告: 環境変数ファイルの読み込みに失敗しました: %v", err)
	}

	// 設定の読み込み
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("設定の読み込みに失敗しました: %v", err)
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
	
	err = database.Connect(dbConfig)
	if err != nil {
		log.Fatalf("データベース接続に失敗しました: %v", err)
	}

	// シーダーランナーの作成
	runner := seed.NewRunner(database.DB)

	// シーダーの実行
	if *specific != "" {
		// 特定のシーダーのみ実行
		names := strings.Split(*specific, ",")
		if err := runner.RunSpecific(names); err != nil {
			log.Fatalf("エラー: %v", err)
			os.Exit(1)
		}
	} else {
		// 全てのシーダーを実行
		if err := runner.Run(); err != nil {
			log.Fatalf("エラー: %v", err)
			os.Exit(1)
		}
	}
}

func printHelp() {
	fmt := `
🌱 Noraneko ID シーダーコマンド

使用方法:
  go run cmd/seed/main.go [オプション]

オプション:
  -env string
        環境変数ファイルのパス (デフォルト: ".env")
  -only string
        実行するシーダーを指定（カンマ区切り）
        利用可能なシーダー: OAuthスコープ,OAuth2クライアント,ユーザー,管理者権限
  -help
        このヘルプを表示

例:
  # 全てのシーダーを実行
  go run cmd/seed/main.go

  # 特定のシーダーのみ実行
  go run cmd/seed/main.go -only "ユーザー,管理者権限"

  # 別の環境変数ファイルを使用
  go run cmd/seed/main.go -env .env.development

開発用アカウント情報:
  管理者: admin@example.com / password123
  ユーザー1: user1@example.com / password123
  ユーザー2: user2@example.com / password123

開発用クライアント情報:
  クライアントID: dev-client-001
  クライアントシークレット: dev-secret-please-change-in-production
  
  SPAクライアントID: test-spa-client
  （パブリッククライアントのためシークレットなし）
`
	log.Print(fmt)
}