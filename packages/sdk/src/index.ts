/**
 * noraneko-id JavaScript SDK
 * 
 * OAuth2 + PKCE認証を簡単に実装するためのSDK
 */

// メインクラス
export { NoranekoID } from './noraneko-id';

// 型定義
export type {
  // 設定関連
  NoranekoIDConfig,
  ResolvedConfig,
  AuthOptions,
  LogoutOptions,
  
  // レスポンス関連
  TokenResponse,
  RefreshTokenResponse,
  User,
  
  // 認証状態
  AuthState,
  
  // イベント関連
  NoranekoIDEventType,
  NoranekoIDEventData,
  EventCallback,
  
  // OAuth2関連
  OAuth2Endpoints,
  PKCEParams,
  JWTPayload,
  ErrorDetails,
  
  // ストレージ関連
  TokenStorage
} from './types';

// エラークラス
export {
  // 基底エラークラス
  NoranekoIDError,
  
  // 具象エラークラス
  AuthenticationError,
  ConfigurationError,
  NetworkError,
  PKCEError,
  StorageError,
  UnsupportedBrowserError,
  
  // エラーコード
  ErrorCode,
  
  // エラー作成ヘルパー
  createOAuth2Error,
  createNetworkError
} from './errors';

// ユーティリティ関数（必要に応じて公開）
export {
  generateRandomString,
  base64UrlEncode,
  base64UrlDecode,
  decodeJWT,
  isTokenExpired,
  parseUrlParams,
  checkBrowserSupport
} from './utils';

// デフォルトエクスポート
import { NoranekoID } from './noraneko-id';
export default NoranekoID;