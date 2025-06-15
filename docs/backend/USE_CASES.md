# Use Cases - ユースケース図

noraneko-id バックエンドの主要ユースケースをUML形式で説明します。

## システム全体ユースケース図

```plantuml
@startuml
!define RECTANGLE class

actor "一般ユーザー" as User
actor "クライアントアプリ開発者" as Developer
actor "システム管理者" as Admin

rectangle "noraneko-id System" {
  
  package "認証・認可" {
    usecase "パスワード登録" as UC1
    usecase "パスワードログイン" as UC2
    usecase "SNS連携ログイン" as UC3
    usecase "ログアウト" as UC4
    usecase "プロフィール取得" as UC5
    usecase "セッション管理" as UC6
  }
  
  package "OAuth2フロー" {
    usecase "認可リクエスト" as UC7
    usecase "同意画面表示" as UC8
    usecase "認可コード発行" as UC9
    usecase "アクセストークン発行" as UC10
    usecase "ユーザー情報取得" as UC11
    usecase "トークン取り消し" as UC12
    usecase "トークンリフレッシュ" as UC13
  }
  
  package "クライアント管理" {
    usecase "クライアント登録" as UC14
    usecase "クライアント設定変更" as UC15
    usecase "クライアント削除" as UC16
    usecase "クライアント一覧表示" as UC17
    usecase "クライアントシークレット再生成" as UC18
  }
  
  package "SNS連携管理" {
    usecase "プロバイダー一覧取得" as UC19
    usecase "Google認証連携" as UC20
    usecase "GitHub認証連携" as UC21
    usecase "LINE認証連携" as UC22
  }
}

' ユーザーの関連
User --> UC1
User --> UC2
User --> UC3
User --> UC4
User --> UC5

' 開発者の関連
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

' 管理者の関連
Admin --> UC14
Admin --> UC15
Admin --> UC16
Admin --> UC17
Admin --> UC18
Admin --> UC19

' システム連携
UC3 --> UC20
UC3 --> UC21
UC3 --> UC22

' 依存関係
UC2 ..> UC6 : includes
UC3 ..> UC6 : includes
UC7 ..> UC8 : includes
UC9 ..> UC10 : extends
UC10 ..> UC13 : extends

@enduml
```

## 1. 認証・認可ユースケース

### 1.1 パスワード認証フロー

```plantuml
@startuml
actor "ユーザー" as User
actor "クライアントアプリ" as ClientApp

rectangle "認証システム" {
  usecase "ユーザー登録\n(Password)" as Register
  usecase "メール重複チェック" as EmailCheck
  usecase "ユーザー名重複チェック" as UsernameCheck
  usecase "パスワードハッシュ化" as HashPassword
  usecase "認証プロバイダー作成" as CreateProvider
  
  usecase "ログイン\n(Password)" as Login
  usecase "認証情報検証" as ValidateAuth
  usecase "セッション作成" as CreateSession
  usecase "クッキー設定" as SetCookie
}

User --> Register
ClientApp --> Register

Register ..> EmailCheck : includes
Register ..> UsernameCheck : includes
Register ..> HashPassword : includes
Register ..> CreateProvider : includes

User --> Login
ClientApp --> Login

Login ..> ValidateAuth : includes
Login ..> CreateSession : includes
Login ..> SetCookie : includes

note right of Register
  マルチテナント:
  - client_id必須
  - クライアントスコープ内で重複チェック
end note

note right of Login
  マルチテナント検証:
  - ユーザーがクライアントに属するかチェック
  - SNSユーザーはパスワードなし
end note

@enduml
```

### 1.2 SNS連携認証フロー

```plantuml
@startuml
actor "ユーザー" as User
actor "クライアントアプリ" as ClientApp
actor "SNSプロバイダー" as SNS

rectangle "OAuth2認証システム" {
  usecase "SNS認証開始" as StartSNS
  usecase "プロバイダー選択" as SelectProvider
  usecase "SNS認証リダイレクト" as RedirectSNS
  usecase "認証コールバック処理" as HandleCallback
  usecase "ユーザー情報取得" as GetUserInfo
  usecase "ユーザー作成/更新" as UpsertUser
  usecase "認証プロバイダー連携" as LinkProvider
}

User --> StartSNS
ClientApp --> StartSNS

StartSNS ..> SelectProvider : includes
StartSNS ..> RedirectSNS : includes

SNS --> HandleCallback
HandleCallback ..> GetUserInfo : includes
HandleCallback ..> UpsertUser : includes
HandleCallback ..> LinkProvider : includes

note right of StartSNS
  OAuth2パラメータ:
  /oauth2/authorize?
  identity_provider=google&
  client_id=xxx&
  redirect_uri=xxx
end note

note right of UpsertUser
  マルチテナント:
  - 同じSNSアカウントでも
    クライアント別に独立ユーザー
  - provider_user_id + client_id で一意性
end note

@enduml
```

## 2. OAuth2フローユースケース

### 2.1 Authorization Code Flow

```plantuml
@startuml
actor "リソースオーナー\n(ユーザー)" as User
actor "クライアント\n(アプリ)" as Client
actor "認可サーバー\n(noraneko-id)" as AuthServer

rectangle "OAuth2 Authorization Code Flow" {
  usecase "認可リクエスト" as AuthRequest
  usecase "ユーザー認証確認" as CheckAuth
  usecase "同意画面表示" as ShowConsent
  usecase "同意確認" as ConfirmConsent
  usecase "認可コード発行" as IssueAuthCode
  usecase "トークンリクエスト" as TokenRequest
  usecase "クライアント認証" as ClientAuth
  usecase "アクセストークン発行" as IssueAccessToken
  usecase "リフレッシュトークン発行" as IssueRefreshToken
}

User --> AuthRequest
Client --> AuthRequest

AuthRequest ..> CheckAuth : includes
CheckAuth ..> ShowConsent : extends
ShowConsent ..> ConfirmConsent : includes
ConfirmConsent ..> IssueAuthCode : includes

Client --> TokenRequest
TokenRequest ..> ClientAuth : includes
TokenRequest ..> IssueAccessToken : includes
TokenRequest ..> IssueRefreshToken : includes

note right of AuthRequest
  PKCEサポート:
  - code_challenge
  - code_challenge_method=S256
  
  SNS連携サポート:
  - identity_provider=google
end note

note right of TokenRequest
  グラントタイプ:
  - authorization_code
  - refresh_token
  
  クライアント認証:
  - client_secret (confidential)
  - PKCE (public)
end note

@enduml
```

### 2.2 User Info Endpoint

```plantuml
@startuml
actor "クライアント" as Client

rectangle "UserInfo Endpoint" {
  usecase "ユーザー情報リクエスト" as UserInfoRequest
  usecase "アクセストークン検証" as ValidateToken
  usecase "スコープ確認" as CheckScope
  usecase "ユーザー情報取得" as GetUserInfo
  usecase "レスポンス生成" as GenerateResponse
}

Client --> UserInfoRequest

UserInfoRequest ..> ValidateToken : includes
ValidateToken ..> CheckScope : includes
CheckScope ..> GetUserInfo : includes
GetUserInfo ..> GenerateResponse : includes

note right of UserInfoRequest
  Bearer Token認証:
  Authorization: Bearer <access_token>
end note

note right of CheckScope
  スコープ別情報提供:
  - openid: sub (user_id)
  - profile: username, display_name
  - email: email, email_verified
end note

@enduml
```

## 3. 管理機能ユースケース

### 3.1 クライアント管理

```plantuml
@startuml
actor "システム管理者" as Admin
actor "クライアント開発者" as Developer

rectangle "クライアント管理システム" {
  usecase "クライアント登録" as CreateClient
  usecase "クライアント情報設定" as SetClientInfo
  usecase "リダイレクトURI設定" as SetRedirectURI
  usecase "スコープ設定" as SetScopes
  usecase "クライアントタイプ設定" as SetClientType
  
  usecase "クライアント一覧表示" as ListClients
  usecase "クライアント詳細表示" as ShowClient
  usecase "クライアント更新" as UpdateClient
  usecase "クライアント削除" as DeleteClient
  usecase "シークレット再生成" as RegenerateSecret
}

Admin --> CreateClient
Developer --> CreateClient

CreateClient ..> SetClientInfo : includes
CreateClient ..> SetRedirectURI : includes
CreateClient ..> SetScopes : includes
CreateClient ..> SetClientType : includes

Admin --> ListClients
Developer --> ListClients

Admin --> ShowClient
Developer --> ShowClient

Admin --> UpdateClient
Developer --> UpdateClient

Admin --> DeleteClient

Admin --> RegenerateSecret
Developer --> RegenerateSecret

note right of CreateClient
  クライアント情報:
  - 名前、説明
  - ロゴURL、ウェブサイト
  - プライバシーポリシー
  - 利用規約
  - サポートメール
end note

note right of SetClientType
  クライアントタイプ:
  - confidential: client_secret有り
  - public: PKCE使用
  
  セキュリティ設定:
  - 同意画面必須/スキップ
  - 信頼済みクライアント
end note

@enduml
```

### 3.2 ユーザー管理（管理機能）

```plantuml
@startuml
actor "システム管理者" as Admin

rectangle "ユーザー管理システム" {
  usecase "ユーザー一覧表示" as ListUsers
  usecase "ユーザー検索" as SearchUsers
  usecase "ユーザー詳細表示" as ShowUser
  usecase "ユーザー状態変更" as ChangeUserStatus
  usecase "認証プロバイダー確認" as ViewProviders
  usecase "セッション管理" as ManageSessions
  usecase "アクセストークン管理" as ManageTokens
}

Admin --> ListUsers
Admin --> SearchUsers
Admin --> ShowUser
Admin --> ChangeUserStatus
Admin --> ViewProviders
Admin --> ManageSessions
Admin --> ManageTokens

ListUsers ..> SearchUsers : extends
ShowUser ..> ViewProviders : includes
ShowUser ..> ManageSessions : includes
ShowUser ..> ManageTokens : includes

note right of SearchUsers
  検索条件:
  - クライアント別
  - メールアドレス
  - ユーザー名
  - 認証プロバイダー
  - 登録日時範囲
  - 最終ログイン日時
end note

note right of ChangeUserStatus
  ユーザー操作:
  - アカウント有効化/無効化
  - メール認証状態変更
  - パスワードリセット強制
  - セッション全削除
end note

@enduml
```

## 4. エラーハンドリングユースケース

### 4.1 認証エラー処理

```plantuml
@startuml
rectangle "エラーハンドリング" {
  usecase "認証失敗" as AuthFailure
  usecase "無効なクライアント" as InvalidClient
  usecase "無効なリダイレクトURI" as InvalidRedirectURI
  usecase "無効なスコープ" as InvalidScope
  usecase "アクセス拒否" as AccessDenied
  usecase "サーバーエラー" as ServerError
  
  usecase "エラーログ記録" as LogError
  usecase "エラーレスポンス生成" as GenerateErrorResponse
  usecase "リダイレクトエラー処理" as RedirectError
}

AuthFailure ..> LogError : includes
InvalidClient ..> LogError : includes
InvalidRedirectURI ..> LogError : includes
InvalidScope ..> LogError : includes
AccessDenied ..> LogError : includes
ServerError ..> LogError : includes

AuthFailure ..> GenerateErrorResponse : includes
InvalidClient ..> GenerateErrorResponse : includes
ServerError ..> GenerateErrorResponse : includes

InvalidRedirectURI ..> RedirectError : includes
InvalidScope ..> RedirectError : includes
AccessDenied ..> RedirectError : includes

note right of LogError
  ログレベル:
  - AuthFailure: WARN
  - InvalidClient: ERROR
  - ServerError: ERROR
  
  ログ内容:
  - エラーコード
  - ユーザーID（あれば）
  - クライアントID
  - IPアドレス
  - User-Agent
end note

note right of GenerateErrorResponse
  OAuth2エラーレスポンス:
  {
    "error": "invalid_request",
    "error_description": "説明文",
    "error_uri": "詳細URL"
  }
end note

@enduml
```

## 5. セキュリティユースケース

### 5.1 セキュリティ監視

```plantuml
@startuml
actor "セキュリティ監視システム" as Monitor
actor "システム管理者" as Admin

rectangle "セキュリティ機能" {
  usecase "不正ログイン検知" as DetectSuspiciousLogin
  usecase "レート制限適用" as ApplyRateLimit
  usecase "IPアドレス監視" as MonitorIP
  usecase "異常パターン検知" as DetectAnomalies
  usecase "セキュリティアラート" as SecurityAlert
  
  usecase "アカウントロック" as LockAccount
  usecase "IPアドレスブロック" as BlockIP
  usecase "緊急アクセス停止" as EmergencyStop
}

Monitor --> DetectSuspiciousLogin
Monitor --> ApplyRateLimit
Monitor --> MonitorIP
Monitor --> DetectAnomalies

DetectSuspiciousLogin ..> SecurityAlert : includes
DetectAnomalies ..> SecurityAlert : includes

SecurityAlert ..> LockAccount : extends
SecurityAlert ..> BlockIP : extends
SecurityAlert ..> EmergencyStop : extends

Admin --> LockAccount
Admin --> BlockIP
Admin --> EmergencyStop

note right of DetectSuspiciousLogin
  検知パターン:
  - 短時間での大量ログイン試行
  - 異なるIPからの同時ログイン
  - 通常と異なる地理的位置
  - 異常なUser-Agent
end note

note right of ApplyRateLimit
  レート制限:
  - /auth/login: 5回/分
  - /auth/register: 3回/分
  - /oauth2/token: 10回/分
  - IP別、ユーザー別制限
end note

@enduml
```