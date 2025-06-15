# Use Cases - ユースケース図

noraneko-id バックエンドの主要ユースケースをUML形式で説明します。

## システム全体ユースケース図

```mermaid
graph TB
    %% Actors
    User[👤 一般ユーザー]
    Developer[👨‍💻 クライアントアプリ開発者]
    Admin[⚙️ システム管理者]
    
    %% noraneko-id System
    subgraph "noraneko-id System"
        
        subgraph "認証・認可"
            UC1[パスワード登録]
            UC2[パスワードログイン]
            UC3[SNS連携ログイン]
            UC4[ログアウト]
            UC5[プロフィール取得]
            UC6[セッション管理]
        end
        
        subgraph "OAuth2フロー"
            UC7[認可リクエスト]
            UC8[同意画面表示]
            UC9[認可コード発行]
            UC10[アクセストークン発行]
            UC11[ユーザー情報取得]
            UC12[トークン取り消し]
            UC13[トークンリフレッシュ]
        end
        
        subgraph "クライアント管理"
            UC14[クライアント登録]
            UC15[クライアント設定変更]
            UC16[クライアント削除]
            UC17[クライアント一覧表示]
            UC18[クライアントシークレット再生成]
        end
        
        subgraph "SNS連携管理"
            UC19[プロバイダー一覧取得]
            UC20[Google認証連携]
            UC21[GitHub認証連携]
            UC22[LINE認証連携]
        end
    end
    
    %% User relationships
    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    
    %% Developer relationships
    Developer --> UC7
    Developer --> UC8
    Developer --> UC9
    Developer --> UC10
    Developer --> UC11
    Developer --> UC12
    Developer --> UC13
    Developer --> UC14
    Developer --> UC15
    Developer --> UC16
    Developer --> UC17
    Developer --> UC18
    
    %% Admin relationships
    Admin --> UC14
    Admin --> UC15
    Admin --> UC16
    Admin --> UC17
    Admin --> UC18
    Admin --> UC19
    
    %% System integrations
    UC3 --> UC20
    UC3 --> UC21
    UC3 --> UC22
    
    %% Dependencies
    UC2 -.-> UC6
    UC3 -.-> UC6
    UC7 -.-> UC8
    UC9 -.-> UC10
    UC10 -.-> UC13
    
    %% Styling
    classDef userClass fill:#e1f5fe
    classDef systemClass fill:#f3e5f5
    classDef adminClass fill:#fff3e0
    
    class User userClass
    class Admin adminClass
    class Developer systemClass
```

## 1. 認証・認可ユースケース

### 1.1 パスワード認証フロー

```mermaid
graph TD
    %% Actors
    User[👤 ユーザー]
    ClientApp[📱 クライアントアプリ]
    
    %% Authentication System
    subgraph "認証システム"
        %% Registration Flow
        Register[ユーザー登録<br/>Password]
        EmailCheck[メール重複チェック]
        UsernameCheck[ユーザー名重複チェック]
        HashPassword[パスワードハッシュ化]
        CreateProvider[認証プロバイダー作成]
        
        %% Login Flow
        Login[ログイン<br/>Password]
        ValidateAuth[認証情報検証]
        CreateSession[セッション作成]
        SetCookie[クッキー設定]
    end
    
    %% User interactions
    User --> Register
    ClientApp --> Register
    User --> Login
    ClientApp --> Login
    
    %% Registration process
    Register --> EmailCheck
    Register --> UsernameCheck
    Register --> HashPassword
    Register --> CreateProvider
    
    %% Login process
    Login --> ValidateAuth
    Login --> CreateSession
    Login --> SetCookie
    
    %% Styling
    classDef userClass fill:#e1f5fe
    classDef appClass fill:#f3e5f5
    classDef processClass fill:#fff3e0
    
    class User userClass
    class ClientApp appClass
    class Register,Login processClass
```

**マルチテナント対応:**
- **client_id必須**: 全ての認証でクライアントID指定
- **スコープ分離**: クライアント内でのみ重複チェック
- **SNS対応**: パスワードなしユーザーも対応

### 1.2 SNS連携認証フロー

```mermaid
graph TD
    %% Actors
    User[👤 ユーザー]
    ClientApp[📱 クライアントアプリ]
    SNS[🔗 SNSプロバイダー]
    
    %% OAuth2 Authentication System
    subgraph "OAuth2認証システム"
        StartSNS[SNS認証開始]
        SelectProvider[プロバイダー選択]
        RedirectSNS[SNS認証リダイレクト]
        HandleCallback[認証コールバック処理]
        GetUserInfo[ユーザー情報取得]
        UpsertUser[ユーザー作成/更新]
        LinkProvider[認証プロバイダー連携]
    end
    
    %% Flow
    User --> StartSNS
    ClientApp --> StartSNS
    
    StartSNS --> SelectProvider
    StartSNS --> RedirectSNS
    
    SNS --> HandleCallback
    HandleCallback --> GetUserInfo
    HandleCallback --> UpsertUser
    HandleCallback --> LinkProvider
    
    %% Styling
    classDef userClass fill:#e1f5fe
    classDef appClass fill:#f3e5f5
    classDef snsClass fill:#e8f5e8
    classDef processClass fill:#fff3e0
    
    class User userClass
    class ClientApp appClass
    class SNS snsClass
    class StartSNS,HandleCallback processClass
```

**OAuth2統合パラメータ:**
```
GET /oauth2/authorize?
  identity_provider=google&
  client_id=demo-client&
  redirect_uri=https://app.com/callback
```

**マルチテナント設計:**
- **完全分離**: 同じSNSアカウントでもクライアント別に独立ユーザー
- **一意性保証**: `provider_user_id + client_id` で重複回避
- **データ独立**: 各クライアントが独自のユーザーベース

## 2. OAuth2フローユースケース

### 2.1 Authorization Code Flow

```mermaid
graph TD
    %% Actors
    User[👤 リソースオーナー<br/>ユーザー]
    Client[📱 クライアント<br/>アプリ]
    AuthServer[🏛️ 認可サーバー<br/>noraneko-id]
    
    %% OAuth2 Flow
    subgraph "OAuth2 Authorization Code Flow"
        AuthRequest[認可リクエスト]
        CheckAuth[ユーザー認証確認]
        ShowConsent[同意画面表示]
        ConfirmConsent[同意確認]
        IssueAuthCode[認可コード発行]
        
        TokenRequest[トークンリクエスト]
        ClientAuth[クライアント認証]
        IssueAccessToken[アクセストークン発行]
        IssueRefreshToken[リフレッシュトークン発行]
    end
    
    %% Flow connections
    User --> AuthRequest
    Client --> AuthRequest
    AuthRequest --> CheckAuth
    CheckAuth --> ShowConsent
    ShowConsent --> ConfirmConsent
    ConfirmConsent --> IssueAuthCode
    
    Client --> TokenRequest
    TokenRequest --> ClientAuth
    TokenRequest --> IssueAccessToken
    TokenRequest --> IssueRefreshToken
    
    %% Styling
    classDef userClass fill:#e1f5fe
    classDef clientClass fill:#f3e5f5
    classDef serverClass fill:#e8f5e8
    classDef flowClass fill:#fff3e0
    
    class User userClass
    class Client clientClass
    class AuthServer serverClass
    class AuthRequest,TokenRequest flowClass
```

**PKCE・SNS連携サポート:**
- **PKCE**: `code_challenge`, `code_challenge_method=S256`
- **SNS連携**: `identity_provider=google`

**対応グラントタイプ:**
- `authorization_code` - 標準認可コードフロー
- `refresh_token` - トークンリフレッシュ

**クライアント認証:**
- **Confidential Client**: `client_secret`
- **Public Client**: PKCE使用

### 2.2 User Info Endpoint

```mermaid
graph LR
    Client[📱 クライアント] --> UserInfoRequest[ユーザー情報リクエスト]
    UserInfoRequest --> ValidateToken[トークン検証]
    ValidateToken --> CheckScope[スコープ確認]
    CheckScope --> GetUserInfo[ユーザー情報取得]
    GetUserInfo --> GenerateResponse[レスポンス生成]
    
    %% Styling
    classDef clientClass fill:#f3e5f5
    classDef processClass fill:#fff3e0
    
    class Client clientClass
    class UserInfoRequest,ValidateToken,CheckScope processClass
```

**Bearer Token認証:**
```
Authorization: Bearer <access_token>
```

**スコープ別情報提供:**
- **openid**: `sub` (user_id)
- **profile**: `username`, `display_name`
- **email**: `email`, `email_verified`

## 3. 管理機能ユースケース

### 3.1 クライアント管理

```mermaid
graph TB
    %% Actors
    Admin[⚙️ システム管理者]
    Developer[👨‍💻 クライアント開発者]
    
    %% Client Management System
    subgraph "クライアント管理システム"
        %% Core operations
        CreateClient[クライアント登録]
        ListClients[クライアント一覧表示]
        ShowClient[クライアント詳細表示]
        UpdateClient[クライアント更新]
        DeleteClient[クライアント削除]
        RegenerateSecret[シークレット再生成]
        
        %% Settings
        SetClientInfo[クライアント情報設定]
        SetRedirectURI[リダイレクトURI設定]
        SetScopes[スコープ設定]
        SetClientType[クライアントタイプ設定]
    end
    
    %% User interactions
    Admin --> CreateClient
    Developer --> CreateClient
    Admin --> ListClients
    Developer --> ListClients
    Admin --> ShowClient
    Developer --> ShowClient
    Admin --> UpdateClient
    Developer --> UpdateClient
    Admin --> DeleteClient
    Admin --> RegenerateSecret
    Developer --> RegenerateSecret
    
    %% Includes relationships
    CreateClient -.-> SetClientInfo
    CreateClient -.-> SetRedirectURI
    CreateClient -.-> SetScopes
    CreateClient -.-> SetClientType
    
    %% Styling
    classDef adminClass fill:#fff3e0
    classDef devClass fill:#e3f2fd
    classDef systemClass fill:#f3e5f5
    
    class Admin adminClass
    class Developer devClass
    class CreateClient,UpdateClient systemClass
```

**クライアント情報設定内容:**
- **基本情報**: 名前、説明、ロゴURL、ウェブサイト
- **規約・サポート**: プライバシーポリシー、利用規約、サポートメール
- **セキュリティ**: 同意画面必須/スキップ、信頼済みクライアント設定

**クライアントタイプ:**
- **confidential**: client_secret使用、サーバーサイドアプリ向け
- **public**: PKCE使用、SPAアプリ・モバイルアプリ向け

### 3.2 ユーザー管理（管理機能）

```mermaid
graph LR
    Admin[⚙️ システム管理者] --> UserMgmt[ユーザー管理システム]
    
    subgraph UserMgmt["ユーザー管理機能"]
        ListUsers[ユーザー一覧表示]
        SearchUsers[ユーザー検索]
        ShowUser[ユーザー詳細表示]
        ChangeStatus[ユーザー状態変更]
        ViewProviders[認証プロバイダー確認]
        ManageSessions[セッション管理]
        ManageTokens[アクセストークン管理]
    end
    
    %% Core flows
    UserMgmt --> ListUsers
    UserMgmt --> SearchUsers
    UserMgmt --> ShowUser
    UserMgmt --> ChangeStatus
    
    %% Detail management
    ShowUser --> ViewProviders
    ShowUser --> ManageSessions
    ShowUser --> ManageTokens
    
    %% Search extends list
    ListUsers -.-> SearchUsers
    
    classDef adminClass fill:#fff3e0
    classDef systemClass fill:#f3e5f5
    
    class Admin adminClass
    class UserMgmt,ShowUser systemClass
```

**検索・フィルタ条件:**
- **クライアント別**: テナント分離によるクライアント単位表示
- **識別情報**: メールアドレス、ユーザー名での検索
- **認証方式**: パスワード、Google、GitHub、LINE等のプロバイダー別
- **時期条件**: 登録日時範囲、最終ログイン日時での絞り込み

**ユーザー状態管理:**
- **アカウント制御**: 有効化/無効化、アカウントロック
- **認証状態**: メール認証状態変更、パスワードリセット強制
- **セッション制御**: アクティブセッション全削除、強制ログアウト

## 4. エラーハンドリングユースケース

### 4.1 認証エラー処理

```mermaid
graph TD
    %% Error Types
    subgraph "認証エラー種別"
        AuthFailure[🔐 認証失敗]
        InvalidClient[❌ 無効なクライアント]
        InvalidRedirectURI[🔗 無効なリダイレクトURI]
        InvalidScope[📋 無効なスコープ]
        AccessDenied[🚫 アクセス拒否]
        ServerError[⚠️ サーバーエラー]
    end
    
    %% Error Handling Processes
    subgraph "エラー処理"
        LogError[📝 エラーログ記録]
        GenerateErrorResponse[📄 エラーレスポンス生成]
        RedirectError[↩️ リダイレクトエラー処理]
    end
    
    %% Error flows
    AuthFailure --> LogError
    InvalidClient --> LogError
    InvalidRedirectURI --> LogError
    InvalidScope --> LogError
    AccessDenied --> LogError
    ServerError --> LogError
    
    %% Response generation
    AuthFailure --> GenerateErrorResponse
    InvalidClient --> GenerateErrorResponse
    ServerError --> GenerateErrorResponse
    
    %% Redirect handling
    InvalidRedirectURI --> RedirectError
    InvalidScope --> RedirectError
    AccessDenied --> RedirectError
    
    %% Styling
    classDef errorClass fill:#ffebee
    classDef processClass fill:#e8f5e8
    
    class AuthFailure,InvalidClient,InvalidRedirectURI,InvalidScope,AccessDenied,ServerError errorClass
    class LogError,GenerateErrorResponse,RedirectError processClass
```

**エラーログ記録レベル:**
- **WARN**: 認証失敗（ユーザー起因）
- **ERROR**: システムエラー、無効クライアント
- **INFO**: 正常なアクセス拒否（同意画面で拒否）

**ログ記録内容:**
- エラーコード・メッセージ
- ユーザーID（認証済みの場合）
- クライアントID・IPアドレス・User-Agent
- リクエストパラメータ（機密情報除く）

**OAuth2エラーレスポンス形式:**
```json
{
  "error": "invalid_request",
  "error_description": "日本語エラー説明",
  "error_uri": "https://docs.noraneko-id.com/errors/invalid_request"
}
```

## 5. セキュリティユースケース

### 5.1 セキュリティ監視

```mermaid
graph TB
    %% Actors
    Monitor[🔍 セキュリティ監視システム]
    Admin[⚙️ システム管理者]
    
    %% Security Features
    subgraph "セキュリティ監視"
        DetectLogin[🕵️ 不正ログイン検知]
        RateLimit[⏱️ レート制限適用]
        MonitorIP[🌐 IPアドレス監視]
        DetectAnomalies[📊 異常パターン検知]
    end
    
    subgraph "アラート・対応"
        SecurityAlert[🚨 セキュリティアラート]
        LockAccount[🔒 アカウントロック]
        BlockIP[🚫 IPアドレスブロック]
        EmergencyStop[🛑 緊急アクセス停止]
    end
    
    %% Monitoring flows
    Monitor --> DetectLogin
    Monitor --> RateLimit
    Monitor --> MonitorIP
    Monitor --> DetectAnomalies
    
    %% Alert generation
    DetectLogin --> SecurityAlert
    DetectAnomalies --> SecurityAlert
    
    %% Response actions
    SecurityAlert --> LockAccount
    SecurityAlert --> BlockIP
    SecurityAlert --> EmergencyStop
    
    %% Admin controls
    Admin --> LockAccount
    Admin --> BlockIP
    Admin --> EmergencyStop
    
    %% Styling
    classDef monitorClass fill:#e3f2fd
    classDef adminClass fill:#fff3e0
    classDef alertClass fill:#ffebee
    classDef actionClass fill:#f3e5f5
    
    class Monitor monitorClass
    class Admin adminClass
    class SecurityAlert alertClass
    class LockAccount,BlockIP,EmergencyStop actionClass
```

**不正ログイン検知パターン:**
- **ブルートフォース**: 短時間での大量ログイン試行
- **分散攻撃**: 異なるIPからの同時ログイン
- **地理的異常**: 通常と異なる地理的位置からのアクセス
- **ボット検知**: 異常なUser-Agent、自動化ツール検知

**レート制限設定:**
- **認証エンドポイント**: `/auth/login` 5回/分、`/auth/register` 3回/分
- **OAuth2エンドポイント**: `/oauth2/token` 10回/分、`/oauth2/authorize` 20回/分
- **管理エンドポイント**: `/admin/*` 30回/分
- **制限単位**: IP別・ユーザー別・クライアント別の階層制限