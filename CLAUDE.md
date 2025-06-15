# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

noraneko-id is a Japanese IDaaS (Identity as a Service) system designed for private service developers. The project implements OAuth2 (RFC 6749) compliant authentication services with emphasis on privacy and no third-party cookies.

## Architecture

The system follows a 3-tier architecture:
- **Frontend**: Next.js with TypeScript (SPA and admin panel) - *Not yet implemented*
- **Backend**: Go with Gin framework (API server) - **Implemented**
- **Database**: PostgreSQL - **Implemented**

## Development Commands

### Database
- Start PostgreSQL: `docker-compose up -d`
- Stop PostgreSQL: `docker-compose down`

### Backend
- Build server: `go build -o bin/noraneko-id cmd/server/main.go`
- Run server: `./bin/noraneko-id` or `go run cmd/server/main.go`
- Install dependencies: `go mod tidy`

### Environment Setup
- Copy environment template: `cp .env.example .env`
- Edit `.env` file for local configuration

## Project Status

**Current Implementation Status:**
- ✅ Go backend foundation with database integration
- ✅ Complete OAuth2 database schema
- ✅ OAuth2 endpoints: `/oauth2/authorize`, `/oauth2/token`, `/oauth2/userinfo`, `/oauth2/revoke`
- ✅ User authentication: `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/profile`
- ✅ Admin client management: `/admin/clients/*`
- ✅ JWT token generation and validation
- ✅ Session-based authentication with cookies
- ✅ Security middleware (CORS, headers)
- ❌ Frontend implementation (Next.js)
- ❌ Production deployment configuration

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/profile` - Get user profile (requires auth)

### OAuth2
- `GET /oauth2/authorize` - OAuth2 authorization endpoint
- `POST /oauth2/token` - OAuth2 token endpoint
- `GET /oauth2/userinfo` - OAuth2 user info endpoint
- `POST /oauth2/revoke` - OAuth2 token revocation

### Admin (requires admin role)
- `POST /admin/clients` - Create OAuth2 client
- `GET /admin/clients` - List OAuth2 clients
- `GET /admin/clients/:id` - Get OAuth2 client details
- `PUT /admin/clients/:id` - Update OAuth2 client
- `DELETE /admin/clients/:id` - Delete OAuth2 client
- `POST /admin/clients/:id/regenerate-secret` - Regenerate client secret

## Core Features (Implemented)

- Complete OAuth2 (RFC 6749) implementation with PKCE support
- User registration and authentication with bcrypt password hashing
- Session management with secure cookies
- JWT access token generation and validation
- OAuth2 client management with admin controls
- PostgreSQL database with comprehensive schema
- Security middleware and CORS support
- Environment-based configuration management

## Language and Documentation

All documentation and code comments are in Japanese, as this targets Japanese developers and services.

## TODO List (2025-01-15更新)

### 高優先度
- [ ] IDaaS UI改善 - 認証画面のUX向上とレスポンシブ対応

### 中優先度
- [ ] レート制限ミドルウェアの実装 - 認証・OAuth2・管理者エンドポイント別の制限設定
- [ ] クライアントアプリ用の雛形作成 - OAuth2クライアント実装のサンプルテンプレート
- [ ] Javascript-SDKのリポジトリ分割 - SDKを独立したリポジトリとして管理
- [ ] SNS連携の導入 - Google、GitHub、LINE等のソーシャルログイン実装

### 低優先度
- [ ] ログ出力の改善 - 構造化ログ、セキュリティイベントログ、デバッグ情報の追加
- [ ] テストスイートの拡張 - マルチテナント機能、SNS連携基盤、新APIエンドポイントのテスト追加
- [ ] URL検証ロジックの強化 - リダイレクトURIの厳密な検証（スキーム、ホスト、パス検証）
- [ ] エラーハンドリングの標準化 - 統一されたエラーレスポンス形式とエラーコード体系化
- [ ] フロントエンド実装 - Next.js管理画面とデモアプリの実装
- [ ] 本番環境対応 - Docker化、CI/CD、監視、バックアップ設定
- [ ] 管理アプリに開発用ドキュメントを公開 - API仕様書、実装ガイドの統合