import 'server-only'
import { cookies } from 'next/headers'
import type { Session, User, TokenResponse, UserInfoResponse } from '../shared/types'
import { getAuthConfig, getDiscoveryConfig } from './config'
import { 
  AuthenticationRequiredError, 
  TokenExpiredError, 
  InvalidTokenError,
  OAuthError 
} from '../shared/errors'
import { 
  getCookieName, 
  parseCookieValue, 
  serializeCookieValue,
  isTokenExpired,
  isTokenExpiringSoon
} from '../shared/utils'

// NextAuth v5風の統一インターフェース
export async function auth(): Promise<Session | null> {
  try {
    const config = getAuthConfig()
    const session = await getSession()
    
    if (!session) {
      return null
    }
    
    // 自動リフレッシュが無効の場合は基本チェックのみ
    if (!config.autoRefresh?.enabled) {
      if (isTokenExpired(session.expiresAt)) {
        await clearSession()
        return null
      }
      return session
    }
    
    // トークンの有効期限チェック（期限切れ）
    if (isTokenExpired(session.expiresAt)) {
      if (session.refreshToken) {
        // リフレッシュトークンでセッション更新を試行（リトライ付き）
        const refreshed = await refreshSessionWithRetry(
          session.refreshToken, 
          config.autoRefresh.maxRetries || 3,
          config.autoRefresh.retryInterval || 5000
        )
        if (refreshed) {
          await saveSession(refreshed)
          return refreshed
        }
      }
      // リフレッシュ失敗またはリフレッシュトークンがない場合はセッションクリア
      await clearSession()
      return null
    }
    
    // 期限が近い場合はバックグラウンドでリフレッシュ
    const threshold = config.autoRefresh.refreshThreshold || 5 * 60 * 1000
    if (session.refreshToken && isTokenExpiringSoon(session.expiresAt, threshold)) {
      // 非同期でリフレッシュ（await しない）
      refreshSessionWithRetry(
        session.refreshToken,
        config.autoRefresh.maxRetries || 3,
        config.autoRefresh.retryInterval || 5000
      )
        .then(refreshed => refreshed && saveSession(refreshed))
        .catch((error) => {
          if (config.debug) {
            console.error('Background token refresh failed:', error)
          }
        })
    }
    
    return session
  } catch (error) {
    if (getAuthConfig().debug) {
      console.error('Auth error:', error)
    }
    return null
  }
}

// 認証必須のヘルパー（NextAuth v5風）
export async function requireAuth(): Promise<User> {
  const session = await auth()
  if (!session) {
    throw new AuthenticationRequiredError()
  }
  return session.user
}

// セッション取得（内部関数）
async function getSession(): Promise<Session | null> {
  const config = getAuthConfig()
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(getCookieName(config.cookiePrefix!, 'token'))
  
  return parseCookieValue<Session>(sessionCookie?.value)
}

// セッション保存
export async function saveSession(session: Session): Promise<void> {
  const config = getAuthConfig()
  const cookieStore = await cookies()
  
  cookieStore.set(getCookieName(config.cookiePrefix!, 'token'), serializeCookieValue(session), {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'lax',
    maxAge: Math.floor((session.expiresAt - Date.now()) / 1000),
    path: '/'
  })
}

// セッションクリア
export async function clearSession(): Promise<void> {
  const config = getAuthConfig()
  const cookieStore = await cookies()
  
  cookieStore.delete(getCookieName(config.cookiePrefix!, 'token'))
}

// OAuth2トークン交換
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<Session> {
  const config = getAuthConfig()
  const discovery = getDiscoveryConfig()
  if (!discovery) {
    throw new Error('Discovery configuration not available')
  }
  
  const tokenResponse = await fetch(discovery.token_endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    })
  })
  
  if (!tokenResponse.ok) {
    const error = await tokenResponse.json().catch(() => ({}))
    throw new OAuthError(error.error || 'token_exchange_failed', error.error_description)
  }
  
  const tokens: TokenResponse = await tokenResponse.json()
  
  // ユーザー情報取得
  const userInfo = await fetchUserInfo(tokens.access_token)
  
  // セッション作成
  const session: Session = {
    user: {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      image: userInfo.picture
    },
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + (tokens.expires_in * 1000),
    scope: tokens.scope
  }
  
  return session
}

// リフレッシュトークンでセッション更新（リトライ機能付き）
async function refreshSessionWithRetry(
  refreshToken: string, 
  maxRetries: number = 3, 
  retryInterval: number = 5000
): Promise<Session | null> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const session = await refreshSession(refreshToken)
      if (session) {
        if (getAuthConfig().debug && attempt > 1) {
          console.log(`Token refresh succeeded on attempt ${attempt}`)
        }
        return session
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      if (getAuthConfig().debug) {
        console.warn(`Token refresh attempt ${attempt}/${maxRetries} failed:`, lastError.message)
      }
      
      // 最後の試行でなければ待機
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryInterval))
      }
    }
  }
  
  if (getAuthConfig().debug) {
    console.error(`Token refresh failed after ${maxRetries} attempts. Last error:`, lastError?.message)
  }
  
  return null
}

// リフレッシュトークンでセッション更新（基本実装）
async function refreshSession(refreshToken: string): Promise<Session | null> {
  const config = getAuthConfig()
  const discovery = getDiscoveryConfig()
  if (!discovery) {
    throw new Error('Discovery configuration not available')
  }
  
  const tokenResponse = await fetch(discovery.token_endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.clientId,
      refresh_token: refreshToken
    })
  })
  
  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.json().catch(() => ({}))
    throw new TokenExpiredError(`Failed to refresh token: ${errorData.error || tokenResponse.statusText}`)
  }
  
  const tokens: TokenResponse = await tokenResponse.json()
  const userInfo = await fetchUserInfo(tokens.access_token)
  
  return {
    user: {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      image: userInfo.picture
    },
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || refreshToken, // 新しいリフレッシュトークンがなければ既存を使用
    expiresAt: Date.now() + (tokens.expires_in * 1000),
    scope: tokens.scope
  }
}

// ユーザー情報取得
async function fetchUserInfo(accessToken: string): Promise<UserInfoResponse> {
  const config = getAuthConfig()
  const discovery = getDiscoveryConfig()
  if (!discovery || !discovery.userinfo_endpoint) {
    throw new Error('Discovery configuration or userinfo endpoint not available')
  }
  
  const userResponse = await fetch(discovery.userinfo_endpoint, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
  
  if (!userResponse.ok) {
    throw new InvalidTokenError('Failed to fetch user info')
  }
  
  return userResponse.json()
}