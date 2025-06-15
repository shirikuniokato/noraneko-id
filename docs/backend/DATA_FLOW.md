# Data Flow Diagrams - データフロー図

noraneko-id バックエンドのデータフローを図解で説明します。

## 1. システム全体データフロー

```mermaid
graph TD
    subgraph "External"
        User[👤 User]
        ClientApp[📱 Client Application]
        SNS[🔗 SNS Providers<br/>Google, GitHub, LINE]
    end
    
    subgraph "noraneko-id Backend"
        subgraph "API Gateway"
            AuthAPI[🔐 Auth API]
            OAuth2API[🎫 OAuth2 API]
            AdminAPI[⚙️ Admin API]
        end
        
        subgraph "Business Logic"
            AuthService[Auth Service]
            OAuth2Service[OAuth2 Service]
            ClientService[Client Service]
            TokenService[Token Service]
        end
        
        subgraph "Data Storage"
            PostgreSQL[(🗄️ PostgreSQL)]
            Sessions[💾 Session Storage]
            TokenCache[⚡ Token Cache]
        end
    end
    
    %% User Flows
    User -->|Credentials| AuthAPI
    User -->|OAuth2 Consent| OAuth2API
    
    %% Client App Flows
    ClientApp -->|Auth Requests| AuthAPI
    ClientApp -->|OAuth2 Requests| OAuth2API
    ClientApp -->|Admin Requests| AdminAPI
    
    %% SNS Integration
    SNS -->|OAuth2 Callback| OAuth2API
    OAuth2Service -->|Auth Requests| SNS
    
    %% Internal Data Flows
    AuthAPI -->|User Data| AuthService
    OAuth2API -->|Token Data| OAuth2Service
    AdminAPI -->|Client Data| ClientService
    
    AuthService -->|CRUD Operations| PostgreSQL
    OAuth2Service -->|Token Operations| PostgreSQL
    OAuth2Service -->|Session Data| Sessions
    ClientService -->|Client Operations| PostgreSQL
    
    TokenService -->|Token Cache| TokenCache
    OAuth2Service -->|Token Validation| TokenService
    
    %% Response Flows
    PostgreSQL -->|Query Results| AuthService
    PostgreSQL -->|Query Results| OAuth2Service
    Sessions -->|Session Data| AuthService
    TokenCache -->|Cached Tokens| TokenService
```

## 2. ユーザー登録データフロー

### 2.1 パスワード認証ユーザー登録

```mermaid
graph TD
    Start([👤 User Registration Request]) --> Validate{Request Validation}
    
    Validate -->|Invalid| Error1[❌ Validation Error]
    Validate -->|Valid| ClientCheck[🔍 Client Verification]
    
    ClientCheck --> ClientDB[(Client Table)]
    ClientDB -->|Not Found| Error2[❌ Invalid Client]
    ClientDB -->|Found| DuplicateCheck[🔍 Duplicate Check]
    
    DuplicateCheck --> UserDB[(User Table)]
    UserDB -->|Duplicate Found| Error3[❌ Email/Username Exists]
    UserDB -->|No Duplicate| HashPassword[🔒 Password Hashing]
    
    HashPassword --> CreateUser[👤 Create User Record]
    CreateUser --> UserDB
    
    CreateUser --> CreateProvider[🔗 Create Auth Provider]
    CreateProvider --> ProviderDB[(UserAuthProvider Table)]
    
    ProviderDB --> Success([✅ Registration Complete])
    
    %% Error Paths
    Error1 --> ErrorResponse[📤 Error Response]
    Error2 --> ErrorResponse
    Error3 --> ErrorResponse
    
    style Start fill:#e1f5fe
    style Success fill:#e8f5e8
    style ErrorResponse fill:#ffebee
```

### 2.2 SNS連携ユーザー登録

```mermaid
graph TD
    Start([🔗 SNS Auth Callback]) --> GetSNSInfo[📥 Extract SNS User Info]
    
    GetSNSInfo --> ValidateProvider{Provider Validation}
    ValidateProvider -->|Invalid| Error1[❌ Invalid Provider]
    ValidateProvider -->|Valid| CheckExisting[🔍 Check Existing User]
    
    CheckExisting --> ProviderDB[(UserAuthProvider Table)]
    ProviderDB -->|Found| UpdateUser[🔄 Update Existing User]
    ProviderDB -->|Not Found| CreateNewUser[👤 Create New User]
    
    CreateNewUser --> GenerateUsername[🎲 Generate Unique Username]
    GenerateUsername --> UserDB[(User Table)]
    
    UserDB --> CreateProvider[🔗 Create Auth Provider Record]
    CreateProvider --> ProviderDB
    
    UpdateUser --> UpdateProvider[🔄 Update Provider Data]
    UpdateProvider --> ProviderDB
    
    ProviderDB --> GenerateTokens[🎫 Generate OAuth2 Tokens]
    GenerateTokens --> TokenDB[(Token Tables)]
    
    TokenDB --> Success([✅ SNS Registration/Login Complete])
    
    %% Error Path
    Error1 --> ErrorResponse[📤 Error Response]
    
    style Start fill:#e1f5fe
    style Success fill:#e8f5e8
    style ErrorResponse fill:#ffebee
```

## 3. 認証データフロー

### 3.1 ログイン認証フロー

```mermaid
graph TD
    Start([🔐 Login Request]) --> ValidateRequest{Request Validation}
    
    ValidateRequest -->|Invalid| Error1[❌ Validation Error]
    ValidateRequest -->|Valid| ClientLookup[🔍 Client Lookup]
    
    ClientLookup --> ClientDB[(Client Table)]
    ClientDB -->|Not Found| Error2[❌ Invalid Client]
    ClientDB -->|Found| UserLookup[🔍 Multi-tenant User Lookup]
    
    UserLookup --> UserDB[(User Table)]
    UserDB -->|Not Found| Error3[❌ User Not Found]
    UserDB -->|Found| PasswordCheck{Password Verification}
    
    PasswordCheck -->|Invalid| Error4[❌ Invalid Credentials]
    PasswordCheck -->|Valid| CreateSession[🎫 Create Session]
    
    CreateSession --> SessionDB[(Session Table)]
    SessionDB --> SetCookie[🍪 Set Session Cookie]
    
    SetCookie --> UpdateLastLogin[🔄 Update Last Login]
    UpdateLastLogin --> UserDB
    
    UserDB --> Success([✅ Login Successful])
    
    %% Error Paths
    Error1 --> ErrorResponse[📤 Error Response]
    Error2 --> ErrorResponse
    Error3 --> ErrorResponse
    Error4 --> ErrorResponse
    
    style Start fill:#e1f5fe
    style Success fill:#e8f5e8
    style ErrorResponse fill:#ffebee
```

### 3.2 セッション検証フロー

```mermaid
graph TD
    Start([📥 Authenticated Request]) --> ExtractSession[🍪 Extract Session Token]
    
    ExtractSession --> HashToken[#️⃣ Hash Session Token]
    HashToken --> SessionLookup[🔍 Session Lookup]
    
    SessionLookup --> SessionDB[(Session Table)]
    SessionDB -->|Not Found| Error1[❌ Session Not Found]
    SessionDB -->|Found| CheckExpiry{Session Expiry Check}
    
    CheckExpiry -->|Expired| Error2[❌ Session Expired]
    CheckExpiry -->|Valid| CheckRevoked{Revocation Check}
    
    CheckRevoked -->|Revoked| Error3[❌ Session Revoked]
    CheckRevoked -->|Active| GetUser[👤 Get User Data]
    
    GetUser --> UserDB[(User Table)]
    UserDB --> GetClient[🏢 Get Client Data]
    GetClient --> ClientDB[(Client Table)]
    
    ClientDB --> SetContext[🎯 Set Request Context]
    SetContext --> Success([✅ Authentication Successful])
    
    %% Error Paths
    Error1 --> Unauthorized[🚫 401 Unauthorized]
    Error2 --> Unauthorized
    Error3 --> Unauthorized
    
    style Start fill:#e1f5fe
    style Success fill:#e8f5e8
    style Unauthorized fill:#ffebee
```

## 4. OAuth2トークンフロー

### 4.1 アクセストークン発行フロー

```mermaid
graph TD
    Start([🎫 Token Request]) --> ValidateGrant{Grant Type Validation}
    
    ValidateGrant -->|authorization_code| AuthCodeFlow[📝 Authorization Code Flow]
    ValidateGrant -->|refresh_token| RefreshFlow[🔄 Refresh Token Flow]
    ValidateGrant -->|Invalid| Error1[❌ Unsupported Grant Type]
    
    AuthCodeFlow --> ValidateCode[🔍 Validate Auth Code]
    ValidateCode --> AuthCodeDB[(AuthorizationCode Table)]
    
    AuthCodeDB -->|Not Found/Expired| Error2[❌ Invalid Auth Code]
    AuthCodeDB -->|Valid| PKCECheck{PKCE Verification}
    
    PKCECheck -->|Failed| Error3[❌ PKCE Verification Failed]
    PKCECheck -->|Passed| GenerateTokens[🎫 Generate Token Pair]
    
    RefreshFlow --> ValidateRefreshToken[🔍 Validate Refresh Token]
    ValidateRefreshToken --> RefreshTokenDB[(RefreshToken Table)]
    
    RefreshTokenDB -->|Invalid| Error4[❌ Invalid Refresh Token]
    RefreshTokenDB -->|Valid| RevokeOldTokens[🗑️ Revoke Old Tokens]
    
    RevokeOldTokens --> GenerateTokens
    
    GenerateTokens --> CreateAccessToken[🎟️ Create Access Token]
    CreateAccessToken --> AccessTokenDB[(AccessToken Table)]
    
    AccessTokenDB --> CreateRefreshToken[🔄 Create Refresh Token]
    CreateRefreshToken --> RefreshTokenDB
    
    RefreshTokenDB --> MarkCodeUsed[✅ Mark Auth Code as Used]
    MarkCodeUsed --> AuthCodeDB
    
    AuthCodeDB --> Success([✅ Tokens Issued])
    
    %% Error Paths
    Error1 --> ErrorResponse[📤 Error Response]
    Error2 --> ErrorResponse
    Error3 --> ErrorResponse
    Error4 --> ErrorResponse
    
    style Start fill:#e1f5fe
    style Success fill:#e8f5e8
    style ErrorResponse fill:#ffebee
```

### 4.2 トークン検証・取り消しフロー

```mermaid
graph TD
    Start([🔍 Token Validation/Revocation]) --> TokenType{Token Type Detection}
    
    TokenType -->|Access Token| ValidateAccess[🎟️ Validate Access Token]
    TokenType -->|Refresh Token| ValidateRefresh[🔄 Validate Refresh Token]
    
    ValidateAccess --> AccessTokenDB[(AccessToken Table)]
    AccessTokenDB -->|Not Found| Error1[❌ Invalid Access Token]
    AccessTokenDB -->|Found| CheckAccessExpiry{Expiry Check}
    
    CheckAccessExpiry -->|Expired| Error2[❌ Token Expired]
    CheckAccessExpiry -->|Valid| CheckAccessRevoked{Revocation Check}
    
    CheckAccessRevoked -->|Revoked| Error3[❌ Token Revoked]
    CheckAccessRevoked -->|Active| AccessSuccess[✅ Access Token Valid]
    
    ValidateRefresh --> RefreshTokenDB[(RefreshToken Table)]
    RefreshTokenDB -->|Not Found| Error4[❌ Invalid Refresh Token]
    RefreshTokenDB -->|Found| CheckRefreshExpiry{Expiry Check}
    
    CheckRefreshExpiry -->|Expired| Error5[❌ Refresh Token Expired]
    CheckRefreshExpiry -->|Valid| CheckRefreshRevoked{Revocation Check}
    
    CheckRefreshRevoked -->|Revoked| Error6[❌ Refresh Token Revoked]
    CheckRefreshRevoked -->|Active| RefreshSuccess[✅ Refresh Token Valid]
    
    %% Revocation Flow
    AccessSuccess --> RevokeRequest{Revocation Request?}
    RefreshSuccess --> RevokeRequest
    
    RevokeRequest -->|Yes| RevokeTokens[🗑️ Revoke Related Tokens]
    RevokeRequest -->|No| GetUserData[👤 Get User Data]
    
    RevokeTokens --> UpdateRevocation[🔄 Update Revocation Status]
    UpdateRevocation --> AccessTokenDB
    UpdateRevocation --> RefreshTokenDB
    
    GetUserData --> UserDB[(User Table)]
    UserDB --> Success([✅ Operation Complete])
    
    RefreshTokenDB --> Success
    
    %% Error Paths
    Error1 --> ErrorResponse[📤 Error Response]
    Error2 --> ErrorResponse
    Error3 --> ErrorResponse
    Error4 --> ErrorResponse
    Error5 --> ErrorResponse
    Error6 --> ErrorResponse
    
    style Start fill:#e1f5fe
    style Success fill:#e8f5e8
    style ErrorResponse fill:#ffebee
```

## 5. マルチテナントデータ分離フロー

### 5.1 テナント分離検証フロー

```mermaid
graph TD
    Start([📥 Client Request]) --> ExtractClientID[🏢 Extract Client ID]
    
    ExtractClientID --> ValidateClient[🔍 Validate Client]
    ValidateClient --> ClientDB[(Client Table)]
    
    ClientDB -->|Not Found| Error1[❌ Invalid Client]
    ClientDB -->|Inactive| Error2[❌ Client Inactive]
    ClientDB -->|Valid| SetTenantContext[🎯 Set Tenant Context]
    
    SetTenantContext --> UserOperation{User Operation Type}
    
    UserOperation -->|Read| ReadUserScoped[👤 Read User (Tenant Scoped)]
    UserOperation -->|Write| WriteUserScoped[✏️ Write User (Tenant Scoped)]
    UserOperation -->|Delete| DeleteUserScoped[🗑️ Delete User (Tenant Scoped)]
    
    ReadUserScoped --> UserDB[(User Table)]
    WriteUserScoped --> UserDB
    DeleteUserScoped --> UserDB
    
    UserDB -->|Query: WHERE client_id = tenant| TenantFilteredData[🎯 Tenant-Filtered Data]
    
    TenantFilteredData --> ProviderOperation{Provider Operation?}
    
    ProviderOperation -->|Yes| ProviderDB[(UserAuthProvider Table)]
    ProviderOperation -->|No| Success[✅ Operation Complete]
    
    ProviderDB -->|Query: WHERE user_id IN tenant_users| Success
    
    %% Error Paths
    Error1 --> ErrorResponse[📤 Error Response]
    Error2 --> ErrorResponse
    
    style Start fill:#e1f5fe
    style Success fill:#e8f5e8
    style ErrorResponse fill:#ffebee
```

### 5.2 マルチテナント重複チェックフロー

```mermaid
graph TD
    Start([🔍 Duplicate Check Request]) --> GetTenantContext[🎯 Get Tenant Context]
    
    GetTenantContext --> CheckType{Check Type}
    
    CheckType -->|Email| EmailCheck[📧 Email Duplicate Check]
    CheckType -->|Username| UsernameCheck[👤 Username Duplicate Check]
    CheckType -->|Provider| ProviderCheck[🔗 Provider User ID Check]
    
    EmailCheck --> EmailQuery[🗃️ Query: SELECT COUNT(*) FROM users<br/>WHERE client_id = ? AND email = ?]
    UsernameCheck --> UsernameQuery[🗃️ Query: SELECT COUNT(*) FROM users<br/>WHERE client_id = ? AND username = ?]
    ProviderCheck --> ProviderQuery[🗃️ Query: SELECT COUNT(*) FROM user_auth_providers p<br/>JOIN users u ON p.user_id = u.id<br/>WHERE u.client_id = ? AND p.provider_type = ?<br/>AND p.provider_user_id = ?]
    
    EmailQuery --> UserDB[(User Table)]
    UsernameQuery --> UserDB
    ProviderQuery --> JoinTables[🔗 Join Users + Providers]
    
    JoinTables --> UserDB
    JoinTables --> ProviderDB[(UserAuthProvider Table)]
    
    UserDB --> EvaluateResult{Result Evaluation}
    ProviderDB --> EvaluateResult
    
    EvaluateResult -->|Count > 0| Duplicate[❌ Duplicate Found]
    EvaluateResult -->|Count = 0| NoDuplicate[✅ No Duplicate]
    
    Duplicate --> RejectOperation[🚫 Reject Operation]
    NoDuplicate --> AllowOperation[✅ Allow Operation]
    
    style Start fill:#e1f5fe
    style AllowOperation fill:#e8f5e8
    style RejectOperation fill:#ffebee
```

## 6. 管理機能データフロー

### 6.1 クライアント管理フロー

```mermaid
graph TD
    Start([⚙️ Admin Request]) --> AuthCheck[🔐 Admin Authentication]
    
    AuthCheck --> AdminDB[(AdminRole Table)]
    AdminDB -->|Not Admin| Error1[❌ Access Denied]
    AdminDB -->|Admin| Operation{Operation Type}
    
    Operation -->|Create| CreateClient[🏢 Create Client]
    Operation -->|Read| ReadClient[👀 Read Client]
    Operation -->|Update| UpdateClient[✏️ Update Client]
    Operation -->|Delete| DeleteClient[🗑️ Delete Client]
    
    CreateClient --> ValidateData[✅ Validate Client Data]
    ValidateData --> GenerateSecret[🔑 Generate Client Secret]
    GenerateSecret --> HashSecret[#️⃣ Hash Client Secret]
    HashSecret --> InsertClient[📥 Insert Client Record]
    
    ReadClient --> QueryClients[🔍 Query Client Data]
    UpdateClient --> ValidateUpdate[✅ Validate Update Data]
    ValidateUpdate --> UpdateRecord[🔄 Update Client Record]
    DeleteClient --> CheckDependencies[🔗 Check Dependencies]
    CheckDependencies --> SoftDelete[🗑️ Soft Delete Client]
    
    InsertClient --> ClientDB[(Client Table)]
    QueryClients --> ClientDB
    UpdateRecord --> ClientDB
    SoftDelete --> ClientDB
    
    ClientDB --> AuditLog[📝 Audit Log]
    AuditLog --> AuditDB[(Audit Table)]
    
    AuditDB --> Success[✅ Operation Complete]
    
    %% Error Path
    Error1 --> ErrorResponse[📤 Error Response]
    
    style Start fill:#e1f5fe
    style Success fill:#e8f5e8
    style ErrorResponse fill:#ffebee
```

### 6.2 ユーザー管理フロー

```mermaid
graph TD
    Start([👥 User Management Request]) --> AdminAuth[🔐 Admin Authentication]
    
    AdminAuth --> AdminDB[(AdminRole Table)]
    AdminDB -->|Not Admin| Error1[❌ Access Denied]
    AdminDB -->|Admin| ClientScope{Client Scope Filter}
    
    ClientScope --> UserQuery[🔍 Query Users by Client]
    UserQuery --> UserDB[(User Table)]
    
    UserDB --> ProviderJoin[🔗 Join Auth Providers]
    ProviderJoin --> ProviderDB[(UserAuthProvider Table)]
    
    ProviderDB --> SessionJoin[🔗 Join Active Sessions]
    SessionJoin --> SessionDB[(Session Table)]
    
    SessionDB --> TokenJoin[🔗 Join Active Tokens]
    TokenJoin --> TokenDB[(Token Tables)]
    
    TokenDB --> AggregateData[📊 Aggregate User Data]
    AggregateData --> FormatResponse[📝 Format Response]
    
    FormatResponse --> UserManagementOp{Management Operation}
    
    UserManagementOp -->|Status Change| UpdateUserStatus[🔄 Update User Status]
    UserManagementOp -->|Session Management| ManageSessions[🎫 Manage Sessions]
    UserManagementOp -->|Token Management| ManageTokens[🎟️ Manage Tokens]
    UserManagementOp -->|View Only| DisplayData[👀 Display Data]
    
    UpdateUserStatus --> UserDB
    ManageSessions --> SessionDB
    ManageTokens --> TokenDB
    
    UserDB --> Success[✅ Operation Complete]
    SessionDB --> Success
    TokenDB --> Success
    DisplayData --> Success
    
    %% Error Path
    Error1 --> ErrorResponse[📤 Error Response]
    
    style Start fill:#e1f5fe
    style Success fill:#e8f5e8
    style ErrorResponse fill:#ffebee
```

## 7. セキュリティデータフロー

### 7.1 レート制限フロー

```mermaid
graph TD
    Start([📥 API Request]) --> ExtractIdentifiers[🏷️ Extract Rate Limit Identifiers]
    
    ExtractIdentifiers --> IdentifierTypes[🔍 Identifier Types:<br/>• IP Address<br/>• User ID<br/>• Client ID<br/>• Endpoint]
    
    IdentifierTypes --> RateLimitDB[(Rate Limit Storage)]
    
    RateLimitDB --> CurrentCount[📊 Get Current Count]
    CurrentCount --> CheckLimit{Within Limit?}
    
    CheckLimit -->|Exceeded| RateLimitError[❌ Rate Limit Exceeded]
    CheckLimit -->|Within Limit| IncrementCounter[➕ Increment Counter]
    
    IncrementCounter --> RateLimitDB
    RateLimitDB --> SetExpiry[⏰ Set/Update Expiry]
    SetExpiry --> AllowRequest[✅ Allow Request]
    
    RateLimitError --> LogViolation[📝 Log Rate Limit Violation]
    LogViolation --> SecurityDB[(Security Log)]
    SecurityDB --> ReturnError[📤 429 Too Many Requests]
    
    AllowRequest --> ProcessRequest[⚙️ Process Request]
    ProcessRequest --> Success[✅ Request Complete]
    
    style Start fill:#e1f5fe
    style Success fill:#e8f5e8
    style ReturnError fill:#ffebee
```

### 7.2 セキュリティログフロー

```mermaid
graph TD
    Start([🚨 Security Event]) --> EventType{Event Type}
    
    EventType -->|Login Attempt| LoginLog[🔐 Login Event]
    EventType -->|Token Operation| TokenLog[🎫 Token Event]
    EventType -->|Admin Operation| AdminLog[⚙️ Admin Event]
    EventType -->|Rate Limit| RateLog[🚦 Rate Limit Event]
    EventType -->|Error| ErrorLog[❌ Error Event]
    
    LoginLog --> ExtractLoginData[📥 Extract Login Data:<br/>• User ID<br/>• Client ID<br/>• IP Address<br/>• User Agent<br/>• Success/Failure]
    
    TokenLog --> ExtractTokenData[📥 Extract Token Data:<br/>• Token ID<br/>• User ID<br/>• Client ID<br/>• Operation Type<br/>• Timestamp]
    
    AdminLog --> ExtractAdminData[📥 Extract Admin Data:<br/>• Admin User ID<br/>• Target Resource<br/>• Operation<br/>• Changes Made]
    
    RateLog --> ExtractRateData[📥 Extract Rate Data:<br/>• IP Address<br/>• Endpoint<br/>• Count<br/>• Limit<br/>• Time Window]
    
    ErrorLog --> ExtractErrorData[📥 Extract Error Data:<br/>• Error Type<br/>• Stack Trace<br/>• Request Details<br/>• User Context]
    
    ExtractLoginData --> FormatLogEntry[📝 Format Log Entry]
    ExtractTokenData --> FormatLogEntry
    ExtractAdminData --> FormatLogEntry
    ExtractRateData --> FormatLogEntry
    ExtractErrorData --> FormatLogEntry
    
    FormatLogEntry --> SecurityDB[(Security Log Table)]
    SecurityDB --> AlertCheck{Alert Trigger?}
    
    AlertCheck -->|Yes| TriggerAlert[🚨 Trigger Security Alert]
    AlertCheck -->|No| StoreLog[💾 Store Log Entry]
    
    TriggerAlert --> NotificationSystem[📧 Notification System]
    NotificationSystem --> StoreLog
    
    StoreLog --> Success[✅ Log Stored]
    
    style Start fill:#fff3e0
    style Success fill:#e8f5e8
    style TriggerAlert fill:#ffebee
```