// 共通型定義
export interface User {
  id: string
  email: string
  name?: string
  image?: string
}

export interface Session {
  user: User
  accessToken: string
  refreshToken?: string
  expiresAt: number
  scope?: string
}

export interface AuthConfig {
  issuer: string
  clientId: string
  clientSecret?: string
  scopes?: string[]
  redirectUri?: string
  loginPath?: string
  callbackPath?: string
  logoutPath?: string
  cookiePrefix?: string
  cookieSecure?: boolean
  debug?: boolean
  // 自動リフレッシュ設定
  autoRefresh?: {
    enabled?: boolean
    refreshThreshold?: number    // 何ミリ秒前にリフレッシュ開始（デフォルト5分）
    maxRetries?: number         // 最大リトライ回数
    retryInterval?: number      // リトライ間隔（ミリ秒）
  }
}

export interface AuthError extends Error {
  type: 'AuthError'
  code: string
}

export interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope?: string
}

export interface UserInfoResponse {
  sub: string
  email: string
  name?: string
  picture?: string
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

// OAuth2コールバック関連の型定義
export type CallbackStatus = 'loading' | 'success' | 'error'

export interface CallbackError {
  error: string
  error_description?: string
  error_uri?: string
}

export interface CallbackState {
  status: CallbackStatus
  error: CallbackError | null
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
}

export interface CallbackParams {
  code?: string
  state?: string
  error?: string
  error_description?: string
  error_uri?: string
}