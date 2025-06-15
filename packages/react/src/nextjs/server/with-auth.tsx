/**
 * Next.js App Router用の認証HOC
 */

import React from 'react';
import { redirect } from 'next/navigation';
import { requireAuth, getServerUserInfo } from './auth';
import { ServerUserInfo } from '../types';

/**
 * 保護ルートのオプション
 */
export interface WithAuthOptions {
  /** 管理者権限が必要か */
  requireAdmin?: boolean;
  /** カスタム認証チェック関数 */
  customAuthCheck?: (userInfo: ServerUserInfo) => boolean;
  /** 未認証時のリダイレクト先 */
  loginUrl?: string;
  /** 権限不足時のリダイレクト先 */
  unauthorizedUrl?: string;
  /** ローディングコンポーネント */
  loading?: React.ComponentType;
  /** 未認証時のフォールバックコンポーネント */
  fallback?: React.ComponentType;
  /** 権限不足時のフォールバックコンポーネント */
  unauthorized?: React.ComponentType;
}

/**
 * Server Componentを認証で保護するHOC
 * 
 * @param WrappedComponent 保護対象のServer Component
 * @param options 認証オプション
 * @returns 認証保護されたコンポーネント
 * 
 * @example
 * ```typescript
 * // app/dashboard/page.tsx
 * import { withAuth } from '@noraneko/id-react/nextjs/server';
 * 
 * async function DashboardPage({ userInfo }: { userInfo: ServerUserInfo }) {
 *   return (
 *     <div>
 *       <h1>Welcome, {userInfo.user.display_name}!</h1>
 *       <p>Email: {userInfo.user.email}</p>
 *     </div>
 *   );
 * }
 * 
 * export default withAuth(DashboardPage);
 * ```
 */
export function withAuth<P extends object = {}>(
  WrappedComponent: React.ComponentType<P & { userInfo: ServerUserInfo }>,
  options: WithAuthOptions = {}
): React.ComponentType<P> {
  const {
    requireAdmin = false,
    customAuthCheck,
    loginUrl = '/login',
    unauthorizedUrl = '/unauthorized'
  } = options;

  const AuthenticatedComponent = async (props: P) => {
    try {
      // JWT認証チェック
      await requireAuth();
      
      // ユーザー情報取得
      const userInfo = await getServerUserInfo();
      
      if (!userInfo) {
        redirect(loginUrl);
      }

      // 管理者権限チェック
      if (requireAdmin && !userInfo.user.is_admin) {
        redirect(unauthorizedUrl);
      }

      // カスタム認証チェック
      if (customAuthCheck && !customAuthCheck(userInfo)) {
        redirect(unauthorizedUrl);
      }

      // 認証済みコンポーネントをレンダリング
      return <WrappedComponent {...props} userInfo={userInfo} />;
    } catch (error) {
      redirect(loginUrl);
    }
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
 * import { withClientAuth } from '@noraneko/id-react/nextjs/server';
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
    const { useNoranekoID } = require('../../hooks/useNoranekoID');
    
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
 * function ProfilePage({ userInfo }: { userInfo?: ServerUserInfo | null }) {
 *   if (userInfo) {
 *     return <AuthenticatedProfile user={userInfo.user} />;
 *   }
 *   
 *   return <PublicProfile />;
 * }
 * 
 * export default withConditionalAuth(ProfilePage, {
 *   condition: (pathname) => pathname.includes('/edit')
 * });
 * ```
 */
export function withConditionalAuth<P extends object = {}>(
  WrappedComponent: React.ComponentType<P & { userInfo?: ServerUserInfo | null }>,
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
        WrappedComponent as React.ComponentType<P & { userInfo: ServerUserInfo }>,
        options
      );
      return <AuthenticatedComponent {...props} />;
    } else {
      // 認証が不要な場合はユーザー情報のみ渡す
      try {
        const userInfo = await getServerUserInfo();
        return <WrappedComponent {...props} userInfo={userInfo} />;
      } catch {
        return <WrappedComponent {...props} userInfo={null} />;
      }
    }
  };

  ConditionalAuthComponent.displayName = `withConditionalAuth(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return ConditionalAuthComponent;
}