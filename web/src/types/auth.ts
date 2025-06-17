/**
 * 認証関連の型定義
 * noraneko-id SDK 最新版対応
 */

// SDK型の再エクスポート
export type { NextJSAuthConfig, User, Session } from "@noranekoid/nextjs";

// カスタム型定義
import type { User } from "@noranekoid/nextjs";

export interface AdminUser extends User {
  // 管理者専用の追加フィールド
  permissions?: string[];
  lastLoginAt?: string;
}

export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// 新しいSDKではProviderが非推奨のため、この型は削除

// イベント型定義
export interface AuthSessionExpiredEvent extends CustomEvent {
  detail: {
    error: string;
  };
}

// グローバル型定義の拡張
declare global {
  interface WindowEventMap {
    "auth-session-expired": AuthSessionExpiredEvent;
  }
}
