/**
 * ProtectedRoute - 認証保護ルートコンポーネント
 */
'use client';

import React from 'react';
import { useAuthState } from '../hooks/useAuthState';
import { useAuthActions } from '../hooks/useAuthActions';

export interface ProtectedRouteProps {
  /** 認証が必要な子コンポーネント */
  children: React.ReactNode;
  /** 未認証時の代替コンポーネント（省略時は自動ログイン） */
  fallback?: React.ReactNode;
  /** 必要なスコープ（省略時は基本認証のみ） */
  requiredScopes?: string[];
  /** 自動ログインを無効にする */
  disableAutoLogin?: boolean;
  /** ログイン時の追加パラメータ */
  loginOptions?: {
    scopes?: string[];
    additionalParams?: Record<string, string>;
  };
}

/**
 * ProtectedRoute Component
 * 
 * 認証が必要なルートを保護するコンポーネント
 * 未認証の場合は自動ログインまたはfallbackコンポーネントを表示
 * 
 * @example
 * ```tsx
 * // 基本的な使用
 * function App() {
 *   return (
 *     <NoranekoIDProvider config={config}>
 *       <ProtectedRoute>
 *         <Dashboard />
 *       </ProtectedRoute>
 *     </NoranekoIDProvider>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // カスタムfallback
 * function App() {
 *   return (
 *     <ProtectedRoute 
 *       fallback={<LoginPage />}
 *       disableAutoLogin={true}
 *     >
 *       <Dashboard />
 *     </ProtectedRoute>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // 管理者権限が必要なルート
 * function AdminApp() {
 *   return (
 *     <ProtectedRoute 
 *       requiredScopes={['admin']}
 *       loginOptions={{
 *         scopes: ['openid', 'profile', 'admin'],
 *         additionalParams: { prompt: 'consent' }
 *       }}
 *       fallback={<div>管理者権限が必要です</div>}
 *     >
 *       <AdminDashboard />
 *     </ProtectedRoute>
 *   );
 * }
 * ```
 */
export function ProtectedRoute({
  children,
  fallback,
  requiredScopes = [],
  disableAutoLogin = false,
  loginOptions = {}
}: ProtectedRouteProps): JSX.Element {
  const { isAuthenticated, isLoading, isInitializing } = useAuthState();
  const { login } = useAuthActions();

  // 初期化中はローディング表示
  if (isInitializing || isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px' 
      }}>
        <div>認証状態を確認中...</div>
      </div>
    );
  }

  // 認証済みの場合は子コンポーネントを表示
  if (isAuthenticated) {
    // TODO: 将来的にスコープチェック機能を追加
    // 現在はisAuthenticatedのみチェック
    return <>{children}</>;
  }

  // 未認証の場合
  if (fallback || disableAutoLogin) {
    // fallbackコンポーネントがある、または自動ログインが無効な場合
    return <>{fallback || <div>ログインが必要です</div>}</>;
  }

  // 自動ログインを実行
  React.useEffect(() => {
    if (!isAuthenticated && !isLoading && !disableAutoLogin) {
      const scopes = loginOptions.scopes || ['openid', 'profile', ...requiredScopes];
      login({
        scopes,
        additionalParams: loginOptions.additionalParams
      });
    }
  }, [isAuthenticated, isLoading, disableAutoLogin, login, requiredScopes, loginOptions]);

  // 自動ログイン実行中
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '200px' 
    }}>
      <div>ログイン処理中...</div>
    </div>
  );
}