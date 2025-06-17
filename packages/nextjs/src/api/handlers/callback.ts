import { NextRequest, NextResponse } from 'next/server'
import { getAuthConfig } from '../../server/config'
import { exchangeCodeForTokens, saveSession } from '../../server/auth'
import { 
  getCookieName,
  parseCookieValue
} from '../../shared/utils'
import { OAuthError } from '../../shared/errors'

export function createCallbackHandler() {
  return async function callbackHandler(request: NextRequest) {
    try {
      const config = getAuthConfig()
      const { searchParams } = new URL(request.url)
      
      // OAuth2パラメータ取得
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')
      
      // エラーチェック
      if (error) {
        throw new OAuthError(error, errorDescription || undefined)
      }
      
      if (!code || !state) {
        throw new Error('Missing required OAuth parameters')
      }
      
      // Cookieから保存した情報を取得
      const codeVerifier = request.cookies.get(getCookieName(config.cookiePrefix!, 'code_verifier'))?.value
      const savedState = request.cookies.get(getCookieName(config.cookiePrefix!, 'state'))?.value
      const callbackUrl = request.cookies.get(getCookieName(config.cookiePrefix!, 'callback_url'))?.value || '/'
      
      if (!codeVerifier || !savedState) {
        throw new Error('Missing PKCE parameters')
      }
      
      // State検証
      if (state !== savedState) {
        throw new Error('Invalid state parameter')
      }
      
      // 認可コードをトークンに交換
      const session = await exchangeCodeForTokens(
        code,
        codeVerifier,
        new URL(config.redirectUri!, request.url).toString()
      )
      
      // セッション保存
      await saveSession(session)
      
      // 一時的なCookieをクリア
      const response = NextResponse.redirect(new URL(callbackUrl, request.url))
      
      response.cookies.delete(getCookieName(config.cookiePrefix!, 'code_verifier'))
      response.cookies.delete(getCookieName(config.cookiePrefix!, 'state'))
      response.cookies.delete(getCookieName(config.cookiePrefix!, 'callback_url'))
      
      return response
    } catch (error) {
      console.error('Callback handler error:', error)
      
      // エラーページにリダイレクト
      const errorUrl = new URL('/login', request.url)
      errorUrl.searchParams.set('error', 'callback_error')
      
      if (error instanceof OAuthError) {
        errorUrl.searchParams.set('error_description', error.message)
      }
      
      return NextResponse.redirect(errorUrl)
    }
  }
}