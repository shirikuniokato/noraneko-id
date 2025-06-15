# General Project Documentation

noraneko-id プロジェクト全体に関わる一般的な開発文書です。

## 📚 文書一覧

### [🔧 DEVELOPMENT.md](./DEVELOPMENT.md)
- 開発環境のセットアップ手順
- 必要ツール・依存関係
- ローカル開発の開始方法
- トラブルシューティング

### [⚙️ WORKFLOW.md](./WORKFLOW.md)
- Git フロー・ブランチ戦略
- コミットメッセージ規約
- プルリクエスト・コードレビューフロー
- リリース・デプロイプロセス

### [🧪 TESTING.md](./TESTING.md)
- テスト戦略・方針
- 単体テスト・統合テスト・E2Eテスト
- テストツール・フレームワーク
- CI/CDパイプライン

## 🚧 開発予定文書

### PROJECT_OVERVIEW.md (作成予定)
- プロジェクト全体概要
- アーキテクチャ概要図
- 技術スタック選定理由
- ロードマップ・将来計画

## 🎯 プロジェクト概要

### noraneko-id とは
**日本の開発者向けIDaaS（Identity as a Service）システム**

- 🎌 **日本語対応**: UI・文書・エラーメッセージ
- 🔒 **プライバシー重視**: サードパーティクッキー不使用
- 🏢 **マルチテナント**: クライアント別完全分離
- 📱 **SNS連携**: Google・GitHub・LINE等対応

### アーキテクチャ概要
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client Apps   │───▶│   noraneko-id    │───▶│ External SNS    │
│                 │    │                  │    │ (Google, etc.)  │
│ • Web Apps      │    │ • Go Backend     │    │                 │
│ • Mobile Apps   │    │ • Next.js Admin  │    │                 │
│ • Services      │    │ • JavaScript SDK │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │   Database      │
                       └─────────────────┘
```

## 🛠️ 技術スタック

### Backend
- **Language**: Go 1.21+
- **Framework**: Gin
- **Database**: PostgreSQL 16+
- **ORM**: GORM
- **Authentication**: JWT + bcrypt
- **API**: OpenAPI/Swagger

### Frontend (Web Console)
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State**: Zustand (予定)

### JavaScript SDK
- **Language**: TypeScript
- **Bundler**: Rollup
- **Testing**: Jest + React Testing Library
- **React Integration**: Hooks + Context

### Infrastructure
- **Containerization**: Docker
- **Database**: PostgreSQL on Docker
- **Development**: Docker Compose
- **Production**: TBD (Vercel/AWS/GCP)

## 🚀 開発開始方法

### 1. リポジトリクローン
```bash
git clone https://github.com/organization/noraneko-id.git
cd noraneko-id
```

### 2. 詳細セットアップ
各コンポーネントの詳細は専用文書を参照：

- **Backend**: [docs/backend/](../backend/) 
- **Web Console**: [docs/web/](../web/)
- **JavaScript SDK**: [docs/javascript-sdk/](../javascript-sdk/)

### 3. 開発フロー
[WORKFLOW.md](./WORKFLOW.md) に従って開発を進めてください。

## 📖 文書ナビゲーション

### 新規参加者向け
1. **[PROJECT_OVERVIEW.md]** - プロジェクト全体像把握
2. **[DEVELOPMENT.md](./DEVELOPMENT.md)** - 開発環境構築
3. **[Backend文書](../backend/)** - システム詳細理解

### API利用者向け
1. **[Backend API仕様](../backend/API_REFERENCE.md)** - API詳細
2. **[JavaScript SDK](../javascript-sdk/)** - クライアント実装

### システム管理者向け
1. **[Web管理コンソール](../web/)** - 管理機能
2. **[Backend アーキテクチャ](../backend/BACKEND_ARCHITECTURE.md)** - システム設計

### 開発者向け
1. **[WORKFLOW.md](./WORKFLOW.md)** - 開発フロー
2. **[TESTING.md](./TESTING.md)** - テスト方針
3. 各コンポーネント詳細文書

## 🔗 外部リソース

### 公式サイト・ドキュメント
- **OAuth2 RFC**: [RFC 6749](https://tools.ietf.org/html/rfc6749)
- **PKCE RFC**: [RFC 7636](https://tools.ietf.org/html/rfc7636)
- **OpenID Connect**: [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)

### 開発ツール・リソース
- **Go Documentation**: [golang.org](https://golang.org/doc/)
- **Next.js Documentation**: [nextjs.org](https://nextjs.org/docs)
- **PostgreSQL Documentation**: [postgresql.org](https://www.postgresql.org/docs/)

## 📞 サポート・コミュニティ

### 開発チーム連絡先
- **Issues**: [GitHub Issues](https://github.com/organization/noraneko-id/issues)
- **Discussions**: [GitHub Discussions](https://github.com/organization/noraneko-id/discussions)
- **Email**: development@noraneko-id.com

### 貢献方法
1. [WORKFLOW.md](./WORKFLOW.md) の開発フローに従う
2. 機能追加・バグ修正は Issue 作成から開始
3. Pull Request 作成時は適切なテンプレート使用
4. コードレビューの指摘に対応

---

📝 **Last Updated**: 2024-06-15  
🔄 **Version**: v1.0.0  
🌍 **Project**: noraneko-id  
👥 **Maintainers**: noraneko-id development team