import 'server-only'
import type { AuthConfig } from '../shared/types'
import type { DiscoveryDocument } from './discovery'

let globalConfig: AuthConfig | null = null
let discoveryConfig: DiscoveryDocument | null = null

export function setAuthConfig(config: AuthConfig): void {
  // デフォルト値の設定
  globalConfig = {
    scopes: ['openid', 'profile', 'email'],
    redirectUri: '/api/auth/callback',
    loginPath: '/api/auth/login',
    callbackPath: '/api/auth/callback',
    logoutPath: '/api/auth/logout',
    cookiePrefix: 'noraneko-auth',
    cookieSecure: process.env.NODE_ENV === 'production',
    debug: process.env.NODE_ENV === 'development',
    autoRefresh: {
      enabled: true,
      refreshThreshold: 5 * 60 * 1000,  // 5分前
      maxRetries: 3,
      retryInterval: 5 * 1000,          // 5秒間隔
      ...(config.autoRefresh || {})
    },
    ...config
  }
  
  // ビルド時Discoveryの結果を取得
  const discoveryJson = process.env.NORANEKO_DISCOVERY_CONFIG
  if (!discoveryJson) {
    throw new Error(
      'NORANEKO_DISCOVERY_CONFIG environment variable not found. ' +
      'Make sure to add the discovery configuration to your next.config.js. ' +
      'See: https://github.com/noraneko-id/nextjs#build-time-discovery'
    )
  }
  
  try {
    discoveryConfig = JSON.parse(discoveryJson)
    
    // 基本的な検証
    if (!discoveryConfig || !discoveryConfig.authorization_endpoint || !discoveryConfig.token_endpoint) {
      throw new Error('Invalid discovery configuration embedded at build time')
    }
    
    if (config.debug) {
      console.log('Using build-time OIDC discovery configuration:', {
        authorization_endpoint: discoveryConfig.authorization_endpoint,
        token_endpoint: discoveryConfig.token_endpoint,
        userinfo_endpoint: discoveryConfig.userinfo_endpoint,
      })
    }
  } catch (error) {
    throw new Error(`Failed to parse discovery configuration: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// 環境変数から自動初期化
function initializeFromEnv(): AuthConfig {
  const issuer = process.env.NORANEKO_ISSUER
  const clientId = process.env.NORANEKO_CLIENT_ID
  
  if (!issuer || !clientId) {
    throw new Error('NORANEKO_ISSUER and NORANEKO_CLIENT_ID environment variables are required')
  }
  
  return {
    issuer,
    clientId,
    clientSecret: process.env.NORANEKO_CLIENT_SECRET,
    scopes: ['openid', 'profile', 'email'],
    redirectUri: '/api/auth/callback',
    loginPath: '/api/auth/login',
    callbackPath: '/api/auth/callback',
    logoutPath: '/api/auth/logout',
    cookiePrefix: 'noraneko-auth',
    cookieSecure: process.env.NODE_ENV === 'production',
    debug: process.env.NODE_ENV === 'development',
    autoRefresh: {
      enabled: true,
      refreshThreshold: 5 * 60 * 1000,  // 5分前
      maxRetries: 3,
      retryInterval: 5 * 1000           // 5秒間隔
    }
  }
}

export function getAuthConfig(): AuthConfig {
  if (!globalConfig) {
    // 環境変数から自動初期化を試行
    try {
      globalConfig = initializeFromEnv()
    } catch (error) {
      throw new Error('Auth config not initialized. Call createAuth() first or set environment variables.')
    }
  }
  return globalConfig
}

export function createAuth(config: AuthConfig): void {
  setAuthConfig(config)
}

export function getDiscoveryConfig(): DiscoveryDocument | null {
  return discoveryConfig
}