# Sequence Diagrams - シーケンス図

noraneko-id バックエンドの主要処理フローをシーケンス図で詳細に説明します。

## 1. OAuth2 Authorization Code Flow

### 1.1 基本的なOAuth2フロー

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client App
    participant N as noraneko-id
    participant D as Database
    
    Note over U,D: OAuth2 Authorization Code Flow
    
    U->>C: アプリ利用開始
    C->>N: GET /oauth2/authorize?response_type=code&client_id=xxx&redirect_uri=xxx&scope=openid profile
    
    Note over N: クライアント検証
    N->>D: クライアント情報取得
    D-->>N: クライアント詳細
    
    alt ユーザー未認証
        N-->>C: 302 Redirect to /login
        C-->>U: ログイン画面表示
        U->>C: ログイン情報入力
        C->>N: POST /auth/login
        N->>D: ユーザー認証
        D-->>N: 認証成功
        N-->>C: セッション設定
    end
    
    Note over N: 同意画面表示判定
    alt 同意が必要
        N-->>U: 同意画面表示
        U->>N: POST /oauth2/authorize (同意)
    end
    
    Note over N: 認可コード生成
    N->>D: 認可コード保存
    N-->>C: 302 Redirect with auth code
    
    Note over C: トークン交換
    C->>N: POST /oauth2/token {grant_type=authorization_code, code=xxx}
    N->>D: 認可コード検証
    D-->>N: 認可コード詳細
    N->>N: アクセストークン生成
    N->>D: トークン保存
    N-->>C: アクセストークン + リフレッシュトークン
    
    Note over C: ユーザー情報取得
    C->>N: GET /oauth2/userinfo (Bearer Token)
    N->>D: トークン検証
    D-->>N: ユーザー情報
    N-->>C: ユーザー情報レスポンス
```

### 1.2 PKCE対応OAuth2フロー

```mermaid
sequenceDiagram
    participant C as Client App
    participant N as noraneko-id
    participant D as Database
    
    Note over C,D: PKCE (Proof Key for Code Exchange) Flow
    
    Note over C: PKCE準備
    C->>C: code_verifier = random_string(128)
    C->>C: code_challenge = BASE64URL(SHA256(code_verifier))
    
    C->>N: GET /oauth2/authorize?<br/>code_challenge=xxx&<br/>code_challenge_method=S256
    
    N->>D: 認可コード + code_challenge保存
    N-->>C: 認可コード返却
    
    Note over C: トークン交換（PKCE）
    C->>N: POST /oauth2/token {<br/>grant_type=authorization_code,<br/>code=xxx,<br/>code_verifier=original_string<br/>}
    
    N->>D: 認可コード取得
    D-->>N: code + code_challenge
    
    N->>N: SHA256(code_verifier) == code_challenge?
    
    alt PKCE検証成功
        N->>N: アクセストークン生成
        N->>D: トークン保存
        N-->>C: アクセストークン発行
    else PKCE検証失敗
        N-->>C: 400 Bad Request (invalid_grant)
    end
```

## 2. SNS連携認証フロー

### 2.1 Google OAuth2連携

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client App
    participant N as noraneko-id
    participant G as Google OAuth2
    participant D as Database
    
    Note over U,D: Google OAuth2 Integration Flow
    
    U->>C: "Googleでログイン"クリック
    C->>N: GET /oauth2/authorize?<br/>identity_provider=google&<br/>client_id=demo-client&<br/>redirect_uri=xxx
    
    Note over N: SNS連携フロー開始
    N->>N: プロバイダー検証 (google)
    N->>N: state生成 (CSRF対策)
    
    N-->>C: 302 Redirect to Google
    Note over N,G: Google認証リダイレクト
    C-->>G: Google OAuth2認証画面
    
    U->>G: Google認証情報入力
    G-->>N: GET /oauth2/callback/google?code=xxx&state=xxx
    
    Note over N: Google認証処理
    N->>N: state検証
    N->>G: POST /oauth2/token (code交換)
    G-->>N: Google access_token
    
    N->>G: GET /oauth2/v2/userinfo (Bearer Token)
    G-->>N: Googleユーザー情報 {sub, email, name, picture}
    
    Note over N: ユーザー作成/更新
    N->>D: プロバイダーユーザー検索<br/>(client_id + provider_type=google + provider_user_id)
    
    alt 既存ユーザー
        D-->>N: 既存ユーザー情報
        N->>D: 最終ログイン時刻更新
    else 新規ユーザー
        N->>D: ユーザー作成 (client_idスコープ内)
        N->>D: UserAuthProvider作成<br/>{provider_type: google, provider_user_id: sub}
    end
    
    Note over N: OAuth2フロー続行
    N->>D: 認可コード生成・保存
    N-->>C: 302 Redirect with auth_code
    
    C->>N: POST /oauth2/token (auth_codeをアクセストークンに交換)
    N-->>C: アクセストークン + リフレッシュトークン
```

### 2.2 SNS連携での新規ユーザー作成

```mermaid
sequenceDiagram
    participant N as noraneko-id
    participant D as Database
    participant G as Google
    
    Note over N,G: SNS新規ユーザー作成フロー
    
    N->>G: ユーザー情報取得
    G-->>N: {<br/>  "sub": "google_12345",<br/>  "email": "user@gmail.com",<br/>  "name": "John Doe",<br/>  "picture": "https://..."<br/>}
    
    Note over N: マルチテナント新規ユーザー作成
    
    N->>D: BEGIN TRANSACTION
    
    Note over N: User作成
    N->>D: INSERT INTO users {<br/>  client_id: demo-client-uuid,<br/>  email: "user@gmail.com",<br/>  username: "google_user_12345", // 自動生成<br/>  display_name: "John Doe",<br/>  profile_image_url: picture,<br/>  password_hash: NULL, // SNSユーザーはパスワードなし<br/>  email_verified: true<br/>}
    D-->>N: user_id: new-user-uuid
    
    Note over N: UserAuthProvider作成
    N->>D: INSERT INTO user_auth_providers {<br/>  user_id: new-user-uuid,<br/>  provider_type: "google",<br/>  provider_user_id: "google_12345",<br/>  provider_email: "user@gmail.com",<br/>  provider_data: {name, picture, locale},<br/>  is_verified: true<br/>}
    
    N->>D: COMMIT TRANSACTION
    
    Note over N: レスポンス
    N-->>N: 新規ユーザー作成完了<br/>認可フロー継続
```

## 3. マルチテナント認証フロー

### 3.1 クライアント別ユーザー分離

```mermaid
sequenceDiagram
    participant C1 as Client A
    participant C2 as Client B
    participant N as noraneko-id
    participant D as Database
    
    Note over C1,D: 同じメールアドレスでの別クライアント登録
    
    Note over C1: Client A でのユーザー登録
    C1->>N: POST /auth/register {<br/>  email: "user@example.com",<br/>  client_id: "client-a"<br/>}
    
    N->>D: クライアント検証
    D-->>N: Client A情報
    
    N->>D: メール重複チェック (Client Aスコープ内)
    D-->>N: 重複なし
    
    N->>D: ユーザー作成
    D-->>N: User A作成完了 {<br/>  id: user-a-uuid,<br/>  client_id: client-a-uuid,<br/>  email: "user@example.com"<br/>}
    
    Note over C2: Client B でのユーザー登録 (同じメール)
    C2->>N: POST /auth/register {<br/>  email: "user@example.com",<br/>  client_id: "client-b"<br/>}
    
    N->>D: クライアント検証
    D-->>N: Client B情報
    
    N->>D: メール重複チェック (Client Bスコープ内)
    D-->>N: 重複なし (別クライアントなので)
    
    N->>D: ユーザー作成
    D-->>N: User B作成完了 {<br/>  id: user-b-uuid,<br/>  client_id: client-b-uuid,<br/>  email: "user@example.com"<br/>}
    
    Note over N,D: 結果: 同じメールアドレスで2つの独立したアカウント
```

### 3.2 マルチテナント認証検証

```mermaid
sequenceDiagram
    participant C as Client App
    participant N as noraneko-id
    participant D as Database
    
    Note over C,D: マルチテナント認証検証フロー
    
    C->>N: POST /auth/login {<br/>  email: "user@example.com",<br/>  password: "secret",<br/>  client_id: "client-a"<br/>}
    
    Note over N: Step 1: クライアント検証
    N->>D: SELECT * FROM o_auth_clients<br/>WHERE client_id = 'client-a' AND is_active = true
    
    alt クライアント無効
        D-->>N: クライアント見つからない
        N-->>C: 400 Bad Request (invalid_client)
    else クライアント有効
        D-->>N: Client A情報
        
        Note over N: Step 2: マルチテナントユーザー検索
        N->>D: SELECT * FROM users<br/>WHERE client_id = client-a-uuid<br/>AND email = 'user@example.com'<br/>AND is_active = true
        
        alt ユーザー見つからない
            D-->>N: ユーザー不在
            N-->>C: 401 Unauthorized (invalid_credentials)
        else ユーザー存在
            D-->>N: User A情報
            
            Note over N: Step 3: パスワード検証
            N->>N: bcrypt.Compare(password, user.password_hash)
            
            alt パスワード不一致
                N-->>C: 401 Unauthorized (invalid_credentials)
            else パスワード一致
                Note over N: Step 4: セッション作成
                N->>D: セッション作成・保存
                N-->>C: 200 OK + セッションクッキー
            end
        end
    end
```

## 4. トークン管理フロー

### 4.1 リフレッシュトークンフロー

```mermaid
sequenceDiagram
    participant C as Client App
    participant N as noraneko-id
    participant D as Database
    
    Note over C,D: Refresh Token Flow
    
    Note over C: アクセストークン期限切れ
    C->>N: API Request with expired token
    N-->>C: 401 Unauthorized (token_expired)
    
    Note over C: リフレッシュトークン使用
    C->>N: POST /oauth2/token {<br/>  grant_type: "refresh_token",<br/>  refresh_token: "xxx",<br/>  client_id: "demo-client"<br/>}
    
    Note over N: リフレッシュトークン検証
    N->>D: リフレッシュトークン検索
    D-->>N: トークン情報
    
    alt トークン無効
        N-->>C: 401 Unauthorized (invalid_grant)
    else トークン有効
        Note over N: 新しいトークンペア生成
        N->>D: 古いトークンを無効化
        N->>N: 新しいアクセストークン生成
        N->>N: 新しいリフレッシュトークン生成
        N->>D: 新しいトークンペア保存
        
        N-->>C: {<br/>  "access_token": "new_access_token",<br/>  "refresh_token": "new_refresh_token",<br/>  "token_type": "Bearer",<br/>  "expires_in": 3600<br/>}
    end
```

### 4.2 トークン取り消しフロー

```mermaid
sequenceDiagram
    participant C as Client App
    participant N as noraneko-id
    participant D as Database
    
    Note over C,D: Token Revocation Flow
    
    C->>N: POST /oauth2/revoke {<br/>  token: "access_token_or_refresh_token",<br/>  token_type_hint: "access_token"<br/>}
    
    Note over N: トークン識別
    alt アクセストークン
        N->>D: アクセストークン検索
        D-->>N: トークン情報
        N->>D: アクセストークンを無効化
        
        Note over N: 関連リフレッシュトークンも無効化
        N->>D: 関連リフレッシュトークン無効化
        
    else リフレッシュトークン
        N->>D: リフレッシュトークン検索
        D-->>N: トークン情報
        N->>D: リフレッシュトークンを無効化
        
        Note over N: 関連アクセストークンも無効化
        N->>D: 関連アクセストークン無効化
    end
    
    N-->>C: 200 OK (取り消し完了)
```

## 5. エラーハンドリングフロー

### 5.1 OAuth2エラーレスポンス

```mermaid
sequenceDiagram
    participant C as Client App
    participant N as noraneko-id
    participant D as Database
    
    Note over C,D: OAuth2 Error Handling Flow
    
    C->>N: GET /oauth2/authorize?<br/>response_type=code&<br/>client_id=invalid&<br/>redirect_uri=https://malicious.com
    
    Note over N: Step 1: クライアント検証
    N->>D: クライアント情報取得
    D-->>N: クライアント見つからない
    
    Note over N: invalid_client エラー
    N->>N: ログ記録: invalid_client_id
    N-->>C: 400 Bad Request {<br/>  "error": "invalid_client",<br/>  "error_description": "無効なクライアントIDです"<br/>}
    
    Note over C,D: リダイレクトURI検証エラー
    C->>N: GET /oauth2/authorize?<br/>response_type=code&<br/>client_id=valid&<br/>redirect_uri=https://malicious.com
    
    N->>D: クライアント情報取得
    D-->>N: 有効なクライアント情報
    
    N->>N: リダイレクトURI検証
    Note over N: 登録済みURIと不一致
    
    N->>N: ログ記録: invalid_redirect_uri
    N-->>C: 302 Redirect to registered_uri?<br/>error=invalid_request&<br/>error_description=無効なredirect_uriです
```

### 5.2 レート制限エラー

```mermaid
sequenceDiagram
    participant C as Client App
    participant N as noraneko-id
    participant R as Rate Limiter
    participant D as Database
    
    Note over C,D: Rate Limiting Flow
    
    loop 5回 (制限値)
        C->>N: POST /auth/login (失敗)
        N->>R: レート制限チェック (IP/ユーザー別)
        R-->>N: 制限内
        N->>D: 認証試行
        D-->>N: 認証失敗
        N-->>C: 401 Unauthorized
    end
    
    Note over C: 6回目の試行
    C->>N: POST /auth/login
    N->>R: レート制限チェック
    R-->>N: 制限超過
    
    N->>N: ログ記録: rate_limit_exceeded
    N-->>C: 429 Too Many Requests {<br/>  "error": "rate_limit_exceeded",<br/>  "message": "試行回数が上限を超えました",<br/>  "retry_after": 300<br/>}
    
    Note over C: 制限解除後
    C->>N: POST /auth/login (300秒後)
    N->>R: レート制限チェック
    R-->>N: 制限リセット済み
    N->>D: 認証試行継続
```

## 6. セッション管理フロー

### 6.1 セッション作成と検証

```mermaid
sequenceDiagram
    participant C as Client App
    participant N as noraneko-id
    participant D as Database
    
    Note over C,D: Session Management Flow
    
    Note over C: ログイン成功後
    C->>N: ログイン成功
    
    Note over N: セッション作成
    N->>N: session_token = UUID.new()
    N->>N: session_hash = SHA256(session_token)
    
    N->>D: セッション保存 {<br/>  user_id: user-uuid,<br/>  session_token_hash: session_hash,<br/>  expires_at: now + 24h,<br/>  user_agent: request.user_agent,<br/>  ip_address: request.ip<br/>}
    
    N-->>C: Set-Cookie: session_token=xxx;<br/>HttpOnly; Secure; SameSite=Lax
    
    Note over C,D: 後続のリクエスト
    C->>N: GET /auth/profile (Cookie付き)
    
    Note over N: セッション検証
    N->>N: session_hash = SHA256(cookie.session_token)
    N->>D: セッション検索
    D-->>N: セッション情報
    
    alt セッション有効
        N->>D: ユーザー情報取得
        D-->>N: ユーザー詳細
        N-->>C: ユーザープロフィール
    else セッション無効/期限切れ
        N-->>C: 401 Unauthorized (session_expired)
    end
```

### 6.2 セッション無効化（ログアウト）

```mermaid
sequenceDiagram
    participant C as Client App
    participant N as noraneko-id
    participant D as Database
    
    Note over C,D: Logout Flow
    
    C->>N: POST /auth/logout
    
    Note over N: セッション無効化
    N->>N: session_hash = SHA256(cookie.session_token)
    N->>D: セッション無効化 {<br/>  UPDATE user_sessions<br/>  SET revoked_at = NOW()<br/>  WHERE session_token_hash = session_hash<br/>}
    
    N-->>C: Set-Cookie: session_token=;<br/>Max-Age=0; HttpOnly; Secure
    
    N-->>C: 200 OK {<br/>  "message": "ログアウトしました"<br/>}
    
    Note over C: 後続リクエスト
    C->>N: GET /auth/profile (無効なセッション)
    N->>D: セッション検索
    D-->>N: セッション無効 (revoked_at != NULL)
    N-->>C: 401 Unauthorized (session_revoked)
```