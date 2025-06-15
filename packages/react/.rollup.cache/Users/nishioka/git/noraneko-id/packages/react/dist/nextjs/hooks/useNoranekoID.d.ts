/**
 * useNoranekoID - メイン認証Hook
 */
import type { UseNoranekoIDResult, UseNoranekoIDOptions } from '../types';
/**
 * useNoranekoID Hook
 *
 * noraneko-id認証機能の包括的なアクセスを提供するメインHook
 *
 * @param options - Hook オプション
 * @returns 認証状態と操作関数
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     user,
 *     isAuthenticated,
 *     isLoading,
 *     login,
 *     logout
 *   } = useNoranekoID();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return isAuthenticated ? (
 *     <div>
 *       Welcome, {user?.display_name}!
 *       <button onClick={() => logout()}>Logout</button>
 *     </div>
 *   ) : (
 *     <button onClick={() => login()}>Login</button>
 *   );
 * }
 * ```
 */
export declare function useNoranekoID(options?: UseNoranekoIDOptions): UseNoranekoIDResult;
//# sourceMappingURL=useNoranekoID.d.ts.map