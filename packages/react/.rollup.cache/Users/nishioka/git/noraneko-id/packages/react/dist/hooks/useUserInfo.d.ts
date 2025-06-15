/**
 * useUserInfo - ユーザー情報専用Hook
 */
import type { UseUserInfoResult } from '../types';
/**
 * useUserInfo Hook
 *
 * ユーザー情報とその管理機能に特化したHook
 * プロフィール表示やユーザー情報更新に使用
 *
 * @returns ユーザー情報と更新関数
 *
 * @example
 * ```tsx
 * function UserProfile() {
 *   const { user, isLoading, refreshUser } = useUserInfo();
 *
 *   if (isLoading) return <div>Loading user...</div>;
 *   if (!user) return <div>No user data</div>;
 *
 *   return (
 *     <div>
 *       <h1>{user.display_name}</h1>
 *       <p>{user.email}</p>
 *       <button onClick={() => refreshUser()}>
 *         Refresh Profile
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useUserInfo(): UseUserInfoResult;
//# sourceMappingURL=useUserInfo.d.ts.map