/**
 * Next.js Server Components & Server Actions 用ユーティリティ
 * 
 * サーバーサイドで実行される認証・セッション管理機能を提供します。
 */

// サーバー認証ユーティリティ
export {
  requireAuth,
  requireAuth as requireServerAuth,
  getServerAuthTokens,
  getServerUserInfo,
  requireAuthWithPermission,
  authenticatedFetch,
  serverAuthorizers,
  isAuthenticated,
  getAuthStatus,
  logout,
} from './auth';


// Server Component HOC
export {
  withAuth,
  withClientAuth,
  withConditionalAuth,
} from './with-auth';
export type { WithAuthOptions } from './with-auth';

// JWT ローカル検証
export {
  validateJWTAccessToken,
  isJWTFormat,
  decodeJWTPayload,
  isJWTExpired,
  isJWTNotYetValid,
  getTokenRemainingTime,
  isTokenExpiringSoon,
} from './jwt-validation';
export type { JWTPayload } from './jwt-validation';

// 型定義
export type {
  AuthTokens,
  ServerUserInfo,
} from '../types';