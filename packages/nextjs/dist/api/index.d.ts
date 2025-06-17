import * as next_server from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
import { U as User } from '../types-od4YWh0d.js';
export { A as AuthConfig } from '../types-od4YWh0d.js';

declare function createLoginHandler(): (request: NextRequest) => Promise<NextResponse<unknown>>;

declare function createCallbackHandler(): (request: NextRequest) => Promise<NextResponse<unknown>>;

declare function createLogoutHandler(): (request: NextRequest) => Promise<NextResponse<unknown>>;

/**
 * NextAuth風の統一ハンドラー
 *
 * @example
 * ```typescript
 * // app/api/auth/[...noraneko]/route.ts
 * import { handlers } from "@noranekoid/nextjs/api"
 * export const { GET, POST } = handlers
 * ```
 */
declare const handlers: {
    GET: (request: NextRequest) => Promise<next_server.NextResponse<unknown>>;
    POST: (request: NextRequest) => Promise<Response>;
};

interface HandlersConfig {
    /**
     * カスタムパスマッピング
     * デフォルト: { login: 'login', callback: 'callback', logout: 'logout', token: 'token' }
     */
    paths?: {
        login?: string;
        callback?: string;
        logout?: string;
        token?: string;
    };
    /**
     * デフォルトアクション（パスが一致しない場合）
     * デフォルト: 'token' (RFC準拠)
     */
    defaultAction?: 'token' | 'login' | 'callback' | 'logout';
}
/**
 * カスタマイズ可能なハンドラーを作成
 *
 * @param config ハンドラー設定
 * @returns NextAuth風の統一ハンドラー
 *
 * @example
 * ```typescript
 * // app/api/auth/[...noraneko]/route.ts
 * import { createHandlers } from "@noranekoid/nextjs/api"
 *
 * export const { GET, POST } = createHandlers({
 *   paths: {
 *     login: 'signin',      // /api/auth/signin
 *     logout: 'signout',    // /api/auth/signout
 *     callback: 'callback', // /api/auth/callback
 *     token: 'token'        // /api/auth/token
 *   }
 * })
 * ```
 */
declare function createHandlers(config?: HandlersConfig): {
    GET: (request: NextRequest) => Promise<next_server.NextResponse<unknown>>;
    POST: (request: NextRequest) => Promise<Response>;
};

/**
 * GET /api/auth/token - 現在のトークン状態取得
 * RFC 6749準拠: トークン関連の操作を /token エンドポイントで実行
 */
declare function GET(request: NextRequest): Promise<NextResponse<null> | NextResponse<{
    user: User;
    expires_at: number;
    scope: string | undefined;
}> | NextResponse<{
    error: string;
}>>;
/**
 * POST /api/auth/token - トークンリフレッシュ
 * RFC 6749 Section 6: Refreshing an Access Token
 */
declare function POST(request: NextRequest): Promise<NextResponse<{
    error: string;
    error_description: string;
}> | NextResponse<{
    user: User;
    expires_at: number;
    scope: string | undefined;
}>>;

export { createCallbackHandler, createHandlers, createLoginHandler, createLogoutHandler, handlers, GET as tokenHandler, POST as tokenRefreshHandler };
