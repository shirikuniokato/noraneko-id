import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React 19 の厳格モード（開発環境のみ）
  reactStrictMode: true,

  // 本番ビルド最適化
  poweredByHeader: false,

  // SDKパッケージのトランスパイル設定
  transpilePackages: ['@noranekoid/nextjs'],

  // 画像最適化の設定
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // 必要に応じて制限
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // 実験的機能
  experimental: {
    // Turbopack を使用した高速ビルド（開発環境）
    // turbo: process.env.NODE_ENV === 'development',

    // Server Actions の最適化
    serverActions: {
      bodySizeLimit: "2mb",
    },

    // 型チェックの並列化
    typedRoutes: true,
  },

  // 環境変数の型安全性
  env: {
    // ランタイムで利用可能な環境変数
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || "0.1.0",
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },

  // ESLint の設定
  eslint: {
    // ビルド時の ESLint を無効化（CI/CDで実行する場合）
    ignoreDuringBuilds: process.env.CI === "true",
  },

  // TypeScript の設定
  typescript: {
    // ビルド時の型チェックを無効化（CI/CDで実行する場合）
    ignoreBuildErrors:
      process.env.CI === "true" && process.env.SKIP_TYPE_CHECK === "true",
  },

  // Webpack の最適化
  webpack: (config, { isServer }) => {
    // サーバーサイドでのブラウザAPI互換性
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };

      // サーバーサイドでのグローバル変数定義（server-only互換性のため一部除外）
      const webpack = require("webpack");
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.DefinePlugin({
          // "globalThis.self": "globalThis", // server-onlyモジュールとの衝突を避けるためコメントアウト
          "globalThis.window": "globalThis",
          "globalThis.btoa": "undefined",
          "globalThis.atob": "undefined",
        })
      );
    } else {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // バンドルサイズの最適化
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: "all",
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor splitting
          vendor: {
            name: "vendor",
            chunks: "all",
            test: /node_modules/,
            priority: 20,
          },
          // Common chunk
          common: {
            name: "common",
            minChunks: 2,
            chunks: "all",
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
          // noraneko-id SDKs
          noranekoSDK: {
            name: "noraneko-sdk",
            test: /[\\/]packages[\\/](sdk|react)[\\/]/,
            chunks: "all",
            priority: 30,
          },
        },
      },
    };

    return config;
  },

  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // 本番環境では CSP を有効化
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Content-Security-Policy",
                  value:
                    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' " +
                    (process.env.NEXT_PUBLIC_API_URL || ""),
                },
              ]
            : []),
        ],
      },
    ];
  },

  // リダイレクト設定
  async redirects() {
    return [
      // ルートページへのアクセスは dashboard へリダイレクト
      {
        source: "/",
        destination: "/dashboard",
        permanent: false,
      },
    ];
  },

  // 出力設定（Vercelでは自動的に最適化されるため削除）
  // output: 'standalone', // Docker対応は不要
};

export default nextConfig;
