/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // noraneko-id SDK を外部パッケージとして扱う
  experimental: {
    serverComponentsExternalPackages: ['@noraneko/id-sdk', '@noraneko/id-react']
  },
  
  // CORS設定（開発環境用）
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NORANEKO_ISSUER || 'http://localhost:8080' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
  
  // 環境変数の設定
  env: {
    NORANEKO_CLIENT_ID: process.env.NORANEKO_CLIENT_ID,
    NORANEKO_ISSUER: process.env.NORANEKO_ISSUER,
    NORANEKO_APP_URL: process.env.NORANEKO_APP_URL,
  },
  
  // TypeScript 設定
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint 設定
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;