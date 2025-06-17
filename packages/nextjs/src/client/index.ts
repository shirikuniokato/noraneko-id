'use client'
import 'client-only'

// React hooks
export { useSession, useAuth, useUser, useAuthStatus, useAuthCallback } from './hooks'

// Context providers
export { SessionProvider } from './providers'

// 型定義（client側で必要なもののみ）
export type { 
  Session, 
  User, 
  AuthStatus, 
  CallbackStatus, 
  CallbackError, 
  CallbackState, 
  CallbackParams 
} from '../shared/types'