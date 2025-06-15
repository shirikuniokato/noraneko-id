/**
 * useAccessToken - アクセストークン管理Hook
 */
import { useContext } from 'react';
import { NoranekoIDContext } from '../context/NoranekoIDContext';
/**
 * useAccessToken Hook
 *
 * アクセストークンの取得・管理に特化したHook
 * API呼び出し時のトークン取得に使用
 *
 * @returns アクセストークンと管理関数
 *
 * @example
 * ```tsx
 * function ApiDataFetcher() {
 *   const { getAccessToken, refreshTokens } = useAccessToken();
 *
 *   const fetchData = async () => {
 *     try {
 *       const token = await getAccessToken();
 *       if (!token) {
 *         throw new Error('No access token available');
 *       }
 *
 *       const response = await fetch('/api/data', {
 *         headers: {
 *           'Authorization': `Bearer ${token}`
 *         }
 *       });
 *
 *       if (response.status === 401) {
 *         // トークンが無効な場合は更新を試行
 *         await refreshTokens();
 *         // 再度取得してリトライ...
 *       }
 *
 *       return response.json();
 *     } catch (error) {
 *       console.error('API call failed:', error);
 *     }
 *   };
 *
 *   return (
 *     <button onClick={fetchData}>
 *       Fetch Protected Data
 *     </button>
 *   );
 * }
 * ```
 *
 * @example
 * // カスタムフック内での使用
 * ```tsx
 * function useAuthenticatedFetch() {
 *   const { getAccessToken } = useAccessToken();
 *
 *   return useCallback(async (url: string, options: RequestInit = {}) => {
 *     const token = await getAccessToken();
 *
 *     return fetch(url, {
 *       ...options,
 *       headers: {
 *         ...options.headers,
 *         ...(token && { 'Authorization': `Bearer ${token}` })
 *       }
 *     });
 *   }, [getAccessToken]);
 * }
 * ```
 */
export function useAccessToken() {
    const context = useContext(NoranekoIDContext);
    if (!context) {
        throw new Error('useAccessToken must be used within a NoranekoIDProvider. ' +
            'Make sure to wrap your component tree with <NoranekoIDProvider>.');
    }
    // アクセストークンの値は直接公開せず、関数経由でのみ取得可能にする
    // これにより：
    // 1. トークンの最新状態を常に取得できる
    // 2. セキュリティ上の理由でトークンを直接変数に保存しない
    // 3. 取得時に自動的な有効性チェックが可能
    return {
        accessToken: null, // セキュリティのため直接公開しない
        isLoading: context.isLoading,
        error: context.error,
        getAccessToken: context.getAccessToken,
        refreshTokens: context.refreshTokens,
    };
}
//# sourceMappingURL=useAccessToken.js.map