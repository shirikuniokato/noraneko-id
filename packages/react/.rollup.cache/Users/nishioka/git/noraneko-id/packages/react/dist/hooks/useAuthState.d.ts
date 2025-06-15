/**
 * useAuthState - 認証状態専用Hook
 */
import type { UseAuthStateResult } from '../types';
/**
 * useAuthState Hook
 *
 * 認証状態のみを監視する軽量Hook
 * ユーザー情報や操作関数が不要な場合に使用
 *
 * @returns 認証状態
 *
 * @example
 * ```tsx
 * function AuthIndicator() {
 *   const { isAuthenticated, isLoading } = useAuthState();
 *
 *   if (isLoading) return <span>⏳</span>;
 *   return <span>{isAuthenticated ? '🔓' : '🔒'}</span>;
 * }
 * ```
 */
export declare function useAuthState(): UseAuthStateResult;
//# sourceMappingURL=useAuthState.d.ts.map