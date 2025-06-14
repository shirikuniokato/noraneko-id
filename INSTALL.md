# noraneko-id インストールガイド

このドキュメントでは、noraneko-id（Japanese IDaaS）の各種インストール方法について説明します。

## 📋 概要

noraneko-id は以下のコンポーネントで構成されています：

- **Backend API**: Go製のOAuth2対応認証サーバー
- **JavaScript SDK**: ブラウザ向けJavaScript SDK
- **React SDK**: React/Next.js向け統合パッケージ
- **Demo Application**: Next.js実装のデモアプリケーション

## 🚀 クイックスタート（開発環境）

### 1. リポジトリのクローン

```bash
git clone https://github.com/noraneko-id/noraneko-id.git
cd noraneko-id
```

### 2. バックエンドAPIの起動

```bash
# PostgreSQLの起動
cd backend
docker-compose up -d

# 環境変数の設定
cp .env.example .env
# .envファイルを編集してください

# 依存関係のインストール
go mod tidy

# サーバーの起動
go run cmd/server/main.go
```

サーバーは `http://localhost:8080` で起動します。

### 3. SDK/React パッケージのビルド

```bash
# JavaScript SDK
cd packages/sdk
npm install
npm run build

# React SDK
cd ../react
npm install
npm run build
```

### 4. デモアプリケーションの起動

```bash
cd ../../examples/nextjs-demo
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.localを編集してクライアント情報を設定

npm run dev
```

デモアプリは `http://localhost:3001` で起動します。

## 📦 GitHubリポジトリ直接インストール（推奨）

npm パッケージを公開せずに、GitHubリポジトリから直接インストールする方法です。

### JavaScript SDK のインストール

```bash
# GitHubから直接インストール
npm install "github:noraneko-id/noraneko-id#main" --save

# または特定のコミット/タグを指定
npm install "github:noraneko-id/noraneko-id#v1.0.0" --save
```

### React SDK のインストール

```bash
# JavaScript SDK と React SDK の両方をインストール
npm install "github:noraneko-id/noraneko-id#main" --save

# peerDependenciesの確認
npm install react react-dom --save
```

### package.json での設定例

```json
{
  "dependencies": {
    "@noraneko/id-sdk": "github:noraneko-id/noraneko-id#main",
    "@noraneko/id-react": "github:noraneko-id/noraneko-id#main",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

### Yarn を使用する場合

```bash
# JavaScript SDK
yarn add "github:noraneko-id/noraneko-id#main"

# 特定のブランチまたはタグ
yarn add "github:noraneko-id/noraneko-id#develop"
yarn add "github:noraneko-id/noraneko-id#v1.0.0"
```

### pnpm を使用する場合

```bash
# JavaScript SDK
pnpm add "github:noraneko-id/noraneko-id#main"

# React SDK
pnpm add "github:noraneko-id/noraneko-id#main"
```

## 🔧 Next.js プロジェクトでの統合

### 1. パッケージのインストール

```bash
npm install "github:noraneko-id/noraneko-id#main"
```

### 2. 環境変数の設定

`.env.local` ファイルを作成：

```env
NORANEKO_CLIENT_ID=your-client-id
NORANEKO_ISSUER=http://localhost:8080
NORANEKO_APP_URL=http://localhost:3000
```

### 3. プロバイダーの設定

`app/layout.tsx` (App Router) または `_app.tsx` (Pages Router):

```tsx
import { NoranekoIDProvider } from '@noraneko/id-react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <NoranekoIDProvider
          config={{
            clientId: process.env.NORANEKO_CLIENT_ID!,
            issuer: process.env.NORANEKO_ISSUER!,
            redirectUri: `${process.env.NORANEKO_APP_URL}/auth/callback`,
            scopes: ['openid', 'profile', 'email'],
          }}
        >
          {children}
        </NoranekoIDProvider>
      </body>
    </html>
  );
}
```

### 4. 認証フックの使用

```tsx
'use client';

import { useNoranekoID } from '@noraneko/id-react';

export default function LoginButton() {
  const { isAuthenticated, user, login, logout } = useNoranekoID();

  if (isAuthenticated) {
    return (
      <div>
        <p>こんにちは、{user?.email}さん</p>
        <button onClick={() => logout()}>ログアウト</button>
      </div>
    );
  }

  return <button onClick={() => login()}>ログイン</button>;
}
```

### 5. 保護されたルートの実装

```tsx
import { ProtectedRoute } from '@noraneko/id-react';

export default function DashboardPage() {
  return (
    <ProtectedRoute
      fallback={<div>ログインが必要です</div>}
    >
      <div>保護されたコンテンツ</div>
    </ProtectedRoute>
  );
}
```

## 🔄 更新方法

### GitHubリポジトリから更新

```bash
# 最新版に更新
npm update "@noraneko/id-sdk" "@noraneko/id-react"

# または明示的に再インストール
npm uninstall "@noraneko/id-sdk" "@noraneko/id-react"
npm install "github:noraneko-id/noraneko-id#main"
```

### 特定のバージョンに変更

```bash
# 特定のタグに変更
npm install "github:noraneko-id/noraneko-id#v1.1.0"

# 特定のコミットに変更
npm install "github:noraneko-id/noraneko-id#abc1234"

# 開発ブランチに変更
npm install "github:noraneko-id/noraneko-id#develop"
```

## 🐛 トラブルシューティング

### 1. インストールエラー

```bash
# node_modules を削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### 2. TypeScript エラー

```bash
# 型定義ファイルの再生成
cd node_modules/@noraneko/id-sdk
npm run build

cd ../id-react
npm run build
```

### 3. Next.js ビルドエラー

`next.config.js` でSDKを外部パッケージとして設定：

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@noraneko/id-sdk', '@noraneko/id-react']
  }
};

module.exports = nextConfig;
```

### 4. CORS エラー

バックエンドサーバーでCORS設定を確認してください：

```go
// backend/internal/middleware/auth.go
// localhost系のオリジンが許可されていることを確認
```

## 🔐 本番環境での設定

### 環境変数

```env
# 本番環境用設定
NORANEKO_CLIENT_ID=prod-client-id
NORANEKO_ISSUER=https://auth.yourdomain.com
NORANEKO_APP_URL=https://yourapp.com
NODE_ENV=production
```

### セキュリティ設定

```tsx
// HTTPS環境でのみCookieを送信
<NoranekoIDProvider
  config={{
    clientId: process.env.NORANEKO_CLIENT_ID!,
    issuer: process.env.NORANEKO_ISSUER!,
    redirectUri: `${process.env.NORANEKO_APP_URL}/auth/callback`,
    scopes: ['openid', 'profile', 'email'],
    // 本番環境用設定
    tokenStorage: 'localStorage', // または 'sessionStorage'
    clockSkewLeeway: 60, // 時刻のずれ許容範囲（秒）
  }}
>
  {children}
</NoranekoIDProvider>
```

## 📚 関連ドキュメント

- [認証フローテスト手順](TEST_AUTH_FLOW.md)
- [プロジェクト設定ガイド](CLAUDE.md)
- [API仕様書](http://localhost:8080/swagger/index.html)
- [React SDK使用例](examples/nextjs-demo/)

## 💬 サポート

- 問題報告: [GitHub Issues](https://github.com/noraneko-id/noraneko-id/issues)
- ディスカッション: [GitHub Discussions](https://github.com/noraneko-id/noraneko-id/discussions)

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。