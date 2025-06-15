/**
 * ConditionalRender - 認証状態による条件付きレンダリング
 */
'use client';
import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { useAuthState } from '../hooks/useAuthState';
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
export function ConditionalRender({ authenticated, unauthenticated, loading, error, children }) {
    const { isAuthenticated, isLoading, isInitializing, error: authError } = useAuthState();
    // エラー状態
    if (authError && error) {
        return _jsx(_Fragment, { children: error });
    }
    // 初期化中またはローディング中
    if (isInitializing || isLoading) {
        if (loading) {
            return _jsx(_Fragment, { children: loading });
        }
        // デフォルトローディング
        return (_jsx("div", { style: {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px'
            }, children: _jsx("div", { children: "\u8AAD\u307F\u8FBC\u307F\u4E2D..." }) }));
    }
    // 認証済み
    if (isAuthenticated) {
        // childrenがある場合はchildrenを優先、なければauthenticatedを使用
        return _jsx(_Fragment, { children: children || authenticated });
    }
    // 未認証
    if (unauthenticated) {
        return _jsx(_Fragment, { children: unauthenticated });
    }
    // 何も指定されていない場合はnullを返す
    return null;
}
export function AuthenticatedOnly({ children, fallback }) {
    return (_jsx(ConditionalRender, { authenticated: children, unauthenticated: fallback }));
}
export function UnauthenticatedOnly({ children, fallback }) {
    return (_jsx(ConditionalRender, { unauthenticated: children, authenticated: fallback }));
}
//# sourceMappingURL=ConditionalRender.js.map