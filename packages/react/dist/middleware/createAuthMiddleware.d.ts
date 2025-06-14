/**
 * Next.js認証ミドルウェア生成関数
 */
import { NextRequest, NextResponse } from 'next/server';
import type { AuthMiddlewareConfig, AuthMiddlewareOptions } from './types';
/**
 * 認証ミドルウェアを生成する
 *
 * @param config 認証設定
 * @param options ミドルウェアオプション
 * @returns Next.js middleware function
 *
 * @example
 * ```typescript
 * // middleware.ts
 * import { createAuthMiddleware } from '@noraneko/id-react/middleware';
 *
 * const authMiddleware = createAuthMiddleware(
 *   {
 *     issuer: 'https://id.example.com',
 *     sessionCookieName: 'noraneko-session'
 *   },
 *   {
 *     protectedRoutes: ['/dashboard', '/admin/**'],
 *     adminRoutes: ['/admin/**'],
 *     loginUrl: '/auth/login',
 *     callbackRoute: '/auth/callback'
 *   }
 * );
 *
 * export default authMiddleware;
 *
 * export const config = {
 *   matcher: ['/dashboard/:path*', '/admin/:path*']
 * };
 * ```
 */
export declare function createAuthMiddleware(config: AuthMiddlewareConfig, options?: AuthMiddlewareOptions): (request: NextRequest) => Promise<NextResponse>;
/**
 * 簡易版ミドルウェア生成（基本的な設定のみ）
 *
 * @example
 * ```typescript
 * import { simpleAuthMiddleware } from '@noraneko/id-react/middleware';
 *
 * export default simpleAuthMiddleware({
 *   issuer: 'https://id.example.com',
 *   protectedRoutes: ['/dashboard/**', '/admin/**'],
 *   adminRoutes: ['/admin/**']
 * });
 * ```
 */
export declare function simpleAuthMiddleware(options: {
    issuer: string;
    protectedRoutes?: string[];
    adminRoutes?: string[];
    loginUrl?: string;
    sessionCookieName?: string;
}): (request: NextRequest) => Promise<NextResponse>;
//# sourceMappingURL=createAuthMiddleware.d.ts.map