# noraneko-id Next.js Demo

このディレクトリには、noraneko-id の React SDK を使用した Next.js デモアプリケーションが含まれています。

## 🎯 デモの目的

このデモアプリケーションは以下の機能を実装しています：

- **OAuth2 + PKCE 認証フロー**: セキュアな認証プロセス
- **自動トークンリフレッシュ**: ユーザーエクスペリエンスの向上
- **認証状態管理**: リアルタイムな認証状態の監視
- **保護されたルート**: 認証が必要なページの実装
- **ユーザー情報表示**: 認証後のユーザー情報取得

## 🚀 セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
# .env.local ファイルを作成
cp .env.example .env.local
```

`.env.local` ファイルを編集し、必要な値を設定してください：

```env
NORANEKO_ISSUER=http://localhost:8080
NORANEKO_CLIENT_ID=your-client-id-here
NORANEKO_APP_URL=http://localhost:3001
```

### 3. OAuth2 クライアントの作成

noraneko-id の管理画面（通常は `http://localhost:8080/admin`）でOAuth2クライアントを作成し、以下の設定を行ってください：

- **Redirect URI**: `http://localhost:3001/auth/callback`
- **Client Type**: `public`（PKCE対応）
- **Scopes**: `openid profile email`

### 4. アプリケーションの起動

```bash
npm run dev
```

アプリケーションは `http://localhost:3001` で起動します。

## 📱 ページ構成

### ホームページ (`/`)
- 認証状態の表示
- ログイン/ログアウト機能
- noraneko-id SDK の機能紹介

### コールバックページ (`/auth/callback`)
- OAuth2認証完了後のコールバック処理
- エラーハンドリング
- 自動リダイレクト

### ダッシュボード (`/dashboard`)
- 認証保護されたページの例
- ユーザー情報の詳細表示
- アクセストークンの表示
- API呼び出し例

## 🔧 実装の詳細

### React Hooks の使用

```typescript
import { useNoranekoID } from '@noraneko/id-react';

function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error, 
    login, 
    logout 
  } = useNoranekoID();
  
  // コンポーネントの実装...
}
```

### 保護されたルート

```typescript
import { ProtectedRoute } from '@noraneko/id-react';

export default function SecurePage() {
  return (
    <ProtectedRoute
      fallback={<div>ログインが必要です</div>}
    >
      <YourSecureContent />
    </ProtectedRoute>
  );
}
```

### プロバイダーの設定

```typescript
import { NoranekoIDProvider } from '@noraneko/id-react';

export default function RootLayout({ children }) {
  return (
    <NoranekoIDProvider
      config={{
        clientId: process.env.NORANEKO_CLIENT_ID,
        issuer: process.env.NORANEKO_ISSUER,
        redirectUri: `${process.env.NORANEKO_APP_URL}/auth/callback`,
        scopes: ['openid', 'profile', 'email'],
      }}
    >
      {children}
    </NoranekoIDProvider>
  );
}
```

## 🧪 テスト方法

1. **基本認証フロー**:
   - ホームページでログインボタンをクリック
   - noraneko-id の認証画面で認証
   - コールバック後にホームページにリダイレクト

2. **保護されたページ**:
   - 認証済み状態で `/dashboard` にアクセス
   - 未認証状態では適切にブロックされることを確認

3. **ログアウト**:
   - ログアウトボタンをクリック
   - 認証状態がリセットされることを確認

## 📝 利用可能なスクリプト

- `npm run dev`: 開発サーバーを起動
- `npm run build`: プロダクションビルドを作成
- `npm run start`: プロダクションサーバーを起動
- `npm run lint`: ESLintを実行
- `npm run type-check`: TypeScriptの型チェックを実行

## 🔍 トラブルシューティング

### CORS エラーが発生する場合

noraneko-id サーバーのCORS設定を確認してください。開発環境では `http://localhost:3001` からのリクエストを許可する必要があります。

### 認証が失敗する場合

1. OAuth2クライアントの設定を確認
2. Redirect URIが正確に設定されているか確認
3. 環境変数が正しく設定されているか確認

### TypeScript エラーが発生する場合

```bash
npm run type-check
```

でエラーの詳細を確認してください。

## 📚 参考リンク

- [noraneko-id プロジェクト](../../README.md)
- [React SDK ドキュメント](../../packages/react/README.md)
- [JavaScript SDK ドキュメント](../../packages/sdk/README.md)
- [Next.js ドキュメント](https://nextjs.org/docs)