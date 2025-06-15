/**
 * ConditionalRender - 認証状態による条件付きレンダリング
 */
'use client';

import React from 'react';
import { useNoranekoID } from '../hooks/useNoranekoID';

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
  /** ログインボタンを自動表示するか */
  showLoginButton?: boolean;
  /** ログインボタン用のメッセージ */
  loginMessage?: string;
  /** ログインボタンのテキスト */
  loginButtonText?: string;
  /** ログイン時のオプション */
  loginOptions?: {
    scopes?: string[];
    additionalParams?: Record<string, string>;
  };
  /** カスタムスタイル */
  className?: string;
  /** カスタムスタイル（インライン） */
  style?: React.CSSProperties;
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
  children,
  showLoginButton = false,
  loginMessage = 'このコンテンツにアクセスするにはログインが必要です',
  loginButtonText = 'ログイン',
  loginOptions = {},
  className,
  style
}: ConditionalRenderProps): JSX.Element | null {
  const { isAuthenticated, isLoading, isInitializing, login, error: authError } = useNoranekoID();

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

  // ログインボタンを自動表示する場合
  if (showLoginButton) {
    return renderLoginButton();
  }

  // 何も指定されていない場合はnullを返す
  return null;

  // ログインボタンUI（ProtectedRouteから移植）
  function renderLoginButton(): JSX.Element {
    const handleLogin = () => {
      const scopes = loginOptions.scopes || ['openid', 'profile'];
      const authOptions: any = { scopes };
      
      if (loginOptions.additionalParams) {
        authOptions.additionalParams = loginOptions.additionalParams;
      }
      
      login(authOptions);
    };

    const containerStyle: React.CSSProperties = {
      textAlign: 'center',
      padding: '40px 20px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      backgroundColor: '#f8fafc',
      ...style
    };

    const messageStyle: React.CSSProperties = {
      marginBottom: '20px',
      color: '#4a5568',
      fontSize: '16px'
    };

    const buttonStyle: React.CSSProperties = {
      backgroundColor: '#4f46e5',
      color: 'white',
      padding: '12px 24px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '16px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      opacity: isLoading ? 0.6 : 1
    };

    return (
      <div className={className} style={containerStyle}>
        <div style={messageStyle}>
          {loginMessage}
        </div>
        <button
          onClick={handleLogin}
          disabled={isLoading}
          style={buttonStyle}
          onMouseOver={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#4338ca';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#4f46e5';
          }}
        >
          {isLoading ? 'ログイン中...' : loginButtonText}
        </button>
      </div>
    );
  }
}
