/**
 * Next.js Middleware types for noraneko-id
 */
interface NextRequest {
    nextUrl: {
        pathname: string;
        searchParams: URLSearchParams;
    };
    cookies: {
        get(name: string): {
            value: string;
        } | undefined;
    };
}
interface NextResponse {
    headers: {
        set(name: string, value: string): void;
    };
}
/**
 * セッション情報
 */
export interface SessionData {
    /** ユーザーID */
    userId: string;
    /** ユーザー情報 */
    user: {
        id: string;
        email: string;
        username: string;
        display_name: string;
        email_verified: boolean;
        is_admin: boolean;
    };
    /** セッションの有効期限 */
    expiresAt: number;
    /** 最後のアクティブ時刻 */
    lastActiveAt: number;
    /** 権限スコープ */
    scopes: string[];
}
/**
 * 認証ミドルウェアの設定
 */
export interface AuthMiddlewareConfig {
    /** noraneko-id APIサーバーのベースURL */
    issuer: string;
    /** セッション検証のためのAPIキー（オプション） */
    apiKey?: string;
    /** セッションCookie名 */
    sessionCookieName?: string;
    /** カスタムセッション検証関数 */
    customSessionValidator?: (request: NextRequest) => Promise<SessionData | null>;
}
/**
 * 認証ミドルウェアのオプション
 */
export interface AuthMiddlewareOptions {
    /** 保護するルートのパターン */
    protectedRoutes?: (string | RegExp | RouteMatcherFunction)[];
    /** 公開ルートのパターン（保護対象から除外） */
    publicRoutes?: (string | RegExp | RouteMatcherFunction)[];
    /** 認証コールバックルート */
    callbackRoute?: string;
    /** ログインページのURL */
    loginUrl?: string;
    /** ログイン後のリダイレクト先 */
    defaultRedirectTo?: string;
    /** 管理者のみアクセス可能なルート */
    adminRoutes?: (string | RegExp | RouteMatcherFunction)[];
    /** カスタム認証コールバック */
    onAuthenticationRequired?: AuthCallbackFunction;
    /** カスタム認証成功コールバック */
    onAuthenticationSuccess?: AuthCallbackFunction;
    /** カスタム認証失敗コールバック */
    onAuthenticationFailure?: AuthCallbackFunction;
}
/**
 * 保護ルートのオプション
 */
export interface ProtectedRouteOptions {
    /** 必要な権限スコープ */
    requiredScopes?: string[];
    /** 管理者権限が必要か */
    requireAdmin?: boolean;
    /** カスタム認証チェック関数 */
    customAuthCheck?: (session: SessionData, request: NextRequest) => boolean;
}
/**
 * ルートマッチャー関数
 */
export type RouteMatcherFunction = (pathname: string, request: NextRequest) => boolean;
/**
 * 認証コールバック関数
 */
export type AuthCallbackFunction = (request: NextRequest, session: SessionData | null) => NextResponse | Promise<NextResponse> | void | Promise<void>;
/**
 * ミドルウェアのレスポンス結果
 */
export interface MiddlewareResult {
    /** レスポンス */
    response?: NextResponse;
    /** セッション情報 */
    session?: SessionData | null;
    /** 認証が必要かどうか */
    authRequired: boolean;
    /** 認証されているかどうか */
    isAuthenticated: boolean;
    /** エラー情報 */
    error?: string;
}
/**
 * withAuth HOCのオプション
 */
export interface WithAuthOptions extends ProtectedRouteOptions {
    /** ローディングコンポーネント */
    loading?: React.ComponentType;
    /** 未認証時のフォールバックコンポーネント */
    fallback?: React.ComponentType;
    /** 権限不足時のフォールバックコンポーネント */
    unauthorized?: React.ComponentType;
}
export {};
//# sourceMappingURL=types.d.ts.map