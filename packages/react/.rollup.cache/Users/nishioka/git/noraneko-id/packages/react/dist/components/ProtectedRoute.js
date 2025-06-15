/**
 * ProtectedRoute - 認証保護ルートコンポーネント
 */
'use client';
import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { useAuthState } from '../hooks/useAuthState';
import { useAuthActions } from '../hooks/useAuthActions';
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
export function ProtectedRoute({ children, fallback, requiredScopes = [], disableAutoLogin = false, loginOptions = {} }) {
    const { isAuthenticated, isLoading, isInitializing } = useAuthState();
    const { login } = useAuthActions();
    // 初期化中はローディング表示
    if (isInitializing || isLoading) {
        return (_jsx("div", { style: {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '200px'
            }, children: _jsx("div", { children: "\u8A8D\u8A3C\u72B6\u614B\u3092\u78BA\u8A8D\u4E2D..." }) }));
    }
    // 認証済みの場合は子コンポーネントを表示
    if (isAuthenticated) {
        // TODO: 将来的にスコープチェック機能を追加
        // 現在はisAuthenticatedのみチェック
        return _jsx(_Fragment, { children: children });
    }
    // 未認証の場合
    if (fallback || disableAutoLogin) {
        // fallbackコンポーネントがある、または自動ログインが無効な場合
        return _jsx(_Fragment, { children: fallback || _jsx("div", { children: "\u30ED\u30B0\u30A4\u30F3\u304C\u5FC5\u8981\u3067\u3059" }) });
    }
    // 自動ログインを実行
    React.useEffect(() => {
        if (!isAuthenticated && !isLoading && !disableAutoLogin) {
            const scopes = loginOptions.scopes || ['openid', 'profile', ...requiredScopes];
            const authOptions = { scopes };
            if (loginOptions.additionalParams) {
                authOptions.additionalParams = loginOptions.additionalParams;
            }
            login(authOptions);
        }
    }, [isAuthenticated, isLoading, disableAutoLogin, login, requiredScopes, loginOptions]);
    // 自動ログイン実行中
    return (_jsx("div", { style: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px'
        }, children: _jsx("div", { children: "\u30ED\u30B0\u30A4\u30F3\u51E6\u7406\u4E2D..." }) }));
}
//# sourceMappingURL=ProtectedRoute.js.map