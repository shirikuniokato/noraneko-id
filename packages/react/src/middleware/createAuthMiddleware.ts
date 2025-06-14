/**
 * Next.js認証ミドルウェア生成関数
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  AuthMiddlewareConfig,
  AuthMiddlewareOptions,
  SessionData,
  MiddlewareResult,
  RouteMatcherFunction,
} from './types';

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
export function createAuthMiddleware(
  config: AuthMiddlewareConfig,
  options: AuthMiddlewareOptions = {}
) {
  const {
    protectedRoutes = [],
    publicRoutes = [],
    callbackRoute = '/auth/callback',
    loginUrl = '/auth/login',
    defaultRedirectTo = '/',
    adminRoutes = [],
    onAuthenticationRequired,
    onAuthenticationSuccess,
    onAuthenticationFailure,
  } = options;

  const {
    issuer,
    apiKey,
    sessionCookieName = 'noraneko-session',
    customSessionValidator,
  } = config;

  return async function middleware(request: NextRequest): Promise<NextResponse> {
    const pathname = request.nextUrl.pathname;

    // 認証コールバック処理
    if (pathname === callbackRoute) {
      return handleAuthCallback(request, defaultRedirectTo);
    }

    // パブリックルートのチェック
    if (isPublicRoute(pathname, publicRoutes, request)) {
      return NextResponse.next();
    }

    // セッション検証
    const session = await validateSession(request, config);
    
    // 保護されたルートかチェック
    const isProtected = isProtectedRoute(pathname, protectedRoutes, request);
    
    if (isProtected) {
      // 未認証の場合
      if (!session) {
        if (onAuthenticationRequired) {
          const customResponse = await onAuthenticationRequired(request, null);
          if (customResponse) return customResponse;
        }
        
        return redirectToLogin(request, loginUrl);
      }

      // 管理者権限チェック
      if (isAdminRoute(pathname, adminRoutes, request)) {
        if (!session.user.is_admin) {
          if (onAuthenticationFailure) {
            const customResponse = await onAuthenticationFailure(request, session);
            if (customResponse) return customResponse;
          }
          
          return new NextResponse('Forbidden', { status: 403 });
        }
      }

      // 認証成功コールバック
      if (onAuthenticationSuccess) {
        const customResponse = await onAuthenticationSuccess(request, session);
        if (customResponse) return customResponse;
      }
    }

    // セッション情報をレスポンスヘッダーに追加（クライアントサイドで利用可能）
    const response = NextResponse.next();
    if (session) {
      response.headers.set('x-noraneko-user-id', session.userId);
      response.headers.set('x-noraneko-authenticated', 'true');
      response.headers.set('x-noraneko-is-admin', session.user.is_admin.toString());
    } else {
      response.headers.set('x-noraneko-authenticated', 'false');
    }

    return response;
  };
}

/**
 * セッション検証
 */
async function validateSession(
  request: NextRequest,
  config: AuthMiddlewareConfig
): Promise<SessionData | null> {
  const { issuer, apiKey, sessionCookieName = 'noraneko-session', customSessionValidator } = config;

  // カスタムセッション検証関数が提供されている場合
  if (customSessionValidator) {
    return await customSessionValidator(request);
  }

  // セッションCookieを取得
  const sessionCookie = request.cookies.get(sessionCookieName);
  if (!sessionCookie) {
    return null;
  }

  try {
    // noraneko-id APIサーバーでセッション検証
    const response = await fetch(`${issuer}/auth/session/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `${sessionCookieName}=${sessionCookie.value}`,
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const sessionData = await response.json();
    
    // セッションデータの形式を標準化
    return {
      userId: sessionData.user.id,
      user: {
        id: sessionData.user.id,
        email: sessionData.user.email,
        username: sessionData.user.username,
        display_name: sessionData.user.display_name,
        email_verified: sessionData.user.email_verified,
        is_admin: sessionData.user.is_admin,
      },
      expiresAt: sessionData.expires_at ? new Date(sessionData.expires_at).getTime() : Date.now() + 24 * 60 * 60 * 1000,
      lastActiveAt: Date.now(),
      scopes: sessionData.scopes || ['openid', 'profile'],
    };
  } catch (error) {
    console.error('Session validation failed:', error);
    return null;
  }
}

/**
 * 認証コールバック処理
 */
async function handleAuthCallback(
  request: NextRequest,
  defaultRedirectTo: string
): Promise<NextResponse> {
  const url = request.nextUrl.clone();
  
  // コールバック後のリダイレクト先を決定
  const returnTo = request.nextUrl.searchParams.get('state') || defaultRedirectTo;
  
  // リダイレクト
  url.pathname = returnTo;
  url.search = '';
  
  return NextResponse.redirect(url);
}

/**
 * ログインページへのリダイレクト
 */
function redirectToLogin(request: NextRequest, loginUrl: string): NextResponse {
  const url = request.nextUrl.clone();
  const returnTo = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search);
  
  url.pathname = loginUrl;
  url.search = `?returnTo=${returnTo}`;
  
  return NextResponse.redirect(url);
}

/**
 * パブリックルートかどうかチェック
 */
function isPublicRoute(
  pathname: string,
  publicRoutes: (string | RegExp | RouteMatcherFunction)[],
  request: NextRequest
): boolean {
  return publicRoutes.some(route => matchRoute(pathname, route, request));
}

/**
 * 保護されたルートかどうかチェック
 */
function isProtectedRoute(
  pathname: string,
  protectedRoutes: (string | RegExp | RouteMatcherFunction)[],
  request: NextRequest
): boolean {
  return protectedRoutes.some(route => matchRoute(pathname, route, request));
}

/**
 * 管理者ルートかどうかチェック
 */
function isAdminRoute(
  pathname: string,
  adminRoutes: (string | RegExp | RouteMatcherFunction)[],
  request: NextRequest
): boolean {
  return adminRoutes.some(route => matchRoute(pathname, route, request));
}

/**
 * ルートマッチング
 */
function matchRoute(
  pathname: string,
  route: string | RegExp | RouteMatcherFunction,
  request: NextRequest
): boolean {
  if (typeof route === 'function') {
    return route(pathname, request);
  }
  
  if (route instanceof RegExp) {
    return route.test(pathname);
  }
  
  // 文字列パターンマッチング
  if (route.includes('**')) {
    // ワイルドカードマッチング (/admin/** など)
    const baseRoute = route.replace('/**', '');
    return pathname.startsWith(baseRoute);
  }
  
  if (route.includes('*')) {
    // 単一セグメントワイルドカード
    const pattern = route.replace(/\*/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(pathname);
  }
  
  // 完全一致
  return pathname === route;
}

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
export function simpleAuthMiddleware(options: {
  issuer: string;
  protectedRoutes?: string[];
  adminRoutes?: string[];
  loginUrl?: string;
  sessionCookieName?: string;
}) {
  return createAuthMiddleware(
    {
      issuer: options.issuer,
      sessionCookieName: options.sessionCookieName,
    },
    {
      protectedRoutes: options.protectedRoutes || [],
      adminRoutes: options.adminRoutes || [],
      loginUrl: options.loginUrl || '/auth/login',
    }
  );
}