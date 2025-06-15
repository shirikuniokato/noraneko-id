import { NextRequest, NextResponse } from 'next/server';
import { MiddlewareHandler } from './chain';
/**
 * 認証ミドルウェアの設定オプション
 */
export interface AuthMiddlewareConfig {
    /** Cookie prefix @default 'noraneko' */
    cookiePrefix?: string;
    /** Login page URL @default '/login' */
    loginUrl?: string;
    /** Paths that require authentication */
    protectedPaths?: string[];
    /** Paths that should redirect authenticated users (e.g., login page) */
    publicOnlyPaths?: string[];
    /** Unauthorized redirect URL @default '/unauthorized' */
    unauthorizedUrl?: string;
    /** Custom redirect function after authentication check */
    onUnauthorized?: (request: NextRequest, reason: 'unauthenticated' | 'unauthorized') => NextResponse;
    /** Custom redirect function for authenticated users on public-only paths */
    onAuthenticatedPublicPath?: (request: NextRequest) => NextResponse;
}
/**
 * 認証ミドルウェア（チェーン対応）
 *
 * HttpOnly クッキーに保存されたアクセストークンを確認し、
 * 認証が必要なパスでの認証チェックを行います。
 *
 * @param config 認証設定
 * @returns MiddlewareHandler
 *
 * @example
 * ```typescript
 * export function middleware(request: NextRequest) {
 *   return chain([
 *     authMiddleware({
 *       protectedPaths: ['/dashboard', '/profile'],
 *       publicOnlyPaths: ['/login', '/register'],
 *       loginUrl: '/login'
 *     }),
 *     // 他のミドルウェア...
 *   ])(request);
 * }
 * ```
 */
export declare function authMiddleware(config?: AuthMiddlewareConfig): MiddlewareHandler;
/**
 * パス判定ヘルパー関数
 *
 * パスがパターンにマッチするかどうかを判定します。
 * ワイルドカード（*）をサポートしています。
 *
 * @param pathname 判定対象のパス
 * @param pattern パターン（例: '/admin/*', '/api/auth'）
 * @returns マッチするかどうか
 */
export declare function matchPath(pathname: string, pattern: string): boolean;
/**
 * 複数パターンマッチヘルパー
 *
 * @param pathname 判定対象のパス
 * @param patterns パターンの配列
 * @returns いずれかのパターンにマッチするかどうか
 */
export declare function matchAnyPath(pathname: string, patterns: string[]): boolean;
//# sourceMappingURL=auth.d.ts.map