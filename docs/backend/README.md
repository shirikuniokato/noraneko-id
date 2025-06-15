# Backend Documentation

noraneko-id Go バックエンドの技術文書一覧です。

## 📚 アーキテクチャ・設計文書

### [🏗️ BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md)
- システム概要とレイヤードアーキテクチャ
- マルチテナント設計の詳細
- セキュリティアーキテクチャ
- データベース設計とインデックス戦略
- パフォーマンス・監視設計

### [🎯 USE_CASES.md](./USE_CASES.md)
- システム全体ユースケース図（PlantUML）
- 認証・認可ユースケース詳細
- OAuth2フローユースケース
- 管理機能ユースケース
- セキュリティユースケース

### [🔄 SEQUENCE_DIAGRAMS.md](./SEQUENCE_DIAGRAMS.md)
- OAuth2 Authorization Code Flow（Mermaid）
- SNS連携認証フロー
- マルチテナント認証検証フロー
- トークン管理・リフレッシュフロー
- エラーハンドリングフロー
- セッション管理フロー

### [📊 DATA_FLOW.md](./DATA_FLOW.md)
- システム全体データフロー図
- ユーザー登録・認証データフロー
- OAuth2トークンフロー
- マルチテナントデータ分離フロー
- 管理機能・セキュリティデータフロー

## 📖 API仕様書

### [📋 API_REFERENCE.md](./API_REFERENCE.md)
- **最新の完全なAPI仕様書**
- 全エンドポイントの詳細仕様
- リクエスト/レスポンス例
- エラーコード一覧
- SDKサンプルコード

### [📝 API.md](./API.md)
- 既存のAPI文書（統合予定）

### [🔧 SWAGGER.md](./SWAGGER.md)
- Swagger/OpenAPI設定とアクセス方法

## 🚀 クイックスタート

### 1. アーキテクチャ理解
```
BACKEND_ARCHITECTURE.md → USE_CASES.md → SEQUENCE_DIAGRAMS.md
```

### 2. API利用開始
```
API_REFERENCE.md → 具体的なエンドポイント仕様確認
```

### 3. データフロー理解
```
DATA_FLOW.md → システム内部動作の詳細把握
```

## 🔗 関連文書

- [JavaScript SDK文書](../javascript-sdk/) - クライアント側実装
- [Web管理画面文書](../web/) - フロントエンド実装
- [一般開発文書](../general/) - 開発フロー・テスト

## 💡 文書の使い方

### 新規開発者向け
1. `BACKEND_ARCHITECTURE.md` でシステム全体像を把握
2. `USE_CASES.md` で機能要件を理解
3. `API_REFERENCE.md` で実装開始

### API利用者向け
1. `API_REFERENCE.md` で必要なエンドポイント確認
2. `SEQUENCE_DIAGRAMS.md` でフロー詳細を理解
3. 実装・テスト開始

### システム運用者向け
1. `DATA_FLOW.md` でデータ処理を理解
2. `BACKEND_ARCHITECTURE.md` でセキュリティ設計確認
3. 監視・ログ設定の実装

## ⚠️ 重要な設計原則

### マルチテナント設計
- **完全分離**: クライアントごとに独立したユーザーベース
- **データ分離**: `ClientID + UID` による一意性保証
- **SNS連携**: 同じSNSアカウントでもクライアント別に独立

### OAuth2 RFC準拠
- **標準準拠**: RFC 6749完全対応
- **PKCE対応**: Public Clientのセキュリティ強化
- **SNS統合**: `identity_provider`パラメータによる統合

### セキュリティ設計
- **多層防御**: API・ビジネスロジック・データ層での検証
- **暗号化**: bcrypt・JWT・SHA-256による適切な暗号化
- **監査ログ**: 全セキュリティイベントの記録

---

📝 **Last Updated**: 2024-06-15  
🔄 **Version**: v1.0.0  
👥 **Maintainers**: noraneko-id development team