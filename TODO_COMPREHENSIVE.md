# noraneko-id 包括的 TODO リスト

## 📊 進捗状況サマリー

- **完了**: 4 タスク (9.1%)
- **高優先度残**: 14 タスク (31.8%)
- **中優先度**: 13 タスク (29.5%)
- **低優先度**: 13 タスク (29.5%)
- **合計**: 44 タスク

---

## 🔴 高優先度タスク (18 タスク)

### Backend (5 タスク)

- [ ] **backend-1**: OAuth2 準拠の改善 - トークンイントロスペクションエンドポイント実装 (RFC 7662)
- [ ] **backend-2**: OAuth2 準拠の改善 - アクセストークン取り消し機能追加
- [ ] **backend-3**: OAuth2 準拠の改善 - state パラメータの必須化 (CSRF 保護)
- [ ] **backend-4**: OAuth2 準拠の改善 - PKCE 強制化 (パブリッククライアント)
- [ ] **backend-5**: 非標準エンドポイント削除 - /auth/session/verify の削除

### React SDK (4 タスク) ✅ **完了済み**

- [x] **react-sdk-1**: メソッドチェーン対応ミドルウェア実装
- [x] **react-sdk-2**: Next.js ディレクトリ構造リファクタリング
- [x] **react-sdk-3**: JWT ローカル検証機能実装
- [x] **react-sdk-4**: isAuthenticated 関数の改善

### Web Frontend (3 タスク)

- [ ] **web-1**: 削除された管理機能の再実装 - クライアント管理画面
- [ ] **web-2**: 削除された管理機能の再実装 - ユーザー管理画面
- [ ] **web-3**: OAuth2 認可フローの完全実装

### Deployment (3 タスク)

- [ ] **deployment-1**: 本番用 Dockerfile 作成
- [ ] **deployment-2**: 環境別設定の分離
- [ ] **deployment-3**: ヘルスチェックエンドポイント追加

---

## 🟡 中優先度タスク (13 タスク)

### Backend (3 タスク)

- [ ] **backend-6**: エラーハンドリング強化 - データベース接続失敗のリトライロジック
- [ ] **backend-7**: エラーハンドリング強化 - パニック回復ミドルウェア
- [ ] **backend-8**: エラーハンドリング強化 - トランザクション処理の改善

### React SDK (6 タスク)

- [x] **react-sdk-5**: getServerSession 関連機能の削除
- [x] **react-sdk-6**: session.ts ファイル全体の削除
- [x] **react-sdk-7**: SessionData、SessionConfig 型の削除
- [ ] **react-sdk-8**: マルチタブ認証状態同期機能実装
- [ ] **react-sdk-9**: サイレント認証更新機能実装
- [ ] **react-sdk-10**: ログアウト状態のブロードキャスト機能実装

### Web Frontend (3 タスク)

- [ ] **web-4**: エラーバウンダリー実装
- [ ] **web-5**: ローディング状態の改善
- [ ] **web-6**: エラーハンドリングの統一

### Deployment (3 タスク)

- [ ] **deployment-4**: GitHub Actions 設定
- [ ] **deployment-5**: 自動テスト実行
- [ ] **deployment-6**: デプロイメント自動化

---

## 🟢 低優先度タスク (13 タスク)

### Backend (5 タスク)

- [ ] **backend-9**: セキュリティ強化 - レート制限ミドルウェア実装
- [ ] **backend-10**: セキュリティ強化 - パスワードポリシー強化 (12 文字以上)
- [ ] **backend-11**: パフォーマンス最適化 - N+1 クエリ問題解決
- [ ] **backend-12**: パフォーマンス最適化 - キャッシュレイヤー追加
- [ ] **backend-13**: パフォーマンス最適化 - データベースインデックス追加

### React SDK (3 タスク)

- [ ] **react-sdk-11**: any 型の具体的な型への置き換え
- [ ] **react-sdk-12**: エラー型の詳細化
- [ ] **react-sdk-13**: オプショナル属性の見直し

### Web Frontend (3 タスク)

- [ ] **web-7**: グローバル状態管理の導入
- [ ] **web-8**: API 設定の環境変数化
- [ ] **web-9**: コンポーネント最適化

### Deployment (3 タスク)

- [ ] **deployment-7**: 構造化ログ実装
- [ ] **deployment-8**: メトリクス収集
- [ ] **deployment-9**: アラート設定

---

## 🎯 推奨実行順序

### **Phase 1: 緊急対応（高優先度）**

#### 1.1 OAuth2 標準準拠（最優先）

1. backend-1: トークンイントロスペクション実装
2. backend-2: アクセストークン取り消し
3. backend-3: state パラメータ必須化
4. backend-4: PKCE 強制化
5. backend-5: /auth/session/verify 削除

#### 1.2 基本機能復旧

6. web-1: クライアント管理画面復旧
7. web-2: ユーザー管理画面復旧
8. web-3: OAuth2 認可フロー完全実装

#### 1.3 本番環境対応

9. deployment-1: 本番用 Dockerfile
10. deployment-2: 環境別設定分離
11. deployment-3: ヘルスチェック追加

### **Phase 2: 機能強化（中優先度）**

<!-- #### 2.1 React SDK整理
12. react-sdk-5: getServerSession削除
13. react-sdk-6: session.ts削除
14. react-sdk-7: Session型削除 -->

#### 2.2 Backend 安定化

15. backend-6: DB 接続リトライ
16. backend-7: パニック回復
17. backend-8: トランザクション改善

#### 2.3 Web UX 改善

18. web-4: エラーバウンダリー
19. web-5: ローディング改善
20. web-6: エラーハンドリング統一

#### 2.4 CI/CD 構築

21. deployment-4: GitHub Actions
22. deployment-5: 自動テスト
23. deployment-6: デプロイ自動化

#### 2.5 React SDK 追加機能

24. react-sdk-8: マルチタブ同期
25. react-sdk-9: サイレント認証更新
26. react-sdk-10: ログアウトブロードキャスト

### **Phase 3: 品質向上（低優先度）**

#### 3.1 パフォーマンス最適化

27. backend-11: N+1 クエリ解決
28. backend-12: キャッシュレイヤー
29. backend-13: データベースインデックス

#### 3.2 セキュリティ強化

30. backend-9: レート制限
31. backend-10: パスワードポリシー

#### 3.3 型安全性向上

32. react-sdk-11: any 型置き換え
33. react-sdk-12: エラー型詳細化
34. react-sdk-13: オプショナル属性見直し

#### 3.4 コード品質向上

35. web-7: グローバル状態管理
36. web-8: API 設定環境変数化
37. web-9: コンポーネント最適化

#### 3.5 運用監視

38. deployment-7: 構造化ログ
39. deployment-8: メトリクス収集
40. deployment-9: アラート設定

---

## 📝 重要な注意事項

### OAuth2 標準準拠の重要性

- **backend-1~5** は相互依存関係があるため、セットで実装する必要があります
- 特に **backend-5** (/auth/session/verify 削除) は **react-sdk-5~7** のセッション機能削除と連動

### 破壊的変更への対応

- React SDK のセッション機能削除は破壊的変更となります
- 移行ガイドの作成と段階的リリースを検討

### テスト戦略

- Phase 1 完了時点で包括的なテストスイート実装
- 特に OAuth2 フローの自動テストが重要

### パフォーマンス考慮

- JWT ローカル検証により、IDaaS サーバー負荷は大幅に軽減済み
- backend-11~13 の最適化はサーバー負荷が高くなった場合に実施

---

## 🔄 継続的な見直し

この TODO リストは開発進捗に応じて定期的に見直し、優先度や内容を更新してください。

**最終更新**: 2025 年 1 月 15 日
