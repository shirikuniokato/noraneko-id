# noraneko-id 認証フローテスト手順書

このドキュメントでは、noraneko-id の認証フローを手動でテストする手順を説明します。

## 前提条件

1. PostgreSQL が起動していること
2. バックエンドサーバーが起動していること
3. デモアプリケーションが起動していること

## 1. 環境のセットアップ

### 1.1 PostgreSQL の起動

```bash
cd backend
docker-compose up -d
```

### 1.2 バックエンドサーバーの起動

```bash
cd backend
cp .env.example .env  # 初回のみ
go run cmd/server/main.go
```

サーバーは `http://localhost:8080` で起動します。

### 1.3 管理者ユーザーの作成

新しいターミナルで以下を実行：

```bash
cd backend

# 管理者ユーザーを作成
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "name": "Admin User"
  }'

# ログインしてセッショントークンを取得
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

### 1.4 管理者権限の付与

PostgreSQL に直接接続して管理者権限を付与：

```bash
docker exec -it noraneko-postgres psql -U noraneko -d noraneko_id

-- ユーザーIDを確認
SELECT id, email FROM users WHERE email = 'admin@example.com';

-- 管理者権限を付与（UUIDは上記で確認したものを使用）
INSERT INTO admin_roles (user_id, role, permissions) 
VALUES ('YOUR-USER-UUID', 'super_admin', '["*"]');

\q
```

### 1.5 OAuth2 クライアントの作成

```bash
# 管理者としてOAuth2クライアントを作成
curl -X POST http://localhost:8080/admin/clients \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Demo App",
    "description": "Next.js Demo Application",
    "client_type": "public",
    "redirect_uris": ["http://localhost:3001/auth/callback"],
    "scopes": ["openid", "profile", "email"],
    "grant_types": ["authorization_code"],
    "response_types": ["code"],
    "logo_url": "https://example.com/logo.png",
    "website": "http://localhost:3001",
    "privacy_policy_url": "http://localhost:3001/privacy",
    "terms_of_service_url": "http://localhost:3001/terms"
  }'
```

レスポンスから `client_id` をコピーしてください。

## 2. デモアプリケーションのセットアップ

### 2.1 環境変数の設定

```bash
cd examples/nextjs-demo
cp .env.example .env.local
```

`.env.local` を編集：

```env
NORANEKO_ISSUER=http://localhost:8080
NORANEKO_CLIENT_ID=YOUR_CLIENT_ID_HERE  # 上記で取得したclient_id
NORANEKO_APP_URL=http://localhost:3001
```

### 2.2 デモアプリケーションの起動

```bash
npm install  # 初回のみ
npm run dev
```

アプリケーションは `http://localhost:3001` で起動します。

## 3. 認証フローのテスト

### 3.1 基本的な認証フロー

1. ブラウザで `http://localhost:3001` を開く
2. 「ログイン」ボタンをクリック
3. noraneko-id の認証画面にリダイレクトされることを確認
4. 作成したアカウントでログイン
5. 認可画面で「許可」をクリック
6. デモアプリにリダイレクトされ、認証済み状態になることを確認

### 3.2 保護されたページへのアクセス

1. 認証済み状態で「保護されたページへ」ボタンをクリック
2. `/dashboard` ページが表示されることを確認
3. ユーザー情報が正しく表示されることを確認

### 3.3 ログアウト

1. 「ログアウト」ボタンをクリック
2. 未認証状態に戻ることを確認
3. `/dashboard` に直接アクセスしてブロックされることを確認

## 4. トラブルシューティング

### CORS エラーが発生する場合

バックエンドサーバーを再起動してください：

```bash
# Ctrl+C でサーバーを停止
go run cmd/server/main.go
```

### 認証が失敗する場合

1. client_id が正しく設定されているか確認
2. redirect_uri が完全に一致しているか確認（末尾のスラッシュも含む）
3. バックエンドのログを確認

### セッションエラーが発生する場合

ブラウザの開発者ツールでCookieを確認：
- `session_token` が設定されているか
- SameSite属性が適切か
- Secure属性（HTTPSの場合のみ）

## 5. API エンドポイントのテスト

### ユーザー情報の取得

```bash
# 認証後、ブラウザの開発者ツールからアクセストークンを取得
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     http://localhost:8080/oauth2/userinfo
```

### クライアント情報の取得

```bash
curl http://localhost:8080/oauth2/client-info/YOUR_CLIENT_ID
```

## 6. 詳細なデバッグ

### バックエンドのログ確認

バックエンドサーバーのコンソールでリクエスト/レスポンスのログを確認できます。

### ブラウザの開発者ツール

1. Networkタブで全てのリクエストを確認
2. Consoleタブでエラーメッセージを確認
3. Applicationタブでクッキーとローカルストレージを確認

### PostgreSQL のデータ確認

```bash
docker exec -it noraneko-postgres psql -U noraneko -d noraneko_id

-- ユーザー一覧
SELECT id, email, name, is_active FROM users;

-- クライアント一覧
SELECT id, client_id, name, client_type FROM oauth_clients;

-- 認可コード（デバッグ用）
SELECT code, client_id, user_id, expires_at FROM authorization_codes WHERE expires_at > NOW();

\q
```

## まとめ

この手順に従って認証フローをテストすることで、noraneko-id が正しく動作していることを確認できます。問題が発生した場合は、ログとブラウザの開発者ツールを使用してデバッグしてください。