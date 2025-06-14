# @noraneko/id-react

React integration for noraneko-id OAuth2 authentication

## 概要

`@noraneko/id-react` は、Reactアプリケーションでnoraneko-id OAuth2認証を簡単に実装するためのReact Hooksとコンポーネントを提供します。

## 特徴

- 🎣 **React Hooks**: `useNoranekoID` など使いやすいフック群
- 🏗️ **Context Provider**: アプリ全体での認証状態共有
- 🛡️ **保護されたルート**: 認証が必要なページの簡単な実装
- 🔄 **自動状態管理**: 認証状態の自動更新・同期
- 📱 **TypeScript完全対応**: 型安全なReact開発
- ⚡ **パフォーマンス最適化**: 必要最小限の再レンダリング

## インストール

```bash
# GitHubから直接インストール（推奨）
npm install "github:noraneko-id/noraneko-id#main"

# または package.json に記述
{
  "dependencies": {
    "@noraneko/id-react": "github:noraneko-id/noraneko-id#main"
  }
}
```

詳細なインストール方法は [INSTALL.md](../../INSTALL.md) を参照してください。

## 基本的な使用方法

### 1. プロバイダーの設定

```jsx
import { NoranekoIDProvider } from '@noraneko/id-react';

function App() {
  return (
    <NoranekoIDProvider
      config={{
        clientId: process.env.NEXT_PUBLIC_NORANEKO_CLIENT_ID,
        issuer: process.env.NEXT_PUBLIC_NORANEKO_ISSUER,
        redirectUri: `${window.location.origin}/auth/callback`
      }}
    >
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </Router>
    </NoranekoIDProvider>
  );
}
```

### 2. メインフックの使用

```jsx
import { useNoranekoID } from '@noraneko/id-react';

function Dashboard() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    login, 
    logout 
  } = useNoranekoID();

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div>
        <h1>ログインが必要です</h1>
        <button onClick={() => login()}>ログイン</button>
      </div>
    );
  }

  return (
    <div>
      <h1>ダッシュボード</h1>
      <p>ようこそ、{user?.display_name}さん！</p>
      <button onClick={() => logout()}>ログアウト</button>
    </div>
  );
}
```

### 3. 保護されたルート

```jsx
import { ProtectedRoute } from '@noraneko/id-react';

function App() {
  return (
    <NoranekoIDProvider config={config}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute 
              requiredPermissions={['admin']}
              hasPermission={(user, permissions) => user.is_admin}
            >
              <AdminPanel />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </NoranekoIDProvider>
  );
}
```

### 4. 認証コールバック処理

```jsx
import { useNoranekoID } from '@noraneko/id-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AuthCallback() {
  const { isLoading, error } = useNoranekoID();
  const navigate = useNavigate();

  useEffect(() => {
    // コールバック処理は Provider で自動実行される
    if (!isLoading && !error) {
      navigate('/dashboard');
    }
  }, [isLoading, error, navigate]);

  if (error) {
    return <div>認証エラー: {error.message}</div>;
  }

  return <div>認証処理中...</div>;
}
```

## API リファレンス

### フック群

#### `useNoranekoID()`
メインの認証フック

```typescript
const {
  user,              // ユーザー情報
  isAuthenticated,   // 認証状態
  isLoading,         // ローディング状態
  isInitializing,    // 初期化中
  error,             // エラー情報
  login,             // ログイン関数
  logout,            // ログアウト関数
  getAccessToken,    // アクセストークン取得
  refreshUser,       // ユーザー情報更新
  refreshTokens      // トークン更新
} = useNoranekoID();
```

#### `useAuthState()`
認証状態のみを監視

```typescript
const { 
  isAuthenticated, 
  isLoading, 
  isInitializing, 
  error 
} = useAuthState();
```

#### `useUserInfo()`
ユーザー情報のみを管理

```typescript
const { 
  user, 
  isLoading, 
  error, 
  refreshUser 
} = useUserInfo();
```

#### `useAccessToken()`
トークン管理専用

```typescript
const { 
  accessToken, 
  isLoading, 
  error, 
  getAccessToken, 
  refreshTokens 
} = useAccessToken();
```

#### `useAuthActions()`
認証操作専用

```typescript
const { 
  login, 
  logout, 
  isLoading, 
  error 
} = useAuthActions();
```

### コンポーネント

#### `<ProtectedRoute>`
認証が必要なルートを保護

```jsx
<ProtectedRoute
  fallback={<LoginRequired />}           // 未認証時の表示
  redirectTo="/login"                    // 未認証時のリダイレクト先
  returnTo="/dashboard"                  // 認証後のリダイレクト先
  requiredPermissions={['admin']}        // 必要な権限
  hasPermission={(user, perms) => bool}  // 権限チェック関数
>
  <AdminPanel />
</ProtectedRoute>
```

#### `<LoginRequired>`
ログインを促すコンポーネント

```jsx
<LoginRequired
  message="この機能を使用するにはログインが必要です"
  loginText="ログイン"
  loginOptions={{ scopes: ['profile'] }}
  className="custom-login-style"
/>
```

#### `<ConditionalRender>`
認証状態による条件表示

```jsx
<ConditionalRender
  authenticated={<UserMenu />}
  unauthenticated={<LoginButton />}
  loading={<Spinner />}
  error={(error) => <ErrorMessage error={error} />}
/>
```

### プロバイダー

#### `<NoranekoIDProvider>`
認証コンテキストを提供

```jsx
<NoranekoIDProvider
  config={{
    clientId: 'your-client-id',
    issuer: 'https://id.noraneko.dev'
  }}
  loadingComponent={<Loading />}          // 初期化中の表示
  errorComponent={<Error />}              // 初期化エラー時の表示
  onInitialized={() => console.log('Ready')}
  onInitializationError={(err) => console.error(err)}
>
  <App />
</NoranekoIDProvider>
```

## Next.js での使用例

### App Router

```jsx
// app/layout.tsx
import { NoranekoIDProvider } from '@noraneko/id-react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NoranekoIDProvider
          config={{
            clientId: process.env.NEXT_PUBLIC_NORANEKO_CLIENT_ID!,
            issuer: process.env.NEXT_PUBLIC_NORANEKO_ISSUER!,
          }}
        >
          {children}
        </NoranekoIDProvider>
      </body>
    </html>
  );
}
```

```jsx
// app/dashboard/page.tsx
'use client';
import { useNoranekoID, ProtectedRoute } from '@noraneko/id-react';

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user, logout } = useNoranekoID();
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.display_name}!</p>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}
```

### Pages Router

```jsx
// pages/_app.tsx
import { NoranekoIDProvider } from '@noraneko/id-react';

export default function App({ Component, pageProps }) {
  return (
    <NoranekoIDProvider
      config={{
        clientId: process.env.NEXT_PUBLIC_NORANEKO_CLIENT_ID!,
        issuer: process.env.NEXT_PUBLIC_NORANEKO_ISSUER!,
      }}
    >
      <Component {...pageProps} />
    </NoranekoIDProvider>
  );
}
```

## 高度な使用方法

### カスタムフックの作成

```typescript
import { useNoranekoID } from '@noraneko/id-react';

export function useAdminAccess() {
  const { user, isAuthenticated } = useNoranekoID();
  
  const isAdmin = isAuthenticated && user?.is_admin === true;
  const canAccessAdmin = isAdmin;
  
  return {
    isAdmin,
    canAccessAdmin,
    user
  };
}
```

### イベントリスナーの使用

```jsx
import { useNoranekoID } from '@noraneko/id-react';
import { useEffect } from 'react';

function App() {
  const { addEventListener, removeEventListener } = useNoranekoID();
  
  useEffect(() => {
    const handleAuth = (user) => {
      console.log('User authenticated:', user);
      // 分析イベントの送信など
    };
    
    addEventListener('authenticated', handleAuth);
    
    return () => {
      removeEventListener('authenticated', handleAuth);
    };
  }, [addEventListener, removeEventListener]);
  
  return <div>...</div>;
}
```

## TypeScript サポート

完全なTypeScript型定義が含まれています：

```typescript
import type { 
  UseNoranekoIDResult,
  NoranekoIDProviderProps,
  ProtectedRouteProps,
  User 
} from '@noraneko/id-react';

const MyComponent: React.FC = () => {
  const result: UseNoranekoIDResult = useNoranekoID();
  const user: User | null = result.user;
  
  return <div>{user?.display_name}</div>;
};
```

## ライセンス

MIT License