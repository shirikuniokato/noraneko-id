# API仕様

noraneko-id APIエンドポイントの詳細仕様です。

## ベースURL

- 開発環境: `http://localhost:8080`
- 本番環境: `https://api.noraneko-id.com`

## 認証

### セッション認証

ログイン後に発行されるセッションクッキーを使用：

```
Cookie: session_token=<session_token>
```

### Bearer Token認証

OAuth2アクセストークンを使用：

```
Authorization: Bearer <access_token>
```

## エンドポイント一覧

### 認証・ユーザー管理

#### POST /auth/register

ユーザー新規登録

**リクエスト:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

**レスポンス (201):**
```json
{
  "id": "01234567-89ab-cdef-0123-456789abcdef",
  "email": "user@example.com",
  "name": "User Name",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**エラーレスポンス (400):**
```json
{
  "error": "email already exists"
}
```

#### POST /auth/login

ユーザーログイン

**リクエスト:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス (200):**
```json
{
  "user": {
    "id": "01234567-89ab-cdef-0123-456789abcdef",
    "email": "user@example.com",
    "name": "User Name"
  },
  "message": "login successful"
}
```

**エラーレスポンス (401):**
```json
{
  "error": "invalid credentials"
}
```

#### POST /auth/logout

ユーザーログアウト

**レスポンス (200):**
```json
{
  "message": "logout successful"
}
```

#### GET /auth/me

ログイン中ユーザー情報取得

**レスポンス (200):**
```json
{
  "id": "01234567-89ab-cdef-0123-456789abcdef",
  "email": "user@example.com",
  "name": "User Name",
  "is_admin": false
}
```

### OAuth2エンドポイント

#### GET /oauth2/authorize

OAuth2認可エンドポイント

**クエリパラメータ:**
- `client_id` (必須): クライアントID
- `response_type` (必須): `code`
- `redirect_uri` (必須): リダイレクトURI
- `scope` (オプション): 要求スコープ（スペース区切り）
- `state` (推奨): CSRF防止のためのランダム文字列
- `code_challenge` (オプション): PKCE用チャレンジ
- `code_challenge_method` (オプション): `S256`

**成功レスポンス:**
認可画面表示またはリダイレクトURI + 認可コード

**エラーレスポンス:**
リダイレクトURI + エラーパラメータ

```
https://client.example.com/callback?error=invalid_request&error_description=Missing+client_id
```

#### POST /oauth2/token

OAuth2トークンエンドポイント

**リクエスト (Authorization Code Grant):**
```json
{
  "grant_type": "authorization_code",
  "code": "auth_code_here",
  "client_id": "client_id_here",
  "client_secret": "client_secret_here",
  "redirect_uri": "https://client.example.com/callback",
  "code_verifier": "code_verifier_for_pkce"
}
```

**リクエスト (Refresh Token Grant):**
```json
{
  "grant_type": "refresh_token",
  "refresh_token": "refresh_token_here",
  "client_id": "client_id_here",
  "client_secret": "client_secret_here"
}
```

**レスポンス (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_here",
  "scope": "read write"
}
```

**エラーレスポンス (400):**
```json
{
  "error": "invalid_grant",
  "error_description": "Authorization code is invalid or expired"
}
```

#### GET /oauth2/userinfo

ユーザー情報エンドポイント（要認証）

**リクエストヘッダー:**
```
Authorization: Bearer <access_token>
```

**レスポンス (200):**
```json
{
  "sub": "01234567-89ab-cdef-0123-456789abcdef",
  "email": "user@example.com",
  "name": "User Name",
  "email_verified": true
}
```

#### POST /oauth2/revoke

トークン無効化エンドポイント

**リクエスト:**
```json
{
  "token": "access_token_or_refresh_token",
  "client_id": "client_id_here",
  "client_secret": "client_secret_here"
}
```

**レスポンス (200):**
```json
{
  "message": "token revoked successfully"
}
```

### 管理者エンドポイント

#### GET /admin/clients

OAuth2クライアント一覧取得（管理者専用）

**レスポンス (200):**
```json
{
  "clients": [
    {
      "id": "01234567-89ab-cdef-0123-456789abcdef",
      "client_id": "my-app-client",
      "name": "My Application",
      "description": "My sample application",
      "redirect_uris": ["https://myapp.com/callback"],
      "scopes": ["read", "write"],
      "is_public": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

#### POST /admin/clients

OAuth2クライアント作成（管理者専用）

**リクエスト:**
```json
{
  "client_id": "my-new-app",
  "name": "My New Application",
  "description": "Description of my new app",
  "redirect_uris": ["https://mynewapp.com/callback"],
  "scopes": ["read", "write"],
  "is_public": false
}
```

**レスポンス (201):**
```json
{
  "id": "01234567-89ab-cdef-0123-456789abcdef",
  "client_id": "my-new-app",
  "client_secret": "generated_client_secret_here",
  "name": "My New Application",
  "description": "Description of my new app",
  "redirect_uris": ["https://mynewapp.com/callback"],
  "scopes": ["read", "write"],
  "is_public": false,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### GET /admin/clients/{id}

OAuth2クライアント詳細取得（管理者専用）

**レスポンス (200):**
```json
{
  "id": "01234567-89ab-cdef-0123-456789abcdef",
  "client_id": "my-app-client",
  "name": "My Application",
  "description": "My sample application",
  "redirect_uris": ["https://myapp.com/callback"],
  "scopes": ["read", "write"],
  "is_public": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### PUT /admin/clients/{id}

OAuth2クライアント更新（管理者専用）

**リクエスト:**
```json
{
  "name": "Updated Application Name",
  "description": "Updated description",
  "redirect_uris": ["https://myapp.com/callback", "https://myapp.com/callback2"],
  "scopes": ["read", "write", "admin"]
}
```

**レスポンス (200):**
```json
{
  "id": "01234567-89ab-cdef-0123-456789abcdef",
  "client_id": "my-app-client",
  "name": "Updated Application Name",
  "description": "Updated description",
  "redirect_uris": ["https://myapp.com/callback", "https://myapp.com/callback2"],
  "scopes": ["read", "write", "admin"],
  "is_public": false,
  "updated_at": "2024-01-01T12:00:00Z"
}
```

#### DELETE /admin/clients/{id}

OAuth2クライアント削除（管理者専用）

**レスポンス (204):**
レスポンスボディなし

### ヘルスチェック

#### GET /health

サーバーヘルスチェック

**レスポンス (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "database": "connected"
}
```

## エラーレスポンス

### 標準エラーフォーマット

```json
{
  "error": "error_code",
  "error_description": "Human readable error description",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### HTTPステータスコード

- `200 OK`: 成功
- `201 Created`: 作成成功
- `204 No Content`: 削除成功
- `400 Bad Request`: リクエストエラー
- `401 Unauthorized`: 認証エラー
- `403 Forbidden`: 認可エラー
- `404 Not Found`: リソースが見つからない
- `409 Conflict`: リソース競合
- `422 Unprocessable Entity`: バリデーションエラー
- `500 Internal Server Error`: サーバーエラー

### OAuth2エラーコード

- `invalid_request`: 必須パラメータの不足など
- `invalid_client`: クライアント認証エラー
- `invalid_grant`: 認可コードまたはリフレッシュトークンが無効
- `unauthorized_client`: クライアントが認可されていない
- `unsupported_grant_type`: サポートされていないグラントタイプ
- `invalid_scope`: 無効なスコープ

## 使用例

### 完全なOAuth2フロー

```bash
# 1. 認可エンドポイントへのリダイレクト
https://api.noraneko-id.com/oauth2/authorize?client_id=myapp&response_type=code&redirect_uri=https://myapp.com/callback&scope=read%20write&state=random123

# 2. ユーザーがログイン・認可後、認可コードが返される
https://myapp.com/callback?code=AUTH_CODE_HERE&state=random123

# 3. 認可コードをアクセストークンに交換
curl -X POST https://api.noraneko-id.com/oauth2/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "AUTH_CODE_HERE",
    "client_id": "myapp",
    "client_secret": "mysecret",
    "redirect_uri": "https://myapp.com/callback"
  }'

# 4. アクセストークンでユーザー情報取得
curl -H "Authorization: Bearer ACCESS_TOKEN_HERE" \
  https://api.noraneko-id.com/oauth2/userinfo
```

### PKCE付きフロー

```bash
# 1. code_verifierとcode_challengeを生成
CODE_VERIFIER=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-43)
CODE_CHALLENGE=$(echo -n $CODE_VERIFIER | openssl sha256 -binary | openssl base64 | tr -d "=+/" | cut -c1-43)

# 2. 認可エンドポイント（code_challengeを含む）
https://api.noraneko-id.com/oauth2/authorize?client_id=myapp&response_type=code&redirect_uri=https://myapp.com/callback&scope=read&state=random123&code_challenge=$CODE_CHALLENGE&code_challenge_method=S256

# 3. トークン取得（code_verifierを送信）
curl -X POST https://api.noraneko-id.com/oauth2/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "AUTH_CODE_HERE",  
    "client_id": "myapp",
    "redirect_uri": "https://myapp.com/callback",
    "code_verifier": "'$CODE_VERIFIER'"
  }'
```

## レート制限

現在のレート制限：

- **認証エンドポイント**: 10回/分/IP
- **OAuth2エンドポイント**: 60回/分/クライアント
- **管理者エンドポイント**: 100回/分/ユーザー
- **その他**: 1000回/時/IP

レート制限に達した場合、`429 Too Many Requests` が返されます。

## WebHook（今後実装予定）

ユーザーアクション（登録、ログイン等）やトークンイベントの通知機能を予定しています。