import { NextRequest, NextResponse } from "next/server";

interface MiddlewareConfig {
  protectedPaths?: string[];
  publicOnlyPaths?: string[];
  loginUrl?: string;
  callbackUrl?: string;
}

// ミドルウェア関数の型定義
export type MiddlewareFunction = (
  request: NextRequest
) => Promise<NextResponse | null> | NextResponse | null;

export function createAuthMiddleware(config: MiddlewareConfig = {}) {
  const {
    protectedPaths = [],
    publicOnlyPaths = [],
    loginUrl = "/api/auth/login",
    callbackUrl = "/",
  } = config;

  return async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // トークンCookieの存在チェック（簡易的な認証状態判定）
    const hasSession = request.cookies.has("noraneko-auth.token");

    // 保護されたパスへのアクセス
    if (protectedPaths.some((path) => pathname.startsWith(path))) {
      if (!hasSession) {
        const loginUrlWithCallback = new URL(loginUrl, request.url);
        loginUrlWithCallback.searchParams.set("callbackUrl", request.url);
        return NextResponse.redirect(loginUrlWithCallback);
      }
    }

    // パブリックのみのパスへのアクセス（ログインページなど）
    if (publicOnlyPaths.some((path) => pathname.startsWith(path))) {
      if (hasSession) {
        return NextResponse.redirect(new URL(callbackUrl, request.url));
      }
    }

    return NextResponse.next();
  };
}

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
export function chain(middlewares: MiddlewareFunction[]): MiddlewareFunction {
  return async function chainedMiddleware(
    request: NextRequest
  ): Promise<NextResponse> {
    for (const middleware of middlewares) {
      const response = await middleware(request);

      // ミドルウェアがレスポンスを返した場合、チェインを終了
      if (response) {
        return response;
      }
    }

    // すべてのミドルウェアが null を返した場合、リクエストを続行
    return NextResponse.next();
  };
}

// デフォルトミドルウェア設定
export const defaultMiddleware = createAuthMiddleware({
  protectedPaths: ["/dashboard"],
  publicOnlyPaths: ["/login"],
  loginUrl: "/api/auth/login",
});
