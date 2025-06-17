// NextAuth風の統一ハンドラー（推奨）
export { handlers } from './handlers'
export { createHandlers } from './create-handlers'

// 個別ハンドラー
export { GET as tokenHandler } from './handlers/token'
export { POST as tokenRefreshHandler } from './handlers/token'
export { createLoginHandler } from './handlers/login'
export { createCallbackHandler } from './handlers/callback'
export { createLogoutHandler } from './handlers/logout'

// 型定義（API側で必要なもの）
export type { AuthConfig } from '../shared/types'