import { NextRequest, NextResponse } from 'next/server'
import { getAuthConfig, getDiscoveryConfig } from '../../server/config'
import { clearSession, auth } from '../../server/auth'

export function createLogoutHandler() {
  return async function logoutHandler(request: NextRequest) {
    try {
      const config = getAuthConfig()
      const { searchParams } = new URL(request.url)
      const callbackUrl = searchParams.get('callbackUrl') || '/'
      
      // 現在のセッション取得（ログアウトURL生成のため）
      const session = await auth()
      
      // セッション削除
      await clearSession()
      
      // OAuth2 End Session Endpoint対応
      if (session?.accessToken) {
        const discovery = getDiscoveryConfig()
        
        // トークン取り消し（もしrevocation_endpointがあれば）
        if (discovery?.revocation_endpoint) {
          try {
            await fetch(discovery.revocation_endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                token: session.accessToken,
                client_id: config.clientId,
                client_secret: config.clientSecret || '',
              }),
            })
          } catch (error) {
            // エラーは無視（ログアウトは続行）
            if (config.debug) {
              console.error('Token revocation failed:', error)
            }
          }
        }
        
        // OP（noraneko-id）のログアウトエンドポイントにリダイレクト（もしあれば）
        const endSessionEndpoint = discovery?.end_session_endpoint
        if (endSessionEndpoint) {
          const logoutUrl = new URL(endSessionEndpoint)
          logoutUrl.searchParams.set('post_logout_redirect_uri', new URL(callbackUrl, request.url).toString())
          if (session.accessToken) {
            logoutUrl.searchParams.set('id_token_hint', session.accessToken)
          }
          return NextResponse.redirect(logoutUrl)
        }
      }
      
      // セッションがない、またはend_session_endpointがない場合は直接callbackUrlにリダイレクト
      return NextResponse.redirect(new URL(callbackUrl, request.url))
    } catch (error) {
      console.error('Logout handler error:', error)
      
      // エラーが発生してもログアウトは継続
      const { searchParams } = new URL(request.url)
      const callbackUrl = searchParams.get('callbackUrl') || '/'
      
      return NextResponse.redirect(new URL(callbackUrl, request.url))
    }
  }
}