import { NextRequest, NextResponse } from 'next/server'
import { getAuthConfig, getDiscoveryConfig } from '../../server/config'
import { 
  generateCodeVerifier, 
  generateCodeChallenge, 
  generateState, 
  buildAuthUrl,
  getCookieName,
  serializeCookieValue
} from '../../shared/utils'

export function createLoginHandler() {
  return async function loginHandler(request: NextRequest) {
    try {
      const config = getAuthConfig()
      const { searchParams } = new URL(request.url)
      const callbackUrl = searchParams.get('callbackUrl') || '/'
      
      // PKCE パラメータ生成
      const codeVerifier = generateCodeVerifier()
      const codeChallenge = generateCodeChallenge(codeVerifier)
      const state = generateState()
      
      // 認証URL生成
      const discovery = getDiscoveryConfig()
      if (!discovery) {
        throw new Error('Discovery configuration not available')
      }
      
      const authUrl = buildAuthUrl({
        issuer: config.issuer,
        clientId: config.clientId,
        redirectUri: new URL(config.redirectUri!, request.url).toString(),
        scopes: config.scopes!,
        state,
        codeChallenge,
        authorizationEndpoint: discovery.authorization_endpoint
      })
      
      // PKCE情報とcallbackUrlをCookieに保存
      const response = NextResponse.redirect(authUrl)
      
      response.cookies.set(
        getCookieName(config.cookiePrefix!, 'code_verifier'),
        codeVerifier,
        {
          httpOnly: true,
          secure: config.cookieSecure,
          sameSite: 'lax',
          maxAge: 600, // 10分
          path: '/'
        }
      )
      
      response.cookies.set(
        getCookieName(config.cookiePrefix!, 'state'),
        state,
        {
          httpOnly: true,
          secure: config.cookieSecure,
          sameSite: 'lax',
          maxAge: 600, // 10分
          path: '/'
        }
      )
      
      response.cookies.set(
        getCookieName(config.cookiePrefix!, 'callback_url'),
        callbackUrl,
        {
          httpOnly: true,
          secure: config.cookieSecure,
          sameSite: 'lax',
          maxAge: 600, // 10分
          path: '/'
        }
      )
      
      return response
    } catch (error) {
      console.error('Login handler error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}