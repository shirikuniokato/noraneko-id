# 開発ワークフロー

noraneko-idプロジェクトの開発ワークフローとベストプラクティスを説明します。

## ブランチ戦略

### Git Flow ベース

```
main (本番)
  ↑
develop (開発統合)
  ↑
feature/* (機能開発)
hotfix/* (緊急修正)
release/* (リリース準備)
```

### ブランチ命名規則

- `feature/[issue-number]-brief-description`
  - 例: `feature/123-oauth2-pkce-support`
- `hotfix/[issue-number]-brief-description`
  - 例: `hotfix/456-session-validation-fix`
- `release/v[version]`
  - 例: `release/v1.2.0`

## 開発フロー

### 1. 機能開発の開始

```bash
# 最新のdevelopブランチを取得
git checkout develop
git pull origin develop

# 新しい機能ブランチを作成
git checkout -b feature/123-new-feature

# 開発環境の起動
./scripts/dev.sh
```

### 2. 開発中

#### コミットメッセージの規則

[Conventional Commits](https://www.conventionalcommits.org/) に従う：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**例:**
```bash
git commit -m "feat(oauth2): add PKCE support for authorization code flow"
git commit -m "fix(auth): resolve session validation issue"
git commit -m "docs: update API documentation for new endpoints"
git commit -m "test: add integration tests for OAuth2 flow"
```

**Type一覧:**
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント変更
- `style`: コードフォーマット（機能に影響しない）
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルド・設定等の変更

#### 定期的なテスト実行

```bash
# バックエンドテスト
cd backend && go test ./...

# フロントエンドテスト
cd web && npm test

# 全テスト実行
./scripts/test.sh
```

#### コード品質チェック

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

### 3. プルリクエスト作成

#### 事前チェック

```bash
# 最新のdevelopブランチをマージ
git checkout develop
git pull origin develop
git checkout feature/123-new-feature
git merge develop

# テストが通ることを確認
./scripts/test.sh

# ビルドが成功することを確認
./scripts/build.sh
```

#### PRテンプレート

```markdown
## 概要
この変更の概要を簡潔に説明してください。

## 変更内容
- [ ] 新機能の追加
- [ ] バグ修正
- [ ] リファクタリング
- [ ] ドキュメント更新
- [ ] テスト追加

## 詳細
### 実装した機能
- 機能1の説明
- 機能2の説明

### 修正したバグ
- バグ1の説明
- バグ2の説明

## テスト
- [ ] 単体テストを追加・更新
- [ ] 統合テストを追加・更新
- [ ] E2Eテストを追加・更新
- [ ] 手動テストを実施

## チェックリスト
- [ ] コードが自己文書化されている
- [ ] 適切なエラーハンドリングを実装
- [ ] セキュリティの考慮事項を確認
- [ ] パフォーマンスの影響を確認
- [ ] ドキュメントを更新

## 関連Issue
Closes #123

## スクリーンショット
（UIに関する変更がある場合）

## 補足事項
追加で説明が必要な事項があれば記載
```

### 4. コードレビュー

#### レビュー観点

**機能性**
- 要件を満たしているか
- エッジケースを考慮しているか
- エラーハンドリングが適切か

**セキュリティ**
- 認証・認可が適切に実装されているか
- SQLインジェクション等の脆弱性がないか
- 機密情報の漏洩がないか

**パフォーマンス**
- N+1クエリ問題がないか
- 不要な処理がないか
- メモリリークの可能性がないか

**保守性**
- コードが読みやすいか
- 適切な命名がされているか
- 重複コードがないか

**テスト**
- 適切なテストケースが追加されているか
- テストカバレッジが十分か

### 5. マージとデプロイ

```bash
# developブランチにマージ後
git checkout develop
git pull origin develop

# 統合テストの実行
./scripts/test.sh

# ステージング環境へのデプロイ（自動化されている想定）
# CI/CDパイプラインが実行される
```

## リリースフロー

### 1. リリース準備

```bash
# developから新しいリリースブランチを作成
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# バージョン情報の更新
# - backend/cmd/server/main.go
# - web/package.json
# - CHANGELOG.md
```

### 2. リリースブランチでの作業

- 最終テストの実行
- ドキュメントの更新
- リリースノートの作成
- バグ修正（新機能は追加しない）

### 3. リリース完了

```bash
# mainブランチにマージ
git checkout main
git merge release/v1.2.0

# タグの作成
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin v1.2.0

# developブランチにもマージ
git checkout develop
git merge release/v1.2.0

# リリースブランチの削除
git branch -d release/v1.2.0
```

## 緊急修正フロー

### 1. ホットフィックス開始

```bash
# mainブランチから緊急修正ブランチを作成
git checkout main
git pull origin main
git checkout -b hotfix/456-critical-security-fix
```

### 2. 修正とテスト

```bash
# 修正を実装
# テストを追加・実行
./scripts/test.sh

# 緊急リリース用バージョン更新
# 例: v1.2.0 → v1.2.1
```

### 3. 緊急リリース

```bash
# mainブランチにマージ
git checkout main
git merge hotfix/456-critical-security-fix
git tag -a v1.2.1 -m "Hotfix version 1.2.1"

# developブランチにもマージ
git checkout develop
git merge hotfix/456-critical-security-fix

# 緊急デプロイの実行
```

## CI/CDパイプライン

### GitHub Actions ワークフロー

#### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Go
      uses: actions/setup-go@v4
      with:
        go-version: '1.21'
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Run tests
      run: ./scripts/test.sh
    
    - name: Build
      run: ./scripts/build.sh

  security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Run security scan
      run: |
        # セキュリティスキャンの実行
        # 例: gosec, npm audit, etc.
```

#### `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      run: |
        # 本番環境へのデプロイ処理
        # 例: Docker image build & push
        # 例: Kubernetes deployment update
```

## ローカル開発のベストプラクティス

### 1. 環境の統一

```bash
# .envファイルを適切に設定
cp backend/.env.example backend/.env
# 必要な値を設定

# Dockerを使用したデータベース
docker-compose up -d postgres
```

### 2. 定期的な依存関係更新

```bash
# Go
cd backend
go mod tidy
go get -u all

# Node.js
cd web
npm update
npm audit fix
```

### 3. データベースマイグレーション

```bash
# 現在はGORMのAutoMigrateを使用
# 本番環境では適切なマイグレーション戦略を検討

# 開発時のデータベースリセット
docker-compose down
docker volume rm noraneko-id_postgres_data
docker-compose up -d postgres
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. マージコンフリクト

```bash
# developブランチを最新に更新
git checkout develop
git pull origin develop

# 機能ブランチに戻ってマージ
git checkout feature/123-new-feature
git merge develop

# コンフリクトを解決
# エディタでコンフリクト箇所を編集
git add .
git commit -m "resolve merge conflicts"
```

#### 2. テスト失敗

```bash
# 詳細なテスト結果を確認
cd backend && go test -v ./...
cd web && npm test -- --verbose

# 特定のテストのみ実行
go test -run TestSpecificFunction ./...
npm test -- --testNamePattern="specific test"
```

#### 3. ビルド失敗

```bash
# 依存関係を再インストール
cd backend && go mod download
cd web && rm -rf node_modules && npm install

# キャッシュをクリア
go clean -cache
npm cache clean --force
```

## 品質管理

### コードカバレッジ目標

- **バックエンド**: 80%以上
- **フロントエンド**: 70%以上

### パフォーマンス指標

- **API レスポンス時間**: 95%が100ms以内
- **ページロード時間**: 2秒以内
- **データベースクエリ**: N+1問題の排除

### セキュリティチェック

- 定期的な脆弱性スキャン
- 依存関係の脆弱性チェック
- コードレビューでのセキュリティ観点確認