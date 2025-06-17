import type { AuthError } from './types'

export class NoranekoAuthError extends Error implements AuthError {
  readonly type = 'AuthError' as const
  
  constructor(
    public code: string,
    message: string,
    public cause?: Error
  ) {
    super(message)
    this.name = 'NoranekoAuthError'
  }
}

export class TokenExpiredError extends NoranekoAuthError {
  constructor(message = 'Token has expired') {
    super('TOKEN_EXPIRED', message)
  }
}

export class InvalidTokenError extends NoranekoAuthError {
  constructor(message = 'Invalid token') {
    super('INVALID_TOKEN', message)
  }
}

export class AuthenticationRequiredError extends NoranekoAuthError {
  constructor(message = 'Authentication required') {
    super('AUTHENTICATION_REQUIRED', message)
  }
}

export class OAuthError extends NoranekoAuthError {
  constructor(
    public oauthError: string,
    public oauthErrorDescription?: string
  ) {
    super('OAUTH_ERROR', `OAuth error: ${oauthError}${oauthErrorDescription ? ` - ${oauthErrorDescription}` : ''}`)
  }
}