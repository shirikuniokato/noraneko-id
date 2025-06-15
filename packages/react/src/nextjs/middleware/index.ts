/**
 * Next.js ミドルウェア用ユーティリティ
 * 
 * Next.js ミドルウェアで使用する認証関連のユーティリティ関数を提供します。
 */

// チェーン基盤
export { chain, conditional, race } from './chain';
export type { MiddlewareHandler } from './chain';

// 認証ミドルウェア
export { authMiddleware, matchPath, matchAnyPath } from './auth';
export type { AuthMiddlewareConfig } from './auth';