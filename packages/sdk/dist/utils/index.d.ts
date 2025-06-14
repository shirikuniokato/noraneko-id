/**
 * noraneko-id SDK ユーティリティ関数
 */
import { PKCEParams, TokenStorage, JWTPayload, ErrorDetails, ResolvedConfig, NoranekoIDConfig } from '../types';
/**
 * PKCE用のランダム文字列を生成
 */
export declare function generateRandomString(length: number): string;
/**
 * SHA256ハッシュを計算してBase64URL形式で返す
 */
export declare function sha256Base64Url(data: string): Promise<string>;
/**
 * Base64URL エンコード
 */
export declare function base64UrlEncode(buffer: Uint8Array): string;
/**
 * Base64URL デコード
 */
export declare function base64UrlDecode(str: string): Uint8Array;
/**
 * PKCEパラメータを生成
 */
export declare function generatePKCEParams(): Promise<PKCEParams>;
/**
 * JWTトークンをデコード（署名検証なし）
 */
export declare function decodeJWT(token: string): JWTPayload;
/**
 * JWTトークンの有効期限をチェック
 */
export declare function isTokenExpired(token: string, clockSkewLeeway?: number): boolean;
/**
 * URLクエリパラメータをパース
 */
export declare function parseUrlParams(url: string): Record<string, string>;
/**
 * OAuth2エラーパラメータをパース
 */
export declare function parseErrorParams(params: Record<string, string>): ErrorDetails | null;
/**
 * 設定を検証・補完
 */
export declare function resolveConfig(config: NoranekoIDConfig): ResolvedConfig;
/**
 * ストレージインスタンスを作成
 */
export declare function createStorage(type: 'localStorage' | 'sessionStorage' | 'memory'): TokenStorage;
/**
 * 現在時刻のUNIXタイムスタンプを取得（秒）
 */
export declare function getCurrentTimestamp(): number;
/**
 * URLにクエリパラメータを追加
 */
export declare function addQueryParams(url: string, params: Record<string, string>): string;
/**
 * 現在のURLからフラグメント（#以降）を除去
 */
export declare function removeUrlFragment(url: string): string;
/**
 * ブラウザが必要なAPIをサポートしているかチェック
 */
export declare function checkBrowserSupport(): void;
/**
 * デバッグ用のログ出力（本番環境では無効）
 */
export declare function debugLog(message: string, data?: any): void;
//# sourceMappingURL=index.d.ts.map