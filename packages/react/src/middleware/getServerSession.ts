/**
 * サーバーサイドでのセッション取得ユーティリティ
 */

import { cookies, headers } from 'next/headers';
import type { SessionData, AuthMiddlewareConfig } from './types';

/**
 * Server Components や Server Actions でセッション情報を取得
 * 
 * @param config 認証設定
 * @returns セッション情報（認証されていない場合はnull）
 * 
 * @example
 * ```typescript
 * // app/dashboard/page.tsx (Server Component)
 * import { getServerSession } from '@noraneko/id-react/middleware';
 * 
 * export default async function DashboardPage() {
 *   const session = await getServerSession({
 *     issuer: 'https://id.example.com',
 *   });
 * 
 *   if (!session) {
 *     redirect('/auth/login');
 *   }
 * 
 *   return (
 *     <div>
 *       <h1>Welcome, {session.user.display_name}!</h1>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Server Action での使用
 * async function updateProfile(formData: FormData) {
 *   'use server';
 *   
 *   const session = await getServerSession({
 *     issuer: process.env.NORANEKO_ISSUER!,
 *   });
 * 
 *   if (!session) {
 *     throw new Error('Unauthorized');
 *   }
 * 
 *   // プロフィール更新処理...
 * }
 * ```
 */
export async function getServerSession(
  config: AuthMiddlewareConfig
): Promise<SessionData | null> {
  const {
    issuer,
    apiKey,
    sessionCookieName = 'noraneko-session',
    customSessionValidator,
  } = config;

  // カスタムセッション検証関数が提供されている場合
  if (customSessionValidator) {
    // Server Components用の仮のNextRequestオブジェクトを作成
    const mockRequest = createMockRequest();
    return await customSessionValidator(mockRequest);
  }

  try {
    // Next.js App Router の cookies() を使用
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(sessionCookieName);

    if (!sessionCookie) {
      return null;
    }

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
    console.error('Server session validation failed:', error);
    return null;
  }
}

/**
 * 現在のリクエストヘッダーからセッション情報を取得
 * ミドルウェアで設定されたヘッダーから情報を読み取る
 * 
 * @returns セッション情報（簡易版）
 */
export async function getSessionFromHeaders(): Promise<{
  isAuthenticated: boolean;
  userId?: string;
  isAdmin?: boolean;
} | null> {
  try {
    const headersList = headers();
    
    const isAuthenticated = headersList.get('x-noraneko-authenticated') === 'true';
    
    if (!isAuthenticated) {
      return { isAuthenticated: false };
    }

    const userId = headersList.get('x-noraneko-user-id');
    const isAdmin = headersList.get('x-noraneko-is-admin') === 'true';

    return {
      isAuthenticated: true,
      userId: userId || undefined,
      isAdmin,
    };
  } catch (error) {
    console.error('Failed to get session from headers:', error);
    return null;
  }
}

/**
 * セッション検証のヘルパー関数
 */
export async function requireAuth(config: AuthMiddlewareConfig): Promise<SessionData> {
  const session = await getServerSession(config);
  
  if (!session) {
    throw new Error('Authentication required');
  }
  
  return session;
}

/**
 * 管理者権限の検証
 */
export async function requireAdmin(config: AuthMiddlewareConfig): Promise<SessionData> {
  const session = await requireAuth(config);
  
  if (!session.user.is_admin) {
    throw new Error('Admin privileges required');
  }
  
  return session;
}

/**
 * 特定のスコープの検証
 */
export async function requireScopes(
  config: AuthMiddlewareConfig,
  requiredScopes: string[]
): Promise<SessionData> {
  const session = await requireAuth(config);
  
  const hasRequiredScopes = requiredScopes.every(scope => 
    session.scopes.includes(scope)
  );
  
  if (!hasRequiredScopes) {
    throw new Error(`Required scopes: ${requiredScopes.join(', ')}`);
  }
  
  return session;
}

/**
 * Server Components用のモックNextRequestオブジェクトを作成
 */
function createMockRequest(): any {
  const cookieStore = cookies();
  const headersList = headers();
  
  return {
    cookies: {
      get: (name: string) => cookieStore.get(name),
    },
    headers: {
      get: (name: string) => headersList.get(name),
    },
    nextUrl: {
      pathname: headersList.get('x-pathname') || '/',
      searchParams: new URLSearchParams(headersList.get('x-search') || ''),
    },
  };
}