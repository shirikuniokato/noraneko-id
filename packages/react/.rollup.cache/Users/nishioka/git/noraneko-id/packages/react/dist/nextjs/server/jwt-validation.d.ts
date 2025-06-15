/**
 * JWT ローカル検証ユーティリティ
 *
 * ネットワーク呼び出しを行わずに、JWTアクセストークンの有効性を検証します。
 */
/**
 * JWT ペイロード の型定義
 */
export interface JWTPayload {
    /** Subject (ユーザーID) */
    sub: string;
    /** Issuer (発行者) */
    iss?: string;
    /** Audience (対象者) */
    aud?: string | string[];
    /** Expiration Time (有効期限) */
    exp: number;
    /** Issued At (発行時刻) */
    iat?: number;
    /** Not Before (有効開始時刻) */
    nbf?: number;
    /** JWT ID */
    jti?: string;
    /** Scope */
    scope?: string;
    /** その他のカスタムクレーム */
    [key: string]: any;
}
/**
 * JWT形式かどうかを判定
 *
 * @param token 検証対象のトークン
 * @returns JWT形式の場合はtrue
 */
export declare function isJWTFormat(token: string): boolean;
/**
 * JWTペイロードをデコード（検証なし）
 *
 * @param token JWTトークン
 * @returns デコードされたペイロード
 * @throws {Error} デコードに失敗した場合
 */
export declare function decodeJWTPayload(token: string): JWTPayload;
/**
 * JWTの有効期限をチェック
 *
 * @param token JWTトークン
 * @param clockSkewSeconds 時刻のずれを許容する秒数 (デフォルト: 300秒 = 5分)
 * @returns 有効期限内の場合はtrue
 */
export declare function isJWTExpired(token: string, clockSkewSeconds?: number): boolean;
/**
 * JWTの有効開始時刻をチェック
 *
 * @param token JWTトークン
 * @param clockSkewSeconds 時刻のずれを許容する秒数 (デフォルト: 300秒 = 5分)
 * @returns 有効開始時刻を過ぎている場合はtrue
 */
export declare function isJWTNotYetValid(token: string, clockSkewSeconds?: number): boolean;
/**
 * JWTアクセストークンの有効性をローカルで検証
 *
 * @param token JWTアクセストークン
 * @param options 検証オプション
 * @returns 有効な場合はtrue
 *
 * @example
 * ```typescript
 * const tokens = await getServerAuthTokens();
 *
 * if (validateJWTAccessToken(tokens.accessToken)) {
 *   // トークンが有効 - ネットワーク呼び出し不要
 *   console.log('Token is valid');
 * } else {
 *   // トークンが無効 - ログインが必要
 *   redirect('/login');
 * }
 * ```
 */
export declare function validateJWTAccessToken(token: string | null, options?: {
    /** 時刻のずれを許容する秒数 @default 300 */
    clockSkewSeconds?: number;
    /** 発行者を検証する場合に指定 */
    expectedIssuer?: string;
    /** 対象者を検証する場合に指定 */
    expectedAudience?: string;
}): boolean;
/**
 * アクセストークンの残り有効期限を取得
 *
 * @param token JWTアクセストークン
 * @returns 残り秒数（期限切れまたはエラーの場合は0）
 */
export declare function getTokenRemainingTime(token: string): number;
/**
 * トークンが指定秒数以内に期限切れになるかチェック
 *
 * @param token JWTアクセストークン
 * @param thresholdSeconds 閾値（秒）
 * @returns 指定秒数以内に期限切れになる場合はtrue
 *
 * @example
 * ```typescript
 * // 5分以内に期限切れになる場合はリフレッシュ
 * if (isTokenExpiringSoon(accessToken, 300)) {
 *   await refreshTokens();
 * }
 * ```
 */
export declare function isTokenExpiringSoon(token: string, thresholdSeconds: number): boolean;
//# sourceMappingURL=jwt-validation.d.ts.map