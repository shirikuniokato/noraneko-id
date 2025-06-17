import { NextRequest } from 'next/server'
import { createLoginHandler } from './handlers/login'
import { createCallbackHandler } from './handlers/callback'
import { createLogoutHandler } from './handlers/logout'
import { GET as tokenHandler, POST as tokenRefreshHandler } from './handlers/token'

interface HandlersConfig {
  /**
   * カスタムパスマッピング
   * デフォルト: { login: 'login', callback: 'callback', logout: 'logout', token: 'token' }
   */
  paths?: {
    login?: string
    callback?: string
    logout?: string
    token?: string    // RFC準拠
  }
  
  /**
   * デフォルトアクション（パスが一致しない場合）
   * デフォルト: 'token' (RFC準拠)
   */
  defaultAction?: 'token' | 'login' | 'callback' | 'logout'
}

/**
 * カスタマイズ可能なハンドラーを作成
 * 
 * @param config ハンドラー設定
 * @returns NextAuth風の統一ハンドラー
 * 
 * @example
 * ```typescript
 * // app/api/auth/[...noraneko]/route.ts
 * import { createHandlers } from "@noranekoid/nextjs/api"
 * 
 * export const { GET, POST } = createHandlers({
 *   paths: {
 *     login: 'signin',      // /api/auth/signin
 *     logout: 'signout',    // /api/auth/signout
 *     callback: 'callback', // /api/auth/callback
 *     token: 'token'        // /api/auth/token
 *   }
 * })
 * ```
 */
export function createHandlers(config: HandlersConfig = {}) {
  const {
    paths = {
      login: 'login',
      callback: 'callback', 
      logout: 'logout',
      token: 'token'       // RFC準拠: デフォルト
    },
    defaultAction = 'token'  // RFC準拠: デフォルト
  } = config

  // デフォルト値をマージ
  const finalPaths = {
    login: 'login',
    callback: 'callback',
    logout: 'logout', 
    token: 'token',      // RFC準拠
    ...paths
  }

  return {
    GET: async (request: NextRequest) => {
      const { pathname } = new URL(request.url)
      const segments = pathname.split('/').filter(Boolean)
      const action = segments[segments.length - 1] // 最後のセグメント

      // パスマッピングから対応するアクションを特定
      let targetAction = defaultAction
      for (const [key, value] of Object.entries(finalPaths)) {
        if (action === value) {
          targetAction = key as keyof typeof finalPaths
          break
        }
      }

      switch (targetAction) {
        case 'login':
          return createLoginHandler()(request)
        
        case 'callback':
          return createCallbackHandler()(request)
        
        case 'logout':
          return createLogoutHandler()(request)
        
        case 'token':
          return tokenHandler(request)
        
        default:
          return tokenHandler(request)
      }
    },

    POST: async (request: NextRequest) => {
      const { pathname } = new URL(request.url)
      const segments = pathname.split('/').filter(Boolean)
      const action = segments[segments.length - 1]

      // パスマッピングから対応するアクションを特定
      let targetAction = defaultAction
      for (const [key, value] of Object.entries(finalPaths)) {
        if (action === value) {
          targetAction = key as keyof typeof finalPaths
          break
        }
      }

      switch (targetAction) {
        case 'token':
          return tokenRefreshHandler(request)
        
        default:
          return new Response('Method not allowed', { status: 405 })
      }
    }
  }
}