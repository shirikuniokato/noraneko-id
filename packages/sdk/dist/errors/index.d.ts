/**
 * noraneko-id SDK エラークラス
 */
export declare enum ErrorCode {
    INVALID_CONFIG = "INVALID_CONFIG",
    MISSING_REQUIRED_PARAMETER = "MISSING_REQUIRED_PARAMETER",
    AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    INVALID_TOKEN = "INVALID_TOKEN",
    TOKEN_REFRESH_FAILED = "TOKEN_REFRESH_FAILED",
    INVALID_STATE = "INVALID_STATE",
    AUTHORIZATION_DENIED = "AUTHORIZATION_DENIED",
    NETWORK_ERROR = "NETWORK_ERROR",
    SERVER_ERROR = "SERVER_ERROR",
    INVALID_RESPONSE = "INVALID_RESPONSE",
    PKCE_ERROR = "PKCE_ERROR",
    UNSUPPORTED_BROWSER = "UNSUPPORTED_BROWSER",
    STORAGE_ERROR = "STORAGE_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
/**
 * SDK基底エラークラス
 */
export declare abstract class NoranekoIDError extends Error {
    readonly code: ErrorCode;
    readonly originalError?: Error;
    readonly details?: Record<string, any>;
    constructor(code: ErrorCode, message: string, originalError?: Error, details?: Record<string, any>);
    /**
     * エラーの詳細情報を含むオブジェクトを返す
     */
    toJSON(): Record<string, any>;
}
/**
 * 設定関連のエラー
 */
export declare class ConfigurationError extends NoranekoIDError {
    constructor(message: string, code?: ErrorCode.INVALID_CONFIG | ErrorCode.MISSING_REQUIRED_PARAMETER, details?: Record<string, any>);
}
/**
 * 認証関連のエラー
 */
export declare class AuthenticationError extends NoranekoIDError {
    constructor(message: string, code?: ErrorCode.AUTHENTICATION_FAILED | ErrorCode.TOKEN_EXPIRED | ErrorCode.INVALID_TOKEN | ErrorCode.TOKEN_REFRESH_FAILED | ErrorCode.INVALID_STATE | ErrorCode.AUTHORIZATION_DENIED | ErrorCode.SERVER_ERROR | ErrorCode.PKCE_ERROR, originalError?: Error, details?: Record<string, any>);
}
/**
 * ネットワーク関連のエラー
 */
export declare class NetworkError extends NoranekoIDError {
    readonly status?: number;
    readonly statusText?: string;
    constructor(message: string, code?: ErrorCode.NETWORK_ERROR | ErrorCode.SERVER_ERROR | ErrorCode.INVALID_RESPONSE, originalError?: Error, status?: number, statusText?: string, details?: Record<string, any>);
    toJSON(): Record<string, any>;
}
/**
 * PKCE関連のエラー
 */
export declare class PKCEError extends NoranekoIDError {
    constructor(message: string, originalError?: Error, details?: Record<string, any>);
}
/**
 * ストレージ関連のエラー
 */
export declare class StorageError extends NoranekoIDError {
    constructor(message: string, originalError?: Error, details?: Record<string, any>);
}
/**
 * 未サポートブラウザエラー
 */
export declare class UnsupportedBrowserError extends NoranekoIDError {
    constructor(message?: string, details?: Record<string, any>);
}
/**
 * OAuth2エラーレスポンスをパースしてエラーを作成
 */
export declare function createOAuth2Error(error: string, errorDescription?: string, errorUri?: string, state?: string): AuthenticationError;
/**
 * HTTPレスポンスからエラーを作成
 */
export declare function createNetworkError(response: Response, originalError?: Error): NetworkError;
//# sourceMappingURL=index.d.ts.map