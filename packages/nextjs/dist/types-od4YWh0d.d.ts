interface User {
    id: string;
    email: string;
    name?: string;
    image?: string;
}
interface Session {
    user: User;
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
    scope?: string;
}
interface AuthConfig {
    issuer: string;
    clientId: string;
    clientSecret?: string;
    scopes?: string[];
    redirectUri?: string;
    loginPath?: string;
    callbackPath?: string;
    logoutPath?: string;
    cookiePrefix?: string;
    cookieSecure?: boolean;
    debug?: boolean;
    autoRefresh?: {
        enabled?: boolean;
        refreshThreshold?: number;
        maxRetries?: number;
        retryInterval?: number;
    };
}
interface AuthError extends Error {
    type: 'AuthError';
    code: string;
}
interface TokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    scope?: string;
}
interface UserInfoResponse {
    sub: string;
    email: string;
    name?: string;
    picture?: string;
}
type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
type CallbackStatus = 'loading' | 'success' | 'error';
interface CallbackError {
    error: string;
    error_description?: string;
    error_uri?: string;
}
interface CallbackState {
    status: CallbackStatus;
    error: CallbackError | null;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
}
interface CallbackParams {
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
    error_uri?: string;
}

export type { AuthConfig as A, CallbackParams as C, Session as S, TokenResponse as T, User as U, AuthError as a, CallbackError as b, CallbackState as c, AuthStatus as d, CallbackStatus as e, UserInfoResponse as f };
