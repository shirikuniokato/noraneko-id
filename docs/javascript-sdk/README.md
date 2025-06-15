# JavaScript SDK Documentation

noraneko-id JavaScript SDK の技術文書とガイド一覧です。

## 📚 文書一覧

### [📋 javascript-sdk-requirements.md](./javascript-sdk-requirements.md)
- JavaScript SDK の要件定義
- 機能仕様とAPI設計
- 実装方針とアーキテクチャ

## 🚧 開発予定文書

### SDK_ARCHITECTURE.md (作成予定)
- SDK内部アーキテクチャ
- モジュール構成とDI設計
- TypeScript型定義

### SDK_API_REFERENCE.md (作成予定) 
- SDK公開APIの完全リファレンス
- メソッド詳細・パラメータ・戻り値
- TypeScript型情報

### INTEGRATION_GUIDE.md (作成予定)
- Next.js統合ガイド
- React Server Components対応
- 認証フック・コンポーネントの使用方法

## 🎯 SDK概要

### 主要機能
- **OAuth2認証フロー**: Authorization Code Flow with PKCE
- **SNS連携**: Google, GitHub, LINE等の統合認証
- **セッション管理**: 自動トークンリフレッシュ
- **React統合**: Hooks・Context・Components提供

### 対応フレームワーク
- ✅ **Next.js**: App Router & Pages Router
- ✅ **React**: 18+ with Hooks
- 🚧 **Vue.js**: 将来対応予定
- 🚧 **Vanilla JS**: 将来対応予定

## 🚀 クイックスタート

### インストール
```bash
npm install @noraneko-id/javascript-sdk
# または
yarn add @noraneko-id/javascript-sdk
```

### 基本設定
```typescript
import { NoranekoID } from '@noraneko-id/javascript-sdk';

const auth = new NoranekoID({
  clientId: 'your-client-id',
  redirectUri: 'https://yourapp.com/auth/callback',
  apiBaseUrl: 'https://api.noraneko-id.com'
});
```

### React統合
```typescript
import { NoranekoIDProvider, useNoranekoID } from '@noraneko-id/javascript-sdk';

function App() {
  return (
    <NoranekoIDProvider
      clientId="your-client-id"
      redirectUri="https://yourapp.com/auth/callback"
    >
      <LoginComponent />
    </NoranekoIDProvider>
  );
}

function LoginComponent() {
  const { login, logout, user, isAuthenticated } = useNoranekoID();
  
  return (
    <div>
      {isAuthenticated ? (
        <button onClick={logout}>ログアウト</button>
      ) : (
        <button onClick={() => login()}>ログイン</button>
      )}
    </div>
  );
}
```

## 🔗 関連文書

- [Backend API仕様](../backend/API_REFERENCE.md) - サーバーサイドAPI
- [Web管理画面](../web/) - 管理コンソール
- [一般開発文書](../general/) - 開発フロー・テスト

## 📦 パッケージ構成

```
@noraneko-id/javascript-sdk/
├── core/           # 核心的なOAuth2・HTTP実装
├── react/          # React固有のHooks・Components
├── nextjs/         # Next.js固有のMiddleware・Utilities
├── types/          # TypeScript型定義
└── utils/          # 共通ユーティリティ
```

## 🛠️ 開発環境

### 必要環境
- **Node.js**: 18+
- **TypeScript**: 5+
- **React**: 18+ (React関連機能使用時)
- **Next.js**: 14+ (Next.js関連機能使用時)

### ビルドツール
- **Bundler**: Rollup + TypeScript
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode

## 🎨 設計原則

### Zero Configuration
- デフォルト設定で即座に動作
- 設定は必要最小限に

### Type Safety
- 完全なTypeScript対応
- 実行時型検証

### Framework Agnostic Core
- フレームワーク固有機能は別モジュール
- Core機能はVanilla JSで動作

### Security First
- PKCE必須対応
- Secure Cookie設定
- XSS・CSRF対策

---

📝 **Last Updated**: 2024-06-15  
🔄 **Version**: v1.0.0-alpha  
📋 **Status**: 要件定義完了、実装開始予定  
👥 **Maintainers**: noraneko-id development team