# noraneko-id

プライベートなサービス開発者向けのIDaaS（Identity as a Service）  
**noraneko-id** は、個人開発/小規模サービスに最適な「認証」「認可」基盤を提供します。  
OAuth2（RFC準拠）をベースに、再利用性・柔軟性・拡張性を重視しています。

---

## サービス概要

- サービス名　　：**noraneko-id**
- 想定ドメイン　：**noraneko-id.com**（または `.io`/`.dev` も候補）
- リポジトリ名　：**noraneko-id**
- カテゴリ　　　：個人/小規模サービス向け IDaaS（認証・認可基盤）

---

## 主な特徴

- **OAuth2（RFC 6749）準拠**
- 3rd party cookie依存なし
- アプリごとのclient_id/client_secret/リダイレクトURI管理
- UUIDベースのユーザ一意性
- 認可画面/同意UI
- 管理画面（ユーザ・アプリ・認可のCRUD）
- Go（Gin）+ PostgreSQL + Next.js（TypeScript）で構築
- Dockerによる開発/本番運用対応

---

## 技術スタック

| レイヤ         | 技術                  | 補足                       |
|----------------|-----------------------|----------------------------|
| バックエンド   | Go（Ginフレームワーク） | APIサーバ・認証/認可ロジック |
| データベース   | PostgreSQL            | Dockerで起動可能           |
| フロントエンド | Next.js（TypeScript） | 管理画面・認可画面          |
| 開発運用      | Docker, docker-compose | ローカル/本番ともに活用     |

---

## 実装済み機能

### 🔐 認証・認可
- ✅ ユーザー登録／ログイン／ログアウト
- ✅ セッション管理（セキュアクッキー）
- ✅ 管理者権限システム
- ✅ パスワードハッシュ化（bcrypt）

### 🛡️ OAuth2（RFC 6749準拠）
- ✅ OAuth2エンドポイント（/authorize, /token, /userinfo, /revoke）
- ✅ 認可コードフロー
- ✅ PKCE（Proof Key for Code Exchange）サポート
- ✅ JWT アクセストークン
- ✅ リフレッシュトークン
- ✅ スコープ管理

### 🔧 管理機能
- ✅ OAuth2クライアント管理（CRUD）
- ✅ クライアントシークレット生成・再生成
- ✅ 管理者専用エンドポイント

### 📚 API仕様
- ✅ OpenAPI/Swagger ドキュメント
- ✅ 対話式API テストUI（Swagger UI）
- ✅ 包括的なエラーハンドリング

### 🏗️ 開発基盤
- ✅ PostgreSQL データベース統合
- ✅ Docker による開発環境
- ✅ GORM による ORM
- ✅ 構造化ログ出力
- ✅ CORS対応

## 開発予定機能

- 📧 メール認証・パスワードリセット
- 🖥️ 管理画面UI（Next.js）
- 🔄 WebHook通知
- 📊 使用状況分析
- 🌐 多言語対応

---

## プロジェクト構造

```
noraneko-id/
├── backend/          # Go APIサーバー
│   ├── cmd/server/   # メインアプリケーション
│   ├── internal/     # 内部パッケージ
│   │   ├── config/   # 設定管理
│   │   ├── handler/  # HTTPハンドラー
│   │   ├── middleware/ # ミドルウェア
│   │   └── model/    # データモデル
│   ├── pkg/          # 外部公開パッケージ
│   │   ├── database/ # データベース接続
│   │   ├── jwt/      # JWT処理
│   │   └── oauth2/   # OAuth2ロジック
│   └── docs/         # Swagger生成ファイル
├── web/              # Next.js 管理画面
├── docs/             # プロジェクトドキュメント
├── scripts/          # ビルド・開発スクリプト
└── docker-compose.yml # 開発環境
```

## クイックスタート

### 1. 前提条件

- Go 1.21以上
- Node.js 18以上  
- Docker & Docker Compose

### 2. 簡単セットアップ（推奨）

```bash
# リポジトリクローン
git clone https://github.com/your-org/noraneko-id.git
cd noraneko-id

# 自動セットアップスクリプトを実行
./setup.sh
```

これにより以下が自動で行われます：
- 環境変数ファイルの作成
- データベースの起動
- マイグレーションの実行
- 開発用の種データ投入

### 3. 手動セットアップ

```bash
# 依存関係インストール
cd backend && go mod download

# 環境変数設定
cp backend/.env.example backend/.env
# .envファイルを編集

# データベース起動
docker-compose up -d

# 種データ投入
cd backend && make seed
```

### 4. 開発サーバー起動

```bash
# バックエンド: http://localhost:8080
cd backend && make run

# フロントエンド: http://localhost:3000（未実装）
# cd web && npm run dev
```

### 5. 開発用アカウント

種データには以下のテストアカウントが含まれています：

| メールアドレス | パスワード | 権限 |
|---------------|-----------|------|
| admin@example.com | password123 | システム管理者 |
| user1@example.com | password123 | 限定管理者 |
| user2@example.com | password123 | 一般ユーザー |

### 6. 開発用OAuth2クライアント

| クライアントID | クライアントシークレット | タイプ |
|---------------|------------------------|--------|
| dev-client-001 | dev-secret-please-change-in-production | Confidential |
| test-spa-client | （なし） | Public (SPA用) |

### 7. API ドキュメント確認

**Swagger UI**: http://localhost:8080/swagger/index.html

## アーキテクチャ概要

```plaintext
[外部アプリケーション]
    ↓ OAuth2
[Go APIサーバー (Gin)]
    ↓ GORM
[PostgreSQL]

[管理者]
    ↓ セッション認証
[Next.js 管理画面]
    ↓ REST API
[Go APIサーバー (Gin)]
```

## API エンドポイント

### 認証
- `POST /auth/register` - ユーザー登録
- `POST /auth/login` - ログイン  
- `POST /auth/logout` - ログアウト
- `GET /auth/profile` - プロフィール取得

### OAuth2
- `GET /oauth2/authorize` - 認可エンドポイント
- `POST /oauth2/token` - トークン取得
- `GET /oauth2/userinfo` - ユーザー情報取得
- `POST /oauth2/revoke` - トークン無効化

### 管理者API
- `POST /admin/clients` - クライアント作成
- `GET /admin/clients` - クライアント一覧
- `GET /admin/clients/{id}` - クライアント詳細
- `PUT /admin/clients/{id}` - クライアント更新
- `DELETE /admin/clients/{id}` - クライアント削除

詳細は [API仕様書](./docs/API.md) または [Swagger UI](http://localhost:8080/swagger/index.html) を参照してください。

## ドキュメント

- 📋 [開発ガイド](./docs/DEVELOPMENT.md) - 環境構築とセットアップ
- 🧪 [テストガイド](./docs/TESTING.md) - テスト実行方法
- 📖 [API仕様書](./docs/API.md) - 詳細なAPI仕様
- 🔄 [開発ワークフロー](./docs/WORKFLOW.md) - Git運用とCI/CD
- 📝 [Swagger利用ガイド](./docs/SWAGGER.md) - OpenAPI仕様の使い方

## OAuth2 フロー例

### 認可コードフロー

```bash
# 1. 認可エンドポイントへリダイレクト
GET /oauth2/authorize?client_id=myapp&response_type=code&redirect_uri=https://myapp.com/callback&scope=read&state=random123

# 2. ユーザーがログイン・認可後、コールバック
https://myapp.com/callback?code=AUTH_CODE&state=random123

# 3. 認可コードをアクセストークンに交換
POST /oauth2/token
{
  "grant_type": "authorization_code",
  "code": "AUTH_CODE",
  "client_id": "myapp",
  "client_secret": "secret",
  "redirect_uri": "https://myapp.com/callback"
}

# 4. アクセストークンでユーザー情報取得
GET /oauth2/userinfo
Authorization: Bearer ACCESS_TOKEN
```

## 開発状況

現在、バックエンドAPIは **完全に実装済み** です。OAuth2の全エンドポイント、認証システム、管理機能が動作します。

**次のマイルストーン:**
- Next.js管理画面の実装
- メール認証機能の追加
- 包括的なテストスイートの作成

## ライセンス

MIT License - 詳細は [LICENSE](./LICENSE) ファイルを参照してください。

## サポート

- 🐛 バグ報告: [Issues](https://github.com/your-org/noraneko-id/issues)
- 💡 機能要望: [Discussions](https://github.com/your-org/noraneko-id/discussions)
- 📧 お問い合わせ: support@noraneko-id.com
