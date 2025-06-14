#!/bin/bash

# noraneko-id 認証フローテストスクリプト

set -e

echo "=== noraneko-id 認証フローテスト ==="
echo ""

# 環境変数
API_URL="http://localhost:8080"
ADMIN_EMAIL="admin@test.com"
ADMIN_PASSWORD="password123"
CLIENT_NAME="Test App $(date +%s)"
REDIRECT_URI="http://localhost:3001/auth/callback"

# 色の定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# 成功/失敗メッセージ
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# 1. サーバーの確認
info "バックエンドサーバーの確認中..."
if curl -s -f "$API_URL/health" > /dev/null; then
    success "バックエンドサーバーが稼働しています"
else
    error "バックエンドサーバーが起動していません。'cd backend && go run cmd/server/main.go' で起動してください"
fi

# 2. 管理者アカウントの作成
info "管理者アカウントの作成中..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\",
    \"name\": \"Test Admin\"
  }")

if echo "$REGISTER_RESPONSE" | grep -q "user_already_exists"; then
    info "管理者アカウントは既に存在します"
elif echo "$REGISTER_RESPONSE" | grep -q "ユーザーの登録が完了しました"; then
    success "管理者アカウントを作成しました"
    
    # ユーザーIDを取得
    USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"id":"[^"]*' | grep -o '[^"]*$')
    
    # 管理者権限の付与
    info "管理者権限を付与しています..."
    docker exec noraneko-postgres psql -U noraneko -d noraneko_id -c \
        "INSERT INTO admin_roles (user_id, role, permissions) VALUES ('$USER_ID', 'super_admin', '[\"*\"]') ON CONFLICT DO NOTHING;" > /dev/null 2>&1
    success "管理者権限を付与しました"
else
    error "管理者アカウントの作成に失敗しました: $REGISTER_RESPONSE"
fi

# 3. ログインしてセッショントークンを取得
info "管理者としてログイン中..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

if echo "$LOGIN_RESPONSE" | grep -q "ログインに成功しました"; then
    success "ログインに成功しました"
else
    error "ログインに失敗しました: $LOGIN_RESPONSE"
fi

# 4. OAuth2クライアントの作成
info "OAuth2クライアントの作成中..."
CLIENT_RESPONSE=$(curl -s -X POST "$API_URL/admin/clients" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{
    \"name\": \"$CLIENT_NAME\",
    \"description\": \"Test OAuth2 Client\",
    \"client_type\": \"public\",
    \"redirect_uris\": [\"$REDIRECT_URI\"],
    \"scopes\": [\"openid\", \"profile\", \"email\"],
    \"grant_types\": [\"authorization_code\"],
    \"response_types\": [\"code\"],
    \"logo_url\": \"https://example.com/logo.png\",
    \"website\": \"http://localhost:3001\",
    \"privacy_policy_url\": \"http://localhost:3001/privacy\",
    \"terms_of_service_url\": \"http://localhost:3001/terms\"
  }")

if echo "$CLIENT_RESPONSE" | grep -q "client_id"; then
    CLIENT_ID=$(echo "$CLIENT_RESPONSE" | grep -o '"client_id":"[^"]*' | grep -o '[^"]*$')
    success "OAuth2クライアントを作成しました"
    echo ""
    echo "======================================"
    echo "クライアント情報:"
    echo "  Client ID: $CLIENT_ID"
    echo "  Redirect URI: $REDIRECT_URI"
    echo "======================================"
else
    error "OAuth2クライアントの作成に失敗しました: $CLIENT_RESPONSE"
fi

# 5. 認証URLの生成
info "認証URLを生成中..."
STATE=$(openssl rand -hex 16)
CODE_VERIFIER=$(openssl rand -base64 32 | tr -d "=+/" | cut -c 1-43)
CODE_CHALLENGE=$(echo -n "$CODE_VERIFIER" | openssl dgst -sha256 -binary | openssl base64 -A | tr -d "=" | tr "+/" "-_")

AUTH_URL="$API_URL/oauth2/authorize?response_type=code&client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URI&scope=openid%20profile%20email&state=$STATE&code_challenge=$CODE_CHALLENGE&code_challenge_method=S256"

echo ""
echo "======================================"
echo "認証フローのテスト準備が完了しました！"
echo ""
echo "1. デモアプリの環境変数を設定:"
echo "   cd examples/nextjs-demo"
echo "   echo 'NORANEKO_CLIENT_ID=$CLIENT_ID' > .env.local"
echo "   echo 'NORANEKO_ISSUER=$API_URL' >> .env.local"
echo "   echo 'NORANEKO_APP_URL=http://localhost:3001' >> .env.local"
echo ""
echo "2. デモアプリを起動:"
echo "   npm install"
echo "   npm run dev"
echo ""
echo "3. ブラウザで http://localhost:3001 を開いてログインボタンをクリック"
echo ""
echo "テスト用認証URL:"
echo "$AUTH_URL"
echo "======================================"

# クリーンアップ
rm -f cookies.txt

echo ""
success "セットアップが完了しました！"