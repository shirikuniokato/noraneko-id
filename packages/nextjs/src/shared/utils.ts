import crypto from 'crypto'

// PKCE (Proof Key for Code Exchange) utilities
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url')
}

export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url')
}

export function generateState(): string {
  return crypto.randomBytes(16).toString('base64url')
}

// URL utilities
export function buildAuthUrl(config: {
  issuer: string
  clientId: string
  redirectUri: string
  scopes: string[]
  state: string
  codeChallenge: string
  authorizationEndpoint: string
}): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    state: config.state,
    code_challenge: config.codeChallenge,
    code_challenge_method: 'S256'
  })
  
  return `${config.authorizationEndpoint}?${params.toString()}`
}

// Token utilities
export function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt
}

export function isTokenExpiringSoon(expiresAt: number, bufferMs = 60000): boolean {
  return Date.now() >= (expiresAt - bufferMs)
}

// Cookie utilities
export function getCookieName(prefix: string, name: string): string {
  return `${prefix}.${name}`
}

export function parseCookieValue<T>(value: string | undefined): T | null {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export function serializeCookieValue<T>(value: T): string {
  return JSON.stringify(value)
}