# @noraneko/id-sdk

noraneko-id JavaScript SDK - OAuth2 + PKCE認証を簡単に実装

## 概要

`@noraneko/id-sdk` は、noraneko-id OAuth2認証サーバーとの連携を簡単にするJavaScript SDKです。OAuth2 Authorization Code + PKCEフローを完全サポートし、セキュアで使いやすいAPIを提供します。

## 特徴

- 🔐 **OAuth2 + PKCE完全対応**: RFC 6749/7636準拠
- 🚀 **簡単な初期化**: 最小限の設定で利用開始
- 🔄 **自動トークン更新**: アクセストークンの自動リフレッシュ
- 📱 **TypeScript完全対応**: 型安全な開発体験
- 🎯 **ゼロ依存**: Pure JavaScriptで外部依存なし
- 💾 **柔軟なストレージ**: localStorage/sessionStorage/memory対応
- 🎨 **イベントドリブン**: 認証状態の変化を監視

## インストール

```bash
# GitHubから直接インストール（推奨）
npm install "github:noraneko-id/noraneko-id#main"

# または package.json に記述
{
  "dependencies": {
    "@noraneko/id-sdk": "github:noraneko-id/noraneko-id#main"
  }
}
```

詳細なインストール方法は [INSTALL.md](../../INSTALL.md) を参照してください。

## 基本的な使用方法

### 1. SDKの初期化

```javascript
import { NoranekoID } from '@noraneko/id-sdk';

const sdk = new NoranekoID({
  clientId: 'your-client-id',
  issuer: 'https://id.noraneko.dev',
  redirectUri: 'https://your-app.com/auth/callback'
});
```

### 2. 認証フローの開始

```javascript
// ログインボタンのクリックハンドラ
async function handleLogin() {
  try {
    await sdk.startAuth({
      scopes: ['openid', 'profile', 'email']
    });
    // 認証画面にリダイレクトされます
  } catch (error) {
    console.error('認証開始エラー:', error);
  }
}
```

### 3. コールバック処理

```javascript
// /auth/callback ページで実行
async function handleCallback() {
  try {
    const tokens = await sdk.handleCallback();
    console.log('認証成功:', tokens);
    
    // ユーザー情報を取得
    const user = await sdk.getUser();
    console.log('ユーザー情報:', user);
    
  } catch (error) {
    console.error('コールバック処理エラー:', error);
  }
}
```

### 4. 認証状態の確認

```javascript
// 認証状態をチェック
const isAuthenticated = await sdk.isAuthenticated();
if (isAuthenticated) {
  const user = await sdk.getUser();
  console.log('ログイン中:', user);
} else {
  console.log('未ログイン');
}
```

### 5. イベントハンドリング

```javascript
// 認証イベントを監視
sdk.on('authenticated', (user) => {
  console.log('ログインしました:', user);
  updateUI('authenticated');
});

sdk.on('unauthenticated', () => {
  console.log('ログアウトしました');
  updateUI('unauthenticated');
});

sdk.on('tokenRefreshed', (tokens) => {
  console.log('トークンが更新されました');
});

sdk.on('error', (error) => {
  console.error('認証エラー:', error);
});
```

### 6. ログアウト

```javascript
async function handleLogout() {
  try {
    await sdk.logout({
      returnTo: 'https://your-app.com' // ログアウト後のリダイレクト先
    });
  } catch (error) {
    console.error('ログアウトエラー:', error);
  }
}
```

## 設定オプション

```javascript
const sdk = new NoranekoID({
  // 必須設定
  clientId: 'your-client-id',
  issuer: 'https://id.noraneko.dev',
  
  // オプション設定
  redirectUri: 'https://your-app.com/auth/callback', // デフォルト: 現在のorigin + '/auth/callback'
  scopes: ['openid', 'profile', 'email'], // デフォルト: ['openid', 'profile', 'email']
  tokenStorage: 'localStorage', // 'localStorage' | 'sessionStorage' | 'memory'
  storagePrefix: 'noraneko_', // ストレージキーのプレフィックス
  clockSkewLeeway: 60, // JWTトークンの時刻スキュー許容秒数
  refreshThreshold: 300, // トークン期限切れ前の更新開始秒数
  
  // 追加パラメータ
  additionalParams: {
    prompt: 'login' // 常にログイン画面を表示
  }
});
```

## API リファレンス

### メソッド

#### `startAuth(options?)`
OAuth2認証フローを開始します。

```javascript
await sdk.startAuth({
  scopes: ['openid', 'profile'],
  redirectUri: 'https://your-app.com/custom-callback',
  additionalParams: {
    prompt: 'consent'
  }
});
```

#### `handleCallback(url?)`
OAuth2コールバックを処理してトークンを取得します。

```javascript
const tokens = await sdk.handleCallback();
```

#### `isAuthenticated()`
認証状態を確認します。

```javascript
const isAuth = await sdk.isAuthenticated();
```

#### `getUser()`
ユーザー情報を取得します。

```javascript
const user = await sdk.getUser();
```

#### `getAccessToken()`
アクセストークンを取得します。

```javascript
const token = await sdk.getAccessToken();
```

#### `refreshTokens()`
トークンを手動で更新します。

```javascript
const newTokens = await sdk.refreshTokens();
```

#### `logout(options?)`
ログアウトします。

```javascript
await sdk.logout({
  localOnly: false, // サーバー側のセッションもクリア
  returnTo: 'https://your-app.com'
});
```

### イベント

#### `on(event, callback)`
イベントリスナーを追加します。

```javascript
sdk.on('authenticated', (user) => {
  // ログイン時の処理
});
```

#### `off(event, callback)`
イベントリスナーを削除します。

```javascript
const handler = (user) => console.log(user);
sdk.on('authenticated', handler);
sdk.off('authenticated', handler);
```

### イベントタイプ

- `authenticated`: ユーザーがログインした時
- `unauthenticated`: ユーザーがログアウトした時
- `tokenRefreshed`: トークンが更新された時
- `tokenExpired`: トークンが期限切れになった時
- `error`: エラーが発生した時

## エラーハンドリング

```javascript
import { 
  AuthenticationError, 
  NetworkError, 
  ConfigurationError,
  ErrorCode 
} from '@noraneko/id-sdk';

try {
  await sdk.startAuth();
} catch (error) {
  if (error instanceof AuthenticationError) {
    if (error.code === ErrorCode.AUTHORIZATION_DENIED) {
      console.log('ユーザーが認証を拒否しました');
    }
  } else if (error instanceof NetworkError) {
    console.log('ネットワークエラー:', error.status);
  } else if (error instanceof ConfigurationError) {
    console.log('設定エラー:', error.message);
  }
}
```

## Next.js での使用例

```javascript
// pages/_app.js
import { useEffect, useState } from 'react';
import { NoranekoID } from '@noraneko/id-sdk';

const sdk = new NoranekoID({
  clientId: process.env.NEXT_PUBLIC_NORANEKO_CLIENT_ID,
  issuer: process.env.NEXT_PUBLIC_NORANEKO_ISSUER,
});

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 認証状態をチェック
    sdk.isAuthenticated().then(isAuth => {
      if (isAuth) {
        return sdk.getUser();
      }
      return null;
    }).then(user => {
      setUser(user);
      setLoading(false);
    });

    // イベントリスナーを設定
    sdk.on('authenticated', setUser);
    sdk.on('unauthenticated', () => setUser(null));

    return () => {
      sdk.off('authenticated', setUser);
      sdk.off('unauthenticated', () => setUser(null));
    };
  }, []);

  if (loading) return <div>Loading...</div>;

  return <Component {...pageProps} user={user} sdk={sdk} />;
}

export default MyApp;
```

```javascript
// pages/auth/callback.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AuthCallback({ sdk }) {
  const router = useRouter();

  useEffect(() => {
    sdk.handleCallback()
      .then(() => {
        router.push('/dashboard');
      })
      .catch(error => {
        console.error('認証エラー:', error);
        router.push('/login?error=auth_failed');
      });
  }, []);

  return <div>認証処理中...</div>;
}
```

## ブラウザサポート

- Chrome 63+
- Firefox 57+
- Safari 11.1+
- Edge 79+

必要なWeb API:
- Crypto API (crypto.getRandomValues, crypto.subtle)
- Fetch API
- URL API
- TextEncoder/TextDecoder

## ライセンス

MIT License

## サポート

- [GitHub Issues](https://github.com/noraneko-id/noraneko-id/issues)
- [ドキュメント](https://docs.noraneko.dev)