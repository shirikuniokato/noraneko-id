import { NextRequest, NextResponse } from 'next/server';
// import { createTokenHandler, createLogoutHandler } from '@noranekoid/nextjs/api';

/**
 * noraneko-id SDK 最新版対応の統合APIハンドラー
 * 
 * [...]slug形式で以下のルートを処理:
 * - GET  /api/auth/login     -> OAuth2ログイン開始
 * - GET  /api/auth/callback  -> OAuth2コールバック処理  
 * - GET  /api/auth/token     -> トークン取得
 * - POST /api/auth/token     -> トークン保存
 * - POST /api/auth/logout    -> ログアウト処理
 * - DELETE /api/auth/token   -> トークン削除
 */

// TODO: 設定（現在はself参照エラーのためコメントアウト）
// const config = {
//   auth: {
//     clientId: process.env.NEXT_PUBLIC_OAUTH2_CLIENT_ID || 'admin-dashboard-001',
//     issuer: process.env.NEXT_PUBLIC_NORANEKO_ISSUER || 'http://localhost:8080',
//     redirectUri: (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/api/auth/callback',
//     scopes: ['openid', 'profile', 'email', 'admin'],
//   },
//   debug: process.env.NODE_ENV === 'development',
// };

// TODO: 各種ハンドラーを作成（現在はself参照エラーのためコメントアウト）
// const tokenHandler = createTokenHandler(config);
// const logoutHandler = createLogoutHandler(config);

// ルーティング処理
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join('/');

  switch (path) {
    case 'token':
      // TODO: return tokenHandler.GET();
      return NextResponse.json({ message: 'Token endpoint (TODO: implement)' }, { status: 501 });
    default:
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join('/');

  switch (path) {
    case 'token':
      // TODO: return tokenHandler.POST(request);
      return NextResponse.json({ message: 'Token POST endpoint (TODO: implement)' }, { status: 501 });
    case 'logout':
      // TODO: return logoutHandler(request);
      return NextResponse.json({ message: 'Logout endpoint (TODO: implement)' }, { status: 501 });
    default:
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join('/');

  switch (path) {
    case 'token':
      // TODO: return tokenHandler.DELETE(request);
      return NextResponse.json({ message: 'Token DELETE endpoint (TODO: implement)' }, { status: 501 });
    default:
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}