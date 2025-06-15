# noraneko-id React SDK Documentation

noraneko-id OAuth2認証システム用の React SDK の完全ガイドです。

## 📚 文書一覧

### [📋 javascript-sdk-requirements.md](./javascript-sdk-requirements.md)
- JavaScript SDK の要件定義
- 機能仕様とAPI設計
- 実装方針とアーキテクチャ

## 🎯 SDK概要

### 実装済み機能
- ✅ **OAuth2認証フロー**: Authorization Code Flow with PKCE (RFC 7636準拠)
- ✅ **React統合**: Context Provider、Hooks、Components完全実装
- ✅ **Next.js統合**: App Router対応、Server Components、Middleware
- ✅ **セキュリティ**: XSS/Open Redirect対策、HttpOnly Cookie対応
- ✅ **TypeScript**: 完全型安全性、strict mode対応
- ✅ **自動トークン管理**: リフレッシュ、有効期限監視
- ✅ **エラーハンドリング**: 詳細なエラー分類と処理

### 対応フレームワーク
- ✅ **React**: 16.8+ (Hooks対応)
- ✅ **Next.js**: 14+ (App Router、Server Components)
- ✅ **TypeScript**: 5+ (strict mode)

## 📦 パッケージ構成

```
@noraneko/id-react/
├── /                    # メインReact統合
│   ├── NoranekoIDProvider   # Context Provider
│   ├── useNoranekoID        # 統合Hook（唯一のHook）
│   ├── ConditionalRender    # 条件分岐コンポーネント
│   └── withAuthRequired     # HOC認証保護
├── /nextjs              # Next.js統合
│   ├── /client          # クライアントサイド Provider
│   ├── /server          # サーバーサイド認証ユーティリティ
│   ├── /middleware      # 認証ミドルウェア
│   └── /api             # APIハンドラー
```

## 🚀 クイックスタート

### インストール
```bash
npm install @noraneko/id-react
```

### 基本的なReact統合
```typescript
import { NoranekoIDProvider, useNoranekoID } from '@noraneko/id-react';

// アプリケーションレベルでプロバイダーを設定
function App() {
  return (
    <NoranekoIDProvider
      config={{
        clientId: 'your-client-id',
        issuer: 'https://id.example.com',
        redirectUri: window.location.origin + '/auth/callback',
        scopes: ['openid', 'profile', 'email']
      }}
    >
      <MainApp />
    </NoranekoIDProvider>
  );
}

// コンポーネント内で認証状態を使用
function MainApp() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    login, 
    logout 
  } = useNoranekoID();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.display_name}</p>
          <button onClick={() => logout()}>ログアウト</button>
        </div>
      ) : (
        <button onClick={() => login()}>ログイン</button>
      )}
    </div>
  );
}
```

### Next.js App Router統合

#### 1. API Route設定
```typescript
// app/api/auth/[...slug]/route.ts
import { createDefaultNoranekoIDHandler } from '@noraneko/id-react/nextjs/api';

export const { GET, POST, DELETE } = createDefaultNoranekoIDHandler();
```

#### 2. Provider設定（HttpOnly Cookie対応）
```typescript
// app/layout.tsx
import { NoranekoIDNextJSProvider } from '@noraneko/id-react/nextjs/client';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <NoranekoIDNextJSProvider
          config={{
            clientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
            issuer: process.env.NEXT_PUBLIC_API_URL!,
            useHttpOnlyCookies: true, // セキュアなHttpOnly Cookie使用
          }}
        >
          {children}
        </NoranekoIDNextJSProvider>
      </body>
    </html>
  );
}
```

#### 3. Server-side認証
```typescript
// app/dashboard/page.tsx
import { requireAuth, getServerUserInfo } from '@noraneko/id-react/nextjs/server';

export default async function DashboardPage() {
  // 認証が必要なページ - 未認証時は自動ログインページにリダイレクト
  await requireAuth();
  
  // サーバーサイドでユーザー情報取得
  const userInfo = await getServerUserInfo();
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {userInfo?.display_name}</p>
    </div>
  );
}
```

#### 4. Middleware認証保護
```typescript
// middleware.ts
import { NextRequest } from 'next/server';
import { chain } from '@noraneko/id-react/nextjs/middleware';
import { authMiddleware } from '@noraneko/id-react/nextjs/middleware';

export function middleware(request: NextRequest) {
  return chain([
    authMiddleware({
      protectedPaths: ['/dashboard', '/admin'],
      publicOnlyPaths: ['/login', '/register'],
      loginUrl: '/login'
    }),
  ])(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

## 📖 詳細ガイド

### コンポーネント

#### withAuthRequired HOC
コンポーネント単位で認証保護を行います：

```typescript
import { withAuthRequired } from '@noraneko/id-react';

function DashboardPage({ noranekoID }: WithNoranekoIDProps) {
  return (
    <div>
      <h1>Welcome, {noranekoID.user?.display_name}</h1>
      <DashboardContent />
    </div>
  );
}

// 認証保護されたコンポーネントとしてエクスポート
export default withAuthRequired(DashboardPage, {
  requiredScopes: ['dashboard'],
  loginOptions: {
    scopes: ['openid', 'profile', 'dashboard']
  }
});
```

#### ConditionalRender
認証状態に応じてコンテンツを切り替えます：

```typescript
import { ConditionalRender } from '@noraneko/id-react';

// 基本的な条件分岐
function NavBar() {
  return (
    <nav>
      <ConditionalRender
        authenticated={<UserMenu />}
        unauthenticated={<LoginButton />}
        loading={<Spinner />}
      />
    </nav>
  );
}

// ログインボタン自動表示（旧ProtectedRoute mode='manual'機能）
function PremiumSection() {
  return (
    <section>
      <h2>プレミアム機能</h2>
      <ConditionalRender
        showLoginButton={true}
        loginMessage="プレミアム機能をご利用いただくにはログインが必要です"
        loginButtonText="プレミアムアカウントでログイン"
        loginOptions={{
          scopes: ['premium'],
          additionalParams: { prompt: 'consent' }
        }}
      >
        <PremiumContent />
      </ConditionalRender>
    </section>
  );
}
```

### Hooks

#### useNoranekoID
統合された唯一のメインHook：

```typescript
import { useNoranekoID } from '@noraneko/id-react';

function MyComponent() {
  const { 
    // 認証状態
    isAuthenticated, 
    isLoading, 
    user,
    error,
    
    // アクション
    login, 
    logout,
    getAccessToken,
    refreshUser 
  } = useNoranekoID();
  
  if (isLoading) return <div>Loading...</div>;
  
  return isAuthenticated ? (
    <div>
      <h1>Welcome, {user?.display_name}</h1>
      <button onClick={() => logout()}>ログアウト</button>
    </div>
  ) : (
    <button onClick={() => login()}>ログイン</button>
  );
}
```

### Server-side機能

#### 認証付きAPI呼び出し
```typescript
import { authenticatedFetch } from '@noraneko/id-react/nextjs/server';

// サーバーアクション内で使用
async function deleteItem(id: string) {
  'use server';
  
  const response = await authenticatedFetch(`/api/items/${id}`, {
    method: 'DELETE'
  });
  
  return response.json();
}
```

#### 権限チェック
```typescript
import { requireAuthWithPermission, serverAuthorizers } from '@noraneko/id-react/nextjs/server';

export default async function AdminPage() {
  // 管理者権限が必要
  await requireAuthWithPermission(serverAuthorizers.admin);
  
  return <AdminDashboard />;
}
```

## 🔧 設定オプション

### NoranekoIDConfig
```typescript
interface NoranekoIDConfig {
  clientId: string;                    // OAuth2 クライアントID
  issuer: string;                      // 認証サーバーのベースURL
  redirectUri?: string;                // リダイレクトURI
  scopes?: string[];                   // 要求スコープ
  tokenStorage?: 'localStorage' | 'sessionStorage' | 'memory';
  storagePrefix?: string;              // ストレージキーのプレフィックス
  refreshThreshold?: number;           // トークン更新閾値（秒）
  clockSkewLeeway?: number;            // 時刻スキュー許容範囲（秒）
}
```

### Next.js設定
```typescript
interface NextJSConfig extends NoranekoIDConfig {
  useHttpOnlyCookies?: boolean;        // HttpOnly Cookie使用
  cookies?: {                          // Cookie設定
    prefix?: string;
    maxAge?: number;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  };
  apiRoute?: {                         // API Route設定
    basePath?: string;
  };
}
```

## 🛡️ セキュリティ機能

### 実装済みセキュリティ対策
- ✅ **OAuth2 + PKCE**: RFC 7636完全準拠
- ✅ **XSS対策**: URL検証、安全なリダイレクト
- ✅ **Open Redirect対策**: ホワイトリスト方式
- ✅ **CSRF対策**: SameSite Cookie、State parameter
- ✅ **HttpOnly Cookie**: セキュアなトークン保存

### セキュリティベストプラクティス
```typescript
// 1. HttpOnly Cookieを使用（本番環境推奨）
const config = {
  useHttpOnlyCookies: true,
  cookies: {
    secure: true,      // HTTPS必須
    sameSite: 'strict' // CSRF対策
  }
};

// 2. 適切なスコープ指定
const scopes = ['openid', 'profile', 'email']; // 必要最小限

// 3. トークン有効期限の適切な設定
const refreshThreshold = 300; // 5分前に更新
```

## 🔗 関連文書

- [Backend API仕様](../backend/API_REFERENCE.md) - サーバーサイドAPI
- [Web管理画面](../web/) - 管理コンソール  
- [一般開発文書](../general/) - 開発フロー・テスト

## 🛠️ 開発情報

### 必要環境
- **Node.js**: 16+
- **TypeScript**: 5+
- **React**: 16.8+ (Hooks対応)
- **Next.js**: 14+ (Next.js機能使用時)

### ビルド・テスト
```bash
# 開発
npm run dev

# ビルド
npm run build

# テスト
npm run test
npm run test:coverage

# 型チェック
npm run type-check

# Lint
npm run lint
npm run lint:fix
```

### パッケージ構造
```
@noraneko/id-react/
├── src/
│   ├── components/          # Reactコンポーネント
│   ├── context/            # Context Provider
│   ├── hooks/              # Reactフック
│   ├── nextjs/             # Next.js統合
│   │   ├── api/            # API Handlers
│   │   ├── client/         # クライアントサイド
│   │   ├── middleware/     # ミドルウェア
│   │   └── server/         # サーバーサイド
│   ├── types/              # 型定義
│   └── utils/              # ユーティリティ
├── dist/                   # ビルド出力
└── __tests__/              # テストファイル
```

## 🎯 設計原則

### セキュリティファースト
- 全ての機能でセキュリティを最優先
- デフォルトで安全な設定

### 型安全性
- TypeScript strict mode完全対応
- 実行時エラーの最小化

### Developer Experience
- 直感的なAPI設計
- 豊富な型情報とIntelliSense対応
- 詳細なエラーメッセージ

### パフォーマンス
- 最小限のバンドルサイズ
- 効率的な状態管理
- 適切なメモ化とキャッシュ

---

📝 **Last Updated**: 2025-01-15  
🔄 **Version**: v0.1.0  
📋 **Status**: ✅ 実装完了、テスト済み  
👥 **Maintainers**: noraneko-id development team