// ルートエントリーポイント - 型定義のみをエクスポート
// 実際のimportは各専用エントリーポイントから行う

// 共通型定義
export type { 
  Session, 
  User, 
  AuthConfig, 
  AuthError, 
  AuthStatus,
  TokenResponse,
  UserInfoResponse
} from './shared/types'

// エラークラス
export { 
  NoranekoAuthError, 
  TokenExpiredError, 
  InvalidTokenError, 
  AuthenticationRequiredError,
  OAuthError 
} from './shared/errors'

// 使用方法のドキュメント
/**
 * @example
 * // Server Components
 * import { auth, requireAuth, createAuth } from '@noranekoid/nextjs/server'
 * 
 * // Client Components  
 * import { useSession, useAuth, SessionProvider } from '@noranekoid/nextjs/client'
 * 
 * // API Routes
 * import { createLoginHandler, createCallbackHandler } from '@noranekoid/nextjs/api'
 * 
 * // Middleware
 * import { createAuthMiddleware } from '@noranekoid/nextjs/middleware'
 */