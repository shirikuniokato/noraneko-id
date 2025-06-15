import { NextRequest, NextResponse } from 'next/server';
import { chain, authMiddleware } from '@noraneko/id-react/nextjs/middleware';
import { serverAuthorizers } from '@noraneko/id-react/nextjs/server';

/**
 * 管理者権限チェックミドルウェア
 * 
 * /admin パスへのアクセス時に管理者権限を確認します。
 * これはアプリケーション固有のビジネスロジックの例です。
 */
async function adminCheckMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // /admin パス以外は処理をスキップ
  if (!pathname.startsWith('/admin')) {
    return null;
  }
  
  // アクセストークンの取得
  const accessToken = request.cookies.get('noraneko_access_token')?.value;
  
  if (!accessToken) {
    // 認証されていない場合はログインページにリダイレクト
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    // 管理者権限の確認
    const hasAdminPermission = await serverAuthorizers.admin(
      { sub: '', email: '', scope: '' }, // ダミーデータ
      { accessToken, refreshToken: null, idToken: null }
    );
    
    if (!hasAdminPermission) {
      // 管理者権限がない場合は未認可ページにリダイレクト
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  } catch (error) {
    console.error('Admin permission check failed:', error);
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  
  // 管理者権限がある場合は処理続行
  return null;
}

/**
 * Next.js ミドルウェア
 * 
 * チェーン形式で複数のミドルウェアを組み合わせています：
 * 1. 基本認証チェック（noraneko-id SDK提供）
 * 2. 管理者権限チェック（アプリケーション固有）
 */
export function middleware(request: NextRequest) {
  return chain([
    // IDaaS SDKが提供する基本認証ミドルウェア
    authMiddleware({
      protectedPaths: ['/dashboard', '/admin'],
      publicOnlyPaths: ['/login'],
      loginUrl: '/login',
    }),
    
    // アプリケーション固有の管理者権限チェック
    adminCheckMiddleware,
    
    // 必要に応じて他のミドルウェアを追加可能
    // corsMiddleware(),
    // rateLimitMiddleware(),
    // loggingMiddleware(),
  ])(request);
}

export const config = {
  // Next.js標準のmatcherを使用してパフォーマンスを最適化
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};