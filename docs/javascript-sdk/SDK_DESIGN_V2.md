# NoranekoID Next.js SDK v2 設計書

## 概要

NextAuth v5のアーキテクチャを参考に、Next.js App Routerに最適化されたnoraneko-id SDKを設計する。

## 設計原則

### 1. NextAuth v5から学ぶ設計パターン

**NextAuth v5の優れた点:**
- `auth()` 関数による統一インターフェース
- Server Components ファーストアプローチ  
- 物理的なファイル分離によるserver-only/client-only競合回避
- シンプルなAPI設計

**参考にする具体的な設計:**
```typescript
// NextAuth v5 パターン
import { auth } from "@/auth"           // Server Components
import { useSession } from "next-auth/react"  // Client Components
```

### 2. noraneko-id独自要件

- OAuth2 RFC 6749準拠
- Multi-tenant対応（クライアントスコープ分離）
- PKCE対応
- 自動トークンリフレッシュ
- カスタムIssuer対応

## アーキテクチャ設計

### ディレクトリ構造

```
packages/nextjs/
├── src/
│   ├── server/           # Server Components専用（server-only）
│   │   ├── index.ts      # メインエントリーポイント
│   │   ├── auth.ts       # 認証核心ロジック
│   │   └── config.ts     # 設定管理
│   ├── client/           # Client Components専用（client-only）
│   │   ├── index.ts      # クライアントエントリーポイント
│   │   ├── hooks.ts      # React hooks
│   │   └── providers.tsx # Context providers
│   ├── api/              # API Routes専用
│   │   ├── index.ts      # API handler exports
│   │   └── handlers/     # 個別ハンドラー
│   │       ├── login.ts
│   │       ├── callback.ts
│   │       ├── logout.ts
│   │       └── session.ts
│   ├── middleware/       # Next.js Middleware専用
│   │   └── index.ts      # 認証ミドルウェア
│   ├── shared/           # 共通ユーティリティ
│   │   ├── types.ts      # 型定義
│   │   ├── errors.ts     # エラークラス
│   │   └── utils.ts      # 汎用関数
│   └── index.ts          # ルートエントリー（型のみ）
├── package.json          # 新exports設定
└── tsup.config.ts        # 簡素化されたビルド設定
```

### Package.json Exports

```json
{
  "name": "@noranekoid/nextjs",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./server": {
      "types": "./dist/server/index.d.ts", 
      "default": "./dist/server/index.js"
    },
    "./client": {
      "types": "./dist/client/index.d.ts",
      "default": "./dist/client/index.js"
    },
    "./api": {
      "types": "./dist/api/index.d.ts",
      "default": "./dist/api/index.js"
    },
    "./middleware": {
      "types": "./dist/middleware/index.d.ts",
      "default": "./dist/middleware/index.js"
    }
  }
}
```

## API設計

### 1. Server Components API（NextAuth v5風）

```typescript
// packages/nextjs/src/server/index.ts
import 'server-only'

export { auth, createAuth } from './auth'
export type { Session, User, AuthConfig } from '../shared/types'
```

```typescript
// packages/nextjs/src/server/auth.ts
import 'server-only'
import { cookies } from 'next/headers'

// NextAuth v5風の統一インターフェース
export async function auth(): Promise<Session | null> {
  // セッション取得ロジック
}

export function createAuth(config: AuthConfig) {
  // 設定初期化
}

// 認証必須のヘルパー
export async function requireAuth(): Promise<User> {
  const session = await auth()
  if (!session) throw new Error('Authentication required')
  return session.user
}
```

### 2. Client Components API

```typescript
// packages/nextjs/src/client/index.ts
'use client'
import 'client-only'

export { useSession, useAuth } from './hooks'
export { SessionProvider } from './providers'
```

```typescript
// packages/nextjs/src/client/hooks.ts
'use client'
import 'client-only'

export function useSession() {
  // NextAuth風のuseSession
}

export function useAuth() {
  // noraneko-id独自のuseAuth
}
```

### 3. API Routes

```typescript
// packages/nextjs/src/api/index.ts
export { GET as authHandler } from './handlers/session'
export { createLoginHandler } from './handlers/login'
export { createCallbackHandler } from './handlers/callback'
export { createLogoutHandler } from './handlers/logout'
```

### 4. Middleware

```typescript
// packages/nextjs/src/middleware/index.ts
import { NextRequest, NextResponse } from 'next/server'

export function createAuthMiddleware(config: MiddlewareConfig) {
  return async function middleware(request: NextRequest) {
    // 認証ミドルウェアロジック
  }
}
```

## 使用例

### App Router での使用

```typescript
// app/layout.tsx - 設定初期化
import { createAuth } from '@noranekoid/nextjs/server'

createAuth({
  issuer: process.env.NORANEKO_ISSUER!,
  clientId: process.env.NORANEKO_CLIENT_ID!,
})

// app/dashboard/page.tsx - Server Component
import { auth } from '@noranekoid/nextjs/server'

export default async function Dashboard() {
  const session = await auth()
  if (!session) redirect('/login')
  
  return <div>Welcome, {session.user.email}</div>
}

// app/components/user-menu.tsx - Client Component
'use client'
import { useSession } from '@noranekoid/nextjs/client'

export function UserMenu() {
  const { data: session, status } = useSession()
  // ...
}

// app/providers.tsx - Client Provider
'use client'
import { SessionProvider } from '@noranekoid/nextjs/client'

export function Providers({ children, session }) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  )
}
```

### API Routes

```typescript
// app/api/auth/[...noraneko]/route.ts
import { authHandler } from '@noranekoid/nextjs/api'

export { authHandler as GET, authHandler as POST }

// app/api/auth/login/route.ts
import { createLoginHandler } from '@noranekoid/nextjs/api'

export const GET = createLoginHandler()

// app/api/auth/callback/route.ts
import { createCallbackHandler } from '@noranekoid/nextjs/api'

export const GET = createCallbackHandler()
```

### Middleware

```typescript
// middleware.ts
import { createAuthMiddleware } from '@noranekoid/nextjs/middleware'

export default createAuthMiddleware({
  protectedPaths: ['/dashboard'],
  loginUrl: '/login'
})
```

## ビルド設定

### tsup.config.ts（簡素化）

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'server/index': 'src/server/index.ts',
    'client/index': 'src/client/index.ts', 
    'api/index': 'src/api/index.ts',
    'middleware/index': 'src/middleware/index.ts'
  },
  format: ['esm'], // ESMのみ
  splitting: false, // 分割無効
  dts: true,
  clean: true,
  external: [
    'react',
    'react-dom', 
    'next',
    'next/server',
    'next/headers',
    'next/navigation',
    'server-only',
    'client-only'
  ]
})
```

## NextAuth v5との差分

### 共通点
- `auth()` 函数による統一インターフェース
- Server Components ファーストアプローチ
- 物理的ファイル分離
- シンプルなAPI設計

### noraneko-id独自機能
- **Multi-tenant対応**: クライアントスコープ分離
- **カスタムOAuth2**: 独自issuer対応
- **PKCE強制**: セキュリティ強化
- **自動リフレッシュ**: バックグラウンドトークン更新

## 実装ステップ

1. **フォルダ構造作成**: 新しいディレクトリ構造
2. **Server API実装**: auth()函数とヘルパー
3. **Client API実装**: useSession/useAuth
4. **API Routes実装**: OAuth2フローハンドラー
5. **Middleware実装**: 認証ミドルウェア
6. **ビルド設定**: 簡素化されたtsup設定
7. **型定義整備**: TypeScript完全対応
8. **テスト実装**: 各レイヤーのテスト

この設計により、NextAuth v5の優れた部分を取り入れつつ、noraneko-id固有の要件を満たすSDKを構築できます。