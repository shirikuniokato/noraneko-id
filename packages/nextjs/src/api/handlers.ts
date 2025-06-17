import { NextRequest } from 'next/server'
import { createLoginHandler } from './handlers/login'
import { createCallbackHandler } from './handlers/callback'
import { createLogoutHandler } from './handlers/logout'
import { GET as tokenHandler, POST as tokenRefreshHandler } from './handlers/token'

/**
 * NextAuth風の統一ハンドラー
 * 
 * @example
 * ```typescript
 * // app/api/auth/[...noraneko]/route.ts
 * import { handlers } from "@noranekoid/nextjs/api"
 * export const { GET, POST } = handlers
 * ```
 */
export const handlers = {
  GET: async (request: NextRequest) => {
    const { pathname } = new URL(request.url)
    const segments = pathname.split('/').filter(Boolean)
    const action = segments[segments.length - 1] // 最後のセグメント

    switch (action) {
      case 'login':
        return createLoginHandler()(request)
      
      case 'callback':
        return createCallbackHandler()(request)
      
      case 'logout':
        return createLogoutHandler()(request)
      
      case 'token':
        // RFC準拠: 推奨エンドポイント
        return tokenHandler(request)
      
      default:
        // デフォルトはRFC準拠のtokenエンドポイント
        return tokenHandler(request)
    }
  },

  POST: async (request: NextRequest) => {
    const { pathname } = new URL(request.url)
    const segments = pathname.split('/').filter(Boolean)
    const action = segments[segments.length - 1]

    switch (action) {
      case 'token':
        // RFC準拠: 推奨エンドポイント
        return tokenRefreshHandler(request)
      
      default:
        return new Response('Method not allowed', { status: 405 })
    }
  }
}

/**
 * 個別ハンドラーの作成関数
 */
export { createLoginHandler, createCallbackHandler, createLogoutHandler }