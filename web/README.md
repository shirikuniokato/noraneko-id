# Noraneko ID 管理コンソール

Noraneko ID の管理者向けWebアプリケーションです。

## 技術スタック

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Authentication**: @noraneko/id-react SDK
- **Deployment**: Vercel

## 開発環境セットアップ

### 前提条件

- Node.js 20.x 以上
- npm または yarn
- Noraneko ID バックエンドサーバーが起動していること

### インストール

```bash
# SDKのビルド（初回のみ）
cd ../packages/sdk && npm install && npm run build
cd ../react && npm install && npm run build

# 管理アプリのセットアップ
cd ../../web
npm install
```

### 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` を編集して、以下の値を設定：

```env
# APIエンドポイント（ローカル開発用）
NEXT_PUBLIC_API_URL=http://localhost:8080

# OAuth2設定（管理アプリ用）
NEXT_PUBLIC_OAUTH2_CLIENT_ID=admin-dashboard-001
```

### 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションにアクセスできます。

## 利用可能なスクリプト

```bash
npm run dev          # 開発サーバー起動
npm run build        # プロダクションビルド
npm run start        # プロダクションサーバー起動
npm run lint         # ESLintチェック
npm run type-check   # TypeScriptの型チェック
npm run analyze      # バンドルサイズ分析
```

## プロジェクト構成

```
web/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx       # ルートレイアウト（Server Component）
│   │   ├── providers.tsx    # Client Providers
│   │   ├── error.tsx        # エラーバウンダリ
│   │   ├── loading.tsx      # ローディング状態
│   │   ├── dashboard/       # ダッシュボードページ
│   │   ├── login/           # ログインページ
│   │   └── api/            # API Routes
│   │       └── auth/       # 認証API
│   ├── components/         # 共有コンポーネント
│   ├── lib/               # ユーティリティ関数
│   └── types/             # TypeScript型定義
├── public/                # 静的ファイル
├── next.config.ts         # Next.js設定
├── tsconfig.json          # TypeScript設定
├── tailwind.config.js     # Tailwind CSS設定
└── vercel.json           # Vercelデプロイ設定
```

## 主な機能

- 🔐 **OAuth2認証**: noraneko-id SDKによる安全な認証
- 📊 **ダッシュボード**: 統計情報とユーザー管理
- 🔄 **自動トークンリフレッシュ**: セッションの自動更新
- 💾 **TTLキャッシュ**: ユーザー情報の効率的な管理
- 🛡️ **セキュリティ**: HttpOnly Cookie、CSRF対策、CSPヘッダー

## デプロイ（Vercel）

### 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定：

- `NEXT_PUBLIC_API_URL`: 本番APIのURL
- `NEXT_PUBLIC_OAUTH2_CLIENT_ID`: 本番用クライアントID

### デプロイコマンド

```bash
vercel
```

または、GitHubと連携して自動デプロイを設定することも可能です。

## セキュリティ

- すべての認証トークンはHttpOnly Cookieで管理
- CSRF攻撃対策（SameSite Cookie）
- XSS対策（Content Security Policy）
- 本番環境では必ずHTTPSを使用してください

## トラブルシューティング

### SDKが見つからないエラー

```bash
# SDKを再ビルド
cd ../packages/sdk && npm run build
cd ../react && npm run build
```

### 認証エラー

1. バックエンドサーバーが起動しているか確認
2. 環境変数が正しく設定されているか確認
3. OAuth2クライアントIDが有効か確認

## ライセンス

MIT
