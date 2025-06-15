.PHONY: help build run test seed db-up db-down clean

# デフォルトターゲット
.DEFAULT_GOAL := help

# ヘルプ
help:
	@echo "利用可能なコマンド:"
	@echo "  make build      - アプリケーションをビルド"
	@echo "  make run        - アプリケーションを実行"
	@echo "  make test       - テストを実行"
	@echo "  make seed       - 種データを投入"
	@echo "  make db-up      - データベースを起動"
	@echo "  make db-down    - データベースを停止"
	@echo "  make clean      - ビルド成果物を削除"

# ビルド
build:
	go build -o bin/noraneko-id cmd/server/main.go

# 実行
run:
	go run cmd/server/main.go

# テスト
test:
	go test -v ./...

# 種データ投入
seed:
	@echo "🌱 種データを投入しています..."
	go run cmd/seed/main.go

# 特定のシーダーのみ実行
seed-only:
	@echo "🌱 特定の種データを投入しています..."
	@echo "例: make seed-only SEEDERS=ユーザー,管理者権限"
	go run cmd/seed/main.go -only "$(SEEDERS)"

# データベース起動
db-up:
	docker-compose up -d

# データベース停止
db-down:
	docker-compose down

# データベース再起動（データをリセット）
db-reset: db-down
	docker-compose down -v
	docker-compose up -d
	@echo "⏳ データベースの起動を待っています..."
	@sleep 5
	@echo "🌱 種データを投入しています..."
	go run cmd/seed/main.go

# クリーン
clean:
	rm -rf bin/

# 開発サーバー（ホットリロード）
dev:
	@which air > /dev/null || (echo "airをインストールしてください: go install github.com/cosmtrek/air@latest" && exit 1)
	air

# 依存関係の更新
deps:
	go mod download
	go mod tidy

# リント
lint:
	@which golangci-lint > /dev/null || (echo "golangci-lintをインストールしてください: https://golangci-lint.run/usage/install/" && exit 1)
	golangci-lint run

# フォーマット
fmt:
	go fmt ./...