/**
 * JWT ローカル検証ユーティリティ
 *
 * ネットワーク呼び出しを行わずに、JWTアクセストークンの有効性を検証します。
 */
/**
 * JWT形式かどうかを判定
 *
 * @param token 検証対象のトークン
 * @returns JWT形式の場合はtrue
 */
export function isJWTFormat(token) {
    if (!token || typeof token !== 'string') {
        return false;
    }
    const parts = token.split('.');
    return parts.length === 3;
}
/**
 * JWTペイロードをデコード（検証なし）
 *
 * @param token JWTトークン
 * @returns デコードされたペイロード
 * @throws {Error} デコードに失敗した場合
 */
export function decodeJWTPayload(token) {
    if (!isJWTFormat(token)) {
        throw new Error('Invalid JWT format');
    }
    try {
        const parts = token.split('.');
        const payload = parts[1];
        // Base64URL デコード
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    }
    catch (error) {
        throw new Error(`Failed to decode JWT payload: ${error}`);
    }
}
/**
 * JWTの有効期限をチェック
 *
 * @param token JWTトークン
 * @param clockSkewSeconds 時刻のずれを許容する秒数 (デフォルト: 300秒 = 5分)
 * @returns 有効期限内の場合はtrue
 */
export function isJWTExpired(token, clockSkewSeconds = 300) {
    try {
        const payload = decodeJWTPayload(token);
        if (!payload.exp) {
            // expクレームがない場合は期限切れとみなす
            return true;
        }
        const now = Math.floor(Date.now() / 1000);
        const expiry = payload.exp - clockSkewSeconds; // クロックスキューを考慮
        return expiry <= now;
    }
    catch {
        // デコードエラーは期限切れとみなす
        return true;
    }
}
/**
 * JWTの有効開始時刻をチェック
 *
 * @param token JWTトークン
 * @param clockSkewSeconds 時刻のずれを許容する秒数 (デフォルト: 300秒 = 5分)
 * @returns 有効開始時刻を過ぎている場合はtrue
 */
export function isJWTNotYetValid(token, clockSkewSeconds = 300) {
    try {
        const payload = decodeJWTPayload(token);
        if (!payload.nbf) {
            // nbfクレームがない場合は常に有効
            return false;
        }
        const now = Math.floor(Date.now() / 1000);
        const notBefore = payload.nbf + clockSkewSeconds; // クロックスキューを考慮
        return notBefore > now;
    }
    catch {
        // デコードエラーは無効とみなす
        return true;
    }
}
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
export function validateJWTAccessToken(token, options = {}) {
    const { clockSkewSeconds = 300, expectedIssuer, expectedAudience } = options;
    // トークンが存在しない場合
    if (!token) {
        return false;
    }
    // JWT形式でない場合（オパークトークン等）
    if (!isJWTFormat(token)) {
        // JWTでない場合は検証できないため、ネットワーク呼び出しが必要
        return false;
    }
    try {
        const payload = decodeJWTPayload(token);
        // 有効期限チェック
        if (isJWTExpired(token, clockSkewSeconds)) {
            return false;
        }
        // 有効開始時刻チェック
        if (isJWTNotYetValid(token, clockSkewSeconds)) {
            return false;
        }
        // 発行者チェック
        if (expectedIssuer && payload.iss !== expectedIssuer) {
            return false;
        }
        // 対象者チェック
        if (expectedAudience) {
            const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
            if (!audiences.includes(expectedAudience)) {
                return false;
            }
        }
        return true;
    }
    catch {
        return false;
    }
}
/**
 * アクセストークンの残り有効期限を取得
 *
 * @param token JWTアクセストークン
 * @returns 残り秒数（期限切れまたはエラーの場合は0）
 */
export function getTokenRemainingTime(token) {
    try {
        const payload = decodeJWTPayload(token);
        if (!payload.exp) {
            return 0;
        }
        const now = Math.floor(Date.now() / 1000);
        const remaining = payload.exp - now;
        return Math.max(0, remaining);
    }
    catch {
        return 0;
    }
}
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
export function isTokenExpiringSoon(token, thresholdSeconds) {
    const remaining = getTokenRemainingTime(token);
    return remaining > 0 && remaining <= thresholdSeconds;
}
//# sourceMappingURL=jwt-validation.js.map