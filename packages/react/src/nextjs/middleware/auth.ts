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
export function authMiddleware(config: AuthMiddlewareConfig = {}): MiddlewareHandler {
  const {
    cookiePrefix = 'noraneko',
    loginUrl = '/login',
    protectedPaths = [],
    publicOnlyPaths = [],
    // unauthorizedUrl = '/unauthorized', // Currently unused
    onUnauthorized,
    onAuthenticatedPublicPath,
  } = config;

  return async function authHandler(request: NextRequest): Promise<NextResponse | null> {
    const { pathname } = request.nextUrl;
    
    // 認証トークンの取得
    const accessToken = request.cookies.get(`${cookiePrefix}_access_token`)?.value;
    const isAuthenticated = !!accessToken;
    
    // 保護されたパスかどうかの判定
    const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
    const isPublicOnlyPath = publicOnlyPaths.some(path => pathname.startsWith(path));
    
    // 未認証ユーザーが保護されたパスにアクセスした場合
    if (isProtectedPath && !isAuthenticated) {
      if (onUnauthorized) {
        return onUnauthorized(request, 'unauthenticated');
      }
      
      const loginUrlWithCallback = new URL(loginUrl, request.url);
      loginUrlWithCallback.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrlWithCallback);
    }
    
    // 認証済みユーザーがパブリックオンリーパスにアクセスした場合
    if (isPublicOnlyPath && isAuthenticated) {
      if (onAuthenticatedPublicPath) {
        return onAuthenticatedPublicPath(request);
      }
      
      const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
      const redirectTo = callbackUrl || '/dashboard';
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
    
    // 認証チェックに問題がない場合は次のミドルウェアに処理を委ねる
    return null;
  };
}

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
export function matchPath(pathname: string, pattern: string): boolean {
  if (pattern.includes('*')) {
    return pathname.startsWith(pattern.replace('*', ''));
  }
  return pathname.startsWith(pattern);
}

/**
 * 複数パターンマッチヘルパー
 * 
 * @param pathname 判定対象のパス
 * @param patterns パターンの配列
 * @returns いずれかのパターンにマッチするかどうか
 */
export function matchAnyPath(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => matchPath(pathname, pattern));
}