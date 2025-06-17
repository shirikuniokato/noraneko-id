import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../server/auth'

/**
 * GET /api/auth/token - 現在のトークン状態取得
 * RFC 6749準拠: トークン関連の操作を /token エンドポイントで実行
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(null, { status: 200 })
    }
    
    // RFC準拠のレスポンス形式
    // セキュリティのためアクセストークンは除外
    const tokenResponse = {
      user: session.user,
      expires_at: Math.floor(session.expiresAt / 1000), // Unix timestamp (seconds)
      scope: session.scope
    }
    
    return NextResponse.json(tokenResponse, { status: 200 })
  } catch (error) {
    console.error('Token handler error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/auth/token - トークンリフレッシュ
 * RFC 6749 Section 6: Refreshing an Access Token
 */
export async function POST(request: NextRequest) {
  try {
    // auth()を呼ぶことで自動的にトークンリフレッシュが行われる
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { 
          error: 'invalid_token',
          error_description: 'No valid session found'
        }, 
        { status: 401 }
      )
    }
    
    // RFC準拠のレスポンス形式
    const tokenResponse = {
      user: session.user,
      expires_at: Math.floor(session.expiresAt / 1000), // Unix timestamp (seconds)
      scope: session.scope
    }
    
    return NextResponse.json(tokenResponse, { status: 200 })
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { 
        error: 'server_error',
        error_description: 'Internal server error during token refresh'
      },
      { status: 500 }
    )
  }
}