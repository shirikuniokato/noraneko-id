import { AuthTokens, ServerUserInfo } from '../types';
/**
 * Get authentication tokens from HttpOnly cookies (Server Components/Actions)
 */
export declare function getServerAuthTokens(cookiePrefix?: string): Promise<AuthTokens>;
/**
 * Require authentication with automatic redirect to login
 */
export declare function requireAuth(options?: {
    cookiePrefix?: string;
    redirectTo?: string;
}): Promise<AuthTokens>;
/**
 * Get user information from the OAuth2 userinfo endpoint (Server Side)
 */
export declare function getServerUserInfo(options?: {
    cookiePrefix?: string;
    issuer?: string;
}): Promise<ServerUserInfo | null>;
/**
 * Require authorization with custom checker and automatic redirect
 */
export declare function requireAuthWithPermission<T = ServerUserInfo>(authorizer: (userInfo: ServerUserInfo, tokens: AuthTokens) => Promise<boolean> | boolean, options?: {
    cookiePrefix?: string;
    issuer?: string;
    redirectTo?: string;
    unauthorizedRedirectTo?: string;
}): Promise<ServerUserInfo>;
/**
 * Common authorizers for server-side permission checks
 */
export declare const serverAuthorizers: {
    /** Check if user has admin role via API */
    admin: (userInfo: ServerUserInfo, tokens: AuthTokens) => Promise<boolean>;
    /** Check if user has specific email domain */
    emailDomain: (allowedDomains: string[]) => (userInfo: ServerUserInfo) => boolean;
    /** Check if user has verified email */
    verifiedEmail: (userInfo: ServerUserInfo) => boolean;
    /** Check if user has any of the specified scopes */
    scopes: (requiredScopes: string[]) => (userInfo: ServerUserInfo) => boolean;
    /** Combine multiple authorizers with AND logic */
    and: (...authorizers: Array<(userInfo: ServerUserInfo, tokens: AuthTokens) => Promise<boolean> | boolean>) => (userInfo: ServerUserInfo, tokens: AuthTokens) => Promise<boolean>;
    /** Combine multiple authorizers with OR logic */
    or: (...authorizers: Array<(userInfo: ServerUserInfo, tokens: AuthTokens) => Promise<boolean> | boolean>) => (userInfo: ServerUserInfo, tokens: AuthTokens) => Promise<boolean>;
};
/**
 * Authenticated fetch with automatic token injection
 */
export declare function authenticatedFetch(url: string, options?: RequestInit & {
    cookiePrefix?: string;
    requireAuth?: boolean;
}): Promise<Response>;
/**
 * Check if user is authenticated (for conditional rendering)
 *
 * JWTの場合はローカル検証、オパークトークンの場合は存在チェックのみ行います。
 */
export declare function isAuthenticated(cookiePrefix?: string): Promise<boolean>;
/**
 * Get authentication status and user info in one call
 */
export declare function getAuthStatus(options?: {
    cookiePrefix?: string;
    issuer?: string;
}): Promise<{
    isAuthenticated: boolean;
    userInfo: ServerUserInfo | null;
    tokens: AuthTokens;
}>;
/**
 * Server Action用のOAuth2準拠ログアウト関数
 *
 * @example
 * ```typescript
 * // app/components/LogoutButton.tsx
 * import { logout } from '@noraneko/id-react/nextjs/server';
 *
 * async function LogoutAction() {
 *   'use server';
 *   await logout({ redirectTo: '/login' });
 * }
 *
 * export function LogoutButton() {
 *   return (
 *     <form action={LogoutAction}>
 *       <button type="submit">ログアウト</button>
 *     </form>
 *   );
 * }
 * ```
 */
export declare function logout(options?: {
    cookiePrefix?: string;
    issuer?: string;
    redirectTo?: string;
    skipRevoke?: boolean;
}): Promise<{
    success: boolean;
    actions: string[];
    error?: string;
}>;
//# sourceMappingURL=auth.d.ts.map