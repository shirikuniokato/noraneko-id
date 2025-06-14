# Next.js Middleware for noraneko-id

Next.js App Routerでサーバーサイド認証を実現するミドルウェア集です。

## 基本的な使用方法

### 1. ミドルウェアの設定

```typescript
// middleware.ts (プロジェクトルート)
import { createAuthMiddleware } from '@noraneko/id-react/middleware';

const authMiddleware = createAuthMiddleware(
  {
    issuer: 'https://id.example.com',
    sessionCookieName: 'noraneko-session'
  },
  {
    protectedRoutes: ['/dashboard/**', '/admin/**'],
    adminRoutes: ['/admin/**'],
    loginUrl: '/auth/login',
    callbackRoute: '/auth/callback'
  }
);

export default authMiddleware;

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*']
};
```

### 2. Server Componentでの認証

```typescript
// app/dashboard/page.tsx
import { withAuth } from '@noraneko/id-react/middleware';

async function DashboardPage({ session }) {
  return (
    <div>
      <h1>Welcome, {session.user.display_name}!</h1>
    </div>
  );
}

export default withAuth(DashboardPage, {
  issuer: process.env.NORANEKO_ISSUER!,
});
```

### 3. セッション情報の取得

```typescript
// Server Action or API Route
import { getServerSession } from '@noraneko/id-react/middleware';

export async function updateProfile(formData: FormData) {
  'use server';
  
  const session = await getServerSession({
    issuer: process.env.NORANEKO_ISSUER!,
  });

  if (!session) {
    throw new Error('Unauthorized');
  }

  // プロフィール更新処理...
}
```

## 高度な使用例

### カスタム認証ロジック

```typescript
const authMiddleware = createAuthMiddleware(
  {
    issuer: 'https://id.example.com',
    customSessionValidator: async (request) => {
      // カスタムセッション検証ロジック
      const token = request.headers.get('authorization');
      return validateCustomToken(token);
    }
  },
  {
    protectedRoutes: [
      '/dashboard/**',
      (pathname, request) => {
        // 動的ルートマッチング
        return pathname.startsWith('/user/') && pathname.includes('/edit');
      }
    ],
    onAuthenticationRequired: async (request, session) => {
      // カスタム未認証処理
      return new Response('Custom login required', { status: 401 });
    }
  }
);
```

### 管理者専用ページ

```typescript
// app/admin/page.tsx
import { withAuth } from '@noraneko/id-react/middleware';

async function AdminPage({ session }) {
  return <AdminDashboard user={session.user} />;
}

export default withAuth(AdminPage, 
  { issuer: process.env.NORANEKO_ISSUER! },
  { requireAdmin: true }
);
```

### Client Componentでの認証

```typescript
// app/dashboard/client-page.tsx
'use client';

import { withClientAuth } from '@noraneko/id-react/middleware';

function ClientDashboard() {
  return <div>Client Dashboard</div>;
}

export default withClientAuth(ClientDashboard, {
  requireAdmin: true,
  loading: () => <div>Loading...</div>,
  unauthorized: () => <div>Access denied</div>
});
```

## API Reference

### createAuthMiddleware(config, options)

認証ミドルウェアを生成します。

**config:**
- `issuer`: noraneko-id APIサーバーのURL
- `sessionCookieName`: セッションCookie名
- `customSessionValidator`: カスタムセッション検証関数

**options:**
- `protectedRoutes`: 保護するルートパターン
- `adminRoutes`: 管理者専用ルート
- `loginUrl`: ログインページURL
- `callbackRoute`: 認証コールバックルート

### withAuth(Component, config, options)

Server Componentを認証で保護するHOC。

**options:**
- `requireAdmin`: 管理者権限を要求
- `requiredScopes`: 必要なスコープ
- `customAuthCheck`: カスタム認証チェック関数

### getServerSession(config)

Server ComponentやServer Actionでセッション情報を取得。

### getSessionFromHeaders()

ミドルウェアで設定されたヘッダーからセッション情報を取得。

## 環境変数

```env
NORANEKO_ISSUER=https://id.example.com
NORANEKO_SESSION_COOKIE_NAME=noraneko-session
```

## セキュリティ考慮事項

1. **HTTPS必須**: 本番環境では必ずHTTPSを使用
2. **Cookie設定**: セッションCookieは`httpOnly`、`secure`、`sameSite`を適切に設定
3. **CSRF対策**: APIルートでは適切なCSRF対策を実装
4. **セッション管理**: 適切なセッション有効期限とローテーション

## トラブルシューティング

### よくある問題

1. **"Authentication required" エラー**
   - セッションCookieが正しく設定されているか確認
   - issuer URLが正しいか確認

2. **ミドルウェアが動作しない**
   - `next.config.js`のmatcher設定を確認
   - ミドルウェアファイルの配置場所を確認

3. **Server Componentで認証情報が取得できない**
   - `getServerSession`を`async`関数内で呼び出しているか確認
   - 適切なconfigを渡しているか確認