/**
 * ConditionalRender - 認証状態による条件付きレンダリング
 */
'use client';

import React from 'react';
import { useAuthState } from '../hooks/useAuthState';

export interface ConditionalRenderProps {
  /** 認証済み時に表示するコンポーネント */
  authenticated?: React.ReactNode;
  /** 未認証時に表示するコンポーネント */
  unauthenticated?: React.ReactNode;
  /** 初期化中に表示するコンポーネント */
  loading?: React.ReactNode;
  /** エラー時に表示するコンポーネント */
  error?: React.ReactNode;
  /** 子コンポーネント（authenticated時と同じ） */
  children?: React.ReactNode;
}

/**
 * ConditionalRender Component
 * 
 * 認証状態に基づいて異なるコンポーネントを条件的にレンダリング
 * if-else文の代わりとして使用し、コードをより宣言的にする
 * 
 * @example
 * ```tsx
 * // 基本的な使用
 * function Header() {
 *   return (
 *     <header>
 *       <h1>My App</h1>
 *       <ConditionalRender
 *         authenticated={<UserMenu />}
 *         unauthenticated={<LoginButton />}
 *         loading={<Spinner />}
 *       />
 *     </header>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // childrenを使った簡潔な記法
 * function ProtectedContent() {
 *   return (
 *     <ConditionalRender unauthenticated={<LoginPrompt />}>
 *       <SecretContent />
 *     </ConditionalRender>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // 複雑な条件分岐
 * function Dashboard() {
 *   return (
 *     <ConditionalRender
 *       authenticated={
 *         <div>
 *           <WelcomeMessage />
 *           <UserDashboard />
 *         </div>
 *       }
 *       unauthenticated={
 *         <div>
 *           <Hero />
 *           <LoginForm />
 *         </div>
 *       }
 *       loading={
 *         <div className="loading-screen">
 *           <Spinner />
 *           <p>アカウント情報を読み込み中...</p>
 *         </div>
 *       }
 *       error={
 *         <ErrorBoundary />
 *       }
 *     />
 *   );
 * }
 * ```
 */
export function ConditionalRender({
  authenticated,
  unauthenticated,
  loading,
  error,
  children
}: ConditionalRenderProps): JSX.Element | null {
  const { isAuthenticated, isLoading, isInitializing, error: authError } = useAuthState();

  // エラー状態
  if (authError && error) {
    return <>{error}</>;
  }

  // 初期化中またはローディング中
  if (isInitializing || isLoading) {
    if (loading) {
      return <>{loading}</>;
    }
    // デフォルトローディング
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '20px' 
      }}>
        <div>読み込み中...</div>
      </div>
    );
  }

  // 認証済み
  if (isAuthenticated) {
    // childrenがある場合はchildrenを優先、なければauthenticatedを使用
    return <>{children || authenticated}</>;
  }

  // 未認証
  if (unauthenticated) {
    return <>{unauthenticated}</>;
  }

  // 何も指定されていない場合はnullを返す
  return null;
}

/**
 * AuthenticatedOnly - 認証済みユーザーのみ表示
 */
export interface AuthenticatedOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthenticatedOnly({ children, fallback }: AuthenticatedOnlyProps): JSX.Element | null {
  return (
    <ConditionalRender
      authenticated={children}
      unauthenticated={fallback}
    />
  );
}

/**
 * UnauthenticatedOnly - 未認証ユーザーのみ表示
 */
export interface UnauthenticatedOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function UnauthenticatedOnly({ children, fallback }: UnauthenticatedOnlyProps): JSX.Element | null {
  return (
    <ConditionalRender
      unauthenticated={children}
      authenticated={fallback}
    />
  );
}