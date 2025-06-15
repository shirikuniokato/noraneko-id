#!/bin/bash

echo "🚀 Noraneko ID 開発環境セットアップ"
echo "=================================="

# 環境変数ファイルのチェック
if [ ! -f backend/.env ]; then
    echo "📝 環境変数ファイルを作成しています..."
    cp backend/.env.example backend/.env
    echo "✅ .envファイルが作成されました"
else
    echo "✅ .envファイルは既に存在します"
fi

# データベースの起動
echo ""
echo "🗄️  PostgreSQLを起動しています..."
docker-compose down -v 2>/dev/null
docker-compose up -d

# データベースの起動を待つ
echo "⏳ データベースの起動を待っています..."
sleep 10

# バックエンドのセットアップ
echo ""
echo "📦 Goの依存関係をインストールしています..."
cd backend
go mod download

# マイグレーションの実行（サーバー起動時に自動実行される）
echo ""
echo "🔧 サーバーを起動してマイグレーションを実行します..."
go run cmd/server/main.go &
SERVER_PID=$!
sleep 5
kill $SERVER_PID 2>/dev/null

# 種データの投入
echo ""
echo "🌱 種データを投入しています..."
go run cmd/seed/main.go

echo ""
echo "✨ セットアップが完了しました！"
echo ""
echo "📋 開発用アカウント情報:"
echo "  管理者: admin@example.com / password123"
echo "  ユーザー1: user1@example.com / password123"
echo "  ユーザー2: user2@example.com / password123"
echo ""
echo "🔑 開発用OAuth2クライアント:"
echo "  Confidential Client:"
echo "    Client ID: dev-client-001"
echo "    Client Secret: dev-secret-please-change-in-production"
echo ""
echo "  Public Client (SPA):"
echo "    Client ID: test-spa-client"
echo ""
echo "🚀 サーバーを起動するには:"
echo "  cd backend && go run cmd/server/main.go"
echo ""
echo "または:"
echo "  cd backend && make run"