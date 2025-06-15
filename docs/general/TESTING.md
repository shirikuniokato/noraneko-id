# テストガイド

noraneko-idのテスト実行方法とテスト戦略について説明します。

## テスト構成

### バックエンド（Go）

- **単体テスト**: 各パッケージの機能テスト
- **統合テスト**: データベースを含むAPI テスト
- **E2Eテスト**: 完全なOAuth2フローのテスト

### フロントエンド（Next.js）

- **コンポーネントテスト**: React コンポーネントの単体テスト
- **統合テスト**: ページ全体のテスト
- **E2Eテスト**: ユーザーシナリオのテスト

## セットアップ

### テスト用データベース

```bash
# テスト用PostgreSQLコンテナの起動
docker run --name noraneko-test-db -e POSTGRES_DB=noraneko_test -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test -p 5433:5432 -d postgres:16-alpine
```

### 環境変数

`backend/.env.test` ファイルを作成：

```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=test
DB_PASSWORD=test
DB_NAME=noraneko_test
DB_SSLMODE=disable
JWT_SECRET=test-secret-key
SESSION_SECRET=test-session-secret
GIN_MODE=test
```

## バックエンドテスト

### 単体テスト実行

```bash
cd backend

# 全テスト実行
go test ./...

# 詳細出力
go test -v ./...

# カバレッジ付き
go test -cover ./...

# 特定パッケージのテスト
go test ./internal/handler
go test ./pkg/oauth2
```

### 統合テスト実行

```bash
cd backend

# テスト用データベースを使用
export $(cat .env.test | xargs)
go test -tags=integration ./...
```

### テストファイル例

#### ハンドラーテスト (`internal/handler/auth_test.go`)

```go
package handler

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/gin-gonic/gin"
    "github.com/stretchr/testify/assert"
)

func TestAuthHandler_Register(t *testing.T) {
    gin.SetMode(gin.TestMode)
    
    // テストケース
    tests := []struct {
        name           string
        requestBody    map[string]interface{}
        expectedStatus int
        expectedError  string
    }{
        {
            name: "正常なユーザー登録",
            requestBody: map[string]interface{}{
                "email":    "test@example.com",
                "password": "password123",
                "name":     "Test User",
            },
            expectedStatus: http.StatusCreated,
        },
        {
            name: "メールアドレス不正",
            requestBody: map[string]interface{}{
                "email":    "invalid-email",
                "password": "password123",
                "name":     "Test User",
            },
            expectedStatus: http.StatusBadRequest,
            expectedError:  "invalid email format",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // テスト実行
            // ...
        })
    }
}
```

#### OAuth2サービステスト (`pkg/oauth2/oauth2_test.go`)

```go
package oauth2

import (
    "testing"
    "time"

    "github.com/stretchr/testify/assert"
)

func TestOAuth2Service_GenerateAuthorizationCode(t *testing.T) {
    service := NewOAuth2Service()
    
    req := &AuthorizationRequest{
        ClientID:     "test-client",
        ResponseType: "code",
        RedirectURI:  "http://localhost:3000/callback",
        Scope:        "read write",
        State:        "random-state",
    }
    
    code, err := service.GenerateAuthorizationCode(req, "user-123")
    
    assert.NoError(t, err)
    assert.NotEmpty(t, code)
    assert.Len(t, code, 32) // 期待されるコード長
}
```

### API統合テスト例

```go
//go:build integration
// +build integration

package handler

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/gin-gonic/gin"
    "github.com/stretchr/testify/suite"
)

type AuthIntegrationTestSuite struct {
    suite.Suite
    router *gin.Engine
    db     *gorm.DB
}

func (suite *AuthIntegrationTestSuite) SetupSuite() {
    // データベース接続とテーブル作成
    // ルーターの初期化
}

func (suite *AuthIntegrationTestSuite) TearDownSuite() {
    // データベースクリーンアップ
}

func (suite *AuthIntegrationTestSuite) TestUserRegistrationFlow() {
    // ユーザー登録からログインまでの一連のフロー
}

func TestAuthIntegrationTestSuite(t *testing.T) {
    suite.Run(t, new(AuthIntegrationTestSuite))
}
```

## フロントエンドテスト

### セットアップ

```bash
cd web

# テスト用パッケージのインストール
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom
```

### 単体テスト実行

```bash
cd web

# 全テスト実行
npm test

# watch モード
npm test -- --watch

# カバレッジ
npm test -- --coverage
```

### テストファイル例

#### コンポーネントテスト (`src/components/LoginForm.test.tsx`)

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginForm from './LoginForm'

describe('LoginForm', () => {
  test('正常なログインフォームの表示', () => {
    render(<LoginForm />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  test('バリデーションエラーの表示', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const submitButton = screen.getByRole('button', { name: /login/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })
  })
})
```

## E2Eテスト

### Playwright セットアップ

```bash
cd web
npm install --save-dev @playwright/test
npx playwright install
```

### E2Eテスト例 (`tests/e2e/oauth-flow.spec.ts`)

```typescript
import { test, expect } from '@playwright/test'

test.describe('OAuth2 Flow', () => {
  test.beforeEach(async ({ page }) => {
    // テストデータのセットアップ
    await page.goto('http://localhost:3000')
  })

  test('完全なOAuth2認可コードフロー', async ({ page }) => {
    // 1. 認可エンドポイントへのリダイレクト
    await page.goto('http://localhost:8080/oauth2/authorize?client_id=test-client&response_type=code&redirect_uri=http://localhost:3000/callback&scope=read&state=test-state')
    
    // 2. ログインフォームが表示される
    await expect(page.locator('input[name="email"]')).toBeVisible()
    
    // 3. ログイン
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // 4. 認可画面が表示される
    await expect(page.locator('text=Authorize Application')).toBeVisible()
    
    // 5. 認可を許可
    await page.click('button:has-text("Allow")')
    
    // 6. リダイレクト先でcodeパラメータを確認
    await expect(page).toHaveURL(/.*code=.*/)
  })
})
```

## パフォーマンステスト

### 負荷テスト

```bash
# Apache Bench を使用した簡単な負荷テスト
ab -n 1000 -c 10 http://localhost:8080/health

# より詳細な負荷テスト（wrk）
wrk -t12 -c400 -d30s http://localhost:8080/health
```

### プロファイリング

```bash
cd backend

# CPUプロファイル
go test -cpuprofile=cpu.prof -bench=.

# メモリプロファイル  
go test -memprofile=mem.prof -bench=.

# プロファイル分析
go tool pprof cpu.prof
```

## テスト実行スクリプト

### 全テスト実行 (`scripts/test.sh`)

```bash
#!/bin/bash

echo "Running all tests..."

# バックエンドテスト
echo "Running backend tests..."
cd backend
go test -v ./...

# フロントエンドテスト
echo "Running frontend tests..."
cd ../web
npm test -- --run

# E2Eテスト
echo "Running E2E tests..."
npm run test:e2e

echo "All tests completed!"
```

## CI/CDでのテスト

### GitHub Actions例 (`.github/workflows/test.yml`)

```yaml
name: Test

on: [push, pull_request]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: noraneko_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-go@v4
      with:
        go-version: '1.21'
    
    - name: Run tests
      working-directory: ./backend
      run: |
        go test -v ./...
        go test -cover ./...
  
  frontend-test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      working-directory: ./web
      run: npm ci
    
    - name: Run tests
      working-directory: ./web
      run: npm test -- --coverage
```

## テスト戦略

### 1. 単体テスト（70%）
- 各関数・メソッドの単体テスト
- ビジネスロジックの検証
- エラーハンドリングの確認

### 2. 統合テスト（20%）
- API エンドポイントのテスト
- データベース操作のテスト
- 外部サービス連携のテスト

### 3. E2Eテスト（10%）
- ユーザーシナリオのテスト
- OAuth2フローの完全なテスト
- ブラウザでの動作確認

## トラブルシューティング

### よくある問題

1. **データベース接続エラー**: テスト用データベースが起動しているか確認
2. **ポート競合**: テスト実行時に開発サーバーを停止
3. **タイムアウト**: 非同期処理のテストでは適切な待機時間を設定
4. **テストデータ汚染**: 各テスト後のクリーンアップを確実に実行