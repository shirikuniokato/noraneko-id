'use client'
import 'client-only'
import { useSessionContext } from './providers'
import type { Session, User } from '../shared/types'

// useAuthCallbackの再エクスポート
export { useAuthCallback } from './useAuthCallback'

// NextAuth風のuseSession
export function useSession() {
  const { data, status, update } = useSessionContext()
  
  return {
    data,
    status,
    update
  }
}

// noraneko-id独自のuseAuth
export function useAuth() {
  const { data: session, status, update } = useSessionContext()
  
  const login = (redirectTo?: string) => {
    const url = new URL('/api/auth/login', window.location.origin)
    if (redirectTo) {
      url.searchParams.set('callbackUrl', redirectTo)
    }
    window.location.href = url.toString()
  }
  
  const logout = (redirectTo?: string) => {
    const url = new URL('/api/auth/logout', window.location.origin)
    if (redirectTo) {
      url.searchParams.set('callbackUrl', redirectTo)
    }
    window.location.href = url.toString()
  }
  
  return {
    session,
    user: session?.user || null,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    login,
    logout,
    refresh: update
  }
}

// ユーザー情報のみを取得するhook
export function useUser(): User | null {
  const { data: session } = useSessionContext()
  return session?.user || null
}

// 認証状態のみを取得するhook  
export function useAuthStatus() {
  const { status } = useSessionContext()
  return status
}