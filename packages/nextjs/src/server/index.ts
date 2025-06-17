import 'server-only'

// 認証核心機能
export { auth, requireAuth, saveSession, clearSession, exchangeCodeForTokens } from './auth'

// 設定機能  
export { createAuth, getAuthConfig } from './config'

// Discovery機能（ビルド時）
export type { DiscoveryDocument } from './discovery'

// 型定義
export type { Session, User, AuthConfig, AuthError } from '../shared/types'

// エラークラス
export { 
  NoranekoAuthError, 
  TokenExpiredError, 
  InvalidTokenError, 
  AuthenticationRequiredError,
  OAuthError 
} from '../shared/errors'