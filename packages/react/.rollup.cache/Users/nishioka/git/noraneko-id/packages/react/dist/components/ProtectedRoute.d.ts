import React from 'react';
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
export declare function ProtectedRoute({ children, fallback, requiredScopes, disableAutoLogin, loginOptions }: ProtectedRouteProps): JSX.Element;
//# sourceMappingURL=ProtectedRoute.d.ts.map