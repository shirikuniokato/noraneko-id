/**
 * LoginRequired - ログイン必須コンポーネント
 */
'use client';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuthState } from '../hooks/useAuthState';
import { useAuthActions } from '../hooks/useAuthActions';
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
export function LoginRequired({ children, message = 'このコンテンツにアクセスするにはログインが必要です', loginButtonText = 'ログイン', loginOptions = {}, className, style }) {
    const { isAuthenticated, isLoading, isInitializing } = useAuthState();
    const { login, isLoading: isLoginLoading } = useAuthActions();
    // 初期化中はローディング表示
    if (isInitializing) {
        return (_jsx("div", { className: className, style: style, children: _jsx("div", { style: { textAlign: 'center', padding: '20px' }, children: "\u8A8D\u8A3C\u72B6\u614B\u3092\u78BA\u8A8D\u4E2D..." }) }));
    }
    // 認証済みの場合は子コンポーネントを表示
    if (isAuthenticated) {
        return _jsx(_Fragment, { children: children });
    }
    // 未認証の場合はログインプロンプトを表示
    const handleLogin = () => {
        const scopes = loginOptions.scopes || ['openid', 'profile'];
        const authOptions = { scopes };
        if (loginOptions.additionalParams) {
            authOptions.additionalParams = loginOptions.additionalParams;
        }
        login(authOptions);
    };
    const containerStyle = {
        textAlign: 'center',
        padding: '40px 20px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        backgroundColor: '#f8fafc',
        ...style
    };
    const messageStyle = {
        marginBottom: '20px',
        color: '#4a5568',
        fontSize: '16px'
    };
    const buttonStyle = {
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
    return (_jsxs("div", { className: className, style: containerStyle, children: [_jsx("div", { style: messageStyle, children: message }), _jsx("button", { onClick: handleLogin, disabled: isLoginLoading || isLoading, style: buttonStyle, onMouseOver: (e) => {
                    if (!isLoginLoading && !isLoading) {
                        e.currentTarget.style.backgroundColor = '#4338ca';
                    }
                }, onMouseOut: (e) => {
                    e.currentTarget.style.backgroundColor = '#4f46e5';
                }, children: isLoginLoading || isLoading ? 'ログイン中...' : loginButtonText })] }));
}
//# sourceMappingURL=LoginRequired.js.map