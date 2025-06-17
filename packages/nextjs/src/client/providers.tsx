'use client'
import 'client-only'
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, AuthStatus } from '../shared/types'

interface SessionContextValue {
  data: Session | null
  status: AuthStatus
  update: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

interface SessionProviderProps {
  children: ReactNode
  session?: Session | null
}

export function SessionProvider({ children, session: initialSession }: SessionProviderProps) {
  const [session, setSession] = useState<Session | null>(initialSession || null)
  const [status, setStatus] = useState<AuthStatus>(
    initialSession ? 'authenticated' : 'loading'
  )

  const updateSession = async () => {
    try {
      setStatus('loading')
      const response = await fetch('/api/auth/token')
      
      if (response.ok) {
        const data = await response.json()
        setSession(data)
        setStatus(data ? 'authenticated' : 'unauthenticated')
      } else {
        setSession(null)
        setStatus('unauthenticated')
      }
    } catch (error) {
      console.error('Failed to update token:', error)
      setSession(null)
      setStatus('unauthenticated')
    }
  }

  // 初期化時とフォーカス時にトークン更新
  useEffect(() => {
    if (!initialSession) {
      updateSession()
    }

    const handleFocus = () => updateSession()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateSession()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [initialSession])

  // トークン期限チェック
  useEffect(() => {
    if (!session || status !== 'authenticated') return

    const checkExpiration = () => {
      if (Date.now() >= session.expiresAt) {
        updateSession()
      }
    }

    const timeUntilExpiry = session.expiresAt - Date.now()
    const checkInterval = Math.min(timeUntilExpiry / 2, 60000) // 最大1分間隔

    const interval = setInterval(checkExpiration, checkInterval)
    return () => clearInterval(interval)
  }, [session, status])

  const value: SessionContextValue = {
    data: session,
    status,
    update: updateSession
  }

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSessionContext(): SessionContextValue {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSessionContext must be used within a SessionProvider')
  }
  return context
}