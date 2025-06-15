/**
 * Next.js Server Components & Server Actions 用ユーティリティ
 *
 * サーバーサイドで実行される認証・セッション管理機能を提供します。
 */
export { requireAuth, requireAuth as requireServerAuth, getServerAuthTokens, getServerUserInfo, requireAuthWithPermission, authenticatedFetch, serverAuthorizers, isAuthenticated, getAuthStatus, logout, } from './auth';
export { withAuth, withClientAuth, withConditionalAuth, } from './with-auth';
export type { WithAuthOptions } from './with-auth';
export { validateJWTAccessToken, isJWTFormat, decodeJWTPayload, isJWTExpired, isJWTNotYetValid, getTokenRemainingTime, isTokenExpiringSoon, } from './jwt-validation';
export type { JWTPayload } from './jwt-validation';
export type { AuthTokens, ServerUserInfo, } from '../types';
//# sourceMappingURL=index.d.ts.map