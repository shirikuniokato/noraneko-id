# .well-known Discovery 実装ガイド

## 概要

SDKに`.well-known`ディスカバリー機能を実装しました。これにより、IDaaSのエンドポイントを自動的に発見し、手動設定を最小限に抑えることができます。

## 実装済み機能

### 1. OpenID Connect Discovery 1.0
- **仕様**: https://openid.net/specs/openid-connect-discovery-1_0.html
- **エンドポイント**: `{issuer}/.well-known/openid-configuration`

### 2. 自動フォールバック
Discovery が失敗した場合は、従来のハードコードされたエンドポイントを使用します。

## 使用方法

### 基本的な使用（デフォルトで有効）

```typescript
import { createAuth } from '@noranekoid/nextjs/server'

// Discovery は自動的に実行される
await createAuth({
  issuer: 'https://auth.example.com',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
})
```

### Discovery を無効にする

```typescript
await createAuth({
  issuer: 'https://auth.example.com',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  discovery: false,  // Discovery を無効化
})
```

### Discovery の手動実行

```typescript
import { discoverConfiguration } from '@noranekoid/nextjs/server'

const config = await discoverConfiguration('https://auth.example.com')
console.log(config)
// {
//   issuer: "https://auth.example.com",
//   authorization_endpoint: "https://auth.example.com/oauth/authorize",
//   token_endpoint: "https://auth.example.com/oauth/token",
//   userinfo_endpoint: "https://auth.example.com/oauth/userinfo",
//   ...
// }
```

## IDaaS 側の実装要件

### 必須: /.well-known/openid-configuration

IDaaS は以下の形式で設定情報を提供する必要があります：

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/oauth/authorize",
  "token_endpoint": "https://auth.example.com/oauth/token",
  "userinfo_endpoint": "https://auth.example.com/oauth/userinfo",
  "jwks_uri": "https://auth.example.com/oauth/jwks",
  "response_types_supported": ["code"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "scopes_supported": ["openid", "profile", "email"],
  "code_challenge_methods_supported": ["S256"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  
  // オプション（SDK が利用）
  "revocation_endpoint": "https://auth.example.com/oauth/revoke",
  "end_session_endpoint": "https://auth.example.com/oauth/logout"
}
```

## SDK の動作

### 1. 初期化時の Discovery

```typescript
// createAuth() 呼び出し時の内部動作
async function createAuth(config) {
  // 1. 設定を保存
  setAuthConfig(config)
  
  // 2. Discovery を実行（デフォルトで有効）
  if (config.discovery !== false) {
    try {
      discoveryConfig = await discoverConfiguration(config.issuer)
      // 成功: Discovery で取得したエンドポイントを使用
    } catch (error) {
      // 失敗: デフォルトエンドポイントにフォールバック
    }
  }
}
```

### 2. エンドポイントの決定

```typescript
// 例: トークンエンドポイント
const tokenEndpoint = discovery?.token_endpoint || `${config.issuer}/oauth2/token`

// 例: 認証エンドポイント
const authEndpoint = discovery?.authorization_endpoint || `${config.issuer}/oauth2/authorize`
```

### 3. キャッシュ機能

Discovery 結果は60分間キャッシュされます：

```typescript
// キャッシュクリア（必要な場合）
import { clearDiscoveryCache } from '@noranekoid/nextjs/server'

clearDiscoveryCache()
```

## 実装の詳細

### DiscoveryDocument 型定義

```typescript
interface DiscoveryDocument {
  // 必須フィールド
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
  jwks_uri: string
  response_types_supported: string[]
  subject_types_supported: string[]
  id_token_signing_alg_values_supported: string[]
  
  // 推奨フィールド
  userinfo_endpoint?: string
  registration_endpoint?: string
  scopes_supported?: string[]
  claims_supported?: string[]
  
  // オプションフィールド（SDK が利用）
  revocation_endpoint?: string
  introspection_endpoint?: string
  code_challenge_methods_supported?: string[]
  grant_types_supported?: string[]
  token_endpoint_auth_methods_supported?: string[]
  end_session_endpoint?: string
}
```

### エラーハンドリング

Discovery が失敗する場合：

1. **ネットワークエラー**: タイムアウト（5秒）またはネットワーク不通
2. **不正なレスポンス**: JSON パースエラーまたは必須フィールド不足
3. **issuer 不一致**: レスポンスの issuer がリクエストと異なる

すべての場合でデフォルトエンドポイントにフォールバックします。

## 利点

### 1. 設定の簡素化
- クライアントは issuer URL のみ設定すればよい
- エンドポイントは自動的に発見される

### 2. 柔軟性
- IDaaS 側でエンドポイントを変更可能
- クライアント側の変更不要

### 3. 標準準拠
- OpenID Connect Discovery 1.0 仕様に準拠
- 他の OIDC プロバイダーとの互換性

## デバッグ

Discovery の動作を確認する：

```typescript
await createAuth({
  issuer: 'https://auth.example.com',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  debug: true,  // デバッグログを有効化
})

// ログ出力例:
// OpenID Connect discovery successful: { ... }
// または
// OpenID Connect discovery failed: Error: ...
```

## 移行ガイド

### 既存の実装からの移行

変更は必要ありません。Discovery はデフォルトで有効になり、失敗した場合は従来の動作にフォールバックします。

### 明示的な設定

もし特定のエンドポイントを使用したい場合は、Discovery を無効にしてください：

```typescript
await createAuth({
  issuer: 'https://auth.example.com',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  discovery: false,  // Discovery を無効化して従来の動作を維持
})