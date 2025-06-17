// import { createAuthMiddleware } from "@noranekoid/nextjs/middleware";

/**
 * Next.js ミドルウェア
 *
 * noraneko-id SDKが提供する認証ミドルウェアを使用：
 * - 保護されたパス: /dashboard で認証が必要
 * - パブリックのみパス: /login は認証済みユーザーはリダイレクト
 * - OAuth2 フローを使用
 */
// TODO: 認証ミドルウェア（現在はself参照エラーのためコメントアウト）
// export default createAuthMiddleware({
//   auth: {
//     issuer: process.env.NEXT_PUBLIC_NORANEKO_ISSUER || 'http://localhost:8080',
//   },
//   cookies: {
//     prefix: "noraneko",
//   },
//   protectedPaths: ["/dashboard"],
//   loginUrl: "/login",
// });

import { NextResponse } from 'next/server';

export default function middleware() {
  return NextResponse.next();
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
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
