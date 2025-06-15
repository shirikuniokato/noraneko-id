# Web Administration Console Documentation

noraneko-id Web管理コンソール（Next.js）の技術文書一覧です。

## 📚 文書一覧

### 🚧 開発予定文書

### WEB_ARCHITECTURE.md (作成予定)
- Next.js App Router アーキテクチャ
- Server Components vs Client Components使い分け
- State管理（Zustand/Context）設計
- 認証フロー・セッション管理

### COMPONENT_GUIDE.md (作成予定)
- UIコンポーネント設計ガイド
- 再利用可能コンポーネント一覧
- スタイリング規約（Tailwind CSS）
- アクセシビリティ対応

### DEPLOYMENT.md (作成予定)
- Vercel/Docker デプロイ手順
- 環境変数設定
- ビルド・最適化設定
- 監視・ログ設定

## 🎯 Web管理コンソール概要

### 主要機能
- **クライアント管理**: OAuth2クライアントのCRUD操作
- **ユーザー管理**: テナント別ユーザー管理・検索
- **統計・分析**: 利用状況・認証ログの可視化
- **システム設定**: SNSプロバイダー設定・セキュリティ設定

### 技術スタック
- ✅ **Next.js**: 14+ App Router
- ✅ **TypeScript**: 5+
- ✅ **Tailwind CSS**: 3+
- ✅ **Radix UI**: プリミティブコンポーネント
- 🚧 **Zustand**: 状態管理（実装予定）
- 🚧 **React Hook Form**: フォーム管理（実装予定）

## 🚀 開発環境セットアップ

### 1. 依存関係インストール
```bash
cd web
npm install
```

### 2. 環境変数設定
```bash
cp .env.example .env.local
```

```env
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_CLIENT_ID=admin-console-client
```

### 3. 開発サーバー起動
```bash
npm run dev
```

## 📁 ディレクトリ構造

```
src/
├── app/                    # App Router ページ
│   ├── dashboard/          # ダッシュボード機能
│   │   ├── clients/        # クライアント管理
│   │   ├── users/          # ユーザー管理
│   │   └── analytics/      # 統計・分析
│   ├── login/              # ログインページ
│   └── layout.tsx          # ルートレイアウト
├── components/             # 再利用可能コンポーネント
│   ├── ui/                 # 基本UIコンポーネント
│   ├── forms/              # フォームコンポーネント
│   ├── charts/             # チャートコンポーネント
│   └── layout/             # レイアウトコンポーネント
├── lib/                    # ユーティリティ・設定
│   ├── api.ts              # API クライアント
│   ├── auth-context.tsx    # 認証コンテキスト
│   └── utils.ts            # 共通ユーティリティ
├── types/                  # TypeScript型定義
└── middleware.ts           # Next.js ミドルウェア
```

## 🎨 設計原則

### Server-First Architecture
- データフェッチはServer Componentsで実行
- Client Componentsは必要最小限に制限
- SEO・パフォーマンス最適化

### Component-Driven Development
- Storybook対応（将来実装）
- 原子設計（Atomic Design）原則
- 再利用性・テスタビリティ重視

### Type-Safe API Integration
- Backend APIとの型共有
- 実行時バリデーション
- エラーハンドリング統一

### Responsive & Accessible
- モバイルファースト設計
- WCAG 2.1 AA準拠
- キーボードナビゲーション対応

## 🔐 認証・セキュリティ

### 認証フロー
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // セッション検証
  // 未認証時はログインページへリダイレクト
  // 管理者権限チェック
}
```

### セキュリティ対策
- **CSP**: Content Security Policy設定
- **CSRF**: SameSite Cookie + Token検証
- **XSS**: Next.js自動エスケープ + Sanitization
- **認可**: ページ・API別権限制御

## 📊 主要ページ・機能

### ダッシュボード (`/dashboard`)
- システム統計概要
- 最近のアクティビティ
- アラート・通知

### クライアント管理 (`/dashboard/clients`)
- OAuth2クライアント一覧・検索
- クライアント作成・編集・削除
- シークレット再生成
- 統計・ログ表示

### ユーザー管理 (`/dashboard/users`)
- テナント別ユーザー一覧
- ユーザー検索・フィルタリング
- アカウント状態変更
- 認証プロバイダー管理

### 統計・分析 (`/dashboard/analytics`)
- 認証成功/失敗率
- API利用統計
- ユーザー増加傾向
- セキュリティイベント

## 🔗 関連文書

- [Backend API仕様](../backend/API_REFERENCE.md) - サーバーサイドAPI
- [JavaScript SDK](../javascript-sdk/) - クライアント側SDK
- [一般開発文書](../general/) - 開発フロー・テスト

## 🚀 デプロイ・運用

### Vercel デプロイ
```bash
npm run build
vercel --prod
```

### Docker デプロイ
```dockerfile
FROM node:18-alpine
# ... (詳細は DEPLOYMENT.md で)
```

### 環境変数（本番）
```env
NEXT_PUBLIC_API_BASE_URL=https://api.noraneko-id.com
NEXT_PUBLIC_CLIENT_ID=admin-console-prod
NEXTAUTH_SECRET=your-production-secret
```

---

📝 **Last Updated**: 2024-06-15  
🔄 **Version**: v1.0.0-alpha  
📋 **Status**: 基本実装完了、機能拡張中  
👥 **Maintainers**: noraneko-id development team