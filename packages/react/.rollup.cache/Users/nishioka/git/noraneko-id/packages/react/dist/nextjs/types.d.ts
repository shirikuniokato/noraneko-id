import { NoranekoIDConfig } from '@noraneko/id-sdk';
import { NextRequest } from 'next/server';
export interface NextJSConfig extends Omit<NoranekoIDConfig, 'storage'> {
    /**
     * Enable HttpOnly cookie storage (recommended for production)
     * @default true
     */
    useHttpOnlyCookies?: boolean;
    /**
     * Cookie configuration
     */
    cookies?: {
        /** Cookie name prefix @default 'noraneko' */
        prefix?: string;
        /** Max age in seconds @default 7 * 24 * 60 * 60 (7 days) */
        maxAge?: number;
        /** Secure flag @default true in production */
        secure?: boolean;
        /** SameSite attribute @default 'lax' */
        sameSite?: 'strict' | 'lax' | 'none';
        /** Cookie path @default '/' */
        path?: string;
    };
    /**
     * API route configuration
     */
    apiRoute?: {
        /** Base path for auth API routes @default '/api/auth' */
        basePath?: string;
    };
}
export interface AuthTokens {
    accessToken: string | null;
    refreshToken: string | null;
    idToken: string | null;
}
export interface ServerUserInfo {
    sub: string;
    email: string;
    name?: string;
    preferred_username?: string;
    email_verified?: boolean;
    [key: string]: any;
}
export interface ApiHandlerConfig {
    issuer: string;
    cookies?: NextJSConfig['cookies'];
}
export type AuthorizerFunction = (token: string, request: NextRequest, path: string) => Promise<boolean> | boolean;
export interface MiddlewareConfig {
    /** Cookie prefix @default 'noraneko' */
    cookiePrefix?: string;
    /** Login page URL @default '/login' */
    loginUrl?: string;
    /** Paths that require authentication */
    protectedPaths?: string[];
    /** Paths that should redirect authenticated users (e.g., login page) */
    publicOnlyPaths?: string[];
    /** Custom authorization function for protected paths */
    authorizer?: AuthorizerFunction;
    /** Unauthorized redirect URL @default '/unauthorized' */
    unauthorizedUrl?: string;
    /** OAuth2 issuer URL (optional, for built-in token validation) */
    issuer?: string;
    /** Skip middleware for these paths (supports wildcards) */
    skipPaths?: string[];
    /** Custom redirect function after authentication check */
    onUnauthorized?: (request: NextRequest, reason: 'unauthenticated' | 'unauthorized') => Response;
    /** Custom redirect function for authenticated users on public-only paths */
    onAuthenticatedPublicPath?: (request: NextRequest) => Response;
}
//# sourceMappingURL=types.d.ts.map