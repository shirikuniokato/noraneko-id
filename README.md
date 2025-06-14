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

## 主要機能（予定・実装中）

- ユーザ登録／ログイン／パスワードリセット
- OAuth2エンドポイント（/authorize, /token, /userinfo, /revoke）
- JWT/DB管理によるトークン発行・検証
- クライアント（アプリ）登録・管理
- 認可スコープ管理
- 管理画面（ユーザ・アプリ・認可一覧、CRUD）
- 1st party cookie/クライアントトークン管理
- 管理者認証・権限管理

---

## アーキテクチャ概要

```plaintext
[ユーザ/管理者]
    ↓（Web, SPA, 管理画面）
[Next.js (TypeScript)]
    ↓（API通信）
[Go APIサーバ (Gin) ]
    ↓（ORM, SQL）
[PostgreSQL]
