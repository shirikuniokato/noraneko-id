# Noraneko Payment 要件仕様書

## 概要

Noraneko Payment は、Noraneko IDaaS と連携する統合決済プラットフォームです。Stripe をバックエンドとして、マルチテナント対応の決済・振込システムを提供し、各クライアントが簡単に決済機能を導入できるようにします。

## システムアーキテクチャ

### 全体構成
```
[クライアントアプリ] ←→ [Noraneko IDaaS] ←→ [Noraneko Payment] ←→ [Stripe API]
                     OAuth2認証         決済・振込処理      実際の決済処理
```

### 主要コンポーネント
- **決済処理エンジン**: Stripe API のラッパー、統一された決済 API
- **出品者管理システム**: KYC、振込先管理、税務処理
- **手数料計算エンジン**: クライアント毎の柔軟な手数料設定
- **振込処理システム**: 自動・手動振込、スケジュール管理
- **管理ダッシュボード**: クライアント用設定画面、売上分析

## IDaaS との連携設計

### 認証・認可
- OAuth2 アクセストークンによる API 認証
- クライアント識別による マルチテナント対応
- ユーザー情報の統一管理（Noraneko ID が Source of Truth）

### データ連携
```go
// Noraneko IDaaS
User {
    ID: uuid.UUID          // 一意ユーザー識別子
    ClientID: uuid.UUID    // テナント識別子
    Email: string
    Username: string
}

// Noraneko Payment
Seller {
    UserID: uuid.UUID      // Noraneko IDaaS の User.ID と紐づけ
    ClientID: uuid.UUID    // 同一ユーザーの複数クライアント対応
    BankAccount: BankInfo  // 振込先情報
    KYCStatus: string      // 本人確認状況
}
```

## 販売モード仕様

### 1. 直販モード (Direct Sales)
**用途**: ECサイト、SaaS販売、デジタルコンテンツ直販

**特徴**:
- 全売上がクライアントに振込
- 出品者という概念なし
- シンプルな決済フロー

**振込フロー**:
```
決済 ¥10,000
├── Stripe手数料: ¥327 (3.27%)
├── Noraneko Payment手数料: ¥200 (2%)
└── クライアント受取: ¥9,473
```

### 2. マーケットプレイスモード (Marketplace)
**用途**: 素材販売PF、ハンドメイドPF、フリーランスPF

**特徴**:
- 売上を出品者とクライアント（プラットフォーム手数料）に分配
- 出品者毎の売上管理・振込
- KYC・税務処理が必要

**振込フロー**:
```
決済 ¥10,000
├── Stripe手数料: ¥327 (3.27%)
├── Noraneko Payment手数料: ¥150 (1.5%)
├── 出品者分: ¥8,523 × 85% = ¥7,245
└── クライアント分: ¥8,523 × 15% = ¥1,278
```

### 3. ハイブリッドモード（商品毎設定）
**用途**: サブスクリプション + 出品販売を併用するプラットフォーム

**特徴**:
- 同一クライアント内で商品・サービス毎に販売モードを設定
- 例：出品者登録料（直販）+ 商品販売（マーケットプレイス）
- 一つの決済プラットフォームで複数ビジネスモデルに対応

**設定例**:
```json
// サブスクリプション決済（直販モード）
{
  "product_type": "subscription",
  "payment_model": "direct",
  "amount": 500
}

// 商品販売決済（マーケットプレイスモード）  
{
  "product_type": "marketplace_item",
  "payment_model": "marketplace",
  "amount": 1000,
  "seller_id": "seller_123"
}
```

## 出品者管理システム

### KYC (Know Your Customer) 要件
```go
type Seller struct {
    ID                uuid.UUID
    UserID            uuid.UUID  // Noraneko IDaaS連携
    ClientID          uuid.UUID  // マルチテナント対応
    
    // KYC情報
    KYCStatus         string     // pending, verified, rejected
    KYCDocuments      []string   // 本人確認書類
    TaxID             *string    // 税務番号
    TaxForm           *string    // W-9, W-8BEN等
    
    // 振込情報
    PayoutMethod      string     // bank_transfer, stripe_express
    BankAccount       *BankAccountInfo
    StripeAccountID   *string    // Stripe Connect
    
    // 設定
    MinPayoutAmount   int        // 最小振込金額
    PayoutSchedule    string     // weekly, monthly
}
```

### 出品者オンボーディングフロー
1. **初回登録**: Noraneko ID ログイン後、出品者情報登録
2. **KYC提出**: 本人確認書類アップロード
3. **振込先設定**: 銀行口座 or Stripe Express アカウント
4. **審査・承認**: 自動/手動審査プロセス
5. **販売開始**: 承認後、出品・売上受取が可能

## 手数料・振込システム

### クライアント毎手数料設定
```go
type ClientTier struct {
    ClientID        uuid.UUID
    TierLevel       string    // "owner", "friend", "standard", "enterprise"
    PlatformFeeRate float64   // Noraneko Payment手数料率
    
    // 契約情報
    ContractType    string    // "free", "pay_as_you_go", "monthly"
    MinMonthlyFee   int       // 月額最低手数料
}
```

### 手数料体系例
| クライアントタイプ | プラットフォーム手数料 | 月額基本料 | 対象 |
|---|---|---|---|
| Owner | 0% | ¥0 | 自社利用 |
| Friend | 1% | ¥0 | 知人・友人 |
| Standard | 3% | ¥0 | 一般クライアント |
| Enterprise | 2% | ¥50,000 | 大口・カスタム |

### 振込スケジュール
- **即時振込**: 決済完了と同時
- **日次振込**: 毎日決まった時間
- **週次振込**: 毎週金曜日等
- **月次振込**: 月末締め翌月払い
- **手動振込**: クライアント側で承認後

## データモデル設計

### 取引管理
```go
type Transaction struct {
    ID              uuid.UUID
    ClientID        uuid.UUID
    Amount          int                    // 決済総額
    Currency        string                 // JPY, USD
    
    // 手数料内訳
    StripeFee       int                    // Stripe手数料
    PlatformFee     int                    // Noraneko Payment手数料
    
    // 分配情報（マーケットプレイスモード）
    SellerAmount    int                    // 出品者取り分
    ClientAmount    int                    // クライアント取り分
    
    // メタデータ
    Metadata        map[string]interface{} // 柔軟な属性管理
    PaymentModel    string                 // "direct" or "marketplace"
    
    Status          string                 // pending, completed, failed
    CreatedAt       time.Time
}
```

### 振込管理
```go
type Payout struct {
    ID              uuid.UUID
    RecipientType   string     // "client" or "seller"
    RecipientID     uuid.UUID
    Amount          int
    Currency        string
    
    PayoutMethod    string     // "stripe_transfer", "bank_transfer"
    Status          string     // "pending", "processing", "completed", "failed"
    
    TransactionIDs  []uuid.UUID // 対象となる取引一覧
    ProcessedAt     *time.Time
    CreatedAt       time.Time
}
```

## API 設計概要

### 決済 API
```http
POST /payment/v1/charge
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "amount": 1000,
  "currency": "JPY",
  "payment_model": "marketplace",
  "metadata": {
    "seller_id": "seller_123",
    "product_id": "prod_456",
    "commission_rate": 0.15
  }
}
```

### 出品者管理 API
```http
# 出品者登録
POST /payment/v1/sellers/onboard

# KYC提出
POST /payment/v1/sellers/{seller_id}/kyc

# 売上確認
GET /payment/v1/sellers/{seller_id}/earnings

# 振込履歴
GET /payment/v1/sellers/{seller_id}/payouts
```

### 管理 API
```http
# クライアント設定
PUT /payment/v1/clients/{client_id}/settings

# 売上レポート
GET /payment/v1/clients/{client_id}/reports

# 振込実行
POST /payment/v1/payouts/execute
```

## セキュリティ・法規制対応

### セキュリティ要件
- **PCI DSS準拠**: カード情報の適切な処理
- **データ暗号化**: 機密情報の暗号化保存
- **API認証**: OAuth2 + JWT による認証・認可
- **監査ログ**: 全ての金融取引の記録

### 法規制対応
- **犯罪収益移転防止法**: KYC・AML対応
- **資金決済法**: 前払式支払手段の適切な管理
- **税務処理**: 支払調書の自動作成・提出
- **個人情報保護**: GDPR・個人情報保護法対応

## 管理ダッシュボード要件

### クライアント用ダッシュボード
- **売上サマリー**: 日次・月次・年次の売上推移
- **取引一覧**: 決済・返金・振込の詳細履歴
- **出品者管理**: KYC状況・売上ランキング
- **設定管理**: 手数料率・振込スケジュール設定

### 運営者用管理画面
- **クライアント管理**: 料金プラン・手数料率設定
- **収益分析**: プラットフォーム収益・成長指標
- **監査・コンプライアンス**: 法規制対応状況
- **システム監視**: API使用状況・エラー監視

## 技術スタック（推奨）

### バックエンド
- **言語**: Go (高パフォーマンス・並行処理)
- **フレームワーク**: Gin (軽量・高速)
- **データベース**: PostgreSQL (ACID・複雑クエリ対応)
- **外部API**: Stripe API (決済処理)
- **認証**: OAuth2 + JWT (Noraneko IDaaS連携)

### インフラ
- **コンテナ**: Docker + Docker Compose
- **オーケストレーション**: Kubernetes (本番環境)
- **CI/CD**: GitHub Actions
- **監視**: Prometheus + Grafana
- **ログ**: ELK Stack (Elasticsearch + Logstash + Kibana)

## 開発フェーズ

### Phase 1: 基盤構築 (MVP)
- [ ] 基本的な決済API実装
- [ ] Stripe連携・webhook処理
- [ ] 直販モードの実装
- [ ] 基本的なクライアント管理

### Phase 2: マーケットプレイス機能
- [ ] 出品者管理システム
- [ ] KYC・審査プロセス
- [ ] マーケットプレイスモード実装
- [ ] 売上分配・振込システム

### Phase 2.5: ハイブリッドモード対応
- [ ] 商品毎の販売モード設定機能
- [ ] サブスクリプション + 出品販売の併用対応
- [ ] 出品者権利管理（サブスク連動）
- [ ] 売上レポートの分離表示

### Phase 3: 高度な機能
- [ ] 多通貨対応
- [ ] 定期課金・サブスクリプション
- [ ] 高度な分析・レポート機能
- [ ] API rate limiting・セキュリティ強化

### Phase 4: エンタープライズ機能
- [ ] カスタム料金プラン
- [ ] 高度な承認フロー
- [ ] 多段階手数料設定
- [ ] 専用サポート・SLA

## 将来の拡張計画

### 国際展開
- 多通貨決済対応 (USD, EUR等)
- 各国の法規制対応
- 現地決済手段の追加

### 新しい決済方法
- 暗号通貨決済
- QR決済 (PayPay等)
- 後払い決済 (Paidy等)
- デジタルウォレット

### B2B機能
- 請求書決済
- 企業間決済
- 会計システム連携
- 税務申告支援

## 成功指標 (KPI)

### ビジネス指標
- **月間決済総額**: プラットフォーム全体の流通総額
- **アクティブクライアント数**: 月間決済実行クライアント数
- **プラットフォーム収益**: 手数料による売上
- **クライアント継続率**: 解約率・継続利用率

### 技術指標
- **API応答時間**: 平均・P95・P99レスポンス時間
- **システム稼働率**: 99.9%以上の可用性目標
- **決済成功率**: 失敗・エラー率の最小化
- **セキュリティインシデント**: ゼロ件維持

---

**Document Version**: 1.0  
**Last Updated**: 2024-06-15  
**Next Review**: IDaaS完成後、開発着手前に詳細仕様を策定