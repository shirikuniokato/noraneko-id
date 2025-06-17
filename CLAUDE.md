# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Noraneko ID is an OAuth2-compliant Identity-as-a-Service (IDaaS) platform for individual developers and small-scale services. It provides authentication and authorization infrastructure based on OAuth2 (RFC 6749) with multi-tenant support.

**Tech Stack:**
- Backend: Go (Gin framework) + PostgreSQL + GORM
- Frontend: Next.js 15 + TypeScript + Tailwind CSS
- SDK: Custom Next.js SDK package (`@noranekoid/nextjs`) with OAuth2/OIDC integration
- Infrastructure: Docker + Docker Compose

## Development Commands

### Backend (Go)
```bash
cd backend

# Development
make run                    # Start development server
make dev                    # Start with hot-reload (requires air)
make build                  # Build binary to bin/noraneko-id
make test                   # Run all tests
make lint                   # Run golangci-lint
make fmt                    # Format code

# Database
make db-up                  # Start PostgreSQL container
make db-down                # Stop PostgreSQL container
make db-reset               # Reset database with fresh data
make seed                   # Seed test data

# Dependencies
make deps                   # Download and tidy modules
```

### Frontend (Next.js)
```bash
cd web

# Development
npm run dev                 # Start development server (:3000)
npm run build               # Production build
npm run start               # Start production server
npm run lint                # ESLint check
npm run type-check          # TypeScript check
```

### JavaScript SDK (packages/nextjs)
```bash
cd packages/nextjs

# Development
npm run dev                 # Build with watch mode
npm run build               # Build SDK package
npm run build:clean         # Clean build (remove dist first)
npm run type-check          # TypeScript check
npm run lint                # ESLint check
npm run test                # Run Jest tests
npm run validate            # Run all checks (type-check + lint + test)
```

### Full Stack Development
```bash
# Recommended: Use the development script
./scripts/dev.sh            # Start all services (PostgreSQL + Backend + Frontend)
./scripts/build.sh          # Build both backend and frontend
```

## Architecture Overview

### Multi-tenant OAuth2 Architecture
The system implements a multi-tenant design where:
- Each OAuth2 client has isolated user bases
- Users are scoped to specific clients (client_id)
- Complete data separation between tenants
- OAuth2 flows are client-aware

### Key Components

**Backend Structure (`backend/`):**
```
cmd/
├── server/          # Main API server
└── seed/           # Database seeding tool

internal/
├── config/         # Configuration management
├── handler/        # HTTP handlers (auth, oauth2, admin)
├── middleware/     # Authentication middleware
├── model/          # GORM data models
└── seed/          # Database seeders

pkg/
├── database/       # Database connection logic
├── jwt/           # JWT token management
└── oauth2/        # Core OAuth2 business logic
```

**Frontend Structure (`web/src/`):**
```
app/
├── api/auth/      # Next.js API routes
├── dashboard/     # Admin dashboard pages
├── login/         # Login page
└── layout.tsx     # Root layout

lib/               # Utility functions
types/             # TypeScript type definitions
middleware.ts      # Next.js middleware
```

**JavaScript SDK Structure (`packages/nextjs/src/`):**
```
api/               # API route handlers for OAuth2 flows
├── handlers/      # Individual route handlers (login, callback, logout, token)
├── handlers.ts    # Unified handlers (NextAuth-style)
└── create-handlers.ts # Custom handler factory

client/            # Client-side React hooks and providers
├── hooks.ts       # useAuth, useSession, useAuthCallback
├── providers.tsx  # SessionProvider for context
└── useAuthCallback.ts # OAuth2 callback processing

server/            # Server-side authentication utilities
├── auth.ts        # Core auth functions (auth, requireAuth, saveSession)
├── config.ts      # Configuration management
└── discovery.ts   # OIDC Discovery support

middleware/        # Next.js middleware for route protection
config/            # Next.js configuration helpers (withNoranekoAuth)
shared/            # Common types, errors, and utilities
```

### Database Schema (Multi-tenant)
- `o_auth_clients` - OAuth2 client applications
- `users` - Users scoped by client_id
- `user_auth_providers` - Social login providers per user
- `o_auth_access_tokens` - Active access tokens
- `user_sessions` - Session management

## OAuth2 Endpoints

**Core OAuth2 (RFC 6749 compliant):**
- `GET /oauth2/authorize` - Authorization endpoint
- `POST /oauth2/token` - Token endpoint
- `GET /oauth2/userinfo` - User info endpoint
- `POST /oauth2/revoke` - Token revocation

**Authentication:**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/profile` - User profile

**Admin API:**
- `POST /admin/clients` - Create OAuth2 client
- `GET /admin/clients` - List clients
- `GET /admin/clients/{id}` - Get client details
- `PUT /admin/clients/{id}` - Update client
- `DELETE /admin/clients/{id}` - Delete client

## JavaScript SDK (@noranekoid/nextjs)

### Key Features
- **Next.js App Router** complete support (Server Components + Client Components)
- **RFC 6749 OAuth2** compliant implementation
- **Auto-discovery** via `.well-known/openid-configuration`
- **Build-time discovery** for zero-runtime configuration
- **Automatic token refresh** with configurable thresholds
- **TypeScript** full type definitions
- **NextAuth-style API** for familiar developer experience

### SDK Installation & Setup

```bash
npm install @noranekoid/nextjs
```

**1. Next.js Configuration (1-line setup):**
```javascript
// next.config.js
const { withNoranekoAuth } = require('@noranekoid/nextjs/config')
module.exports = withNoranekoAuth({})
```

**2. Environment Variables:**
```env
# Required for .well-known discovery
NORANEKO_AUTH_ISSUER=https://noraneko-id.com
NORANEKO_AUTH_CLIENT_ID=your-client-id
NORANEKO_AUTH_CLIENT_SECRET=your-client-secret

# Optional (defaults provided)
NORANEKO_AUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback
NORANEKO_AUTH_SCOPES=openid,profile,email
```

**3. Authentication Initialization:**
```typescript
// app/auth.ts
import { createAuth } from '@noranekoid/nextjs/server'

createAuth({
  issuer: process.env.NORANEKO_AUTH_ISSUER!,
  clientId: process.env.NORANEKO_AUTH_CLIENT_ID!,
  clientSecret: process.env.NORANEKO_AUTH_CLIENT_SECRET!,
  autoRefresh: {
    enabled: true,
    refreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
  },
})

export { auth } from '@noranekoid/nextjs/server'
```

**4. API Routes:**
```typescript
// app/api/auth/[...noraneko]/route.ts
import { handlers } from '@noranekoid/nextjs/api'
export const { GET, POST } = handlers
```

### SDK Usage Examples

**Server Components:**
```typescript
import { auth } from '@/app/auth'

export default async function Page() {
  const session = await auth()
  if (!session) return <div>Please login</div>
  return <div>Welcome, {session.user.name}!</div>
}
```

**Client Components:**
```typescript
'use client'
import { useAuth } from '@noranekoid/nextjs/client'

export default function UserProfile() {
  const { data: session, status } = useAuth()
  if (status === 'loading') return <div>Loading...</div>
  if (status === 'unauthenticated') return <div>Not logged in</div>
  return <div>Hello {session?.user.name}!</div>
}
```

**Route Protection Middleware:**
```typescript
// middleware.ts
import { createAuthMiddleware } from '@noranekoid/nextjs/middleware'

export default createAuthMiddleware({
  protectedPaths: ['/dashboard', '/profile'],
  publicOnlyPaths: ['/login'],
  loginUrl: '/api/auth/login',
})
```

### SDK Export Structure
```
@noranekoid/nextjs           # Types and errors only
@noranekoid/nextjs/server    # Server-side auth functions
@noranekoid/nextjs/client    # Client-side hooks and providers
@noranekoid/nextjs/api       # API route handlers
@noranekoid/nextjs/middleware # Route protection middleware
@noranekoid/nextjs/config    # Next.js configuration helpers
```

## Testing Strategy

**Test Execution:**
```bash
# Backend tests
cd backend
go test ./...                    # All tests
go test -v ./...                 # Verbose output
go test -cover ./...             # With coverage
go test -tags=integration ./...  # Integration tests only

# Frontend tests
cd web
npm test                         # Run Jest tests
npm run test:e2e                 # E2E tests (when implemented)
```

**Test Structure:**
- **Unit Tests**: Handler validation, OAuth2 service logic, JWT operations
- **Integration Tests**: Full OAuth2 flows with database
- **E2E Tests**: Complete user scenarios (planned)

**Test Coverage:** 44 tests total (32 unit + 12 integration), 100% pass rate

## Development Environment Setup

1. **Prerequisites**: Go 1.21+, Node.js 18+, Docker & Docker Compose

2. **Quick Setup**:
   ```bash
   ./setup.sh  # Automated setup script
   ```

3. **Manual Setup**:
   ```bash
   # Backend dependencies
   cd backend && go mod download
   
   # Frontend dependencies  
   cd web && npm install
   
   # Environment variables
   cp backend/.env.example backend/.env
   # Edit .env with your settings
   
   # Start database
   docker-compose up -d postgres
   
   # Seed test data
   cd backend && make seed
   ```

## Important Development Notes

### Multi-tenant Considerations
- All user operations must include `client_id` context
- Database queries should always filter by client scope
- OAuth2 flows validate client ownership of users
- Sessions are client-aware

### Security Implementation
- Passwords: bcrypt hashing (cost=12)
- JWT: RS256 signing with rotating secrets
- Sessions: Secure cookies with CSRF protection
- PKCE: Required for public OAuth2 clients

### Code Conventions
- Go: Standard Go formatting with golangci-lint
- TypeScript: Strict mode enabled with extensive type checking
- Database: GORM ORM with UUID primary keys
- API: RESTful design with OpenAPI documentation

## VibeCoding開発ガイド

### 開発哲学
VibeCodingは、noraneko-idプロジェクトの開発スタイルと品質基準を定義したガイドラインです。

**核心原則:**
1. **シンプルさを重視** - 複雑な抽象化より理解しやすいコード
2. **開発者体験最優先** - 自己文書化されたコードと一貫性
3. **継続的改善** - 小さく頻繁なリリースとリファクタリング
4. **実用性重視** - RFC準拠と使いやすさのバランス

### コード規約

#### Go言語
```bash
# 必須ツール
go fmt ./...                # 標準フォーマット
go vet ./...               # 静的解析
golangci-lint run          # 包括的リント
```

**命名規則:**
- ファイル: `snake_case.go` (例: `auth_test.go`)
- 関数/メソッド: `PascalCase` (public), `camelCase` (private)
- 定数: `SCREAMING_SNAKE_CASE`
- パッケージ: 小文字単語 (例: `oauth2`, `handler`)

**構造体とバリデーション:**
```go
type LoginRequest struct {
    Email    string `json:"email" binding:"required,email" example:"user@example.com"`
    Password string `json:"password" binding:"required,min=8" example:"password123"`
    ClientID string `json:"client_id" binding:"required" example:"dev-client-001"`
}
```

#### TypeScript/JavaScript
```bash
# 必須コマンド
npm run type-check         # TypeScript型チェック
npm run lint              # ESLint実行
```

**設定基準:**
- 厳格モード有効: `strict: true`
- 未使用変数検出: `noUnusedLocals: true`
- インデックスアクセス安全性: `noUncheckedIndexedAccess: true`

**命名規則:**
- ファイル: `kebab-case.tsx` (例: `login-form.tsx`)
- コンポーネント: `PascalCase` (例: `LoginForm`)
- 関数/変数: `camelCase`
- 型定義: `PascalCase` (例: `AuthConfig`)

**インポートパス:**
```typescript
// パス別名を活用
import { auth } from '@/app/auth'
import { LoginForm } from '@/components/login-form'
```

### コミット規約 (Conventional Commits)

**基本形式:**
```
<type>(<scope>): <description>

[optional body]

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**タイプ分類:**
- `feat:` 新機能追加
- `fix:` バグ修正
- `docs:` ドキュメント更新
- `refactor:` リファクタリング
- `test:` テスト追加/修正
- `chore:` ビルド/設定変更

**例:**
```
feat(oauth2): add PKCE support for authorization code flow

- Implement code_challenge and code_verifier generation
- Add PKCE validation in token endpoint
- Update client registration to support PKCE

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### テスト戦略

#### Go テストパターン
```go
func TestAuthHandler_Login(t *testing.T) {
    tests := []struct {
        name           string
        requestBody    LoginRequest
        expectedStatus int
        expectedError  string
    }{
        {
            name: "正常なログイン",
            requestBody: LoginRequest{
                Email:    "user@example.com",
                Password: "password123",
                ClientID: "test-client",
            },
            expectedStatus: http.StatusOK,
        },
        {
            name: "無効なメールアドレス",
            requestBody: LoginRequest{
                Email:    "invalid-email",
                Password: "password123",
                ClientID: "test-client",
            },
            expectedStatus: http.StatusBadRequest,
            expectedError:  "invalid email format",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // テスト実装
        })
    }
}
```

#### TypeScript テストパターン
```typescript
describe('LoginForm', () => {
  test('正常なフォーム送信', async () => {
    render(<LoginForm />)
    
    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /login/i }))
    
    expect(mockLogin).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123'
    })
  })
})
```

### プロジェクト固有パターン

#### マルチテナント設計
```go
// 全てのクエリにclient_idスコープを含める
func (r *UserRepository) FindByEmail(clientID, email string) (*User, error) {
    var user User
    err := r.db.Where("client_id = ? AND email = ?", clientID, email).First(&user).Error
    return &user, err
}
```

#### OAuth2/OIDC準拠
```go
// RFC 6749に準拠したエラーレスポンス
type OAuth2Error struct {
    Error            string `json:"error"`
    ErrorDescription string `json:"error_description,omitempty"`
    ErrorURI         string `json:"error_uri,omitempty"`
}
```

#### ビルド時設定（SDK）
```typescript
// .well-known discovery を活用
const discovery = JSON.parse(process.env.NORANEKO_DISCOVERY_CONFIG!)
createAuth({
  issuer: discovery.issuer,
  authorizationEndpoint: discovery.authorization_endpoint,
  tokenEndpoint: discovery.token_endpoint,
})
```

### エラーハンドリング

#### Goエラーパターン
```go
// エラーラップで文脈を保持
if err := userService.CreateUser(req); err != nil {
    return fmt.Errorf("ユーザー作成に失敗しました: %w", err)
}

// HTTPエラーレスポンス
func handleError(c *gin.Context, err error, message string) {
    log.Printf("エラー: %v", err)
    c.JSON(http.StatusInternalServerError, gin.H{
        "error":   "internal_server_error",
        "message": message,
    })
}
```

#### TypeScript エラーパターン
```typescript
// カスタムエラークラス
class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

// エラーバウンダリでの処理
export function ErrorBoundary({ error }: { error: Error }) {
  if (error instanceof AuthError) {
    return <div>認証エラー: {error.message}</div>
  }
  return <div>予期しないエラーが発生しました</div>
}
```

### ログ出力規約

#### 開発環境
```go
log.Printf("🔍 OAuth2認可リクエスト: client_id=%s, scope=%s", clientID, scope)
log.Printf("✅ ユーザーログイン成功: user_id=%s", userID)
log.Printf("❌ データベース接続エラー: %v", err)
```

#### 本番環境
```go
// 構造化ログ（将来的にJSON形式に移行予定）
log.Printf("level=info event=user_login user_id=%s client_id=%s", userID, clientID)
log.Printf("level=error event=db_connection_failed error=%q", err.Error())
```

### 開発ワークフロー

#### 1. 機能開発
```bash
# 1. 機能ブランチ作成
git checkout -b feat/new-oauth-scope

# 2. 開発・テスト
make test && npm run validate

# 3. コミット
git add .
git commit -m "feat(oauth2): add custom scope management"

# 4. プッシュ・PR作成
git push origin feat/new-oauth-scope
```

#### 2. 品質チェック
```bash
# バックエンド
cd backend
make lint && make test

# フロントエンド
cd web
npm run type-check && npm run lint && npm test

# SDK
cd packages/nextjs
npm run validate
```

### 自動コミット戦略

VibeCodingでは、開発効率を向上させるため、機能単位での自動コミットを推奨しています。

#### コミットタイミング
1. **機能完成時**: 1つの機能が完全に動作する状態
2. **テスト追加時**: 新しいテストが追加され、パスしている状態  
3. **リファクタリング完了時**: コード改善が完了し、既存機能に影響がない状態
4. **バグ修正時**: 特定のバグが完全に修正された状態
5. **ドキュメント更新時**: 重要な文書変更が完了した状態

#### 自動コミットの判断基準
```bash
# 以下の条件を全て満たす場合、自動コミットを実行
1. コンパイルエラーがない
2. 全てのテストがパスしている  
3. リントエラーがない
4. 型チェックエラーがない
5. 明確な機能単位の変更が完了している
```

#### コミット実行コマンド例
```bash
# バックエンド機能完了時
cd backend && make lint && make test && git add . && git commit -m "feat(auth): implement user registration with email validation

- Add user registration endpoint with email/password validation
- Implement bcrypt password hashing
- Add duplicate email check with proper error handling
- Include comprehensive test coverage for edge cases

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# フロントエンド機能完了時  
cd web && npm run type-check && npm run lint && npm test && git add . && git commit -m "feat(ui): add responsive login form component

- Create LoginForm component with form validation
- Implement proper error state handling and display
- Add loading states and accessibility features
- Include comprehensive unit tests with user interactions

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# SDK機能完了時
cd packages/nextjs && npm run validate && git add . && git commit -m "feat(sdk): add automatic token refresh capability

- Implement background token refresh with configurable threshold
- Add retry logic with exponential backoff
- Include proper error handling and fallback mechanisms
- Add comprehensive tests for various refresh scenarios

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

#### 自動コミットメッセージの構造
```
<type>(<scope>): <clear summary in Japanese/English>

<detailed description in bullet points>
- 実装した具体的な機能や変更
- 重要な技術的判断や制約
- テストカバレッジや品質保証の内容

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

#### 自動コミットのベストプラクティス
1. **原子性**: 1つのコミットは1つの論理的な変更のみ
2. **自己完結性**: そのコミット単体で動作する状態を保つ
3. **可逆性**: 必要に応じて安全にrevertできる粒度
4. **追跡可能性**: 変更理由と影響範囲が明確
5. **品質保証**: 全ての品質チェックをパスしてからコミット

#### 自動コミットしない場合
- 作業が途中で不完全な状態
- テストが失敗している
- 複数の機能が混在している  
- 実験的なコードや一時的な変更
- 設定ファイルのみの軽微な変更

このVibeCodingガイドに従うことで、コードの一貫性と品質を保ちながら、効率的な開発が可能になります。

### Error Handling
OAuth2 errors follow RFC 6749 format:
```json
{
  "error": "invalid_request",
  "message": "Human-readable message",
  "details": "Additional context"
}
```

## Useful Development URLs
- Backend API: http://localhost:8080
- Frontend: http://localhost:3000  
- Swagger UI: http://localhost:8080/swagger/index.html
- Health Check: http://localhost:8080/health

## Test Accounts (Development)
| Email | Password | Role |
|-------|----------|------|
| admin@example.com | password123 | System Admin |
| user1@example.com | password123 | Limited Admin |
| user2@example.com | password123 | Regular User |

## Test OAuth2 Clients
| Client ID | Secret | Type |
|-----------|--------|------|
| dev-client-001 | dev-secret-please-change-in-production | Confidential |
| test-spa-client | (none) | Public (SPA) |

## Common Issues

### Backend Issues
1. **Database Connection**: Ensure PostgreSQL container is running via `docker-compose up -d postgres`
2. **Port Conflicts**: Check ports 3000, 5432, 8080 availability  
3. **CORS Errors**: Verify backend CORS settings include http://localhost:3000
4. **Test Failures**: Confirm test database is accessible and seeded properly

### JavaScript SDK Issues
1. **"NORANEKO_DISCOVERY_CONFIG not found"**: Build-time discovery not executed
   - Add `withNoranekoAuth()` to `next.config.js`
   - Set `NORANEKO_AUTH_ISSUER` environment variable
   - Run `npm run build` to execute discovery

2. **Cookie not set**: Check `cookieSecure` setting
   - Development: Set `cookieSecure: false`
   - Production: Ensure HTTPS is enabled

3. **Token auto-refresh not working**: Enable in configuration
   ```typescript
   createAuth({
     autoRefresh: { enabled: true, refreshThreshold: 5 * 60 * 1000 }
   })
   ```

4. **Build-time discovery failure**: Verify OIDC provider accessibility
   - Check `NORANEKO_AUTH_ISSUER` URL
   - Ensure `/.well-known/openid-configuration` endpoint exists
   - Verify network connectivity from build environment