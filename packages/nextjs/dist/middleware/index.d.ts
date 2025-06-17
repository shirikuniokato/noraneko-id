import { NextRequest, NextResponse } from 'next/server';

interface MiddlewareConfig {
    protectedPaths?: string[];
    publicOnlyPaths?: string[];
    loginUrl?: string;
    callbackUrl?: string;
}
type MiddlewareFunction = (request: NextRequest) => Promise<NextResponse | null> | NextResponse | null;
declare function createAuthMiddleware(config?: MiddlewareConfig): (request: NextRequest) => Promise<NextResponse<unknown>>;
/**
 * 複数のミドルウェア関数を順次実行するチェイン機能
 * 最初にレスポンスを返すミドルウェアでチェインが終了
 *
 * @param middlewares 実行するミドルウェア関数の配列
 * @returns チェインされたミドルウェア関数
 *
 * @example
 * import { chain, createAuthMiddleware } from '@noranekoid/nextjs/middleware'
 * import { rateLimitMiddleware } from './rate-limit'
 * import { corsMiddleware } from './cors'
 *
 * export default chain([
 *   corsMiddleware,
 *   rateLimitMiddleware,
 *   createAuthMiddleware({
 *     protectedPaths: ['/dashboard'],
 *     publicOnlyPaths: ['/login']
 *   })
 * ])
 */
declare function chain(middlewares: MiddlewareFunction[]): MiddlewareFunction;
declare const defaultMiddleware: (request: NextRequest) => Promise<NextResponse<unknown>>;

export { type MiddlewareFunction, chain, createAuthMiddleware, defaultMiddleware };
