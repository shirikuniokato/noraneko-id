/**
 * useAccessToken - アクセストークン管理Hook
 */
import type { UseAccessTokenResult } from '../types';
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
export declare function useAccessToken(): UseAccessTokenResult;
//# sourceMappingURL=useAccessToken.d.ts.map