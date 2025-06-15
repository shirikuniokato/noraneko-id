# noraneko-id React SDK 要件仕様書（実装完了版）

## 概要

noraneko-id React SDKは、Reactアプリケーションがnoraneko-id OAuth2認証サーバーと簡単に連携できるようにするためのライブラリです。OAuth2 Authorization Code + PKCEフローを実装し、セキュアで使いやすいAPIを提供します。

**現在のステータス**: ✅ **実装完了・テスト済み**

## 設計目標（達成済み）

### 1. 実装負担の軽減 ✅
- 各クライアントアプリケーションでの認証・認可実装を最小化
- 複雑なOAuth2フローを抽象化し、シンプルなAPIで提供
- React固有の実装（Hooks、Context、Components）を完全実装
- Next.js特化機能（Server Components、Middleware、API Routes）も提供

### 2. セキュリティ ✅
- OAuth2 + PKCE (RFC 7636) 完全準拠
- セキュアなトークン管理（HttpOnly Cookie対応）
- CSRF攻撃対策（state parameter、SameSite Cookie）
- XSS・Open Redirect脆弱性対策実装済み
- 適切なトークン有効期限管理

### 3. 開発者体験 ✅
- TypeScript完全対応（strict mode）
- 直感的で分かりやすいAPI設計
- 豊富なドキュメントとサンプルコード
- デバッグしやすいエラーメッセージ
- IntelliSense対応の型定義

## 実装済み機能

### 1. React統合 ✅

#### 1.1 Context Provider
```typescript
// 実装済み - NoranekoIDProvider
import { NoranekoIDProvider } from '@noraneko/id-react';

function App() {
  return (
    <NoranekoIDProvider
      config={{
        clientId: 'your-client-id',
        issuer: 'https://id.example.com',
        scopes: ['openid', 'profile', 'email']
      }}
    >
      <MainApp />
    </NoranekoIDProvider>
  );
}
```

#### 1.2 React Hooks
```typescript
// 実装済み - メインフック
const { user, isAuthenticated, login, logout } = useNoranekoID();

// 実装済み - 特化フック
const { isAuthenticated, isLoading } = useAuthState();
const { user, refreshUser } = useUserInfo();
const { getAccessToken } = useAccessToken();
const { login, logout } = useAuthActions();
```

#### 1.3 Reactコンポーネント
```typescript
// 実装済み - 認証保護コンポーネント
<ProtectedRoute fallback={<Login />}>
  <Dashboard />
</ProtectedRoute>

// 実装済み - 条件表示コンポーネント
<ConditionalRender
  authenticated={<UserMenu />}
  unauthenticated={<LoginButton />}
/>
```

### 2. Next.js統合 ✅

#### 2.1 Server Components対応
```typescript
// 実装済み - サーバーサイド認証
import { requireAuth, getServerUserInfo } from '@noraneko/id-react/nextjs/server';

export default async function DashboardPage() {
  await requireAuth();
  const userInfo = await getServerUserInfo();
  return <Dashboard user={userInfo} />;
}
```

#### 2.2 API Routes
```typescript
// 実装済み - 自動APIハンドラー
import { createDefaultNoranekoIDHandler } from '@noraneko/id-react/nextjs/api';
export const { GET, POST, DELETE } = createDefaultNoranekoIDHandler();
```

#### 2.3 Middleware
```typescript
// 実装済み - 認証ミドルウェア
import { authMiddleware } from '@noraneko/id-react/nextjs/middleware';

export function middleware(request: NextRequest) {
  return authMiddleware({
    protectedPaths: ['/dashboard'],
    publicOnlyPaths: ['/login']
  })(request);
}
```

#### 2.4 HttpOnly Cookie対応
```typescript
// 実装済み - セキュアなトークン保存
const config = {
  useHttpOnlyCookies: true,
  cookies: {
    secure: true,
    sameSite: 'strict'
  }
};
```

### 3. セキュリティ機能 ✅

#### 3.1 脆弱性対策
```typescript
// 実装済み - URL検証ユーティリティ
import { isSafeRedirectUrl } from '@noraneko/id-react/utils';

// XSS対策
if (isSafeRedirectUrl(redirectUrl)) {
  safeRedirect(redirectUrl, '/default');
}

// Open Redirect対策
function safeServerRedirect(url: string, defaultUrl: string) {
  const targetUrl = isSafeServerRedirectUrl(url) ? url : defaultUrl;
  redirect(targetUrl);
}
```

#### 3.2 OAuth2 + PKCE
```typescript
// 実装済み - RFC 7636完全準拠
// - Code Verifier: 128文字のランダム文字列
// - Code Challenge Method: S256 (SHA256)
// - 自動的なchallenge/verifier生成・管理
```

### 4. 状態管理 ✅

#### 4.1 Reducer-based状態管理
```typescript
// 実装済み - 型安全な状態管理
export type NoranekoIDAction =
  | { type: 'INITIALIZE_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'LOGOUT_SUCCESS' }
  // ... 他のアクション型
```

#### 4.2 エラーハンドリング
```typescript
// 実装済み - 詳細なエラー分類
export interface UseNoranekoIDResult {
  error: Error | null;
  isLoading: boolean;
  isInitializing: boolean;
  // ... 他のプロパティ
}
```

## 技術仕様（実装済み）

### 1. 対応環境 ✅
- **React**: 16.8+ (Hooks対応)
- **Next.js**: 14+ (App Router)
- **TypeScript**: 5+ (strict mode完全対応)
- **Node.js**: 16+ (開発・ビルド環境)

### 2. パッケージ形式 ✅
```json
{
  "main": "dist/index.js",
  "module": "dist/index.esm.js",  
  "types": "dist/index.d.ts",
  "exports": {
    ".": "./dist/index.esm.js",
    "./nextjs": "./dist/nextjs/index.esm.js",
    "./nextjs/client": "./dist/nextjs/client.esm.js",
    "./nextjs/server": "./dist/nextjs/server.esm.js"
  }
}
```

### 3. 依存関係 ✅
```json
{
  "dependencies": {
    "@noraneko/id-sdk": "file:../sdk",
    "tslib": "^2.8.1"
  },
  "peerDependencies": {
    "react": ">=16.8.0",
    "react-dom": ">=16.8.0"
  }
}
```

## 実装されたAPI

### 1. React Provider ✅
```typescript
// 完全実装済み
export interface NoranekoIDProviderProps {
  config: NoranekoIDConfig;
  children: ReactNode;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode | ((error: Error) => ReactNode);
  onInitialized?: () => void;
  onInitializationError?: (error: Error) => void;
}
```

### 2. React Hooks ✅
```typescript
// 全て実装済み
export function useNoranekoID(): UseNoranekoIDResult;
export function useAuthState(): UseAuthStateResult;
export function useUserInfo(): UseUserInfoResult;
export function useAccessToken(): UseAccessTokenResult;
export function useAuthActions(): UseAuthActionsResult;
```

### 3. Next.js サーバーサイド ✅
```typescript
// 完全実装済み
export async function requireAuth(options?: { cookiePrefix?: string; redirectTo?: string }): Promise<AuthTokens>;
export async function getServerUserInfo(options?: { cookiePrefix?: string; issuer?: string }): Promise<ServerUserInfo | null>;
export async function requireAuthWithPermission(authorizer: Function, options?: {}): Promise<ServerUserInfo>;
export async function authenticatedFetch(url: string, options?: RequestInit): Promise<Response>;
export async function logout(options?: {}): Promise<{ success: boolean; actions: string[] }>;
```

## セキュリティ実装（完了済み）

### 1. 脆弱性対策 ✅
```typescript
// XSS対策 - 実装済み
export function isSafeRedirectUrl(url: string): boolean;

// Open Redirect対策 - 実装済み  
function safeServerRedirect(url: string, defaultUrl: string): never;

// CSRF対策 - HttpOnly Cookie実装済み
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const
};
```

### 2. OAuth2 + PKCE ✅
- RFC 7636完全準拠（Core SDKで実装済み）
- 暗号学的に安全な乱数生成
- SHA256ハッシュによるchallenge生成

### 3. エラーハンドリング ✅
```typescript
// 実装済み型安全なエラー処理
export type NoranekoIDAction =
  | { type: 'INITIALIZE_ERROR'; payload: Error }
  | { type: 'AUTH_ERROR'; payload: Error }
  | { type: 'LOGOUT_ERROR'; payload: Error }
  // ...その他のアクション
```

## テスト実装状況 ✅

### 1. 単体テスト ✅
- ✅ Components: ProtectedRoute, ConditionalRender
- ✅ Context: NoranekoIDProvider  
- ✅ Hooks: useNoranekoID, useAuthState, useUserInfo

### 2. テスト環境設定 ✅
```typescript
// test-setup.ts - 完全実装済み
// - TextEncoder/TextDecoder polyfill
// - Crypto API mock
// - fetch mock
// - localStorage/sessionStorage mock
// - 型安全なモック関数
```

## 開発・ビルド環境 ✅

### 1. ビルドツール ✅
```json
{
  "scripts": {
    "build": "rollup -c",
    "test": "jest",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx"
  }
}
```

### 2. 品質保証 ✅
- ✅ TypeScript strict mode
- ✅ ESLint + React hooks rules
- ✅ Jest + React Testing Library
- ✅ Rollup + TypeScript bundling

## 今後の拡張予定

### 短期計画（3ヶ月以内）
- [ ] Vue.js統合パッケージ（@noraneko/id-vue）
- [ ] WebAuthn多要素認証対応
- [ ] Session management（複数タブ同期）

### 中期計画（6ヶ月以内）
- [ ] React Native対応
- [ ] Electron対応
- [ ] Progressive Web App最適化

### 長期計画（1年以内）
- [ ] Angular統合パッケージ
- [ ] Svelte統合パッケージ
- [ ] Micro-frontends対応

---

📝 **最終更新**: 2025-01-15  
🔄 **バージョン**: v0.1.0  
📋 **ステータス**: ✅ **実装完了・本番レディ**  
👥 **メンテナ**: noraneko-id development team