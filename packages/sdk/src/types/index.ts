/**
 * noraneko-id SDK型定義
 */

// ユーザー情報
export interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  email_verified: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

// 設定関連
export interface NoranekoIDConfig {
  /** OAuth2クライアントID */
  clientId: string;
  
  /** noraneko-idサーバーのベースURL */
  issuer: string;
  
  /** リダイレクトURI（デフォルト: 現在のorigin + '/auth/callback'） */
  redirectUri?: string;
  
  /** 要求するスコープ（デフォルト: ['openid', 'profile', 'email']） */
  scopes?: string[];
  
  /** トークン保存先（デフォルト: 'localStorage'） */
  tokenStorage?: 'localStorage' | 'sessionStorage' | 'memory';
  
  /** ストレージキーのプレフィックス（デフォルト: 'noraneko_'） */
  storagePrefix?: string;
  
  /** JWTトークンの時刻スキュー許容秒数（デフォルト: 60） */
  clockSkewLeeway?: number;
  
  /** トークン期限切れ前の更新開始秒数（デフォルト: 300） */
  refreshThreshold?: number;
  
  /** レスポンスタイプ（デフォルト: 'code'） */
  responseType?: 'code';
  
  /** 追加の認証パラメータ */
  additionalParams?: Record<string, string>;
}

// 認証フロー関連
export interface AuthOptions {
  /** 要求するスコープ（設定を上書き） */
  scopes?: string[];
  
  /** リダイレクトURI（設定を上書き） */
  redirectUri?: string;
  
  /** 追加のパラメータ */
  additionalParams?: Record<string, string>;
  
  /** state parameter（指定しない場合は自動生成） */
  state?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

// PKCE関連
export interface PKCEParams {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

// イベント関連
export type NoranekoIDEventType = 
  | 'authenticated'
  | 'unauthenticated' 
  | 'tokenRefreshed'
  | 'error'
  | 'tokenExpired';

export interface NoranekoIDEventData {
  authenticated: User;
  unauthenticated: void;
  tokenRefreshed: TokenResponse;
  error: Error;
  tokenExpired: void;
}

export type EventCallback<T extends NoranekoIDEventType> = (data: NoranekoIDEventData[T]) => void;

// ログアウト関連
export interface LogoutOptions {
  /** ローカルトークンのみクリア（サーバー側のセッションは残す） */
  localOnly?: boolean;
  
  /** ログアウト後のリダイレクトURI */
  returnTo?: string;
}

// JWT関連
export interface JWTPayload {
  sub: string;
  aud: string;
  iss: string;
  exp: number;
  iat: number;
  scope?: string;
  client_id?: string;
  [key: string]: any;
}

// 内部状態管理
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  scopes: string[];
}

// エラー関連
export interface ErrorDetails {
  error: string;
  error_description?: string;
  error_uri?: string;
  state?: string;
}

// OAuth2エンドポイント関連
export interface OAuth2Endpoints {
  authorization: string;
  token: string;
  userinfo: string;
  revocation?: string;
  logout?: string;
}

// ストレージインターフェース
export interface TokenStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

// 内部設定（完全な設定）
export interface ResolvedConfig extends Required<Omit<NoranekoIDConfig, 'additionalParams'>> {
  additionalParams: Record<string, string>;
  endpoints: OAuth2Endpoints;
}