/**
 * noraneko-id SDK ユーティリティ関数
 */

import { 
  PKCEParams, 
  TokenStorage, 
  JWTPayload, 
  ErrorDetails,
  ResolvedConfig,
  NoranekoIDConfig
} from '../types';
import { 
  PKCEError, 
  StorageError, 
  AuthenticationError, 
  ErrorCode,
  UnsupportedBrowserError,
  ConfigurationError 
} from '../errors';

/**
 * PKCE用のランダム文字列を生成
 */
export function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const array = new Uint8Array(length);
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto.getRandomValues
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  
  return Array.from(array, byte => charset[byte % charset.length]).join('');
}

/**
 * SHA256ハッシュを計算してBase64URL形式で返す
 */
export async function sha256Base64Url(data: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new UnsupportedBrowserError('Web Crypto API is not supported');
  }

  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  
  return base64UrlEncode(new Uint8Array(hashBuffer));
}

/**
 * Base64URL エンコード
 */
export function base64UrlEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64URL デコード
 */
export function base64UrlDecode(str: string): Uint8Array {
  // パディングを追加
  const padded = str + '='.repeat((4 - str.length % 4) % 4);
  // URL-safe文字を標準Base64文字に変換
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  
  return bytes;
}

/**
 * PKCEパラメータを生成
 */
export async function generatePKCEParams(): Promise<PKCEParams> {
  try {
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await sha256Base64Url(codeVerifier);
    
    return {
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256'
    };
  } catch (error) {
    throw new PKCEError(
      'PKCEパラメータの生成に失敗しました',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * JWTトークンをデコード（署名検証なし）
 */
export function decodeJWT(token: string): JWTPayload {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(parts[1]))
    );
    
    return payload;
  } catch (error) {
    throw new AuthenticationError(
      'JWTトークンのデコードに失敗しました',
      ErrorCode.INVALID_TOKEN,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * JWTトークンの有効期限をチェック
 */
export function isTokenExpired(token: string, clockSkewLeeway: number = 60): boolean {
  try {
    const payload = decodeJWT(token);
    const now = Math.floor(Date.now() / 1000);
    return payload.exp ? payload.exp + clockSkewLeeway < now : false;
  } catch {
    return true; // デコードできない場合は期限切れとして扱う
  }
}

/**
 * URLクエリパラメータをパース
 */
export function parseUrlParams(url: string): Record<string, string> {
  try {
    const urlObj = new URL(url);
    const params: Record<string, string> = {};
    
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  } catch (error) {
    throw new AuthenticationError(
      'URLパラメータの解析に失敗しました',
      ErrorCode.INVALID_STATE,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * OAuth2エラーパラメータをパース
 */
export function parseErrorParams(params: Record<string, string>): ErrorDetails | null {
  if (!params.error) {
    return null;
  }
  
  return {
    error: params.error,
    error_description: params.error_description,
    error_uri: params.error_uri,
    state: params.state
  };
}

/**
 * 設定を検証・補完
 */
export function resolveConfig(config: NoranekoIDConfig): ResolvedConfig {
  // 必須パラメータの検証
  if (!config.clientId) {
    throw new ConfigurationError(
      'clientId is required',
      ErrorCode.MISSING_REQUIRED_PARAMETER
    );
  }
  
  if (!config.issuer) {
    throw new ConfigurationError(
      'issuer is required',
      ErrorCode.MISSING_REQUIRED_PARAMETER
    );
  }

  // デフォルト値の設定
  const defaultRedirectUri = typeof window !== 'undefined' 
    ? `${window.location.origin}/auth/callback`
    : 'http://localhost:3000/auth/callback';

  const resolved: ResolvedConfig = {
    clientId: config.clientId,
    issuer: config.issuer.replace(/\/$/, ''), // 末尾のスラッシュを除去
    redirectUri: config.redirectUri || defaultRedirectUri,
    scopes: config.scopes || ['openid', 'profile', 'email'],
    tokenStorage: config.tokenStorage || 'localStorage',
    storagePrefix: config.storagePrefix || 'noraneko_',
    clockSkewLeeway: config.clockSkewLeeway || 60,
    refreshThreshold: config.refreshThreshold || 300,
    responseType: config.responseType || 'code',
    additionalParams: config.additionalParams || {},
    endpoints: {
      authorization: `${config.issuer.replace(/\/$/, '')}/oauth2/authorize`,
      token: `${config.issuer.replace(/\/$/, '')}/oauth2/token`,
      userinfo: `${config.issuer.replace(/\/$/, '')}/oauth2/userinfo`,
      revocation: `${config.issuer.replace(/\/$/, '')}/oauth2/revoke`,
      logout: `${config.issuer.replace(/\/$/, '')}/auth/logout`
    }
  };

  return resolved;
}

/**
 * ストレージインスタンスを作成
 */
export function createStorage(type: 'localStorage' | 'sessionStorage' | 'memory'): TokenStorage {
  switch (type) {
    case 'localStorage':
      if (typeof window === 'undefined' || !window.localStorage) {
        throw new StorageError('localStorage is not available');
      }
      return {
        getItem: (key) => window.localStorage.getItem(key),
        setItem: (key, value) => window.localStorage.setItem(key, value),
        removeItem: (key) => window.localStorage.removeItem(key),
        clear: () => window.localStorage.clear()
      };
      
    case 'sessionStorage':
      if (typeof window === 'undefined' || !window.sessionStorage) {
        throw new StorageError('sessionStorage is not available');
      }
      return {
        getItem: (key) => window.sessionStorage.getItem(key),
        setItem: (key, value) => window.sessionStorage.setItem(key, value),
        removeItem: (key) => window.sessionStorage.removeItem(key),
        clear: () => window.sessionStorage.clear()
      };
      
    case 'memory':
      const memoryStore = new Map<string, string>();
      return {
        getItem: (key) => memoryStore.get(key) || null,
        setItem: (key, value) => { memoryStore.set(key, value); },
        removeItem: (key) => { memoryStore.delete(key); },
        clear: () => { memoryStore.clear(); }
      };
      
    default:
      throw new StorageError(`Unsupported storage type: ${type}`);
  }
}

/**
 * 現在時刻のUNIXタイムスタンプを取得（秒）
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * URLにクエリパラメータを追加
 */
export function addQueryParams(url: string, params: Record<string, string>): string {
  const urlObj = new URL(url);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      urlObj.searchParams.set(key, value);
    }
  });
  
  return urlObj.toString();
}

/**
 * 現在のURLからフラグメント（#以降）を除去
 */
export function removeUrlFragment(url: string): string {
  return url.split('#')[0];
}

/**
 * ブラウザが必要なAPIをサポートしているかチェック
 */
export function checkBrowserSupport(): void {
  const missing: string[] = [];
  
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    missing.push('crypto.getRandomValues');
  }
  
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    missing.push('crypto.subtle');
  }
  
  if (typeof URL === 'undefined') {
    missing.push('URL');
  }
  
  if (typeof TextEncoder === 'undefined') {
    missing.push('TextEncoder');
  }
  
  if (typeof TextDecoder === 'undefined') {
    missing.push('TextDecoder');
  }
  
  if (missing.length > 0) {
    throw new UnsupportedBrowserError(
      `このブラウザは必要なAPIをサポートしていません: ${missing.join(', ')}`,
      { missingAPIs: missing }
    );
  }
}

/**
 * デバッグ用のログ出力（本番環境では無効）
 */
export function debugLog(message: string, data?: any): void {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log(`[noraneko-id] ${message}`, data || '');
  }
}