/**
 * noraneko-id SDK型定義
 */
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
export interface PKCEParams {
    codeVerifier: string;
    codeChallenge: string;
    codeChallengeMethod: 'S256';
}
export type NoranekoIDEventType = 'authenticated' | 'unauthenticated' | 'tokenRefreshed' | 'error' | 'tokenExpired';
export interface NoranekoIDEventData {
    authenticated: User;
    unauthenticated: void;
    tokenRefreshed: TokenResponse;
    error: Error;
    tokenExpired: void;
}
export type EventCallback<T extends NoranekoIDEventType> = (data: NoranekoIDEventData[T]) => void;
export interface LogoutOptions {
    /** ローカルトークンのみクリア（サーバー側のセッションは残す） */
    localOnly?: boolean;
    /** ログアウト後のリダイレクトURI */
    returnTo?: string;
}
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
export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
    scopes: string[];
}
export interface ErrorDetails {
    error: string;
    error_description?: string;
    error_uri?: string;
    state?: string;
}
export interface OAuth2Endpoints {
    authorization: string;
    token: string;
    userinfo: string;
    revocation?: string;
    logout?: string;
}
export interface TokenStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
}
export interface ResolvedConfig extends Required<Omit<NoranekoIDConfig, 'additionalParams'>> {
    additionalParams: Record<string, string>;
    endpoints: OAuth2Endpoints;
}
//# sourceMappingURL=index.d.ts.map