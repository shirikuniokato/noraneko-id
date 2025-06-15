/**
 * useNoranekoID - メイン認証Hook
 */
import { useContext } from 'react';
import { NoranekoIDContext } from '../context/NoranekoIDContext';
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
export function useNoranekoID(options = {}) {
    const context = useContext(NoranekoIDContext);
    if (!context) {
        throw new Error('useNoranekoID must be used within a NoranekoIDProvider. ' +
            'Make sure to wrap your component tree with <NoranekoIDProvider>.');
    }
    // コンテキストから必要な値を取得
    const { user, isAuthenticated, isLoading, isInitializing, error, login, logout, getAccessToken, refreshUser, refreshTokens, } = context;
    // オプションに基づいた戻り値の調整
    // 将来的な拡張のために options パラメータを用意
    // 現在は使用していないが、以下のような機能を追加予定:
    // - skipUserInfo: ユーザー情報の自動取得をスキップ
    // - retryCount: エラー時の自動リトライ回数
    // - retryDelay: リトライ間隔
    return {
        // 認証状態
        user,
        isAuthenticated,
        isLoading,
        isInitializing,
        error,
        // 認証操作
        login,
        logout,
        // データ取得・操作
        getAccessToken,
        refreshUser,
        refreshTokens,
    };
}
//# sourceMappingURL=useNoranekoID.js.map