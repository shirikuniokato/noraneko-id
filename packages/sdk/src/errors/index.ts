/**
 * noraneko-id SDK エラークラス
 */

export enum ErrorCode {
  // 設定エラー
  INVALID_CONFIG = 'INVALID_CONFIG',
  MISSING_REQUIRED_PARAMETER = 'MISSING_REQUIRED_PARAMETER',
  
  // 認証エラー
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  INVALID_STATE = 'INVALID_STATE',
  AUTHORIZATION_DENIED = 'AUTHORIZATION_DENIED',
  
  // ネットワークエラー
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  
  // PKCE関連
  PKCE_ERROR = 'PKCE_ERROR',
  
  // その他
  UNSUPPORTED_BROWSER = 'UNSUPPORTED_BROWSER',
  STORAGE_ERROR = 'STORAGE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * SDK基底エラークラス
 */
export abstract class NoranekoIDError extends Error {
  public readonly code: ErrorCode;
  public readonly originalError?: Error;
  public readonly details?: Record<string, any>;

  constructor(
    code: ErrorCode,
    message: string,
    originalError?: Error,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.originalError = originalError;
    this.details = details;

    // Error.captureStackTrace が利用可能な場合（Node.js環境など）
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * エラーの詳細情報を含むオブジェクトを返す
   */
  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message
      } : undefined
    };
  }
}

/**
 * 設定関連のエラー
 */
export class ConfigurationError extends NoranekoIDError {
  constructor(
    message: string,
    code: ErrorCode.INVALID_CONFIG | ErrorCode.MISSING_REQUIRED_PARAMETER = ErrorCode.INVALID_CONFIG,
    details?: Record<string, any>
  ) {
    super(code, message, undefined, details);
  }
}

/**
 * 認証関連のエラー
 */
export class AuthenticationError extends NoranekoIDError {
  constructor(
    message: string,
    code: ErrorCode.AUTHENTICATION_FAILED | ErrorCode.TOKEN_EXPIRED | ErrorCode.INVALID_TOKEN | ErrorCode.TOKEN_REFRESH_FAILED | ErrorCode.INVALID_STATE | ErrorCode.AUTHORIZATION_DENIED | ErrorCode.SERVER_ERROR | ErrorCode.PKCE_ERROR = ErrorCode.AUTHENTICATION_FAILED,
    originalError?: Error,
    details?: Record<string, any>
  ) {
    super(code, message, originalError, details);
  }
}

/**
 * ネットワーク関連のエラー
 */
export class NetworkError extends NoranekoIDError {
  public readonly status?: number;
  public readonly statusText?: string;

  constructor(
    message: string,
    code: ErrorCode.NETWORK_ERROR | ErrorCode.SERVER_ERROR | ErrorCode.INVALID_RESPONSE = ErrorCode.NETWORK_ERROR,
    originalError?: Error,
    status?: number,
    statusText?: string,
    details?: Record<string, any>
  ) {
    super(code, message, originalError, details);
    this.status = status;
    this.statusText = statusText;
  }

  public toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      status: this.status,
      statusText: this.statusText
    };
  }
}

/**
 * PKCE関連のエラー
 */
export class PKCEError extends NoranekoIDError {
  constructor(
    message: string,
    originalError?: Error,
    details?: Record<string, any>
  ) {
    super(ErrorCode.PKCE_ERROR, message, originalError, details);
  }
}

/**
 * ストレージ関連のエラー
 */
export class StorageError extends NoranekoIDError {
  constructor(
    message: string,
    originalError?: Error,
    details?: Record<string, any>
  ) {
    super(ErrorCode.STORAGE_ERROR, message, originalError, details);
  }
}

/**
 * 未サポートブラウザエラー
 */
export class UnsupportedBrowserError extends NoranekoIDError {
  constructor(
    message: string = 'このブラウザはサポートされていません',
    details?: Record<string, any>
  ) {
    super(ErrorCode.UNSUPPORTED_BROWSER, message, undefined, details);
  }
}

/**
 * OAuth2エラーレスポンスをパースしてエラーを作成
 */
export function createOAuth2Error(
  error: string,
  errorDescription?: string,
  errorUri?: string,
  state?: string
): AuthenticationError {
  const details = {
    error,
    error_description: errorDescription,
    error_uri: errorUri,
    state
  };

  let code: ErrorCode;
  let message: string;

  switch (error) {
    case 'invalid_request':
      code = ErrorCode.AUTHENTICATION_FAILED;
      message = 'リクエストが無効です';
      break;
    case 'unauthorized_client':
      code = ErrorCode.AUTHENTICATION_FAILED;
      message = 'クライアントが認証されていません';
      break;
    case 'access_denied':
      code = ErrorCode.AUTHORIZATION_DENIED;
      message = 'アクセスが拒否されました';
      break;
    case 'unsupported_response_type':
      code = ErrorCode.AUTHENTICATION_FAILED;
      message = 'サポートされていないレスポンスタイプです';
      break;
    case 'invalid_scope':
      code = ErrorCode.AUTHENTICATION_FAILED;
      message = '無効なスコープです';
      break;
    case 'server_error':
      code = ErrorCode.SERVER_ERROR;
      message = 'サーバーエラーが発生しました';
      break;
    case 'temporarily_unavailable':
      code = ErrorCode.SERVER_ERROR;
      message = 'サーバーが一時的に利用できません';
      break;
    case 'invalid_client':
      code = ErrorCode.AUTHENTICATION_FAILED;
      message = '無効なクライアントです';
      break;
    case 'invalid_grant':
      code = ErrorCode.AUTHENTICATION_FAILED;
      message = '無効な認可グラントです';
      break;
    case 'unsupported_grant_type':
      code = ErrorCode.AUTHENTICATION_FAILED;
      message = 'サポートされていないグラントタイプです';
      break;
    default:
      code = ErrorCode.AUTHENTICATION_FAILED;
      message = errorDescription || '認証エラーが発生しました';
  }

  return new AuthenticationError(message, code, undefined, details);
}

/**
 * HTTPレスポンスからエラーを作成
 */
export function createNetworkError(
  response: Response,
  originalError?: Error
): NetworkError {
  const status = response.status;
  const statusText = response.statusText;
  
  let code: ErrorCode;
  let message: string;

  if (status >= 500) {
    code = ErrorCode.SERVER_ERROR;
    message = `サーバーエラー: ${status} ${statusText}`;
  } else if (status >= 400) {
    code = ErrorCode.NETWORK_ERROR;
    message = `リクエストエラー: ${status} ${statusText}`;
  } else {
    code = ErrorCode.INVALID_RESPONSE;
    message = `予期しないレスポンス: ${status} ${statusText}`;
  }

  return new NetworkError(message, code, originalError, status, statusText);
}