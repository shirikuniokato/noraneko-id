# API Reference - API仕様書

noraneko-id バックエンドの詳細なAPI仕様とエンドポイント一覧です。

## 基本情報

- **Base URL**: `https://api.noraneko-id.com` (本番) / `http://localhost:8080` (開発)
- **API Version**: v1
- **Content-Type**: `application/json`
- **Character Encoding**: UTF-8

## 認証方式

### 1. セッション認証 (Cookie)
```http
Cookie: session_token=<session_token>
```

### 2. Bearer Token認証 (OAuth2)
```http
Authorization: Bearer <access_token>
```

## エラーレスポンス形式

```json
{
  "error": "error_code",
  "message": "エラーメッセージ（日本語）",
  "details": "詳細情報（オプション）",
  "error_uri": "https://docs.noraneko-id.com/errors/error_code"
}
```

### 共通エラーコード

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `invalid_request` | 400 | リクエスト形式が不正 |
| `unauthorized` | 401 | 認証が必要 |
| `forbidden` | 403 | アクセス権限なし |
| `not_found` | 404 | リソースが見つからない |
| `method_not_allowed` | 405 | HTTPメソッドが許可されていない |
| `rate_limit_exceeded` | 429 | レート制限超過 |
| `server_error` | 500 | サーバー内部エラー |

---

## 認証・認可API

### ユーザー登録

**POST** `/auth/register`

新しいユーザーアカウントを作成します（パスワード認証）。

#### リクエスト

```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "testuser",
  "display_name": "Test User",
  "client_id": "demo-client"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | ✅ | メールアドレス |
| `password` | string | ✅ | パスワード（6文字以上） |
| `username` | string | ✅ | ユーザー名（3-50文字） |
| `display_name` | string | | 表示名 |
| `client_id` | string | ✅ | クライアントID（マルチテナント） |

#### レスポンス

**201 Created**
```json
{
  "message": "ユーザーの登録が完了しました",
  "user": {
    "id": "12345678-1234-1234-1234-123456789abc",
    "client_id": "demo-client",
    "email": "user@example.com",
    "username": "testuser",
    "display_name": "Test User",
    "email_verified": false
  }
}
```

#### エラーレスポンス

**400 Bad Request**
```json
{
  "error": "invalid_client",
  "message": "無効なクライアントIDです"
}
```

**409 Conflict**
```json
{
  "error": "email_already_exists",
  "message": "このメールアドレスは既に使用されています"
}
```

---

### ユーザーログイン

**POST** `/auth/login`

メールアドレスとパスワードでログインします。

#### リクエスト

**JSON形式:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "client_id": "demo-client"
}
```

**フォーム形式:**
```
Content-Type: application/x-www-form-urlencoded

email=user@example.com&password=password123&client_id=demo-client&redirect_uri=https://example.com/callback
```

#### レスポンス

**200 OK (JSON)**
```json
{
  "message": "ログインに成功しました",
  "user": {
    "id": "12345678-1234-1234-1234-123456789abc",
    "client_id": "demo-client",
    "email": "user@example.com",
    "username": "testuser",
    "display_name": "Test User",
    "email_verified": false
  }
}
```

**302 Found (フォーム)**
```
Set-Cookie: session_token=<token>; HttpOnly; Secure; SameSite=Lax
Location: <redirect_uri>
```

#### エラーレスポンス

**401 Unauthorized**
```json
{
  "error": "invalid_credentials",
  "message": "メールアドレスまたはパスワードが正しくありません"
}
```

---

### ユーザーログアウト

**POST** `/auth/logout`

現在のセッションを無効化してログアウトします。

#### リクエスト

認証: セッションクッキー必須

#### レスポンス

**200 OK**
```json
{
  "message": "ログアウトしました"
}
```

```
Set-Cookie: session_token=; Max-Age=0; HttpOnly; Secure
```

---

### プロフィール取得

**GET** `/auth/profile`

ログイン中のユーザーのプロフィール情報を取得します。

#### リクエスト

認証: セッションクッキーまたはBearer Token

#### レスポンス

**200 OK**
```json
{
  "user": {
    "id": "12345678-1234-1234-1234-123456789abc",
    "client_id": "demo-client",
    "email": "user@example.com",
    "username": "testuser",
    "display_name": "Test User",
    "profile_image_url": "https://example.com/avatar.jpg",
    "email_verified": true,
    "last_login_at": "2024-01-15T10:30:00Z",
    "created_at": "2024-01-01T00:00:00Z",
    "auth_providers": [
      {
        "type": "password",
        "verified": true,
        "last_used_at": "2024-01-15T10:30:00Z",
        "created_at": "2024-01-01T00:00:00Z"
      },
      {
        "type": "google",
        "verified": true,
        "provider_email": "user@gmail.com",
        "last_used_at": "2024-01-10T15:20:00Z",
        "created_at": "2024-01-05T12:00:00Z"
      }
    ]
  }
}
```

---

### サポートプロバイダー一覧

**GET** `/auth/providers`

システムがサポートしている認証プロバイダーの一覧を取得します。

#### レスポンス

**200 OK**
```json
{
  "providers": [
    {
      "type": "password",
      "name": "パスワード認証",
      "available": true
    },
    {
      "type": "google",
      "name": "Google",
      "available": false
    },
    {
      "type": "github",
      "name": "GitHub",
      "available": false
    },
    {
      "type": "line",
      "name": "LINE",
      "available": false
    }
  ],
  "total": 4
}
```

---

## OAuth2 API

### 認可エンドポイント

**GET/POST** `/oauth2/authorize`

OAuth2認可コードフローの認可エンドポイントです。

#### クエリパラメータ

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `response_type` | string | ✅ | `code` 固定 |
| `client_id` | string | ✅ | クライアントID |
| `redirect_uri` | string | ✅ | リダイレクトURI |
| `scope` | string | | スコープ (デフォルト: `openid`) |
| `state` | string | | CSRF対策用ランダム文字列 |
| `code_challenge` | string | | PKCEコードチャレンジ |
| `code_challenge_method` | string | | PKCEメソッド (`S256`) |
| `identity_provider` | string | | SNS連携プロバイダー |

#### SNS連携の例

```
GET /oauth2/authorize?response_type=code&client_id=demo-client&redirect_uri=https://example.com/callback&identity_provider=google&state=xyz123
```

#### レスポンス

**未認証の場合:**
```
302 Found
Location: /login?redirect_uri=<encoded_authorize_url>
```

**同意画面表示:**
```
200 OK
Content-Type: text/html

<同意画面のHTML>
```

**認可成功:**
```
302 Found
Location: https://example.com/callback?code=<auth_code>&state=xyz123
```

**エラー:**
```
302 Found
Location: https://example.com/callback?error=invalid_request&error_description=<description>&state=xyz123
```

---

### トークンエンドポイント

**POST** `/oauth2/token`

認可コードをアクセストークンに交換します。

#### リクエスト

**Authorization Code Grant:**
```json
{
  "grant_type": "authorization_code",
  "code": "<authorization_code>",
  "redirect_uri": "https://example.com/callback",
  "client_id": "demo-client",
  "client_secret": "<client_secret>",
  "code_verifier": "<pkce_verifier>"
}
```

**Refresh Token Grant:**
```json
{
  "grant_type": "refresh_token",
  "refresh_token": "<refresh_token>",
  "client_id": "demo-client",
  "client_secret": "<client_secret>"
}
```

#### レスポンス

**200 OK**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "def50200ab1234...",
  "scope": "openid profile email"
}
```

#### エラーレスポンス

**400 Bad Request**
```json
{
  "error": "invalid_grant",
  "error_description": "認可コードが無効または期限切れです"
}
```

---

### ユーザー情報エンドポイント

**GET** `/oauth2/userinfo`

アクセストークンを使用してユーザー情報を取得します。

#### リクエスト

```http
Authorization: Bearer <access_token>
```

#### レスポンス

**200 OK**
```json
{
  "sub": "12345678-1234-1234-1234-123456789abc",
  "email": "user@example.com",
  "email_verified": true,
  "name": "Test User",
  "preferred_username": "testuser",
  "picture": "https://example.com/avatar.jpg",
  "updated_at": 1642204800
}
```

**スコープ別レスポンス内容:**
- `openid`: `sub`
- `profile`: `name`, `preferred_username`, `picture`, `updated_at`
- `email`: `email`, `email_verified`

---

### トークン取り消し

**POST** `/oauth2/revoke`

アクセストークンまたはリフレッシュトークンを取り消します。

#### リクエスト

```json
{
  "token": "<access_token_or_refresh_token>",
  "token_type_hint": "access_token"
}
```

#### レスポンス

**200 OK**
```json
{
  "message": "トークンを取り消しました"
}
```

---

### クライアント情報取得

**GET** `/oauth2/client-info/{client_id}`

OAuth2クライアントの公開情報を取得します。

#### レスポンス

**200 OK**
```json
{
  "id": "12345678-1234-1234-1234-123456789abc",
  "name": "Demo Client",
  "description": "Demo application for testing",
  "redirect_uri": "https://example.com/callback",
  "logo_url": "https://example.com/logo.png",
  "website": "https://example.com",
  "privacy_policy_url": "https://example.com/privacy",
  "terms_of_service_url": "https://example.com/terms"
}
```

---

## 管理者API

### クライアント作成

**POST** `/admin/clients`

新しいOAuth2クライアントを作成します。

認証: 管理者権限必須

#### リクエスト

```json
{
  "name": "My Application",
  "description": "My awesome application",
  "redirect_uris": [
    "https://myapp.com/callback",
    "https://myapp.com/dev/callback"
  ],
  "allowed_scopes": ["openid", "profile", "email"],
  "is_confidential": true,
  "require_consent": true,
  "trusted_client": false,
  "logo_url": "https://myapp.com/logo.png",
  "website": "https://myapp.com",
  "privacy_policy_url": "https://myapp.com/privacy",
  "terms_of_service_url": "https://myapp.com/terms",
  "support_email": "support@myapp.com",
  "brand_color": "#4f46e5"
}
```

#### レスポンス

**201 Created**
```json
{
  "message": "クライアントが作成されました",
  "client": {
    "id": "12345678-1234-1234-1234-123456789abc",
    "client_id": "my-app-client",
    "client_secret": "generated-secret-key",
    "name": "My Application",
    "description": "My awesome application",
    "redirect_uris": ["https://myapp.com/callback"],
    "allowed_scopes": ["openid", "profile", "email"],
    "is_confidential": true,
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### クライアント一覧取得

**GET** `/admin/clients`

OAuth2クライアントの一覧を取得します。

認証: 管理者権限必須

#### クエリパラメータ

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | ページ番号 (デフォルト: 1) |
| `limit` | integer | 1ページあたりの件数 (デフォルト: 20) |
| `search` | string | 名前での検索 |
| `is_active` | boolean | アクティブ状態でフィルタ |

#### レスポンス

**200 OK**
```json
{
  "clients": [
    {
      "id": "12345678-1234-1234-1234-123456789abc",
      "client_id": "demo-client",
      "name": "Demo Client",
      "description": "Demo application",
      "is_confidential": false,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "user_count": 150
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "total_pages": 1
  }
}
```

---

### クライアント詳細取得

**GET** `/admin/clients/{id}`

特定のOAuth2クライアントの詳細情報を取得します。

認証: 管理者権限必須

#### レスポンス

**200 OK**
```json
{
  "client": {
    "id": "12345678-1234-1234-1234-123456789abc",
    "client_id": "demo-client",
    "name": "Demo Client",
    "description": "Demo application for testing",
    "redirect_uris": ["http://localhost:3001/auth/callback"],
    "allowed_scopes": ["openid", "profile", "email"],
    "is_confidential": false,
    "is_active": true,
    "require_consent": false,
    "trusted_client": true,
    "logo_url": null,
    "website": null,
    "privacy_policy_url": null,
    "terms_of_service_url": null,
    "support_email": null,
    "brand_color": "#4f46e5",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "statistics": {
      "total_users": 150,
      "active_users_30d": 120,
      "total_tokens_issued": 1500,
      "active_tokens": 45
    }
  }
}
```

---

### クライアント更新

**PUT** `/admin/clients/{id}`

OAuth2クライアントの情報を更新します。

認証: 管理者権限必須

#### リクエスト

```json
{
  "name": "Updated Application Name",
  "description": "Updated description",
  "redirect_uris": [
    "https://myapp.com/callback",
    "https://myapp.com/dev/callback"
  ],
  "allowed_scopes": ["openid", "profile", "email", "read"],
  "require_consent": false,
  "trusted_client": true
}
```

#### レスポンス

**200 OK**
```json
{
  "message": "クライアント情報が更新されました",
  "client": {
    "id": "12345678-1234-1234-1234-123456789abc",
    "client_id": "my-app-client",
    "name": "Updated Application Name",
    "updated_at": "2024-01-15T11:30:00Z"
  }
}
```

---

### クライアント削除

**DELETE** `/admin/clients/{id}`

OAuth2クライアントを削除します（ソフト削除）。

認証: 管理者権限必須

#### レスポンス

**200 OK**
```json
{
  "message": "クライアントが削除されました"
}
```

---

### クライアントシークレット再生成

**POST** `/admin/clients/{id}/regenerate-secret`

OAuth2クライアントのシークレットを再生成します。

認証: 管理者権限必須

#### レスポンス

**200 OK**
```json
{
  "message": "クライアントシークレットが再生成されました",
  "client_secret": "new-generated-secret-key"
}
```

---

## ヘルスチェックAPI

### システム状態確認

**GET** `/health`

システムの動作状態を確認します。

#### レスポンス

**200 OK**
```json
{
  "status": "ok",
  "service": "Noraneko ID",
  "environment": "development",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "database": {
    "status": "connected",
    "response_time_ms": 5
  }
}
```

**503 Service Unavailable** (サービス停止時)
```json
{
  "status": "unavailable",
  "service": "Noraneko ID",
  "errors": [
    "Database connection failed"
  ]
}
```

---

## WebHook API (将来実装予定)

### ユーザー作成通知

**POST** `<client_webhook_url>`

ユーザーが作成された際にクライアントアプリに通知します。

#### ペイロード

```json
{
  "event": "user.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "client_id": "demo-client",
  "data": {
    "user_id": "12345678-1234-1234-1234-123456789abc",
    "email": "user@example.com",
    "username": "testuser",
    "provider_type": "password"
  }
}
```

### トークン失効通知

**POST** `<client_webhook_url>`

トークンが失効した際にクライアントアプリに通知します。

#### ペイロード

```json
{
  "event": "token.revoked",
  "timestamp": "2024-01-15T10:30:00Z",
  "client_id": "demo-client",
  "data": {
    "user_id": "12345678-1234-1234-1234-123456789abc",
    "token_id": "token-uuid",
    "reason": "user_logout"
  }
}
```

---

## SDK/ライブラリ

### JavaScript SDK

```javascript
import { NoranekoID } from '@noraneko-id/javascript-sdk';

const auth = new NoranekoID({
  clientId: 'your-client-id',
  redirectUri: 'https://yourapp.com/callback',
  apiBaseUrl: 'https://api.noraneko-id.com'
});

// OAuth2ログイン
const loginUrl = auth.buildLoginUrl({
  scope: 'openid profile email',
  state: 'random-state'
});

// SNS連携ログイン
const googleLoginUrl = auth.buildLoginUrl({
  identityProvider: 'google',
  scope: 'openid profile email'
});
```

### Go SDK (将来実装予定)

```go
import "github.com/noraneko-id/go-sdk"

client := noranekoid.NewClient(&noranekoid.Config{
    ClientID:     "your-client-id",
    ClientSecret: "your-client-secret",
    RedirectURI:  "https://yourapp.com/callback",
    BaseURL:      "https://api.noraneko-id.com",
})

// トークン検証
userInfo, err := client.VerifyToken(accessToken)
```

---

## レート制限

| エンドポイント | 制限 | ウィンドウ |
|---------------|------|-----------|
| `POST /auth/login` | 5 requests | 1分 |
| `POST /auth/register` | 3 requests | 1分 |
| `POST /oauth2/token` | 10 requests | 1分 |
| `GET /oauth2/userinfo` | 60 requests | 1分 |
| `POST /admin/*` | 30 requests | 1分 |

制限超過時は `429 Too Many Requests` が返されます。

---

## OpenAPI仕様

完全なOpenAPI 3.0仕様書は以下で確認できます：

- **Swagger UI**: `http://localhost:8080/swagger/index.html`
- **JSON**: `http://localhost:8080/swagger/doc.json`
- **YAML**: `http://localhost:8080/swagger/doc.yaml`