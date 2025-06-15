import { NextRequest, NextResponse } from 'next/server';
/**
 * ミドルウェアハンドラーの型定義
 *
 * @param request Next.js リクエストオブジェクト
 * @returns 処理を続行する場合は null、早期リターンする場合は NextResponse
 */
export type MiddlewareHandler = (request: NextRequest) => Promise<NextResponse | null> | NextResponse | null;
/**
 * ミドルウェアチェーン実行関数
 *
 * 複数のミドルウェアを順次実行し、いずれかが NextResponse を返した場合は
 * そこで処理を終了します。全てのミドルウェアが null を返した場合は
 * NextResponse.next() を返します。
 *
 * @param handlers 実行するミドルウェアハンドラーの配列
 * @returns Next.js ミドルウェア関数
 *
 * @example
 * ```typescript
 * export function middleware(request: NextRequest) {
 *   return chain([
 *     authMiddleware({ protectedPaths: ['/dashboard'] }),
 *     customMiddleware(),
 *     anotherMiddleware()
 *   ])(request);
 * }
 * ```
 */
export declare function chain(handlers: MiddlewareHandler[]): (request: NextRequest) => Promise<NextResponse>;
/**
 * 条件付きミドルウェア実行ヘルパー
 *
 * 指定した条件が true の場合のみミドルウェアを実行します。
 *
 * @param condition 実行条件を判定する関数
 * @param handler 条件が true の場合に実行するハンドラー
 * @returns MiddlewareHandler
 *
 * @example
 * ```typescript
 * const conditionalAuth = conditional(
 *   (req) => req.nextUrl.pathname.startsWith('/admin'),
 *   authMiddleware({ requireAdmin: true })
 * );
 * ```
 */
export declare function conditional(condition: (request: NextRequest) => boolean, handler: MiddlewareHandler): MiddlewareHandler;
/**
 * ミドルウェアの実行順序制御ヘルパー
 *
 * 複数のミドルウェアを並列実行し、最初に NextResponse を返したものを採用します。
 * 全て null を返した場合は null を返します。
 *
 * @param handlers 並列実行するハンドラーの配列
 * @returns MiddlewareHandler
 *
 * @example
 * ```typescript
 * const raceAuth = race([
 *   tokenAuth(),
 *   sessionAuth(),
 *   basicAuth()
 * ]);
 * ```
 */
export declare function race(handlers: MiddlewareHandler[]): MiddlewareHandler;
//# sourceMappingURL=chain.d.ts.map