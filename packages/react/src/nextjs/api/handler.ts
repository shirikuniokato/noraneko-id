import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ApiHandlerConfig } from '../types';

/**
 * Create Next.js API route handlers for OAuth2 token management
 * Usage: export const { GET, POST, DELETE } = createNoranekoIDHandler(config);
 */
export function createNoranekoIDHandler(config: ApiHandlerConfig) {
  const cookieConfig = {
    prefix: 'noraneko',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    ...config.cookies,
  };

  const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: cookieConfig.secure,
    sameSite: cookieConfig.sameSite,
    path: cookieConfig.path,
  };

  // Token retrieval (GET)
  async function GET(_request: NextRequest) {
    try {
      const cookieStore = await cookies();
      
      const accessToken = cookieStore.get(`${cookieConfig.prefix}_access_token`)?.value;
      const refreshToken = cookieStore.get(`${cookieConfig.prefix}_refresh_token`)?.value;
      const idToken = cookieStore.get(`${cookieConfig.prefix}_id_token`)?.value;
      
      return NextResponse.json({
        access_token: accessToken || null,
        refresh_token: refreshToken || null,
        id_token: idToken || null,
      });
    } catch (error) {
      console.error('Token retrieval error:', error);
      return NextResponse.json(
        { error: 'Token retrieval failed' }, 
        { status: 500 }
      );
    }
  }

  // Token storage (POST)
  async function POST(request: NextRequest) {
    try {
      const body = await request.json();
      const cookieStore = await cookies();
      
      if (body.access_token) {
        cookieStore.set(`${cookieConfig.prefix}_access_token`, body.access_token, {
          ...COOKIE_OPTIONS,
          maxAge: 60 * 60, // 1 hour for access tokens
        });
      }
      
      if (body.refresh_token) {
        cookieStore.set(`${cookieConfig.prefix}_refresh_token`, body.refresh_token, {
          ...COOKIE_OPTIONS,
          maxAge: 60 * 60 * 24 * 30, // 30 days for refresh tokens
        });
      }
      
      if (body.id_token) {
        cookieStore.set(`${cookieConfig.prefix}_id_token`, body.id_token, {
          ...COOKIE_OPTIONS,
          maxAge: 60 * 60 * 24, // 24 hours for ID tokens
        });
      }
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Token storage error:', error);
      return NextResponse.json(
        { error: 'Token storage failed' }, 
        { status: 500 }
      );
    }
  }

  // OAuth2 compliant logout (DELETE)
  async function DELETE(request: NextRequest) {
    const results: string[] = [];
    let hasErrors = false;
    
    try {
      const body = await request.json().catch(() => ({}));
      const cookieStore = await cookies();
      
      // Phase 1: OAuth2 token revocation (server-side invalidation)
      if (config.issuer && !body.skipRevoke) {
        const accessToken = cookieStore.get(`${cookieConfig.prefix}_access_token`)?.value;
        const refreshToken = cookieStore.get(`${cookieConfig.prefix}_refresh_token`)?.value;
        
        // Revoke access token
        if (accessToken) {
          try {
            const revokeResponse = await fetch(`${config.issuer}/oauth2/revoke`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'noraneko-id-nextjs-api'
              },
              body: `token=${encodeURIComponent(accessToken)}&token_type_hint=access_token`,
            });
            
            if (revokeResponse.ok) {
              results.push('access_token_revoked');
            } else {
              console.warn('Access token revoke failed:', revokeResponse.status);
              results.push('access_token_revoke_failed');
              hasErrors = true;
            }
          } catch (error) {
            console.warn('Access token revoke error:', error);
            results.push('access_token_revoke_failed');
            hasErrors = true;
          }
        }
        
        // Revoke refresh token
        if (refreshToken) {
          try {
            const revokeResponse = await fetch(`${config.issuer}/oauth2/revoke`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'noraneko-id-nextjs-api'
              },
              body: `token=${encodeURIComponent(refreshToken)}&token_type_hint=refresh_token`,
            });
            
            if (revokeResponse.ok) {
              results.push('refresh_token_revoked');
            } else {
              console.warn('Refresh token revoke failed:', revokeResponse.status);
              results.push('refresh_token_revoke_failed');
              hasErrors = true;
            }
          } catch (error) {
            console.warn('Refresh token revoke error:', error);
            results.push('refresh_token_revoke_failed');
            hasErrors = true;
          }
        }
      }
      
      // Phase 2: Local cookie cleanup (always executed)
      if (body.key) {
        // Delete specific token
        const cookieName = `${cookieConfig.prefix}_${body.key}`;
        cookieStore.delete(cookieName);
        results.push(`cookie_${body.key}_deleted`);
      } else {
        // Delete all tokens (complete logout)
        cookieStore.delete(`${cookieConfig.prefix}_access_token`);
        cookieStore.delete(`${cookieConfig.prefix}_refresh_token`);
        cookieStore.delete(`${cookieConfig.prefix}_id_token`);
        results.push('all_cookies_deleted');
      }
      
      // Phase 3: Response with detailed status
      if (hasErrors) {
        return NextResponse.json({
          success: false,
          message: 'Partial logout completed',
          actions: results,
          warning: 'Some server-side operations failed, but local state was cleared'
        }, { status: 207 }); // 207 Multi-Status
      }
      
      return NextResponse.json({
        success: true,
        message: 'Complete logout successful',
        actions: results
      });
      
    } catch (error) {
      console.error('Logout error:', error);
      
      // Fail-safe: Force local cookie cleanup even on error
      try {
        const cookieStore = await cookies();
        cookieStore.delete(`${cookieConfig.prefix}_access_token`);
        cookieStore.delete(`${cookieConfig.prefix}_refresh_token`);
        cookieStore.delete(`${cookieConfig.prefix}_id_token`);
        results.push('emergency_cookie_cleanup');
      } catch (cleanupError) {
        console.error('Emergency cleanup failed:', cleanupError);
      }
      
      return NextResponse.json({
        success: false,
        message: 'Logout failed',
        actions: results,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }

  return { GET, POST, DELETE };
}

/**
 * Default handler with standard configuration
 * For quick setup without custom config
 */
export function createDefaultNoranekoIDHandler() {
  const issuer = process.env.NORANEKO_ISSUER || process.env.NEXT_PUBLIC_API_URL;
  
  if (!issuer) {
    throw new Error(
      'Missing issuer configuration. Set NORANEKO_ISSUER or NEXT_PUBLIC_API_URL environment variable.'
    );
  }

  return createNoranekoIDHandler({ issuer });
}