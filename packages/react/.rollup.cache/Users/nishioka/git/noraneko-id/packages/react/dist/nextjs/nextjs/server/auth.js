import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
/**
 * Server-side authentication utilities for Next.js App Router
 */
const DEFAULT_COOKIE_PREFIX = 'noraneko';
/**
 * Get authentication tokens from HttpOnly cookies (Server Components/Actions)
 */
export async function getServerAuthTokens(cookiePrefix = DEFAULT_COOKIE_PREFIX) {
    const cookieStore = await cookies();
    return {
        accessToken: cookieStore.get(`${cookiePrefix}_access_token`)?.value || null,
        refreshToken: cookieStore.get(`${cookiePrefix}_refresh_token`)?.value || null,
        idToken: cookieStore.get(`${cookiePrefix}_id_token`)?.value || null,
    };
}
/**
 * Require authentication with automatic redirect to login
 */
export async function requireAuth(options = {}) {
    const { cookiePrefix = DEFAULT_COOKIE_PREFIX, redirectTo = '/login' } = options;
    const tokens = await getServerAuthTokens(cookiePrefix);
    if (!tokens.accessToken) {
        redirect(redirectTo);
    }
    return tokens;
}
/**
 * Get user information from the OAuth2 userinfo endpoint (Server Side)
 */
export async function getServerUserInfo(options = {}) {
    const { cookiePrefix = DEFAULT_COOKIE_PREFIX, issuer = process.env.NEXT_PUBLIC_API_URL || process.env.NORANEKO_ISSUER } = options;
    const tokens = await getServerAuthTokens(cookiePrefix);
    if (!tokens.accessToken || !issuer) {
        return null;
    }
    try {
        const response = await fetch(`${issuer}/oauth2/userinfo`, {
            headers: {
                'Authorization': `Bearer ${tokens.accessToken}`,
                'User-Agent': 'noraneko-id-nextjs-server',
            },
            cache: 'no-store', // Always fetch fresh user info
        });
        if (!response.ok) {
            console.error('UserInfo fetch failed:', response.status, response.statusText);
            return null;
        }
        return await response.json();
    }
    catch (error) {
        console.error('UserInfo fetch error:', error);
        return null;
    }
}
/**
 * Require authorization with custom checker and automatic redirect
 */
export async function requireAuthWithPermission(authorizer, options = {}) {
    const { cookiePrefix = DEFAULT_COOKIE_PREFIX, issuer = process.env.NEXT_PUBLIC_API_URL || process.env.NORANEKO_ISSUER, redirectTo = '/login', unauthorizedRedirectTo = '/unauthorized' } = options;
    const userInfo = await getServerUserInfo({ cookiePrefix, issuer });
    if (!userInfo) {
        redirect(redirectTo);
    }
    const tokens = await getServerAuthTokens(cookiePrefix);
    try {
        const hasPermission = await authorizer(userInfo, tokens);
        if (!hasPermission) {
            redirect(unauthorizedRedirectTo);
        }
    }
    catch (error) {
        console.error('Permission check error:', error);
        redirect(unauthorizedRedirectTo);
    }
    return userInfo;
}
/**
 * Common authorizers for server-side permission checks
 */
export const serverAuthorizers = {
    /** Check if user has admin role via API */
    admin: async (userInfo, tokens) => {
        const issuer = process.env.NEXT_PUBLIC_API_URL || process.env.NORANEKO_ISSUER;
        if (!tokens.accessToken || !issuer) {
            return false;
        }
        try {
            const response = await fetch(`${issuer}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${tokens.accessToken}`,
                    'User-Agent': 'noraneko-id-nextjs-server',
                },
                cache: 'no-store',
            });
            if (!response.ok) {
                return false;
            }
            const profile = await response.json();
            return profile.user?.is_admin === true;
        }
        catch {
            return false;
        }
    },
    /** Check if user has specific email domain */
    emailDomain: (allowedDomains) => (userInfo) => {
        const email = userInfo.email;
        if (!email)
            return false;
        const domain = email.split('@')[1];
        return allowedDomains.includes(domain);
    },
    /** Check if user has verified email */
    verifiedEmail: (userInfo) => !!userInfo.email_verified,
    /** Check if user has any of the specified scopes */
    scopes: (requiredScopes) => (userInfo) => {
        const userScopes = userInfo.scope?.split(' ') || [];
        return requiredScopes.some(scope => userScopes.includes(scope));
    },
    /** Combine multiple authorizers with AND logic */
    and: (...authorizers) => async (userInfo, tokens) => {
        for (const authorizer of authorizers) {
            const result = await authorizer(userInfo, tokens);
            if (!result)
                return false;
        }
        return true;
    },
    /** Combine multiple authorizers with OR logic */
    or: (...authorizers) => async (userInfo, tokens) => {
        for (const authorizer of authorizers) {
            const result = await authorizer(userInfo, tokens);
            if (result)
                return true;
        }
        return false;
    },
};
/**
 * Authenticated fetch with automatic token injection
 */
export async function authenticatedFetch(url, options = {}) {
    const { cookiePrefix = DEFAULT_COOKIE_PREFIX, requireAuth = true, ...fetchOptions } = options;
    const tokens = requireAuth
        ? await requireAuth({ cookiePrefix })
        : await getServerAuthTokens(cookiePrefix);
    if (!tokens.accessToken && requireAuth) {
        throw new Error('No access token available');
    }
    const headers = new Headers(fetchOptions.headers);
    if (tokens.accessToken) {
        headers.set('Authorization', `Bearer ${tokens.accessToken}`);
    }
    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }
    headers.set('User-Agent', 'noraneko-id-nextjs-server');
    return fetch(url, {
        ...fetchOptions,
        headers,
        cache: 'no-store', // Prevent caching of authenticated requests
    });
}
/**
 * Check if user is authenticated (for conditional rendering)
 *
 * JWTの場合はローカル検証、オパークトークンの場合は存在チェックのみ行います。
 */
export async function isAuthenticated(cookiePrefix = DEFAULT_COOKIE_PREFIX) {
    const tokens = await getServerAuthTokens(cookiePrefix);
    if (!tokens.accessToken) {
        return false;
    }
    // JWT検証をインポート（循環参照を避けるため動的インポート）
    const { validateJWTAccessToken, isJWTFormat } = await import('./jwt-validation');
    // JWTの場合はローカル検証
    if (isJWTFormat(tokens.accessToken)) {
        return validateJWTAccessToken(tokens.accessToken);
    }
    // オパークトークンの場合は存在チェックのみ
    // （完全な検証にはネットワーク呼び出しが必要だが、パフォーマンスを優先）
    return true;
}
/**
 * Get authentication status and user info in one call
 */
export async function getAuthStatus(options = {}) {
    const { cookiePrefix = DEFAULT_COOKIE_PREFIX, issuer } = options;
    const tokens = await getServerAuthTokens(cookiePrefix);
    const isAuth = !!tokens.accessToken;
    const userInfo = isAuth ? await getServerUserInfo({ cookiePrefix, issuer }) : null;
    return {
        isAuthenticated: isAuth,
        userInfo,
        tokens,
    };
}
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
export async function logout(options = {}) {
    const { cookiePrefix = DEFAULT_COOKIE_PREFIX, issuer = process.env.NEXT_PUBLIC_API_URL || process.env.NORANEKO_ISSUER, redirectTo = '/login', skipRevoke = false } = options;
    const results = [];
    let hasErrors = false;
    try {
        const tokens = await getServerAuthTokens(cookiePrefix);
        // Phase 1: OAuth2 token revocation (server-side invalidation)
        if (issuer && !skipRevoke) {
            if (tokens.accessToken) {
                try {
                    const revokeResponse = await fetch(`${issuer}/oauth2/revoke`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'User-Agent': 'noraneko-id-nextjs-server'
                        },
                        body: `token=${encodeURIComponent(tokens.accessToken)}&token_type_hint=access_token`,
                    });
                    if (revokeResponse.ok) {
                        results.push('access_token_revoked');
                    }
                    else {
                        console.warn('Access token revoke failed:', revokeResponse.status);
                        results.push('access_token_revoke_failed');
                        hasErrors = true;
                    }
                }
                catch (error) {
                    console.warn('Access token revoke error:', error);
                    results.push('access_token_revoke_failed');
                    hasErrors = true;
                }
            }
            if (tokens.refreshToken) {
                try {
                    const revokeResponse = await fetch(`${issuer}/oauth2/revoke`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'User-Agent': 'noraneko-id-nextjs-server'
                        },
                        body: `token=${encodeURIComponent(tokens.refreshToken)}&token_type_hint=refresh_token`,
                    });
                    if (revokeResponse.ok) {
                        results.push('refresh_token_revoked');
                    }
                    else {
                        console.warn('Refresh token revoke failed:', revokeResponse.status);
                        results.push('refresh_token_revoke_failed');
                        hasErrors = true;
                    }
                }
                catch (error) {
                    console.warn('Refresh token revoke error:', error);
                    results.push('refresh_token_revoke_failed');
                    hasErrors = true;
                }
            }
        }
        // Phase 2: Cookie cleanup (Server Components)
        const cookieStore = await cookies();
        cookieStore.delete(`${cookiePrefix}_access_token`);
        cookieStore.delete(`${cookiePrefix}_refresh_token`);
        cookieStore.delete(`${cookiePrefix}_id_token`);
        results.push('server_cookies_deleted');
        // Phase 3: Redirect (if specified)
        if (redirectTo) {
            redirect(redirectTo);
        }
        return {
            success: !hasErrors,
            actions: results,
            ...(hasErrors && {
                error: 'Some server-side operations failed, but local state was cleared'
            })
        };
    }
    catch (error) {
        // Fail-safe: Emergency cookie cleanup
        try {
            const cookieStore = await cookies();
            cookieStore.delete(`${cookiePrefix}_access_token`);
            cookieStore.delete(`${cookiePrefix}_refresh_token`);
            cookieStore.delete(`${cookiePrefix}_id_token`);
            results.push('emergency_cookie_cleanup');
        }
        catch (cleanupError) {
            console.error('Emergency cleanup failed:', cleanupError);
        }
        // If redirect was requested, do it anyway (fail-safe logout)
        if (redirectTo) {
            redirect(redirectTo);
        }
        return {
            success: false,
            actions: results,
            error: error instanceof Error ? error.message : 'Server logout failed'
        };
    }
}
//# sourceMappingURL=auth.js.map