import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token');
  const pathname = request.nextUrl.pathname;

  // 認証が不要なパス
  const publicPaths = ['/login', '/api/auth'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // 認証が必要なパス（管理者専用）
  const protectedPaths = ['/dashboard', '/register'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  // 保護されたパスにアクセスしようとしていて、セッショントークンがない場合
  if (isProtectedPath && !sessionToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ログイン済みユーザーがログインページにアクセスしようとした場合
  if (isPublicPath && sessionToken && pathname !== '/api/auth') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};