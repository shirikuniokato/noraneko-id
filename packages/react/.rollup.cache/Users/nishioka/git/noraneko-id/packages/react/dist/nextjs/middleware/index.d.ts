/**
 * Next.js ミドルウェア用ユーティリティ
 *
 * Next.js ミドルウェアで使用する認証関連のユーティリティ関数を提供します。
 */
export { chain, conditional, race } from './chain';
export type { MiddlewareHandler } from './chain';
export { authMiddleware, matchPath, matchAnyPath } from './auth';
export type { AuthMiddlewareConfig } from './auth';
//# sourceMappingURL=index.d.ts.map