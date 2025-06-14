/**
 * LoginRequired - ログイン必須コンポーネント
 */
'use client';

import React from 'react';
import { useAuthState } from '../hooks/useAuthState';
import { useAuthActions } from '../hooks/useAuthActions';

export interface LoginRequiredProps {
  /** 認証済み時に表示する子コンポーネント */
  children: React.ReactNode;
  /** 未認証時のメッセージ */
  message?: string;
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
 * LoginRequired Component
 * 
 * ログインが必要なコンテンツを表示し、未認証時はログインボタンを提供
 * ProtectedRouteと異なり、自動リダイレクトせずユーザーの明示的な操作を待つ
 * 
 * @example
 * ```tsx
 * // 基本的な使用
 * function UserProfile() {
 *   return (
 *     <div>
 *       <h1>ユーザープロフィール</h1>
 *       <LoginRequired>
 *         <UserDetails />
 *       </LoginRequired>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // カスタムメッセージとスコープ
 * function PremiumContent() {
 *   return (
 *     <LoginRequired
 *       message="プレミアムコンテンツにアクセスするにはログインが必要です"
 *       loginButtonText="プレミアムアカウントでログイン"
 *       loginOptions={{
 *         scopes: ['openid', 'profile', 'premium'],
 *         additionalParams: { prompt: 'consent' }
 *       }}
 *     >
 *       <PremiumDashboard />
 *     </LoginRequired>
 *   );
 * }
 * ```
 */
export function LoginRequired({
  children,
  message = 'このコンテンツにアクセスするにはログインが必要です',
  loginButtonText = 'ログイン',
  loginOptions = {},
  className,
  style
}: LoginRequiredProps): JSX.Element {
  const { isAuthenticated, isLoading, isInitializing } = useAuthState();
  const { login, isLoading: isLoginLoading } = useAuthActions();

  // 初期化中はローディング表示
  if (isInitializing) {
    return (
      <div className={className} style={style}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          認証状態を確認中...
        </div>
      </div>
    );
  }

  // 認証済みの場合は子コンポーネントを表示
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // 未認証の場合はログインプロンプトを表示
  const handleLogin = () => {
    const scopes = loginOptions.scopes || ['openid', 'profile'];
    login({
      scopes,
      additionalParams: loginOptions.additionalParams
    });
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
    opacity: isLoginLoading || isLoading ? 0.6 : 1
  };

  return (
    <div className={className} style={containerStyle}>
      <div style={messageStyle}>
        {message}
      </div>
      <button
        onClick={handleLogin}
        disabled={isLoginLoading || isLoading}
        style={buttonStyle}
        onMouseOver={(e) => {
          if (!isLoginLoading && !isLoading) {
            e.currentTarget.style.backgroundColor = '#4338ca';
          }
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#4f46e5';
        }}
      >
        {isLoginLoading || isLoading ? 'ログイン中...' : loginButtonText}
      </button>
    </div>
  );
}