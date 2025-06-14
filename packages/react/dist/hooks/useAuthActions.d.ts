/**
 * useAuthActions - 認証操作専用Hook
 */
import type { UseAuthActionsResult } from '../types';
/**
 * useAuthActions Hook
 *
 * 認証操作（ログイン・ログアウト）に特化したHook
 * ボタンコンポーネントや操作専用コンポーネントで使用
 *
 * @returns 認証操作関数
 *
 * @example
 * ```tsx
 * function AuthButtons() {
 *   const { login, logout, isLoading } = useAuthActions();
 *   const { isAuthenticated } = useAuthState();
 *
 *   const handleLogin = () => {
 *     login({
 *       scopes: ['openid', 'profile', 'email'],
 *       additionalParams: {
 *         prompt: 'login' // 常にログイン画面を表示
 *       }
 *     });
 *   };
 *
 *   const handleLogout = () => {
 *     logout({
 *       returnTo: window.location.origin // ログアウト後にホームに戻る
 *     });
 *   };
 *
 *   if (isLoading) {
 *     return <div>Processing...</div>;
 *   }
 *
 *   return isAuthenticated ? (
 *     <button onClick={handleLogout}>Logout</button>
 *   ) : (
 *     <button onClick={handleLogin}>Login</button>
 *   );
 * }
 * ```
 *
 * @example
 * // 条件付きログイン
 * ```tsx
 * function ConditionalLoginButton({ requiredScopes }: { requiredScopes: string[] }) {
 *   const { login, isLoading } = useAuthActions();
 *
 *   const handleLogin = () => {
 *     login({
 *       scopes: ['openid', ...requiredScopes],
 *       additionalParams: {
 *         prompt: 'consent' // 常に同意画面を表示
 *       }
 *     });
 *   };
 *
 *   return (
 *     <button onClick={handleLogin} disabled={isLoading}>
 *       {isLoading ? 'Logging in...' : 'Login with Enhanced Permissions'}
 *     </button>
 *   );
 * }
 * ```
 */
export declare function useAuthActions(): UseAuthActionsResult;
//# sourceMappingURL=useAuthActions.d.ts.map