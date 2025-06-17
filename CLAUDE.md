# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Backend (Go)
```bash
# Development server
cd backend && make run

# Build application
cd backend && make build

# Run tests
cd backend && make test

# Run tests with coverage
cd backend && go test -cover ./...

# Database management
cd backend && make db-up     # Start PostgreSQL container
cd backend && make db-down   # Stop PostgreSQL container
cd backend && make db-reset  # Reset database with fresh data

# Seed test data
cd backend && make seed

# Lint (requires golangci-lint)
cd backend && make lint

# Format code
cd backend && make fmt

# Hot reload development (requires air)
cd backend && make dev
```

### Frontend (Next.js)
```bash
# Development server (web app)
cd web && npm run dev

# Development server (demo app)
cd examples/nextjs-demo && npm run dev

# Build for production
cd web && npm run build
cd web && npm run build:prod

# Type checking
cd web && npm run type-check

# Linting
cd web && npm run lint

# Start production server
cd web && npm run start:prod
```

### SDK Development
```bash
# Next.js SDK package
cd packages/nextjs && npm run build
cd packages/nextjs && npm run dev        # Watch mode
cd packages/nextjs && npm run validate   # Type-check + lint + test
```

### Full Stack Development
```bash
# Quick setup (all services)
./setup.sh

# Development mode (all services)
./scripts/dev.sh

# Run all tests
./scripts/test.sh (if exists)
```

## Architecture Overview

noraneko-id is a comprehensive OAuth2 IDaaS (Identity as a Service) solution designed for individual developers and small-scale services. The system implements RFC 6749 compliant OAuth2 with multi-tenant architecture.

### Core Components

**Backend (Go + Gin)**
- Located in `backend/`
- OAuth2 server with full RFC 6749 compliance
- Multi-tenant user management with client-scoped isolation
- JWT token handling with RS256 signatures
- PostgreSQL database with GORM ORM
- Swagger/OpenAPI documentation

**Frontend (Next.js)**
- Management dashboard in `web/`
- Next.js 15 with App Router
- TypeScript and Tailwind CSS
- Authentication UI components

**SDK Packages**
- `packages/nextjs/` - Next.js App Router integration
- React components and hooks for OAuth2 flows
- Server and client utilities for authentication

### Multi-Tenant Design

The system uses a **client-scoped isolation** model:
- Each OAuth2 client has isolated user base
- Users belong to specific clients (not shared across clients)
- Database schema enforces tenant boundaries via foreign keys
- All queries are scoped by `client_id`

### API Structure

```
Authentication:
- POST /auth/register   - User registration (client-scoped)
- POST /auth/login      - User login
- POST /auth/logout     - User logout
- GET  /auth/profile    - User profile

OAuth2 (RFC 6749):
- GET  /oauth2/authorize - Authorization endpoint
- POST /oauth2/token     - Token endpoint  
- GET  /oauth2/userinfo  - User info endpoint
- POST /oauth2/revoke    - Token revocation

Admin (Client Management):
- GET|POST|PUT|DELETE /admin/clients - OAuth2 client CRUD
```

### Database Schema

Key tables:
- `o_auth_clients` - OAuth2 client definitions
- `users` - Multi-tenant users (scoped by client_id)
- `user_auth_providers` - External OAuth provider links
- `user_sessions` - Session management 
- `o_auth_access_tokens` - OAuth2 tokens

### Development Environment

The system uses Docker Compose for local development:
- PostgreSQL database container
- Backend runs on `:8080`
- Frontend runs on `:3000`
- Demo app runs on `:3001`

### Test Data

After running `make seed`, test accounts available:
- admin@example.com / password123 (System Admin)
- user1@example.com / password123 (Limited Admin)
- user2@example.com / password123 (Regular User)

Test OAuth2 clients:
- dev-client-001 (Confidential client)
- test-spa-client (Public SPA client)

## Key Implementation Details

### Security Features
- bcrypt password hashing (cost=12)
- JWT tokens with RS256 signatures
- PKCE support for OAuth2
- Secure session management with SameSite cookies
- CSRF protection
- Input validation and SQL injection prevention

### OAuth2 Flow Implementation
The system supports Authorization Code flow with PKCE:
1. Client redirects to `/oauth2/authorize`
2. User authenticates and consents
3. Authorization code returned to client
4. Client exchanges code for access token at `/oauth2/token`
5. Client uses token to access `/oauth2/userinfo`

### Development Patterns
- Go follows clean architecture with layered design
- Handler -> Service -> Repository pattern
- GORM for database operations
- Gin for HTTP routing
- Structured logging throughout
- Comprehensive error handling with proper HTTP status codes

### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- Test database isolation
- Mock external dependencies
- Use `go test -tags=integration` for integration tests

## Important Notes

- The system enforces strict client isolation - users cannot cross client boundaries
- Always scope database queries by client_id for multi-tenancy
- JWT secrets and client secrets are hashed before database storage
- Session tokens are regenerated on login to prevent session fixation
- The system is designed to be stateless for horizontal scaling
- All OAuth2 flows follow RFC 6749 specifications strictly