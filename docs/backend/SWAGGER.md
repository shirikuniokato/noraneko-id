# Swagger/OpenAPI ドキュメント

noraneko-id APIのSwagger/OpenAPIドキュメントについて説明します。

## Swagger UI の利用方法

### 1. サーバー起動

```bash
# 開発環境での起動
cd backend
go run ./cmd/server

# または開発スクリプトを使用
./scripts/dev.sh
```

### 2. Swagger UI へのアクセス

サーバー起動後、以下のURLでSwagger UIにアクセスできます：

**http://localhost:8080/swagger/index.html**

### 3. API ドキュメントの確認

Swagger UI では以下が確認できます：

- **API エンドポイント一覧**: 利用可能な全てのAPIエンドポイント
- **リクエスト/レスポンス形式**: 各エンドポイントの詳細仕様
- **認証方式**: セッション認証とBearer Token認証
- **対話式テスト**: ブラウザ上でAPIを直接テスト可能

## APIカテゴリー

### 認証 (Authentication)
- `POST /auth/register` - ユーザー新規登録
- `POST /auth/login` - ユーザーログイン
- `POST /auth/logout` - ユーザーログアウト
- `GET /auth/profile` - ユーザープロフィール取得

### OAuth2
- `GET /oauth2/authorize` - OAuth2認可エンドポイント
- `POST /oauth2/token` - トークンエンドポイント
- `GET /oauth2/userinfo` - ユーザー情報エンドポイント
- `POST /oauth2/revoke` - トークン無効化エンドポイント

### 管理者 (Admin)
- `POST /admin/clients` - OAuth2クライアント作成
- `GET /admin/clients` - OAuth2クライアント一覧取得
- `GET /admin/clients/{id}` - OAuth2クライアント詳細取得
- `PUT /admin/clients/{id}` - OAuth2クライアント更新
- `DELETE /admin/clients/{id}` - OAuth2クライアント削除

## 認証のテスト方法

### 1. セッション認証のテスト

```bash
# 1. ユーザー登録
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "username": "testuser",
    "display_name": "Test User"
  }'

# 2. ログイン（セッションクッキーが設定される）
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# 3. セッション認証が必要なエンドポイントをテスト
curl -X GET http://localhost:8080/auth/profile \
  -b cookies.txt
```

### 2. Bearer Token認証のテスト

```bash
# 1. OAuth2フローでアクセストークンを取得
# （ここではクライアント登録とフロー実行が必要）

# 2. アクセストークンでAPIをテスト
curl -X GET http://localhost:8080/oauth2/userinfo \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Swagger UI での認証設定

### 1. セッション認証の設定

1. Swagger UIで「Authorize」ボタンをクリック
2. 「SessionAuth」セクションで認証情報を設定
3. 事前に `/auth/login` でログインしてセッションクッキーを取得

### 2. Bearer Token認証の設定

1. Swagger UIで「Authorize」ボタンをクリック
2. 「BearerAuth」セクションで `Bearer YOUR_ACCESS_TOKEN` を入力
3. 事前にOAuth2フローでアクセストークンを取得

## ドキュメントの更新方法

### 1. コードアノテーションの更新

各ハンドラー関数のSwaggerアノテーションを更新：

```go
// @Summary API概要
// @Description 詳細説明
// @Tags カテゴリー名
// @Accept json
// @Produce json
// @Param request body RequestStruct true "リクエスト説明"
// @Success 200 {object} ResponseStruct "成功レスポンス"
// @Failure 400 {object} ErrorResponse "エラーレスポンス"
// @Router /endpoint [post]
func Handler(c *gin.Context) {
    // ハンドラー実装
}
```

### 2. ドキュメント再生成

```bash
cd backend

# Swagger文書の再生成
~/go/bin/swag init -g cmd/server/main.go -o docs

# または、swagがPATHに通っている場合
swag init -g cmd/server/main.go -o docs
```

### 3. 生成ファイル

以下のファイルが生成されます：

- `docs/docs.go` - Goパッケージファイル
- `docs/swagger.json` - OpenAPI JSON仕様
- `docs/swagger.yaml` - OpenAPI YAML仕様

## カスタマイズ

### 1. API情報の設定

`cmd/server/main.go` でAPI基本情報を設定：

```go
// @title noraneko-id API
// @version 1.0
// @description プライベートサービス開発者向けIDaaS API
// @termsOfService https://noraneko-id.com/terms

// @contact.name noraneko-id Support
// @contact.url https://noraneko-id.com/support
// @contact.email support@noraneko-id.com

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /
```

### 2. セキュリティ定義

```go
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Bearer Token認証

// @securityDefinitions.apikey SessionAuth
// @in header
// @name Cookie
// @description セッション認証
```

## ベストプラクティス

### 1. リクエスト/レスポンス構造体

適切なタグとコメントを追加：

```go
type LoginRequest struct {
    Email    string `json:"email" binding:"required,email" example:"user@example.com"` // メールアドレス
    Password string `json:"password" binding:"required,min=6" example:"password123"` // パスワード（6文字以上）
}
```

### 2. エラーレスポンス

統一されたエラーレスポンス形式を使用：

```go
type ErrorResponse struct {
    Error       string `json:"error" example:"invalid_request"`
    Message     string `json:"message" example:"リクエストが無効です"`
    Timestamp   string `json:"timestamp" example:"2024-01-01T00:00:00Z"`
}
```

### 3. API バージョニング

将来的なAPIバージョン管理を考慮した設計を行います。

## 統合とCI/CD

### 1. 自動生成の組み込み

ビルドプロセスにSwagger生成を組み込み：

```bash
# scripts/build.sh での例
cd backend
swag init -g cmd/server/main.go -o docs
go build -o bin/server ./cmd/server
```

### 2. ドキュメント品質チェック

- API仕様の網羅性確認
- レスポンス例の妥当性確認
- セキュリティ要件の文書化確認

## 参考資料

- [Swaggo Documentation](https://github.com/swaggo/swag)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Gin-Swagger Integration](https://github.com/swaggo/gin-swagger)