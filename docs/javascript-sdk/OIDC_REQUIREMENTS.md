# OIDC完全準拠 実装要件

このドキュメントでは、Noraneko ID SDKがOpenID Connect仕様に完全準拠するための要件を説明します。

## 重要な変更点

**後方互換性を排除し、OIDC Discovery必須の実装になりました。**

## IDaaS側の必須要件

### 1. Discovery Endpoint（必須）

**エンドポイント**: `{issuer}/.well-known/openid-configuration`

このエンドポイントが実装されていない場合、SDKは初期化に失敗します。

#### 必須フィールド

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/oauth/authorize",
  "token_endpoint": "https://auth.example.com/oauth/token",
  "userinfo_endpoint": "https://auth.example.com/oauth/userinfo",
  "jwks_uri": "https://auth.example.com/oauth/jwks",
  "response_types_supported": ["code"],
  "subject_types_supported": ["pairwise"],  // NoranekoIDの特徴
  "id_token_signing_alg_values_supported": ["RS256"]
}
```

#### 推奨フィールド

```json
{
  // ... 必須フィールド ...
  "scopes_supported": ["openid", "profile", "email"],
  "code_challenge_methods_supported": ["S256"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "revocation_endpoint": "https://auth.example.com/oauth/revoke",
  "end_session_endpoint": "https://auth.example.com/oauth/logout"
}
```

### 2. Pairwise Identifiers サポート

NoranekoIDの「クライアント×ユーザで一意」という設計に対応：

```json
{
  "subject_types_supported": ["pairwise"]
}
```

UserInfo レスポンス例：
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",  // クライアントごとに異なる値
  "email": "user@example.com",
  "name": "ユーザー名"
}
```

## SDK側の動作

### 1. 初期化時の必須処理

```typescript
await createAuth({
  issuer: 'https://auth.example.com',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret'
})
```

内部処理：
1. `{issuer}/.well-known/openid-configuration` へアクセス
2. Discovery失敗時は初期化エラー（フォールバックなし）
3. 必須フィールドの検証
4. issuer値の一致確認

### 2. エンドポイントの決定

すべてのエンドポイントはDiscovery結果から取得：

- ❌ ハードコードされたパス（`/oauth2/authorize` など）は使用しない
- ✅ Discovery documentから取得したURLのみ使用

### 3. エラーハンドリング

Discovery失敗時のエラー例：

```typescript
// ネットワークエラー
Error: OpenID Connect Discovery failed: 404 Not Found

// 必須フィールド不足
Error: Invalid discovery document: missing required fields (issuer, authorization_endpoint, token_endpoint)

// issuer不一致
Error: Issuer mismatch: expected https://auth.example.com, got https://other.example.com

// userinfo_endpoint不足
Error: Invalid discovery document: missing userinfo_endpoint
```

## 実装チェックリスト

### IDaaS側

- [ ] `/.well-known/openid-configuration` エンドポイントの実装
- [ ] 必須フィールドすべての提供
- [ ] `subject_types_supported` に `pairwise` を含める
- [ ] CORS設定（SDKからのアクセスを許可）
- [ ] 5秒以内のレスポンス

### SDK利用側

- [ ] `createAuth()` の非同期呼び出し（`await` 必須）
- [ ] 初期化エラーのハンドリング
- [ ] issuer URLの正確な設定（末尾スラッシュなし）

## 移行ガイド

### 従来の実装

```typescript
// 同期的な初期化（非推奨）
initializeAuth({
  issuer: 'https://auth.example.com',
  // ...
})
```

### 新しい実装

```typescript
// 非同期初期化（必須）
try {
  await createAuth({
    issuer: 'https://auth.example.com',
    // ...
  })
} catch (error) {
  console.error('Failed to initialize auth:', error)
  // Discovery失敗時の処理
}
```

## よくある問題

### 1. Discovery失敗

**原因**: 
- `.well-known/openid-configuration` が実装されていない
- CORSエラー
- ネットワークエラー

**解決策**:
- IDaaS側でDiscovery endpointを実装
- 適切なCORS設定
- issuer URLの確認

### 2. issuer不一致

**原因**: 
Discovery documentの`issuer`値とSDK設定の`issuer`値が異なる

**解決策**:
- 末尾スラッシュの有無を統一
- 正確なissuer値を使用

### 3. 必須フィールド不足

**原因**: 
Discovery documentに必須フィールドが含まれていない

**解決策**:
- `authorization_endpoint`、`token_endpoint`、`userinfo_endpoint` を必ず含める

## まとめ

この実装により：

1. **完全なOIDC準拠**: OpenID Connect Discovery 1.0仕様に完全準拠
2. **セキュリティ向上**: 設定ミスのリスク削減
3. **柔軟性**: IDaaS側でエンドポイントを自由に変更可能
4. **標準化**: 他のOIDCプロバイダーとの互換性

ただし、`.well-known/openid-configuration` の実装が必須となります。