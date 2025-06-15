# マルチテナント対応マイグレーションガイド

## 概要

このガイドは、noraneko-id をマルチテナント対応にアップグレードするための手順を説明します。

## 重要な変更点

1. **Userテーブル**
   - `client_id` フィールド追加（必須）
   - `password_hash` が nullable に変更（SNSログイン対応）
   - `profile_image_url` フィールド追加
   - Email/Usernameのユニーク制約が複合インデックスに変更

2. **新テーブル**
   - `user_auth_providers` - 認証プロバイダー情報管理

3. **既存データの移行**
   - 全ての既存ユーザーは "default-client" に割り当てられます

## マイグレーション手順

### 1. バックアップ（重要！）

```bash
# データベース全体のバックアップ
PGPASSWORD=dev_password pg_dump -h localhost -U noraneko -d noraneko_id > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. サーバー停止

```bash
# 実行中のサーバーを停止
# Ctrl+C または kill $(lsof -t -i:8080)
```

### 3. マイグレーション実行

```bash
# SQLマイグレーションの実行
PGPASSWORD=dev_password psql -h localhost -U noraneko -d noraneko_id < migrations/001_multi_tenant_migration.sql
```

### 4. 確認

```bash
# テーブル構造の確認
PGPASSWORD=dev_password psql -h localhost -U noraneko -d noraneko_id -c "\d users"
PGPASSWORD=dev_password psql -h localhost -U noraneko -d noraneko_id -c "\d user_auth_providers"

# データ移行の確認
PGPASSWORD=dev_password psql -h localhost -U noraneko -d noraneko_id -c "SELECT COUNT(*) FROM users WHERE client_id IS NOT NULL;"
PGPASSWORD=dev_password psql -h localhost -U noraneko -d noraneko_id -c "SELECT COUNT(*) FROM user_auth_providers;"
```

### 5. サーバー再起動

```bash
# サーバー起動（自動マイグレーションで新しいカラムが追加される）
go run cmd/server/main.go
```

## ロールバック手順

問題が発生した場合：

```bash
# バックアップからリストア
PGPASSWORD=dev_password psql -h localhost -U noraneko -d noraneko_id < backup_YYYYMMDD_HHMMSS.sql
```

## 注意事項

1. **APIの変更**
   - 認証エンドポイントで `client_id` が必要になります
   - 既存のクライアントアプリケーションの更新が必要です

2. **デフォルトクライアント**
   - ID: `a0000000-0000-0000-0000-000000000001`
   - Client ID: `default-client`
   - 既存ユーザーは全てこのクライアントに割り当てられます

3. **パスワードなしユーザー**
   - SNSログインのみのユーザーは `password_hash` が NULL になります
   - `user_auth_providers` テーブルで認証方法を管理します

## トラブルシューティング

### エラー: "column client_id does not exist"
GORMの自動マイグレーションを先に実行した場合。SQLマイグレーションの該当部分をスキップしてください。

### エラー: "duplicate key value violates unique constraint"
既に同じemailのユーザーが存在する場合。手動で調整が必要です。

### エラー: "foreign key constraint violation"
存在しないclient_idを参照している場合。デフォルトクライアントが作成されているか確認してください。

## サポート

問題が発生した場合は、GitHubのIssueで報告してください。