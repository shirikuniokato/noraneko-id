import { NextResponse } from 'next/server';
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
export function chain(handlers) {
    return async function chainedMiddleware(request) {
        for (const handler of handlers) {
            try {
                const result = await handler(request);
                // ハンドラーが NextResponse を返した場合、ここで処理終了
                if (result) {
                    return result;
                }
                // null の場合は次のハンドラーに進む
            }
            catch (error) {
                console.error('Middleware handler error:', error);
                // エラーが発生した場合は処理を継続
                // 本番環境では適切なエラーハンドリングを実装すること
                continue;
            }
        }
        // 全てのハンドラーが null を返した場合、正常に次の処理へ
        return NextResponse.next();
    };
}
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
export function conditional(condition, handler) {
    return async (request) => {
        if (condition(request)) {
            return await handler(request);
        }
        return null;
    };
}
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
export function race(handlers) {
    return async (request) => {
        const results = await Promise.allSettled(handlers.map(handler => handler(request)));
        for (const result of results) {
            if (result.status === 'fulfilled' && result.value) {
                return result.value;
            }
        }
        return null;
    };
}
//# sourceMappingURL=chain.js.map