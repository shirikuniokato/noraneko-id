# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

noraneko-id is a Japanese IDaaS (Identity as a Service) system designed for private service developers. The project implements OAuth2 (RFC 6749) compliant authentication services with emphasis on privacy and no third-party cookies.

## Architecture

The system follows a 3-tier architecture:
- **Frontend**: Next.js with TypeScript (SPA and admin panel)
- **Backend**: Go with Gin framework (API server)
- **Database**: PostgreSQL

## Project Status

This is a **greenfield project** currently in the planning/documentation phase. No actual implementation code exists yet - only comprehensive documentation in README.md describing the planned service.

## Development Setup (When Implementation Begins)

The project will require initialization of:
- Go module (`go mod init`)
- Next.js application setup
- Docker and docker-compose configuration
- PostgreSQL database schema
- Development tooling and build scripts

## Core Features (Planned)

- OAuth2 endpoints: `/authorize`, `/token`, `/userinfo`, `/revoke`
- User management (registration, login, password reset)
- Client application registration and management
- JWT and database token management
- Authorization scope management
- Admin panel with CRUD operations
- First-party cookie/client token handling

## Language and Documentation

All documentation and likely code comments will be in Japanese, as this targets Japanese developers and services.