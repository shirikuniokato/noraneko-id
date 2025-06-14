# 実装例とベストプラクティス

## 基本的なNext.jsアプリケーション構成

### プロジェクト構造

```
my-app/
├── middleware.ts                 # 認証ミドルウェア
├── app/
│   ├── layout.tsx               # ルートレイアウト
│   ├── page.tsx                 # ホームページ
│   ├── auth/
│   │   ├── login/page.tsx       # ログインページ
│   │   └── callback/page.tsx    # 認証コールバック
│   ├── dashboard/
│   │   ├── layout.tsx           # ダッシュボードレイアウト
│   │   └── page.tsx             # ダッシュボード（保護済み）
│   └── admin/
│       └── page.tsx             # 管理者ページ
└── next.config.js
```

### 1. ミドルウェア設定 (middleware.ts)

```typescript
import { createAuthMiddleware } from '@noraneko/id-react/middleware';

const authMiddleware = createAuthMiddleware(
  {
    issuer: process.env.NORANEKO_ISSUER!,
    sessionCookieName: 'noraneko-session'
  },
  {
    // 保護されたルート
    protectedRoutes: [
      '/dashboard/**',
      '/admin/**',
      '/profile/**'
    ],
    
    // 管理者専用ルート
    adminRoutes: [
      '/admin/**'
    ],
    
    // パブリックルート（保護対象から除外）
    publicRoutes: [
      '/',
      '/about',
      '/auth/**',
      '/api/health'
    ],
    
    // 認証設定
    loginUrl: '/auth/login',
    callbackRoute: '/auth/callback',
    defaultRedirectTo: '/dashboard',
    
    // カスタムコールバック
    onAuthenticationRequired: async (request, session) => {
      console.log('Authentication required for:', request.nextUrl.pathname);
    },
    
    onAuthenticationSuccess: async (request, session) => {
      console.log('User authenticated:', session.user.email);
    }
  }
);

export default authMiddleware;

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*', 
    '/profile/:path*'
  ]
};
```

### 2. ルートレイアウト (app/layout.tsx)

```typescript
import { NoranekoIDProvider } from '@noraneko/id-react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <NoranekoIDProvider
          config={{
            clientId: process.env.NEXT_PUBLIC_NORANEKO_CLIENT_ID!,
            issuer: process.env.NEXT_PUBLIC_NORANEKO_ISSUER!,
            redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
            scopes: ['openid', 'profile', 'email'],
          }}
        >
          {children}
        </NoranekoIDProvider>
      </body>
    </html>
  );
}
```

### 3. ログインページ (app/auth/login/page.tsx)

```typescript
'use client';

import { useNoranekoID } from '@noraneko/id-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginForm() {
  const { login, isLoading } = useNoranekoID();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const returnTo = searchParams.get('returnTo') || '/dashboard';

  const handleLogin = async () => {
    try {
      await login({
        scopes: ['openid', 'profile', 'email'],
        additionalParams: {
          state: returnTo // ログイン後のリダイレクト先
        }
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="login-page">
      <h1>ログイン</h1>
      <button 
        onClick={handleLogin} 
        disabled={isLoading}
        className="login-button"
      >
        {isLoading ? 'ログイン中...' : 'noraneko-idでログイン'}
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
```

### 4. 認証コールバック (app/auth/callback/page.tsx)

```typescript
'use client';

import { useEffect } from 'react';
import { useNoranekoID } from '@noraneko/id-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CallbackPage() {
  const { handleCallback, isLoading } = useNoranekoID();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const processCallback = async () => {
      try {
        await handleCallback();
        
        // ログイン成功後のリダイレクト
        const returnTo = searchParams.get('state') || '/dashboard';
        router.push(returnTo);
      } catch (error) {
        console.error('Callback processing failed:', error);
        router.push('/auth/login?error=callback_failed');
      }
    };

    processCallback();
  }, [handleCallback, router, searchParams]);

  if (isLoading) {
    return (
      <div className="callback-loading">
        <h2>認証処理中...</h2>
        <p>しばらくお待ちください。</p>
      </div>
    );
  }

  return null;
}
```

### 5. 保護されたページ (app/dashboard/page.tsx)

```typescript
import { withAuth } from '@noraneko/id-react/middleware';
import { DashboardContent } from './components/DashboardContent';

async function DashboardPage({ session }) {
  return (
    <div>
      <h1>ダッシュボード</h1>
      <p>ようこそ、{session.user.display_name}さん！</p>
      <DashboardContent user={session.user} />
    </div>
  );
}

export default withAuth(DashboardPage, {
  issuer: process.env.NORANEKO_ISSUER!,
});
```

### 6. 管理者専用ページ (app/admin/page.tsx)

```typescript
import { withAuth } from '@noraneko/id-react/middleware';
import { AdminDashboard } from './components/AdminDashboard';

async function AdminPage({ session }) {
  return (
    <div>
      <h1>管理者ダッシュボード</h1>
      <AdminDashboard user={session.user} />
    </div>
  );
}

export default withAuth(
  AdminPage, 
  { issuer: process.env.NORANEKO_ISSUER! },
  { requireAdmin: true }
);
```

### 7. ハイブリッドページ (Server + Client)

```typescript
// app/profile/page.tsx
import { getServerSession } from '@noraneko/id-react/middleware';
import { ProfileEditor } from './ProfileEditor';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const session = await getServerSession({
    issuer: process.env.NORANEKO_ISSUER!,
  });

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <div>
      <h1>プロフィール</h1>
      
      {/* Server Component部分 */}
      <div className="profile-info">
        <h2>{session.user.display_name}</h2>
        <p>Email: {session.user.email}</p>
        <p>Username: {session.user.username}</p>
      </div>
      
      {/* Client Component部分 */}
      <ProfileEditor initialData={session.user} />
    </div>
  );
}
```

```typescript
// app/profile/ProfileEditor.tsx
'use client';

import { useNoranekoID } from '@noraneko/id-react';
import { useState } from 'react';

export function ProfileEditor({ initialData }) {
  const { getAccessToken, refreshUser } = useNoranekoID();
  const [profile, setProfile] = useState(initialData);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateProfile = async (newData) => {
    setIsUpdating(true);
    try {
      const token = await getAccessToken();
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newData),
      });

      if (response.ok) {
        await refreshUser(); // ユーザー情報を再取得
        setProfile(newData);
      }
    } catch (error) {
      console.error('Profile update failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="profile-editor">
      {/* プロフィール編集フォーム */}
      <button 
        onClick={() => updateProfile({ ...profile, display_name: 'New Name' })}
        disabled={isUpdating}
      >
        {isUpdating ? '更新中...' : 'プロフィール更新'}
      </button>
    </div>
  );
}
```

### 8. API Route (app/api/profile/route.ts)

```typescript
import { getServerSession } from '@noraneko/id-react/middleware';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession({
      issuer: process.env.NORANEKO_ISSUER!,
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // プロフィール更新ロジック
    const updatedProfile = await updateUserProfile(session.userId, body);
    
    return NextResponse.json(updatedProfile);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 9. 環境変数設定 (.env.local)

```env
# Public (クライアントサイドで使用)
NEXT_PUBLIC_NORANEKO_CLIENT_ID=your-client-id
NEXT_PUBLIC_NORANEKO_ISSUER=https://id.example.com
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Private (サーバーサイドのみ)
NORANEKO_ISSUER=https://id.example.com
NORANEKO_API_KEY=your-api-key
```

### 10. Next.js設定 (next.config.js)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@noraneko/id-react']
  },
  
  // CORS設定（必要に応じて）
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NORANEKO_ISSUER },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

## ベストプラクティス

### セキュリティ

1. **環境変数の管理**
   - パブリック変数とプライベート変数を適切に分離
   - 本番環境では必ずHTTPS使用

2. **セッション管理**
   - 適切なCookie設定（httpOnly, secure, sameSite）
   - セッションの定期的なローテーション

3. **CSRF対策**
   - API RouteでのCSRFトークン検証
   - SameSite Cookieの使用

### パフォーマンス

1. **Server Componentの活用**
   - 認証情報の事前取得
   - 不要なクライアントサイドレンダリングの回避

2. **キャッシュ戦略**
   - セッション情報の適切なキャッシュ
   - APIレスポンスのキャッシュ

3. **コード分割**
   - 認証関連コンポーネントの遅延読み込み
   - ルートベースのコード分割

### 開発効率

1. **型安全性**
   - TypeScriptを活用した型定義
   - セッションデータの型チェック

2. **デバッグ**
   - 開発環境でのログ出力
   - 認証フローの可視化

3. **テスト**
   - 認証済み/未認証状態のテスト
   - ミドルウェアの単体テスト