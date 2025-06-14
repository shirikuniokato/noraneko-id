// ユーザー関連の型定義
export interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  email_verified: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

// OAuth2クライアント関連の型定義
export interface OAuthClient {
  id: string;
  client_id: string;
  client_secret: string;
  name: string;
  description?: string;
  redirect_uri: string;
  scopes: string[];
  grant_types: string[];
  
  // UI設定フィールド
  logo_url?: string;
  website?: string;
  privacy_policy_url?: string;
  terms_of_service_url?: string;
  support_email?: string;
  brand_color?: string;
  consent_message?: string;
  
  // セキュリティ設定
  require_consent: boolean;
  trusted_client: boolean;
  
  created_at: string;
  updated_at: string;
}

// 認証関連
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  display_name?: string;
}

// APIレスポンス
export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

// クライアント作成リクエスト
export interface CreateClientRequest {
  name: string;
  description?: string;
  redirect_uri: string;
  scopes: string[];
  grant_types: string[];
  
  // UI設定フィールド
  logo_url?: string;
  website?: string;
  privacy_policy_url?: string;
  terms_of_service_url?: string;
  support_email?: string;
  brand_color?: string;
  consent_message?: string;
  
  // セキュリティ設定
  require_consent?: boolean;
  trusted_client?: boolean;
}

export type CreateClientResponse = OAuthClient;