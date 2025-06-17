# VibeCoding ガイドライン

noraneko-idプロジェクトの開発スタイル「VibeCoding」のガイドラインです。このガイドラインは、プロジェクトの一貫性を保ち、開発者が効率的に協力できる環境を構築することを目的としています。

## 目次

1. [VibeCodingの哲学](#vibecoding-philosophy)
2. [言語別コーディング規約](#language-conventions)
3. [プロジェクト構造](#project-structure)
4. [テスト戦略](#testing-strategy)
5. [エラーハンドリング](#error-handling)
6. [ログ出力](#logging)
7. [コミット規約](#commit-conventions)
8. [開発フロー](#development-flow)
9. [パフォーマンス](#performance)
10. [セキュリティ](#security)

## VibeCoding哲学 {#vibecoding-philosophy}

VibeCodingは以下の原則に基づいています：

### 🎯 シンプルさを重視
- 複雑な抽象化よりも、理解しやすいコードを書く
- 過度な最適化よりも、保守性を優先する
- 必要十分な機能に集中し、オーバーエンジニアリングを避ける

### 🤝 開発者体験を最優先
- コードの可読性を重視し、自己文書化されたコードを書く
- 一貫した命名規則とコーディングスタイルを維持する
- 新しい開発者が迅速にプロジェクトに参加できる環境を整備する

### 🔄 継続的改善
- 小さく頻繁にリリースし、フィードバックを素早く取り入れる
- テストを通じて品質を担保し、リファクタリングを恐れない
- 技術的負債を蓄積させず、定期的にコードの健全性を見直す

### 🌍 実用性とベストプラクティスのバランス
- 業界標準に従いつつ、プロジェクトの特性に合わせて最適化する
- RFC準拠（OAuth2など）を保ちながら、使いやすさを追求する
- ドキュメントとコードの整合性を維持する

## 言語別コーディング規約 {#language-conventions}

### Go言語

#### フォーマットとリント
```bash
# 必須ツール
go fmt ./...           # コードフォーマット
go vet ./...           # 静的解析
golangci-lint run      # 包括的リント
```

#### 命名規則
```go
// パッケージ名: 小文字、短く、意味のある名前
package handler

// 構造体: PascalCase
type AuthHandler struct {
    config *config.Config
}

// 関数: PascalCase（公開）、camelCase（非公開）
func NewAuthHandler(cfg *config.Config) *AuthHandler

// 変数: camelCase
var clientSecret string

// 定数: PascalCase または UPPER_SNAKE_CASE
const DefaultTimeout = 30 * time.Second
const MAX_RETRY_COUNT = 3
```

#### ドキュメンテーション
```go
// AuthHandler 認証関連のハンドラー
type AuthHandler struct {
    config *config.Config
}

// Login ユーザーログイン POST /auth/login
// @Summary ユーザーログイン
// @Description メールアドレスとパスワードでユーザーログインを行います
// @Tags 認証
// @Accept json
// @Produce json
// @Param request body LoginRequest true "ログイン情報"
// @Success 200 {object} map[string]interface{} "ログイン成功"
// @Failure 400 {object} map[string]interface{} "リクエストエラー"
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
    // 実装
}
```

#### 構造体タグの活用
```go
type LoginRequest struct {
    Email    string `json:"email" binding:"required,email" example:"user@example.com"`
    Password string `json:"password" binding:"required,min=6" example:"password123"`
    ClientID string `json:"client_id" binding:"required" example:"demo-client"`
}
```

### TypeScript/JavaScript

#### ESLint設定
```javascript
// eslint.config.mjs
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];
```

#### TypeScript設定（厳格モード）
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

#### 命名規則
```typescript
// インターface: PascalCase
interface LoginFormProps {
  errorParam?: string;
}

// 関数: camelCase
function handleSubmit(data: FormData) {
  // 実装
}

// React コンポーネント: PascalCase
export default function LoginForm(props: LoginFormProps) {
  return <div>...</div>;
}

// 定数: UPPER_SNAKE_CASE
const API_BASE_URL = 'http://localhost:8080';

// ファイル名: kebab-case
// LoginForm.tsx, user-service.ts
```

#### パス別名設定
```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@/components/*": ["./src/components/*"],
    "@/app/*": ["./src/app/*"],
    "@/lib/*": ["./src/lib/*"],
    "@/types/*": ["./src/types/*"]
  }
}
```

## プロジェクト構造 {#project-structure}

### Go（バックエンド）
```
backend/
├── cmd/              # アプリケーションエントリーポイント
│   ├── server/       # メインサーバー
│   └── seed/         # データシーダー
├── internal/         # プライベートコード（外部からimport不可）
│   ├── config/       # 設定管理
│   ├── handler/      # HTTPハンドラー
│   ├── middleware/   # ミドルウェア
│   ├── model/        # データモデル
│   └── seed/         # シーダー実装
├── pkg/              # パブリックライブラリ（外部からimport可能）
│   ├── database/     # データベース接続
│   ├── jwt/          # JWT関連ユーティリティ
│   └── oauth2/       # OAuth2実装
├── docs/             # Swagger生成ドキュメント
├── templates/        # HTMLテンプレート
└── migrations/       # データベースマイグレーション
```

### Next.js（フロントエンド）
```
web/
├── src/
│   ├── app/              # App Router（Next.js 13+）
│   │   ├── api/          # API Routes
│   │   ├── dashboard/    # ダッシュボードページ
│   │   │   └── components/  # ページ固有コンポーネント
│   │   ├── login/        # ログインページ
│   │   │   └── components/  # ページ固有コンポーネント
│   │   ├── layout.tsx    # ルートレイアウト
│   │   └── page.tsx      # ホームページ
│   ├── lib/              # ユーティリティライブラリ
│   ├── types/            # TypeScript型定義
│   └── middleware.ts     # Next.js ミドルウェア
├── public/               # 静的ファイル
└── packages/             # 内部パッケージ
```

### ディレクトリ命名規則
- **Go**: スネークケース（`auth_test.go`, `user_seeder.go`）
- **Next.js**: ケバブケース（`dashboard`, `login`）
- **コンポーネント**: PascalCase（`LoginForm.tsx`, `DashboardHeader.tsx`）

## テスト戦略 {#testing-strategy}

### テストピラミッド
- **単体テスト（70%）**: 個別関数・メソッドのテスト
- **統合テスト（20%）**: API・データベース連携のテスト
- **E2Eテスト（10%）**: ユーザーシナリオのテスト

### Go テスト
```go
package handler

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestLoginRequest_Validation(t *testing.T) {
    testCases := []struct {
        name           string
        request        LoginRequest
        expectValid    bool
        expectedErrors []string
    }{
        {
            name: "有効なリクエスト",
            request: LoginRequest{
                Email:    "test@example.com",
                Password: "password123",
            },
            expectValid: true,
        },
        // その他のテストケース
    }

    for _, tt := range testCases {
        t.Run(tt.name, func(t *testing.T) {
            // テスト実行
            assert.Equal(t, tt.expectValid, isValid)
        })
    }
}
```

### テストファイル命名
- **Go**: `*_test.go`
- **TypeScript**: `*.test.ts`, `*.spec.ts`

### 統合テスト（Go）
```go
//go:build integration
// +build integration

package handler

import (
    "testing"
    "github.com/stretchr/testify/suite"
)

type AuthIntegrationTestSuite struct {
    suite.Suite
    router *gin.Engine
    db     *gorm.DB
}

func (suite *AuthIntegrationTestSuite) SetupSuite() {
    // データベース接続とテーブル作成
}

func TestAuthIntegrationTestSuite(t *testing.T) {
    suite.Run(t, new(AuthIntegrationTestSuite))
}
```

## エラーハンドリング {#error-handling}

### Go エラーハンドリング
```go
// エラーラップとコンテキスト情報の提供
func Connect(config DatabaseConfig) error {
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        return fmt.Errorf("データベース接続に失敗しました: %v", err)
    }
    return nil
}

// HTTPレスポンスでのエラー処理
func (h *AuthHandler) Login(c *gin.Context) {
    if req.Email == "" || req.Password == "" {
        redirectURI := c.PostForm("redirect_uri")
        loginURL := "/login?error=" + url.QueryEscape("メールアドレス、パスワードを入力してください")
        if redirectURI != "" {
            loginURL += "&redirect_uri=" + url.QueryEscape(redirectURI)
        }
        c.Redirect(http.StatusFound, loginURL)
        return
    }
}
```

### TypeScript エラーハンドリング
```typescript
// Result型パターンの使用を推奨
type Result<T, E = Error> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};

// API レスポンスのハンドリング
async function loginUser(credentials: LoginCredentials): Promise<Result<User>> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      return { success: false, error: new Error('ログインに失敗しました') };
    }

    const user = await response.json();
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

## ログ出力 {#logging}

### Go ログ出力
```go
import "log"

// アプリケーション起動時
log.Println("データベースに正常に接続しました")

// エラー時
log.Fatal("設定の読み込みに失敗しました:", err)

// 処理完了時
log.Println("データベースマイグレーションが完了しました")

// デバッグ情報（将来的な構造化ログ対応）
// TODO: slog パッケージへの移行を検討
log.Printf("ユーザー %s がログインしました", userID)
```

### ログレベル設定
```go
func getLogLevel() logger.LogLevel {
    switch os.Getenv("GIN_MODE") {
    case "release":
        return logger.Error
    case "test":
        return logger.Silent
    default:
        return logger.Info
    }
}
```

### 日本語メッセージの活用
- **開発者向けログ**: 日本語で詳細な情報を提供
- **ユーザー向けエラー**: わかりやすい日本語メッセージ
- **システムログ**: 英語と日本語の併用を検討

## コミット規約 {#commit-conventions}

### Conventional Commits準拠
```bash
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Type一覧
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント変更
- `style`: コードフォーマット（機能に影響しない）
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルド・設定等の変更

### コミットメッセージ例
```bash
git commit -m "feat(oauth2): add PKCE support for authorization code flow"
git commit -m "fix(auth): resolve session validation issue"
git commit -m "docs: update API documentation for new endpoints"
git commit -m "refactor: consolidate React SDK by eliminating duplicate functionality"
git commit -m "chore: update .gitignore for development temporary files"
```

### ブランチ命名規則
```bash
feature/[issue-number]-brief-description
hotfix/[issue-number]-brief-description
release/v[version]

# 例
feature/123-oauth2-pkce-support
hotfix/456-session-validation-fix
release/v1.2.0
```

## 開発フロー {#development-flow}

### 1. 機能開発の流れ
```bash
# 1. 最新のdevelopブランチを取得
git checkout develop
git pull origin develop

# 2. 新しい機能ブランチを作成
git checkout -b feature/123-new-feature

# 3. 開発環境の起動
./scripts/dev.sh

# 4. 開発・テスト・コミット
# ...

# 5. プルリクエスト作成前のチェック
./scripts/test.sh
./scripts/build.sh

# 6. プルリクエスト作成
```

### 2. コード品質チェック
```bash
# Go
cd backend
go fmt ./...
go vet ./...
golangci-lint run

# TypeScript
cd web
npm run lint
npm run type-check
```

### 3. プルリクエストチェックリスト
- [ ] 全テストが通過する
- [ ] コードが自己文書化されている
- [ ] 適切なエラーハンドリングを実装
- [ ] セキュリティの考慮事項を確認
- [ ] パフォーマンスの影響を確認
- [ ] ドキュメントを更新

## パフォーマンス {#performance}

### Go パフォーマンス指針
```go
// データベースクエリの最適化
// N+1問題の回避
users := []User{}
db.Preload("Roles").Find(&users)

// 不要なメモリ割り当ての回避
var buf strings.Builder
for _, item := range items {
    buf.WriteString(item)
}

// コンテキストタイムアウトの設定
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()
```

### フロントエンド パフォーマンス
```typescript
// Next.js の最適化機能を活用
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// 動的インポートでコード分割
const DynamicComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
});

// メモ化で再レンダリングを最適化
import { memo, useMemo } from 'react';

const ExpensiveComponent = memo(({ data }) => {
  const processedData = useMemo(() => {
    return expensiveOperation(data);
  }, [data]);

  return <div>{processedData}</div>;
});
```

### パフォーマンス目標
- **API レスポンス時間**: 95%が100ms以内
- **ページロード時間**: 2秒以内
- **データベースクエリ**: N+1問題の排除

## セキュリティ {#security}

### 認証・認可
```go
// JWTトークンの適切な検証
func ValidateToken(tokenString string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("予期しない署名方法: %v", token.Header["alg"])
        }
        return []byte(secretKey), nil
    })
    
    if err != nil {
        return nil, err
    }
    
    if claims, ok := token.Claims.(*Claims); ok && token.Valid {
        return claims, nil
    }
    
    return nil, fmt.Errorf("無効なトークンです")
}
```

### 入力値検証
```go
// Ginのバリデーション活用
type LoginRequest struct {
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required,min=6"`
}

// SQL インジェクション対策（GORM使用）
var user User
db.Where("email = ?", email).First(&user) // プレースホルダー使用
```

### セキュリティチェックリスト
- [ ] 入力値の適切な検証・サニタイゼーション
- [ ] SQLインジェクション対策
- [ ] CSRF対策の実装
- [ ] セキュアなセッション管理
- [ ] 機密情報の適切な管理（.env ファイルの除外）
- [ ] HTTPS の強制使用
- [ ] 適切なCORS設定

## 継続的改善

### 定期的な見直し事項
1. **依存関係の更新**: セキュリティパッチの適用
2. **コードカバレッジ**: バックエンド80%以上、フロントエンド70%以上
3. **技術的負債**: 定期的なリファクタリング
4. **パフォーマンス監視**: メトリクスの測定と改善
5. **セキュリティ監査**: 脆弱性スキャンの実行

### ツールとメトリクス
```bash
# 依存関係の脆弱性チェック
cd backend && go list -json -m all | nancy sleuth
cd web && npm audit

# コードカバレッジ
cd backend && go test -cover ./...
cd web && npm test -- --coverage

# パフォーマンステスト
ab -n 1000 -c 10 http://localhost:8080/health
```

---

このガイドラインは生きた文書として、プロジェクトの成長とともに継続的に更新されます。新しいメンバーや技術的な変更があった際は、このドキュメントを参照し、必要に応じて改善提案を行ってください。

**VibeCoding**: シンプルで実用的、そして開発者が楽しく開発できるコードを目指して 🚀