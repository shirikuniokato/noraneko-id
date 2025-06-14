/**
 * Next.js App Router用の認証HOC
 */

import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession, getSessionFromHeaders } from './getServerSession';
import type { WithAuthOptions, AuthMiddlewareConfig, SessionData } from './types';

/**
 * Server Componentを認証で保護するHOC
 * 
 * @param WrappedComponent 保護対象のServer Component
 * @param config 認証設定
 * @param options 認証オプション
 * @returns 認証保護されたコンポーネント
 * 
 * @example
 * ```typescript
 * // app/dashboard/page.tsx
 * import { withAuth } from '@noraneko/id-react/middleware';
 * 
 * async function DashboardPage({ session }: { session: SessionData }) {
 *   return (
 *     <div>
 *       <h1>Welcome, {session.user.display_name}!</h1>
 *       <p>Email: {session.user.email}</p>
 *     </div>
 *   );
 * }
 * 
 * export default withAuth(DashboardPage, {
 *   issuer: process.env.NORANEKO_ISSUER!,
 * });
 * ```
 * 
 * @example
 * ```typescript
 * // 管理者専用ページ
 * async function AdminPage({ session }: { session: SessionData }) {
 *   return <AdminDashboard user={session.user} />;
 * }
 * 
 * export default withAuth(AdminPage, 
 *   { issuer: process.env.NORANEKO_ISSUER! },
 *   { requireAdmin: true }
 * );
 * ```
 */
export function withAuth<P extends object = {}>(
  WrappedComponent: React.ComponentType<P & { session: SessionData }>,
  config: AuthMiddlewareConfig,
  options: WithAuthOptions = {}
): React.ComponentType<P> {
  const {
    requiredScopes = [],
    requireAdmin = false,
    customAuthCheck,
  } = options;

  const AuthenticatedComponent = async (props: P) => {
    // セッション取得
    const session = await getServerSession(config);

    // 未認証の場合はログインページにリダイレクト
    if (!session) {
      redirect('/auth/login');
    }

    // 管理者権限チェック
    if (requireAdmin && !session.user.is_admin) {
      redirect('/403'); // 403 Forbiddenページにリダイレクト
    }

    // 必要なスコープチェック
    if (requiredScopes.length > 0) {
      const hasRequiredScopes = requiredScopes.every(scope => 
        session.scopes.includes(scope)
      );
      
      if (!hasRequiredScopes) {
        redirect('/403');
      }
    }

    // カスタム認証チェック
    if (customAuthCheck) {
      // Server Componentでは仮のrequestオブジェクトを作成
      const mockRequest = createMockRequest();
      const isAuthorized = customAuthCheck(session, mockRequest);
      
      if (!isAuthorized) {
        redirect('/403');
      }
    }

    // 認証済みコンポーネントをレンダリング
    return <WrappedComponent {...props} session={session} />;
  };

  // デバッグ用のdisplayName設定
  AuthenticatedComponent.displayName = `withAuth(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return AuthenticatedComponent;
}

/**
 * Client Component用の認証HOC
 * Next.js App Routerでクライアントサイドの認証保護を実現
 * 
 * @example
 * ```typescript
 * // app/dashboard/client-page.tsx
 * 'use client';
 * 
 * import { withClientAuth } from '@noraneko/id-react/middleware';
 * import { useNoranekoID } from '@noraneko/id-react';
 * 
 * function ClientDashboard() {
 *   const { user } = useNoranekoID();
 *   
 *   return (
 *     <div>
 *       <h1>Client Dashboard</h1>
 *       <p>User: {user?.display_name}</p>
 *     </div>
 *   );
 * }
 * 
 * export default withClientAuth(ClientDashboard, {
 *   requireAdmin: true
 * });
 * ```
 */
export function withClientAuth<P extends object = {}>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthOptions = {}
): React.ComponentType<P> {
  const {
    requiredScopes = [],
    requireAdmin = false,
    loading: LoadingComponent,
    fallback: FallbackComponent,
    unauthorized: UnauthorizedComponent,
  } = options;

  const ClientAuthenticatedComponent = (props: P) => {
    // この実装はクライアントサイドでのみ動作
    if (typeof window === 'undefined') {
      // サーバーサイドでは何も表示しない
      return null;
    }

    // React Hooksを使用（クライアントサイドでのみ実行）
    const React = require('react');
    const { useNoranekoID } = require('../hooks/useNoranekoID');
    
    const [isClient, setIsClient] = React.useState(false);
    const { isAuthenticated, isLoading, user, isInitializing } = useNoranekoID();

    React.useEffect(() => {
      setIsClient(true);
    }, []);

    // クライアントサイドの準備ができていない場合
    if (!isClient) {
      return LoadingComponent ? <LoadingComponent /> : <div>Loading...</div>;
    }

    // 初期化中またはローディング中
    if (isInitializing || isLoading) {
      return LoadingComponent ? <LoadingComponent /> : <div>Loading...</div>;
    }

    // 未認証
    if (!isAuthenticated || !user) {
      return FallbackComponent ? <FallbackComponent /> : <div>Please log in</div>;
    }

    // 管理者権限チェック
    if (requireAdmin && !user.is_admin) {
      return UnauthorizedComponent ? <UnauthorizedComponent /> : <div>Unauthorized</div>;
    }

    // スコープチェック（実装は将来的に追加）
    // TODO: クライアントサイドでのスコープ情報取得

    return <WrappedComponent {...props} />;
  };

  ClientAuthenticatedComponent.displayName = `withClientAuth(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return ClientAuthenticatedComponent;
}

/**
 * 条件付き認証HOC
 * 特定の条件下でのみ認証を要求
 * 
 * @example
 * ```typescript
 * function ProfilePage({ session }: { session?: SessionData }) {
 *   if (session) {
 *     return <AuthenticatedProfile user={session.user} />;
 *   }
 *   
 *   return <PublicProfile />;
 * }
 * 
 * export default withConditionalAuth(ProfilePage, 
 *   { issuer: process.env.NORANEKO_ISSUER! },
 *   { condition: (pathname) => pathname.includes('/edit') }
 * );
 * ```
 */
export function withConditionalAuth<P extends object = {}>(
  WrappedComponent: React.ComponentType<P & { session?: SessionData }>,
  config: AuthMiddlewareConfig,
  options: WithAuthOptions & {
    condition: (pathname: string) => boolean;
  }
): React.ComponentType<P> {
  const ConditionalAuthComponent = async (props: P) => {
    // 現在のパス情報を取得（実装は簡略化）
    const pathname = '/'; // 実際の実装では headers() から取得

    const requiresAuth = options.condition(pathname);

    if (requiresAuth) {
      // 認証が必要な場合は通常のwithAuthを適用
      const AuthenticatedComponent = withAuth(
        WrappedComponent as React.ComponentType<P & { session: SessionData }>,
        config,
        options
      );
      return <AuthenticatedComponent {...props} />;
    } else {
      // 認証が不要な場合はセッション情報のみ渡す
      const session = await getServerSession(config);
      return <WrappedComponent {...props} session={session} />;
    }
  };

  ConditionalAuthComponent.displayName = `withConditionalAuth(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return ConditionalAuthComponent;
}

/**
 * Server Component用のモックrequestオブジェクト作成
 */
function createMockRequest(): any {
  // 実際の実装では headers() から必要な情報を取得
  return {
    nextUrl: {
      pathname: '/',
      searchParams: new URLSearchParams(),
    },
  };
}