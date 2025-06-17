/** @type {import('next').NextConfig} */
const nextConfig = {
  // ビルド時にOpenID Connect Discoveryを実行
  async env() {
    const issuer = process.env.NORANEKO_AUTH_ISSUER
    
    if (!issuer) {
      console.warn('NORANEKO_AUTH_ISSUER not set, skipping OIDC discovery')
      return {}
    }

    try {
      console.log(`Fetching OIDC discovery from: ${issuer}/.well-known/openid-configuration`)
      
      const response = await fetch(`${issuer}/.well-known/openid-configuration`, {
        headers: {
          'Accept': 'application/json',
        },
        // 30秒でタイムアウト（ビルド時は余裕を持つ）
        signal: AbortSignal.timeout(30000),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const discovery = await response.json()

      // 必須フィールドの検証
      const requiredFields = ['issuer', 'authorization_endpoint', 'token_endpoint', 'userinfo_endpoint']
      const missingFields = requiredFields.filter(field => !discovery[field])
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields in discovery document: ${missingFields.join(', ')}`)
      }

      // issuerの検証
      if (discovery.issuer !== issuer) {
        throw new Error(`Issuer mismatch: expected ${issuer}, got ${discovery.issuer}`)
      }

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

      return {
        // Discovery結果をビルド時に埋め込み
        NORANEKO_DISCOVERY_CONFIG: JSON.stringify(discovery)
      }
    } catch (error) {
      console.error('❌ OIDC discovery failed:')
      console.error(`   Error: ${error.message}`)
      console.error(`   Issuer: ${issuer}`)
      console.error('')
      console.error('Make sure the OIDC provider is running and accessible.')
      console.error('Check that the issuer URL is correct and includes the full base URL.')
      
      // ビルドを停止
      process.exit(1)
    }
  },

  // その他のNext.js設定
  transpilePackages: ['@noranekoid/nextjs'],
}

module.exports = nextConfig