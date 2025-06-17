/**
 * Next.js Configuration Helper for Noraneko ID
 * 
 * @example
 * // next.config.js
 * const { withNoranekoAuth } = require('@noranekoid/nextjs/config')
 * module.exports = withNoranekoAuth({})
 */

/**
 * Noraneko Auth configuration wrapper for Next.js
 * @param {import('next').NextConfig} nextConfig - Next.js configuration
 * @returns {import('next').NextConfig} Enhanced configuration with build-time discovery
 */
function withNoranekoAuth(nextConfig = {}) {
  return {
    ...nextConfig,
    
    // Merge existing env function with discovery
    async env() {
      const existingEnv = typeof nextConfig.env === 'function' 
        ? await nextConfig.env() 
        : nextConfig.env || {}

      const discoveryEnv = await performDiscovery()
      
      return {
        ...existingEnv,
        ...discoveryEnv,
      }
    },

    // Ensure transpilation
    transpilePackages: [
      ...(nextConfig.transpilePackages || []),
      '@noranekoid/nextjs',
    ],
  }
}

/**
 * Perform OIDC Discovery at build time
 * @returns {Promise<Record<string, string>>} Environment variables to inject
 */
async function performDiscovery() {
  const issuer = process.env.NORANEKO_AUTH_ISSUER
  
  if (!issuer) {
    console.warn('⚠️  NORANEKO_AUTH_ISSUER not set, skipping OIDC discovery')
    console.warn('   Set NORANEKO_AUTH_ISSUER environment variable to enable build-time discovery')
    return {}
  }

  try {
    console.log(`🔍 Fetching OIDC discovery from: ${issuer}/.well-known/openid-configuration`)
    
    const response = await fetch(`${issuer}/.well-known/openid-configuration`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'noraneko-nextjs-sdk/1.0.0',
      },
      signal: AbortSignal.timeout(30000), // 30秒でタイムアウト
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const discovery = await response.json()

    // 必須フィールドの検証
    const requiredFields = [
      'issuer', 
      'authorization_endpoint', 
      'token_endpoint', 
      'userinfo_endpoint'
    ]
    
    const missingFields = requiredFields.filter(field => !discovery[field])
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields in discovery document: ${missingFields.join(', ')}`)
    }

    // issuerの検証 (OpenID Connect Discovery 1.0 Section 4.3)
    if (discovery.issuer !== issuer) {
      throw new Error(`Issuer mismatch: expected "${issuer}", got "${discovery.issuer}"`)
    }

    // 成功ログ
    console.log('✅ OIDC discovery successful')
    console.log(`   Authorization: ${discovery.authorization_endpoint}`)
    console.log(`   Token: ${discovery.token_endpoint}`)
    console.log(`   UserInfo: ${discovery.userinfo_endpoint}`)
    
    if (discovery.revocation_endpoint) {
      console.log(`   Revocation: ${discovery.revocation_endpoint}`)
    }
    
    if (discovery.end_session_endpoint) {
      console.log(`   End Session: ${discovery.end_session_endpoint}`)
    }

    // PKCE対応チェック
    if (discovery.code_challenge_methods_supported?.includes('S256')) {
      console.log('✅ PKCE (S256) supported')
    } else {
      console.warn('⚠️  PKCE (S256) not explicitly supported in discovery document')
    }

    // Pairwise対応チェック（NoranekoIDの特徴）
    if (discovery.subject_types_supported?.includes('pairwise')) {
      console.log('✅ Pairwise subject identifiers supported')
    }

    return {
      NORANEKO_DISCOVERY_CONFIG: JSON.stringify(discovery)
    }
  } catch (error) {
    console.error('❌ OIDC discovery failed:')
    console.error(`   Error: ${error.message}`)
    console.error(`   Issuer: ${issuer}`)
    console.error('')
    console.error('Troubleshooting steps:')
    console.error('1. Verify the OIDC provider is running and accessible')
    console.error('2. Check that the issuer URL is correct')
    console.error('3. Ensure /.well-known/openid-configuration endpoint exists')
    console.error('4. Verify network connectivity from build environment')
    
    // ビルドを停止
    process.exit(1)
  }
}

/**
 * Create a minimal Next.js config with only Noraneko Auth
 * @returns {import('next').NextConfig} Next.js configuration
 */
function createNoranekoConfig() {
  return withNoranekoAuth({})
}

module.exports = {
  withNoranekoAuth,
  createNoranekoConfig,
}