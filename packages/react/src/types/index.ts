/**
 * @noraneko/id-react 型定義
 */

import { ReactNode } from 'react';
import type {
  NoranekoIDConfig,
  User,
  AuthOptions,
  LogoutOptions,
  TokenResponse,
  NoranekoIDEventType,
  EventCallback,
  NoranekoID
} from '@noraneko/id-sdk';

// 拡張ログアウトオプション
export interface EnhancedLogoutOptions extends LogoutOptions {
  /** ログアウト後のリダイレクト先 */
  redirectTo?: string;
  
  /** ローカルストレージもクリアするか */
  clearLocalStorage?: boolean;
  
  /** セッションストレージもクリアするか */
  clearSessionStorage?: boolean;
  
  /** OAuth2 revokeをスキップするか（緊急ログアウト用） */
  skipRevoke?: boolean;
  
  /** エラーでも強制ログアウトするか */
  force?: boolean;
}

// Provider関連
export interface NoranekoIDProviderProps {
  /** noraneko-id SDK設定 */
  config: NoranekoIDConfig;
  
  /** 子コンポーネント */
  children: ReactNode;
  
  /** 初期化完了前に表示するローディングコンポーネント */
  loadingComponent?: ReactNode;
  
  /** 初期化エラー時に表示するエラーコンポーネント */
  errorComponent?: ReactNode | ((error: Error) => ReactNode);
  
  /** SDKの初期化完了時のコールバック */
  onInitialized?: () => void;
  
  /** 初期化エラー時のコールバック */
  onInitializationError?: (error: Error) => void;
}

// Hook戻り値の型
export interface UseNoranekoIDResult {
  /** ユーザー情報 */
  user: User | null;
  
  /** 認証状態 */
  isAuthenticated: boolean;
  
  /** ローディング状態 */
  isLoading: boolean;
  
  /** 初期化中かどうか */
  isInitializing: boolean;
  
  /** エラー情報 */
  error: Error | null;
  
  /** ログイン（認証開始） */
  login: (options?: AuthOptions) => Promise<void>;
  
  /** ログアウト */
  logout: (options?: EnhancedLogoutOptions) => Promise<void>;
  
  /** アクセストークン取得 */
  getAccessToken: () => Promise<string | null>;
  
  /** ユーザー情報を強制更新 */
  refreshUser: () => Promise<User | null>;
  
  /** トークンを手動更新 */
  refreshTokens: () => Promise<TokenResponse>;
}

// 個別Hook用の型
export interface UseAuthStateResult {
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: Error | null;
}

export interface UseUserInfoResult {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  refreshUser: () => Promise<User | null>;
}

export interface UseAccessTokenResult {
  accessToken: string | null;
  isLoading: boolean;
  error: Error | null;
  getAccessToken: () => Promise<string | null>;
  refreshTokens: () => Promise<TokenResponse>;
}

export interface UseAuthActionsResult {
  login: (options?: AuthOptions) => Promise<void>;
  logout: (options?: EnhancedLogoutOptions) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

// コンポーネント関連の型
export interface ProtectedRouteProps {
  /** 認証が必要な子コンポーネント */
  children: ReactNode;
  
  /** 未認証時に表示するコンポーネント */
  fallback?: ReactNode;
  
  /** 未認証時のリダイレクト先（指定時は自動リダイレクト） */
  redirectTo?: string;
  
  /** 認証完了後のリダイレクト先 */
  returnTo?: string;
  
  /** 必要な権限（カスタム認可ロジック） */
  requiredPermissions?: string[];
  
  /** 権限チェック関数 */
  hasPermission?: (user: User, permissions: string[]) => boolean;
}

export interface LoginRequiredProps {
  /** ログインボタンのテキスト */
  loginText?: string;
  
  /** メッセージ */
  message?: string;
  
  /** ログインオプション */
  loginOptions?: AuthOptions;
  
  /** カスタムスタイル */
  className?: string;
  
  /** カスタムログインボタンコンポーネント */
  loginComponent?: ReactNode;
}

export interface ConditionalRenderProps {
  /** 認証済みの場合に表示する内容 */
  authenticated?: ReactNode;
  
  /** 未認証の場合に表示する内容 */
  unauthenticated?: ReactNode;
  
  /** ローディング中に表示する内容 */
  loading?: ReactNode;
  
  /** エラー時に表示する内容 */
  error?: ReactNode | ((error: Error) => ReactNode);
  
  /** カスタム条件関数 */
  condition?: (result: UseNoranekoIDResult) => boolean;
  
  /** 条件が真の場合に表示する内容 */
  children?: ReactNode;
  
  /** 条件が偽の場合に表示する内容 */
  fallback?: ReactNode;
}

// Context関連の型
export interface NoranekoIDContextValue extends UseNoranekoIDResult {
  /** SDK インスタンス（内部使用） */
  sdk: NoranekoID | null;
  
  /** イベントリスナー登録 */
  addEventListener: <T extends NoranekoIDEventType>(
    event: T,
    callback: EventCallback<T>
  ) => void;
  
  /** イベントリスナー削除 */
  removeEventListener: <T extends NoranekoIDEventType>(
    event: T,
    callback: EventCallback<T>
  ) => void;
}

// 内部状態管理用の型
export interface NoranekoIDState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: Error | null;
}

export type NoranekoIDAction =
  | { type: 'INITIALIZE_START' }
  | { type: 'INITIALIZE_SUCCESS' }
  | { type: 'INITIALIZE_ERROR'; payload: Error }
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: Error }
  | { type: 'LOGOUT_START' }
  | { type: 'LOGOUT_SUCCESS' }
  | { type: 'LOGOUT_ERROR'; payload: Error }
  | { type: 'USER_UPDATE'; payload: User | null }
  | { type: 'TOKEN_REFRESH_START' }
  | { type: 'TOKEN_REFRESH_SUCCESS' }
  | { type: 'TOKEN_REFRESH_ERROR'; payload: Error }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

// ユーティリティ型
export type AuthenticationStatus = 'authenticated' | 'unauthenticated' | 'loading' | 'error';

export interface AuthenticationGuardOptions {
  /** 認証状態の確認を待つ最大時間（ミリ秒） */
  timeout?: number;
  
  /** 認証失敗時の動作 */
  onAuthFail?: 'redirect' | 'throw' | 'return-false';
  
  /** リダイレクト先URL */
  redirectUrl?: string;
}

// HOC（Higher-Order Component）用の型
export interface WithNoranekoIDProps {
  noranekoID: UseNoranekoIDResult;
}

export type ComponentWithNoranekoID<P = {}> = React.ComponentType<P & WithNoranekoIDProps>;

// Hook オプション
export interface UseNoranekoIDOptions {
  /** 自動ユーザー情報取得を無効にする */
  skipUserInfo?: boolean;
  
  /** エラー時の自動リトライ回数 */
  retryCount?: number;
  
  /** リトライ間隔（ミリ秒） */
  retryDelay?: number;
}