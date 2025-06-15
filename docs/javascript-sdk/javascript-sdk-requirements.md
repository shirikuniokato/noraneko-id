# noraneko-id JavaScript SDK 要件仕様書

## 概要

noraneko-id JavaScript SDKは、クライアントアプリケーションがnoraneko-id OAuth2認証サーバーと簡単に連携できるようにするためのライブラリです。OAuth2 Authorization Code + PKCEフローを実装し、セキュアで使いやすいAPIを提供します。

## 設計目標

### 1. 実装負担の軽減
- 各クライアントアプリケーションでの認証・認可実装を最小化
- 複雑なOAuth2フローを抽象化し、シンプルなAPIで提供
- フレームワーク固有の実装（React、Next.js等）は別パッケージとして提供

### 2. セキュリティ
- OAuth2 + PKCE (RFC 7636) 完全準拠
- セキュアなトークン管理
- CSRF攻撃対策（state parameter）
- 適切なトークン有効期限管理

### 3. 開発者体験
- TypeScript完全対応
- 直感的で分かりやすいAPI設計
- 豊富なドキュメントとサンプルコード
- デバッグしやすいエラーメッセージ

## 機能要件

### 1. OAuth2認証フロー

#### 1.1 Authorization Code + PKCE フロー
```javascript
// 認証開始
await sdk.startAuth({
  scopes: ['openid', 'profile', 'email'],
  redirectUri: 'https://app.example.com/callback'
});

// コールバック処理
const tokens = await sdk.handleCallback();
```

#### 1.2 サポートするグラントタイプ
- Authorization Code + PKCE（メイン）
- Refresh Token（トークン更新用）

#### 1.3 PKCE実装
- Code Verifier: 128文字のランダム文字列
- Code Challenge Method: S256 (SHA256)
- 自動的なchallenge/verifier生成・管理

### 2. トークン管理

#### 2.1 トークンの種類
- Access Token（JWT形式）
- Refresh Token
- ID Token（OpenID Connect対応）

#### 2.2 トークン保存
```javascript
// 設定可能な保存先
const config = {
  tokenStorage: 'localStorage', // 'localStorage' | 'sessionStorage' | 'memory'
  storagePrefix: 'noraneko_' // ストレージキーのプレフィックス
};
```

#### 2.3 自動リフレッシュ
- アクセストークン有効期限の自動監視
- 期限切れ前の自動更新
- リフレッシュ失敗時の認証再要求

### 3. ユーザー情報取得

#### 3.1 ユーザー情報API
```javascript
// ユーザー情報取得
const user = await sdk.getUserInfo();
// {
//   id: "uuid",
//   email: "user@example.com",
//   username: "username",
//   display_name: "表示名",
//   email_verified: true
// }
```

#### 3.2 認証状態管理
```javascript
// 認証状態確認
const isAuthenticated = await sdk.isAuthenticated();

// ログアウト
await sdk.logout();
```

### 4. イベントシステム

#### 4.1 認証状態変更イベント
```javascript
sdk.on('authenticated', (user) => {
  console.log('ユーザーがログインしました:', user);
});

sdk.on('unauthenticated', () => {
  console.log('ユーザーがログアウトしました');
});

sdk.on('tokenRefreshed', (tokens) => {
  console.log('トークンが更新されました');
});
```

#### 4.2 エラーイベント
```javascript
sdk.on('error', (error) => {
  console.error('認証エラー:', error);
});
```

## 技術要件

### 1. 対応環境
- **ブラウザ**: ES2020+対応のモダンブラウザ
- **Node.js**: 対応しない（ブラウザ専用）
- **TypeScript**: 完全対応（型定義含む）

### 2. モジュール形式
- **ES Modules**: メイン形式
- **UMD**: CDN配布用
- **TypeScript**: .d.tsファイル提供

### 3. 依存関係
- **Pure JavaScript**: 外部依存なし
- **Polyfill**: 必要に応じてユーザー側で追加

### 4. バンドルサイズ
- Minified + Gzipped: 15KB以下を目標

## API設計

### 1. 初期化
```javascript
import { NoranekoID } from '@noraneko/id-sdk';

const sdk = new NoranekoID({
  // 必須設定
  clientId: 'your-client-id',
  issuer: 'https://id.noraneko.dev', // noraneko-idサーバーのベースURL
  
  // オプション設定
  redirectUri: window.location.origin + '/auth/callback',
  scopes: ['openid', 'profile', 'email'],
  tokenStorage: 'localStorage',
  storagePrefix: 'noraneko_',
  
  // 詳細設定
  clockSkewLeeway: 60, // JWTトークンの時刻スキュー許容秒数
  refreshThreshold: 300, // トークン期限切れ前の更新開始秒数
});
```

### 2. 主要メソッド
```javascript
class NoranekoID {
  // 認証フロー
  async startAuth(options?: AuthOptions): Promise<void>
  async handleCallback(url?: string): Promise<TokenResponse>
  
  // 認証状態
  async isAuthenticated(): Promise<boolean>
  async getUser(): Promise<User | null>
  async getAccessToken(): Promise<string | null>
  
  // トークン管理
  async refreshTokens(): Promise<TokenResponse>
  async logout(options?: LogoutOptions): Promise<void>
  
  // イベント
  on(event: string, callback: Function): void
  off(event: string, callback: Function): void
  emit(event: string, ...args: any[]): void
}
```

## セキュリティ要件

### 1. PKCE実装
- RFC 7636完全準拠
- 暗号学的に安全な乱数生成
- SHA256ハッシュによるchallenge生成

### 2. State Parameter
- CSRF攻撃防止のためのstate parameter生成・検証
- セッション固定攻撃対策

### 3. トークン保護
- XSS攻撃対策（適切なストレージ選択）
- トークンの安全な保存・取得

### 4. エラーハンドリング
- 機密情報を含まないエラーメッセージ
- 適切なログレベル設定

## エラー処理

### 1. エラーの種類
```javascript
// 認証エラー
class AuthenticationError extends Error {
  code: 'AUTHENTICATION_FAILED' | 'TOKEN_EXPIRED' | 'INVALID_TOKEN'
  originalError?: Error
}

// 設定エラー
class ConfigurationError extends Error {
  code: 'INVALID_CONFIG' | 'MISSING_REQUIRED_PARAMETER'
}

// ネットワークエラー
class NetworkError extends Error {
  code: 'NETWORK_ERROR' | 'SERVER_ERROR'
  status?: number
}
```

### 2. エラー処理パターン
```javascript
try {
  const user = await sdk.getUser();
} catch (error) {
  if (error instanceof AuthenticationError) {
    // 認証が必要
    await sdk.startAuth();
  } else {
    // その他のエラー処理
    console.error('予期しないエラー:', error);
  }
}
```

## 今後の拡張計画

### フレームワーク統合パッケージ
1. **@noraneko/id-react**: React用フックス・コンポーネント
2. **@noraneko/id-nextjs**: Next.js用ミドルウェア・API Routes
3. **@noraneko/id-vue**: Vue.js用プラグイン（将来的に）

### 追加機能
1. **サーバーサイド認証**: Node.js環境での実装
2. **多要素認証**: TOTP、WebAuthn対応
3. **セッション管理**: 複数タブ間での状態同期

## 開発・テスト要件

### 1. テスト
- Unit Tests: Jest + Testing Library
- Integration Tests: OAuth2フロー全体のテスト
- Browser Tests: 複数ブラウザでの動作確認

### 2. ドキュメント
- API Reference（JSDoc生成）
- Getting Started ガイド
- サンプルアプリケーション
- Migration Guide

### 3. 品質保証
- TypeScript strict mode
- ESLint + Prettier
- CI/CD パイプライン
- セキュリティ監査

---

この要件仕様書は開発進行に応じて更新・詳細化していきます。