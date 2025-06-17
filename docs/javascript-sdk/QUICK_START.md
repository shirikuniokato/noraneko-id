# Noraneko ID SDK - クイックスタート

最短1分でNoraneko ID認証を Next.js アプリに統合する方法です。

## 📦 インストール

```bash
npm install @noranekoid/nextjs
# または
yarn add @noranekoid/nextjs
# または
pnpm add @noranekoid/nextjs
```

## ⚡ 1行設定

### 1. Next.js設定

`next.config.js` を以下の**1行**で設定：

```javascript
const { withNoranekoAuth } = require('@noranekoid/nextjs/config')

module.exports = withNoranekoAuth({
  // 既存のNext.js設定があればここに追加
})
```

### 2. 環境変数

`.env.local` に設定：

```env
NORANEKO_AUTH_ISSUER=https://auth.example.com
NORANEKO_AUTH_CLIENT_ID=your-client-id
NORANEKO_AUTH_CLIENT_SECRET=your-client-secret
```

### 3. SDK初期化

`app/auth.ts` を作成：

```typescript
import { createAuth } from '@noranekoid/nextjs/server'

createAuth({
  issuer: process.env.NORANEKO_AUTH_ISSUER!,
  clientId: process.env.NORANEKO_AUTH_CLIENT_ID!,
  clientSecret: process.env.NORANEKO_AUTH_CLIENT_SECRET!,
})

export { auth } from '@noranekoid/nextjs/server'
```

## 🚀 使用方法

### API Routes

`app/api/auth/[...noraneko]/route.ts`:

```typescript
import { handlers } from '@noranekoid/nextjs/api'

export const { GET, POST } = handlers
```

### Server Component

```typescript
import { auth } from '@/app/auth'

export default async function Page() {
  const session = await auth()
  
  if (!session) {
    return <div>ログインしてください</div>
  }
  
  return <div>ようこそ、{session.user.name}さん！</div>
}
```

### Client Component

```typescript
'use client'
import { useAuth } from '@noranekoid/nextjs/client'

export default function Profile() {
  const { data: session, status } = useAuth()
  
  if (status === 'loading') return <div>Loading...</div>
  if (!session) return <div>Not logged in</div>
  
  return <div>Hello {session.user.name}!</div>
}
```

### Middleware（オプション）

`middleware.ts`:

```typescript
import { createAuthMiddleware } from '@noranekoid/nextjs/middleware'

export default createAuthMiddleware({
  protectedPaths: ['/dashboard'],
  loginUrl: '/api/auth/login',
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

## ✅ ビルド確認

```bash
npm run build
```

ビルドログで確認：

```
> next build

🔍 Fetching OIDC discovery from: https://auth.example.com/.well-known/openid-configuration
✅ OIDC discovery successful
   Authorization: https://auth.example.com/oauth/authorize
   Token: https://auth.example.com/oauth/token
   UserInfo: https://auth.example.com/oauth/userinfo
   Revocation: https://auth.example.com/oauth/revoke
✅ PKCE (S256) supported
✅ Pairwise subject identifiers supported

Creating an optimized production build...
✅ Compiled successfully
```

## 🎯 ログイン/ログアウト

### ログインボタン

```typescript
export function LoginButton() {
  return (
    <a href="/api/auth/login">
      <button>ログイン</button>
    </a>
  )
}
```

### ログアウトボタン

```typescript
export function LogoutButton() {
  return (
    <a href="/api/auth/logout">
      <button>ログアウト</button>
    </a>
  )
}
```

## 🌐 Vercel デプロイ

### 環境変数設定

Vercel Dashboard で設定：

```
NORANEKO_AUTH_ISSUER=https://auth.example.com
NORANEKO_AUTH_CLIENT_ID=your-client-id  
NORANEKO_AUTH_CLIENT_SECRET=your-client-secret
```

### デプロイ

```bash
# Vercelビルド時にDiscoveryが自動実行されます
vercel --prod

# ビルドログで確認
# Running "npm run build"
# 🔍 Fetching OIDC discovery from: https://auth.example.com/.well-known/openid-configuration
# ✅ OIDC discovery successful
# Build completed successfully
```

## 🔧 高度な設定

### カスタムスコープ

```typescript
createAuth({
  issuer: process.env.NORANEKO_AUTH_ISSUER!,
  clientId: process.env.NORANEKO_AUTH_CLIENT_ID!,
  clientSecret: process.env.NORANEKO_AUTH_CLIENT_SECRET!,
  scopes: ['openid', 'profile', 'email', 'custom-scope'],
})
```

### 自動リフレッシュ設定

```typescript
createAuth({
  // ... 基本設定
  autoRefresh: {
    enabled: true,
    refreshThreshold: 5 * 60 * 1000,  // 5分前にリフレッシュ
    maxRetries: 3,
    retryInterval: 5000,
  },
})
```

### デバッグモード

```typescript
createAuth({
  // ... 基本設定
  debug: true,  // 詳細ログを出力
})
```

## 🚨 トラブルシューティング

### Discovery失敗

```bash
npm run build

> next build

❌ OIDC discovery failed:
   Error: HTTP 404: Not Found
   Issuer: https://auth.example.com

Troubleshooting steps:
1. Verify the OIDC provider is running and accessible
2. Check that the issuer URL is correct
3. Ensure /.well-known/openid-configuration endpoint exists
4. Verify network connectivity from build environment
```

**解決策:**
1. `NORANEKO_AUTH_ISSUER` URLを確認
2. `/.well-known/openid-configuration` が存在するか確認
3. ビルド環境からIDaaSへのネットワーク接続を確認

### 設定不足

```
Error: NORANEKO_DISCOVERY_CONFIG environment variable not found
```

**解決策:**
1. `next.config.js` に `withNoranekoAuth()` を追加
2. `NORANEKO_AUTH_ISSUER` 環境変数を設定
3. `npm run build` を実行

### 型エラー

```
Module not found: @noranekoid/nextjs/config
```

**解決策:**
```javascript
// next.config.js（CommonJS形式で記述）
const { withNoranekoAuth } = require('@noranekoid/nextjs/config')
```

## 📚 さらに詳しく

- [完全ガイド](./README.md) - 詳細な設定とAPI仕様
- [OAuth2統合](./OAUTH2_INTEGRATION.md) - IDaaS開発者向け
- [ビルド時Discovery](./BUILD_TIME_DISCOVERY.md) - パフォーマンス最適化

## 🎉 完了！

これで Noraneko ID 認証が Next.js アプリに統合されました！

シンプルな1行設定でありながら、RFC準拠・高パフォーマンス・Vercel最適化された本格的な認証システムが手に入ります。