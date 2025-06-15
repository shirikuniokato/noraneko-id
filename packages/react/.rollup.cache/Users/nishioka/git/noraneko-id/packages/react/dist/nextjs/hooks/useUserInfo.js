/**
 * useUserInfo - ユーザー情報専用Hook
 */
import { useContext } from 'react';
import { NoranekoIDContext } from '../context/NoranekoIDContext';
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
export function useUserInfo() {
    const context = useContext(NoranekoIDContext);
    if (!context) {
        throw new Error('useUserInfo must be used within a NoranekoIDProvider. ' +
            'Make sure to wrap your component tree with <NoranekoIDProvider>.');
    }
    return {
        user: context.user,
        isLoading: context.isLoading,
        error: context.error,
        refreshUser: context.refreshUser,
    };
}
//# sourceMappingURL=useUserInfo.js.map