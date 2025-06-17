import { a as AuthError } from './types-od4YWh0d.js';
export { A as AuthConfig, d as AuthStatus, S as Session, T as TokenResponse, U as User, f as UserInfoResponse } from './types-od4YWh0d.js';

declare class NoranekoAuthError extends Error implements AuthError {
    code: string;
    cause?: Error | undefined;
    readonly type: "AuthError";
    constructor(code: string, message: string, cause?: Error | undefined);
}
declare class TokenExpiredError extends NoranekoAuthError {
    constructor(message?: string);
}
declare class InvalidTokenError extends NoranekoAuthError {
    constructor(message?: string);
}
declare class AuthenticationRequiredError extends NoranekoAuthError {
    constructor(message?: string);
}
declare class OAuthError extends NoranekoAuthError {
    oauthError: string;
    oauthErrorDescription?: string | undefined;
    constructor(oauthError: string, oauthErrorDescription?: string | undefined);
}

export { AuthError, AuthenticationRequiredError, InvalidTokenError, NoranekoAuthError, OAuthError, TokenExpiredError };
