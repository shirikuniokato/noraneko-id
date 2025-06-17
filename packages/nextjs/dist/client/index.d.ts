import { C as CallbackParams, b as CallbackError, c as CallbackState, S as Session, d as AuthStatus, U as User } from '../types-od4YWh0d.js';
export { e as CallbackStatus } from '../types-od4YWh0d.js';
import React, { ReactNode } from 'react';

interface UseAuthCallbackOptions {
    /**
     * コールバック成功時のリダイレクト先
     * デフォルト: "/"
     */
    successRedirect?: string;
    /**
     * エラー時のリダイレクト先
     * デフォルト: "/login"
     */
    errorRedirect?: string;
    /**
     * 自動リダイレクトを無効にする
     * デフォルト: false
     */
    disableAutoRedirect?: boolean;
    /**
     * コールバック処理完了時のカスタムハンドラ
     */
    onSuccess?: (params: CallbackParams) => void;
    onError?: (error: CallbackError) => void;
}
/**
 * OAuth2コールバック処理専用フック
 *
 * @param options コールバック処理のオプション
 * @returns コールバック状態とユーティリティ関数
 *
 * @example
 * ```tsx
 * // app/auth/callback/page.tsx
 * 'use client'
 * import { useAuthCallback } from '@noranekoid/nextjs/client'
 *
 * export default function CallbackPage() {
 *   const { status, error, isLoading } = useAuthCallback({
 *     successRedirect: '/dashboard',
 *     errorRedirect: '/login?error=callback_failed'
 *   })
 *
 *   if (isLoading) return <div>認証処理中...</div>
 *   if (error) return <div>エラー: {error.error_description || error.error}</div>
 *   return <div>処理中...</div>
 * }
 * ```
 */
declare function useAuthCallback(options?: UseAuthCallbackOptions): CallbackState;

declare function useSession(): {
    data: Session | null;
    status: AuthStatus;
    update: () => Promise<void>;
};
declare function useAuth(): {
    session: Session | null;
    user: User | null;
    status: AuthStatus;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (redirectTo?: string) => void;
    logout: (redirectTo?: string) => void;
    refresh: () => Promise<void>;
};
declare function useUser(): User | null;
declare function useAuthStatus(): AuthStatus;

interface SessionProviderProps {
    children: ReactNode;
    session?: Session | null;
}
declare function SessionProvider({ children, session: initialSession }: SessionProviderProps): React.JSX.Element;

export { AuthStatus, CallbackError, CallbackParams, CallbackState, Session, SessionProvider, User, useAuth, useAuthCallback, useAuthStatus, useSession, useUser };
