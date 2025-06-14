# 開発ガイド

noraneko-idの開発環境構築から開発ワークフローまでを説明します。

## 前提条件

以下のツールがインストールされている必要があります：

- **Go** 1.21以上
- **Node.js** 18以上
- **Docker** & **Docker Compose**
- **Git**

## 環境構築

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-org/noraneko-id.git
cd noraneko-id
```

### 2. 依存関係のインストール

```bash
# Goの依存関係
cd backend
go mod download

# Node.jsの依存関係
cd ../web
npm install
```

### 3. 環境変数の設定

`backend/.env` ファイルを作成：

```env
# データベース設定
DB_HOST=localhost
DB_PORT=5432
DB_USER=noraneko
DB_PASSWORD=dev_password
DB_NAME=noraneko_id
DB_SSLMODE=disable

# JWT設定
JWT_SECRET=your-secret-key-here-change-in-production

# サーバー設定
PORT=8080
GIN_MODE=debug

# セッション設定
SESSION_SECRET=your-session-secret-here
```

### 4. データベースの起動

```bash
# プロジェクトルートから実行
docker-compose up -d postgres

# データベースの準備確認
docker-compose logs postgres
```

## 開発サーバーの起動

### 方法1: スクリプトを使用（推奨）

```bash
# プロジェクトルートから実行
./scripts/dev.sh
```

これにより以下が自動で起動されます：
- PostgreSQL（Docker）
- Goバックエンドサーバー（:8080）
- Next.js開発サーバー（:3000）

### 方法2: 個別起動

```bash
# ターミナル1: データベース
docker-compose up postgres

# ターミナル2: バックエンド
cd backend
go run ./cmd/server

# ターミナル3: フロントエンド
cd web
npm run dev
```

## 利用可能なエンドポイント

### バックエンドAPI (http://localhost:8080)

- `GET /health` - ヘルスチェック
- `POST /auth/register` - ユーザー登録
- `POST /auth/login` - ログイン
- `POST /auth/logout` - ログアウト
- `GET /oauth2/authorize` - OAuth2認可エンドポイント
- `POST /oauth2/token` - トークン発行
- `GET /oauth2/userinfo` - ユーザー情報取得
- `POST /oauth2/revoke` - トークン無効化
- `GET /admin/clients` - クライアント一覧（管理者）
- `POST /admin/clients` - クライアント作成（管理者）

### フロントエンド (http://localhost:3000)

- 管理画面（開発中）

## データベース

### スキーマ確認

```bash
# PostgreSQLコンテナに接続
docker exec -it noraneko-postgres psql -U noraneko -d noraneko_id

# テーブル一覧
\dt

# 特定テーブルのスキーマ確認
\d users
```

### データベースリセット

```bash
# データベースコンテナを停止・削除
docker-compose down
docker volume rm noraneko-id_postgres_data

# 再起動
docker-compose up -d postgres
```

## ビルド

### 開発ビルド

```bash
./scripts/build.sh
```

### 本番ビルド

```bash
# バックエンド
cd backend
CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o bin/server ./cmd/server

# フロントエンド
cd web
npm run build
```

## コード品質

### フォーマット

```bash
# Go
cd backend
go fmt ./...

# TypeScript/JavaScript
cd web
npm run lint
npm run lint:fix
```

### 静的解析

```bash
# Go
cd backend
go vet ./...

# TypeScript
cd web
npm run type-check
```

## トラブルシューティング

### よくある問題

#### 1. データベース接続エラー

```
failed to connect to database: dial tcp [::1]:5432: connect: connection refused
```

**解決方法:**
- PostgreSQLコンテナが起動しているか確認
- `.env`ファイルの設定を確認
- ポート5432が他のプロセスで使用されていないか確認

#### 2. セッション認証エラー

```
invalid session token
```

**解決方法:**
- ブラウザのクッキーを削除
- `SESSION_SECRET`が設定されているか確認

#### 3. CORS エラー

フロントエンドからAPIアクセス時にCORSエラーが発生する場合：

**解決方法:**
- バックエンドのCORS設定を確認
- 開発時は `http://localhost:3000` が許可されているか確認

#### 4. ポート競合

**解決方法:**
```bash
# 使用中のポートを確認
lsof -i :8080
lsof -i :3000
lsof -i :5432

# プロセスを終了
kill -9 <PID>
```

## 開発時の注意事項

1. **データベースマイグレーション**: 現在はGORMのAutoMigrateを使用。本番環境では適切なマイグレーション戦略を検討
2. **セキュリティ**: `.env`ファイルは絶対にコミットしない
3. **ログ**: 開発時は`GIN_MODE=debug`、本番時は`GIN_MODE=release`
4. **テストデータ**: 開発用の初期データ作成スクリプトの追加を検討

## 次のステップ

- [テストガイド](./TESTING.md)
- [API仕様](./API.md)
- [デプロイガイド](./DEPLOYMENT.md)