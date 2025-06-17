# @noranekoid/nextjs

OAuth2/OIDC対応のNext.js App Router認証SDK

[![npm version](https://badge.fury.io/js/%40noranekoid%2Fnextjs.svg)](https://badge.fury.io/js/%40noranekoid%2Fnextjs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@noranekoid/nextjs.svg)](https://nodejs.org/)

## 特徴

- 🚀 **Next.js App Router完全対応** - Server Components、Client Components両方をサポート
- 🔐 **RFC 6749準拠** - OAuth2標準仕様に準拠した実装
- 🔍 **自動エンドポイント発見** - .well-known OpenID Connect Discoveryでゼロ設定
- ⚡ **ビルド時Discovery** - 実行時HTTPリクエストなしでVercel最適化
- 🔄 **自動トークンリフレッシュ** - 期限切れ前に自動的にトークンを更新
- 🎯 **TypeScript対応** - 完全な型定義を提供
- 🔗 **ミドルウェアチェイン** - 複数のミドルウェアを組み合わせ可能
- 🎨 **NextAuth風API** - 親しみやすい統一ハンドラー

## インストール

```bash
npm install @noranekoid/nextjs
# または
yarn add @noranekoid/nextjs
# または
pnpm add @noranekoid/nextjs
```

## クイックスタート

### 1. Next.js設定（1行設定）

`next.config.js`を作成し、**1行**で設定：

```javascript
const { withNoranekoAuth } = require('@noranekoid/nextjs/config')

module.exports = withNoranekoAuth({
  // 既存のNext.js設定があればここに追加
})
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定します：

```env
# 必須（.well-known Discovery用）
NORANEKO_AUTH_ISSUER=https://auth.example.com
NORANEKO_AUTH_CLIENT_ID=your-client-id
NORANEKO_AUTH_CLIENT_SECRET=your-client-secret

# オプション（デフォルト値あり）
NORANEKO_AUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback
NORANEKO_AUTH_SCOPES=openid,profile,email
```

**ビルド時Discovery**: `NORANEKO_AUTH_ISSUER`から自動的に`.well-known/openid-configuration`を取得し、エンドポイントを自動設定します。

### 3. 認証の初期化

`app/auth.ts`を作成：

```typescript
import { createAuth } from '@noranekoid/nextjs/server'

// ビルド時Discoveryにより設定は最小限
createAuth({
  issuer: process.env.NORANEKO_AUTH_ISSUER!,
  clientId: process.env.NORANEKO_AUTH_CLIENT_ID!,
  clientSecret: process.env.NORANEKO_AUTH_CLIENT_SECRET!,
  // エンドポイントは.well-known Discoveryで自動設定
  autoRefresh: {
    enabled: true,
    refreshThreshold: 5 * 60 * 1000, // 5分前にリフレッシュ
  }
})

export { auth } from '@noranekoid/nextjs/server'
```

### 4. API Routesの設定

`app/api/auth/[...noraneko]/route.ts`を作成：

```typescript
import { handlers } from '@noranekoid/nextjs/api'

export const { GET, POST } = handlers
```

### 5. Middlewareの設定（オプション）

`middleware.ts`を作成：

```typescript
import { createAuthMiddleware } from '@noranekoid/nextjs/middleware'

export default createAuthMiddleware({
  protectedPaths: ['/dashboard', '/profile'],
  publicOnlyPaths: ['/login'],
  loginUrl: '/api/auth/login',
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### 6. 使用例

#### サーバーコンポーネントでの認証状態確認

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

#### クライアントコンポーネントでの認証状態確認

```typescript
'use client'
import { useAuth } from '@noranekoid/nextjs/client'

export default function UserProfile() {
  const { data: session, status } = useAuth()
  
  if (status === 'loading') return <div>Loading...</div>
  if (status === 'unauthenticated') return <div>Not logged in</div>
  
  return <div>Hello {session?.user.name}!</div>
}
```

## 設定オプション

### AuthConfig

```typescript
interface AuthConfig {
  // 必須
  issuer: string              // OAuth2プロバイダーのIssuer URL
  clientId: string            // クライアントID
  clientSecret?: string       // クライアントシークレット（サーバーサイドのみ）
  
  // オプション
  scopes?: string[]           // 要求するスコープ（デフォルト: ['openid', 'profile', 'email']）
  redirectUri?: string        // コールバックURL
  loginPath?: string          // ログインパス（デフォルト: '/api/auth/login'）
  callbackPath?: string       // コールバックパス（デフォルト: '/api/auth/callback'）
  logoutPath?: string         // ログアウトパス（デフォルト: '/api/auth/logout'）
  cookiePrefix?: string       // Cookieプレフィックス（デフォルト: 'noraneko-auth'）
  cookieSecure?: boolean      // セキュアCookie（デフォルト: production時true）
  debug?: boolean             // デバッグモード
  
  // 自動リフレッシュ設定
  autoRefresh?: {
    enabled?: boolean         // 有効化（デフォルト: false）
    refreshThreshold?: number // リフレッシュ開始時間（ミリ秒、デフォルト: 300000）
    maxRetries?: number       // 最大リトライ回数（デフォルト: 3）
    retryInterval?: number    // リトライ間隔（ミリ秒、デフォルト: 5000）
  }
}
```

## API リファレンス

### サーバーサイド

#### `createAuth(config: AuthConfig): void`
認証システムを初期化します。ビルド時Discoveryによりエンドポイントが自動設定されます。

```typescript
createAuth({
  issuer: 'https://auth.example.com',  // .well-known DiscoveryのベースURL
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  // authorization_endpoint, token_endpoint等は自動設定
})
```

#### `auth(): Promise<Session | null>`
現在の認証セッションを取得します。Server Componentsで使用できます。

```typescript
const session = await auth()
if (!session) {
  // 未認証
}
```

### クライアントサイド

#### `SessionProvider`
認証状態をクライアントコンポーネントで利用可能にするプロバイダー。

```typescript
import { SessionProvider } from '@noranekoid/nextjs/client'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

#### `useAuth()`
認証状態を取得するフック。

```typescript
const { data, status, update } = useAuth()
// data: Session | null
// status: 'loading' | 'authenticated' | 'unauthenticated'
// update: () => Promise<void> - セッションを手動更新
```

#### `useAuthCallback(options?: UseAuthCallbackOptions)`
OAuth2コールバックを処理するフック。

```typescript
interface UseAuthCallbackOptions {
  onSuccess?: (params: CallbackParams) => void
  onError?: (error: CallbackError) => void
  autoRedirect?: boolean  // デフォルト: true
  redirectTo?: string     // デフォルト: '/'
}
```

使用例：
```typescript
export default function CallbackPage() {
  const { status, error } = useAuthCallback({
    onSuccess: () => console.log('ログイン成功'),
    onError: (error) => console.error('ログイン失敗:', error),
  })
  
  if (status === 'processing') {
    return <div>処理中...</div>
  }
  
  if (status === 'error') {
    return <div>エラー: {error?.message}</div>
  }
  
  return null
}
```

### API Routes

#### 統一ハンドラー（推奨）

```typescript
import { handlers } from '@noranekoid/nextjs/api'
export const { GET, POST } = handlers
```

これにより以下のエンドポイントが自動的に作成されます：
- `GET /api/auth/login` - ログイン開始
- `GET /api/auth/callback` - OAuth2コールバック
- `GET /api/auth/logout` - ログアウト
- `GET /api/auth/token` - 現在のトークン状態取得
- `POST /api/auth/token` - トークンリフレッシュ

#### カスタムパス設定

```typescript
import { createHandlers } from '@noranekoid/nextjs/api'

export const { GET, POST } = createHandlers({
  paths: {
    login: 'signin',      // /api/auth/signin
    logout: 'signout',    // /api/auth/signout
    callback: 'callback', // /api/auth/callback
    token: 'token'        // /api/auth/token
  }
})
```

### Middleware

#### `createAuthMiddleware(config: MiddlewareConfig)`

```typescript
interface MiddlewareConfig {
  protectedPaths?: string[]    // 認証が必要なパス
  publicOnlyPaths?: string[]   // 未認証時のみアクセス可能なパス
  loginUrl?: string            // ログインURL
  callbackUrl?: string         // ログイン後のリダイレクト先
}
```

#### ミドルウェアチェイン

複数のミドルウェアを組み合わせる場合：

```typescript
import { chain, createAuthMiddleware } from '@noranekoid/nextjs/middleware'

const authMiddleware = createAuthMiddleware({
  protectedPaths: ['/dashboard'],
})

const customMiddleware = async (request: NextRequest) => {
  // カスタムロジック
  return null // 次のミドルウェアへ
}

export default chain([authMiddleware, customMiddleware])
```

## エラーハンドリング

SDKは以下のエラークラスを提供します：

```typescript
import { 
  NoranekoAuthError,
  TokenExpiredError,
  InvalidTokenError,
  AuthenticationRequiredError,
  OAuthError 
} from '@noranekoid/nextjs'

try {
  const session = await auth()
} catch (error) {
  if (error instanceof TokenExpiredError) {
    // トークン期限切れ
  } else if (error instanceof AuthenticationRequiredError) {
    // 認証が必要
  }
}
```

## 実装例

### 保護されたページの実装

```typescript
// app/dashboard/page.tsx
import { auth } from '@/app/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/api/auth/login')
  }
  
  return (
    <div>
      <h1>ダッシュボード</h1>
      <p>ようこそ、{session.user.name}さん</p>
    </div>
  )
}
```

### ログイン/ログアウトボタン

```typescript
'use client'
import { useAuth } from '@noranekoid/nextjs/client'

export function AuthButton() {
  const { data: session, status } = useAuth()
  
  if (status === 'loading') {
    return <button disabled>Loading...</button>
  }
  
  if (session) {
    return (
      <a href="/api/auth/logout">
        <button>ログアウト</button>
      </a>
    )
  }
  
  return (
    <a href="/api/auth/login">
      <button>ログイン</button>
    </a>
  )
}
```

### カスタムコールバックページ

```typescript
// app/auth/callback/page.tsx
'use client'
import { useAuthCallback } from '@noranekoid/nextjs/client'
import { useRouter } from 'next/navigation'

export default function CallbackPage() {
  const router = useRouter()
  
  const { status, error } = useAuthCallback({
    onSuccess: () => {
      router.push('/dashboard')
    },
    onError: (error) => {
      console.error('認証エラー:', error)
      router.push('/login?error=' + error.code)
    },
    autoRedirect: false, // 手動でリダイレクト
  })
  
  if (status === 'processing') {
    return <div>認証処理中...</div>
  }
  
  if (status === 'error') {
    return <div>エラーが発生しました: {error?.message}</div>
  }
  
  return <div>リダイレクト中...</div>
}
```

## トラブルシューティング

### よくある問題

#### 1. "NORANEKO_DISCOVERY_CONFIG environment variable not found" エラー

ビルド時Discoveryが実行されていません。

**解決策:**
1. `next.config.js`に`withNoranekoAuth()`を設定
2. `NORANEKO_AUTH_ISSUER`環境変数を設定  
3. `npm run build`でビルド時Discoveryを実行

```typescript
// app/auth.ts
import { createAuth } from '@noranekoid/nextjs/server'

createAuth({
  issuer: process.env.NORANEKO_AUTH_ISSUER!,
  clientId: process.env.NORANEKO_AUTH_CLIENT_ID!,
  clientSecret: process.env.NORANEKO_AUTH_CLIENT_SECRET!,
})
```

#### 2. Cookieが設定されない

- `cookieSecure`がtrueの場合、HTTPSが必要です
- 開発環境では`cookieSecure: false`を設定してください

#### 3. トークンの自動更新が動作しない

`autoRefresh.enabled`をtrueに設定してください：

```typescript
createAuth({
  // 他の設定...
  autoRefresh: {
    enabled: true,
    refreshThreshold: 5 * 60 * 1000, // 5分前
  }
})
```

#### 4. ビルド時Discovery失敗

```
❌ OIDC discovery failed:
   Error: HTTP 404: Not Found
   Issuer: https://auth.example.com
```

**解決策:**
1. `NORANEKO_AUTH_ISSUER`のURLを確認
2. `/.well-known/openid-configuration`が存在するか確認
3. ビルド環境からIDaaSへのアクセスを確認

### デバッグモード

詳細なログを有効にする：

```typescript
createAuth({
  // 他の設定...
  debug: true
})
```

**ビルド時Discoveryログ:**
```bash
npm run build

🔍 Fetching OIDC discovery from: https://auth.example.com/.well-known/openid-configuration
✅ OIDC discovery successful
   Authorization: https://auth.example.com/oauth/authorize
   Token: https://auth.example.com/oauth/token
   UserInfo: https://auth.example.com/oauth/userinfo
✅ PKCE (S256) supported
✅ Pairwise subject identifiers supported
```

## 貢献方法

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

### 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install

# 開発モードで実行
npm run dev

# ビルド
npm run build

# テスト実行
npm test

# 型チェック
npm run type-check

# Lint
npm run lint
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## サポート

問題や質問がある場合は、[GitHubのIssue](https://github.com/noraneko-id/nextjs/issues)を作成してください。