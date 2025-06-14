'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/**
 * noraneko-id SDK エラークラス
 */
exports.ErrorCode = void 0;
(function (ErrorCode) {
    // 設定エラー
    ErrorCode["INVALID_CONFIG"] = "INVALID_CONFIG";
    ErrorCode["MISSING_REQUIRED_PARAMETER"] = "MISSING_REQUIRED_PARAMETER";
    // 認証エラー
    ErrorCode["AUTHENTICATION_FAILED"] = "AUTHENTICATION_FAILED";
    ErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ErrorCode["INVALID_TOKEN"] = "INVALID_TOKEN";
    ErrorCode["TOKEN_REFRESH_FAILED"] = "TOKEN_REFRESH_FAILED";
    ErrorCode["INVALID_STATE"] = "INVALID_STATE";
    ErrorCode["AUTHORIZATION_DENIED"] = "AUTHORIZATION_DENIED";
    // ネットワークエラー
    ErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
    ErrorCode["SERVER_ERROR"] = "SERVER_ERROR";
    ErrorCode["INVALID_RESPONSE"] = "INVALID_RESPONSE";
    // PKCE関連
    ErrorCode["PKCE_ERROR"] = "PKCE_ERROR";
    // その他
    ErrorCode["UNSUPPORTED_BROWSER"] = "UNSUPPORTED_BROWSER";
    ErrorCode["STORAGE_ERROR"] = "STORAGE_ERROR";
    ErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(exports.ErrorCode || (exports.ErrorCode = {}));
/**
 * SDK基底エラークラス
 */
class NoranekoIDError extends Error {
    constructor(code, message, originalError, details) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.originalError = originalError;
        this.details = details;
        // Error.captureStackTrace が利用可能な場合（Node.js環境など）
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    /**
     * エラーの詳細情報を含むオブジェクトを返す
     */
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            details: this.details,
            originalError: this.originalError ? {
                name: this.originalError.name,
                message: this.originalError.message
            } : undefined
        };
    }
}
/**
 * 設定関連のエラー
 */
class ConfigurationError extends NoranekoIDError {
    constructor(message, code = exports.ErrorCode.INVALID_CONFIG, details) {
        super(code, message, undefined, details);
    }
}
/**
 * 認証関連のエラー
 */
class AuthenticationError extends NoranekoIDError {
    constructor(message, code = exports.ErrorCode.AUTHENTICATION_FAILED, originalError, details) {
        super(code, message, originalError, details);
    }
}
/**
 * ネットワーク関連のエラー
 */
class NetworkError extends NoranekoIDError {
    constructor(message, code = exports.ErrorCode.NETWORK_ERROR, originalError, status, statusText, details) {
        super(code, message, originalError, details);
        this.status = status;
        this.statusText = statusText;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            status: this.status,
            statusText: this.statusText
        };
    }
}
/**
 * PKCE関連のエラー
 */
class PKCEError extends NoranekoIDError {
    constructor(message, originalError, details) {
        super(exports.ErrorCode.PKCE_ERROR, message, originalError, details);
    }
}
/**
 * ストレージ関連のエラー
 */
class StorageError extends NoranekoIDError {
    constructor(message, originalError, details) {
        super(exports.ErrorCode.STORAGE_ERROR, message, originalError, details);
    }
}
/**
 * 未サポートブラウザエラー
 */
class UnsupportedBrowserError extends NoranekoIDError {
    constructor(message = 'このブラウザはサポートされていません', details) {
        super(exports.ErrorCode.UNSUPPORTED_BROWSER, message, undefined, details);
    }
}
/**
 * OAuth2エラーレスポンスをパースしてエラーを作成
 */
function createOAuth2Error(error, errorDescription, errorUri, state) {
    const details = {
        error,
        error_description: errorDescription,
        error_uri: errorUri,
        state
    };
    let code;
    let message;
    switch (error) {
        case 'invalid_request':
            code = exports.ErrorCode.AUTHENTICATION_FAILED;
            message = 'リクエストが無効です';
            break;
        case 'unauthorized_client':
            code = exports.ErrorCode.AUTHENTICATION_FAILED;
            message = 'クライアントが認証されていません';
            break;
        case 'access_denied':
            code = exports.ErrorCode.AUTHORIZATION_DENIED;
            message = 'アクセスが拒否されました';
            break;
        case 'unsupported_response_type':
            code = exports.ErrorCode.AUTHENTICATION_FAILED;
            message = 'サポートされていないレスポンスタイプです';
            break;
        case 'invalid_scope':
            code = exports.ErrorCode.AUTHENTICATION_FAILED;
            message = '無効なスコープです';
            break;
        case 'server_error':
            code = exports.ErrorCode.SERVER_ERROR;
            message = 'サーバーエラーが発生しました';
            break;
        case 'temporarily_unavailable':
            code = exports.ErrorCode.SERVER_ERROR;
            message = 'サーバーが一時的に利用できません';
            break;
        case 'invalid_client':
            code = exports.ErrorCode.AUTHENTICATION_FAILED;
            message = '無効なクライアントです';
            break;
        case 'invalid_grant':
            code = exports.ErrorCode.AUTHENTICATION_FAILED;
            message = '無効な認可グラントです';
            break;
        case 'unsupported_grant_type':
            code = exports.ErrorCode.AUTHENTICATION_FAILED;
            message = 'サポートされていないグラントタイプです';
            break;
        default:
            code = exports.ErrorCode.AUTHENTICATION_FAILED;
            message = errorDescription || '認証エラーが発生しました';
    }
    return new AuthenticationError(message, code, undefined, details);
}
/**
 * HTTPレスポンスからエラーを作成
 */
function createNetworkError(response, originalError) {
    const status = response.status;
    const statusText = response.statusText;
    let code;
    let message;
    if (status >= 500) {
        code = exports.ErrorCode.SERVER_ERROR;
        message = `サーバーエラー: ${status} ${statusText}`;
    }
    else if (status >= 400) {
        code = exports.ErrorCode.NETWORK_ERROR;
        message = `リクエストエラー: ${status} ${statusText}`;
    }
    else {
        code = exports.ErrorCode.INVALID_RESPONSE;
        message = `予期しないレスポンス: ${status} ${statusText}`;
    }
    return new NetworkError(message, code, originalError, status, statusText);
}

/**
 * noraneko-id SDK ユーティリティ関数
 */
/**
 * PKCE用のランダム文字列を生成
 */
function generateRandomString(length) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const array = new Uint8Array(length);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(array);
    }
    else {
        // Fallback for environments without crypto.getRandomValues
        for (let i = 0; i < length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
    }
    return Array.from(array, byte => charset[byte % charset.length]).join('');
}
/**
 * SHA256ハッシュを計算してBase64URL形式で返す
 */
async function sha256Base64Url(data) {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
        throw new UnsupportedBrowserError('Web Crypto API is not supported');
    }
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return base64UrlEncode(new Uint8Array(hashBuffer));
}
/**
 * Base64URL エンコード
 */
function base64UrlEncode(buffer) {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
/**
 * Base64URL デコード
 */
function base64UrlDecode(str) {
    // パディングを追加
    const padded = str + '='.repeat((4 - str.length % 4) % 4);
    // URL-safe文字を標準Base64文字に変換
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}
/**
 * PKCEパラメータを生成
 */
async function generatePKCEParams() {
    try {
        const codeVerifier = generateRandomString(128);
        const codeChallenge = await sha256Base64Url(codeVerifier);
        return {
            codeVerifier,
            codeChallenge,
            codeChallengeMethod: 'S256'
        };
    }
    catch (error) {
        throw new PKCEError('PKCEパラメータの生成に失敗しました', error instanceof Error ? error : undefined);
    }
}
/**
 * JWTトークンをデコード（署名検証なし）
 */
function decodeJWT(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
        }
        const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])));
        return payload;
    }
    catch (error) {
        throw new AuthenticationError('JWTトークンのデコードに失敗しました', exports.ErrorCode.INVALID_TOKEN, error instanceof Error ? error : undefined);
    }
}
/**
 * JWTトークンの有効期限をチェック
 */
function isTokenExpired(token, clockSkewLeeway = 60) {
    try {
        const payload = decodeJWT(token);
        const now = Math.floor(Date.now() / 1000);
        return payload.exp ? payload.exp + clockSkewLeeway < now : false;
    }
    catch {
        return true; // デコードできない場合は期限切れとして扱う
    }
}
/**
 * URLクエリパラメータをパース
 */
function parseUrlParams(url) {
    try {
        const urlObj = new URL(url);
        const params = {};
        urlObj.searchParams.forEach((value, key) => {
            params[key] = value;
        });
        return params;
    }
    catch (error) {
        throw new AuthenticationError('URLパラメータの解析に失敗しました', exports.ErrorCode.INVALID_STATE, error instanceof Error ? error : undefined);
    }
}
/**
 * OAuth2エラーパラメータをパース
 */
function parseErrorParams(params) {
    if (!params.error) {
        return null;
    }
    return {
        error: params.error,
        error_description: params.error_description,
        error_uri: params.error_uri,
        state: params.state
    };
}
/**
 * 設定を検証・補完
 */
function resolveConfig(config) {
    // 必須パラメータの検証
    if (!config.clientId) {
        throw new ConfigurationError('clientId is required', exports.ErrorCode.MISSING_REQUIRED_PARAMETER);
    }
    if (!config.issuer) {
        throw new ConfigurationError('issuer is required', exports.ErrorCode.MISSING_REQUIRED_PARAMETER);
    }
    // デフォルト値の設定
    const defaultRedirectUri = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : 'http://localhost:3000/auth/callback';
    const resolved = {
        clientId: config.clientId,
        issuer: config.issuer.replace(/\/$/, ''), // 末尾のスラッシュを除去
        redirectUri: config.redirectUri || defaultRedirectUri,
        scopes: config.scopes || ['openid', 'profile', 'email'],
        tokenStorage: config.tokenStorage || 'localStorage',
        storagePrefix: config.storagePrefix || 'noraneko_',
        clockSkewLeeway: config.clockSkewLeeway || 60,
        refreshThreshold: config.refreshThreshold || 300,
        responseType: config.responseType || 'code',
        additionalParams: config.additionalParams || {},
        endpoints: {
            authorization: `${config.issuer.replace(/\/$/, '')}/oauth2/authorize`,
            token: `${config.issuer.replace(/\/$/, '')}/oauth2/token`,
            userinfo: `${config.issuer.replace(/\/$/, '')}/oauth2/userinfo`,
            revocation: `${config.issuer.replace(/\/$/, '')}/oauth2/revoke`,
            logout: `${config.issuer.replace(/\/$/, '')}/auth/logout`
        }
    };
    return resolved;
}
/**
 * ストレージインスタンスを作成
 */
function createStorage(type) {
    switch (type) {
        case 'localStorage':
            if (typeof window === 'undefined' || !window.localStorage) {
                throw new StorageError('localStorage is not available');
            }
            return {
                getItem: (key) => window.localStorage.getItem(key),
                setItem: (key, value) => window.localStorage.setItem(key, value),
                removeItem: (key) => window.localStorage.removeItem(key),
                clear: () => window.localStorage.clear()
            };
        case 'sessionStorage':
            if (typeof window === 'undefined' || !window.sessionStorage) {
                throw new StorageError('sessionStorage is not available');
            }
            return {
                getItem: (key) => window.sessionStorage.getItem(key),
                setItem: (key, value) => window.sessionStorage.setItem(key, value),
                removeItem: (key) => window.sessionStorage.removeItem(key),
                clear: () => window.sessionStorage.clear()
            };
        case 'memory':
            const memoryStore = new Map();
            return {
                getItem: (key) => memoryStore.get(key) || null,
                setItem: (key, value) => { memoryStore.set(key, value); },
                removeItem: (key) => { memoryStore.delete(key); },
                clear: () => { memoryStore.clear(); }
            };
        default:
            throw new StorageError(`Unsupported storage type: ${type}`);
    }
}
/**
 * 現在時刻のUNIXタイムスタンプを取得（秒）
 */
function getCurrentTimestamp() {
    return Math.floor(Date.now() / 1000);
}
/**
 * URLにクエリパラメータを追加
 */
function addQueryParams(url, params) {
    const urlObj = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
        if (value) {
            urlObj.searchParams.set(key, value);
        }
    });
    return urlObj.toString();
}
/**
 * ブラウザが必要なAPIをサポートしているかチェック
 */
function checkBrowserSupport() {
    const missing = [];
    if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
        missing.push('crypto.getRandomValues');
    }
    if (typeof crypto === 'undefined' || !crypto.subtle) {
        missing.push('crypto.subtle');
    }
    if (typeof URL === 'undefined') {
        missing.push('URL');
    }
    if (typeof TextEncoder === 'undefined') {
        missing.push('TextEncoder');
    }
    if (typeof TextDecoder === 'undefined') {
        missing.push('TextDecoder');
    }
    if (missing.length > 0) {
        throw new UnsupportedBrowserError(`このブラウザは必要なAPIをサポートしていません: ${missing.join(', ')}`, { missingAPIs: missing });
    }
}
/**
 * デバッグ用のログ出力（本番環境では無効）
 */
function debugLog(message, data) {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log(`[noraneko-id] ${message}`, data || '');
    }
}

/**
 * noraneko-id SDK メインクラス
 */
/**
 * noraneko-id JavaScript SDK メインクラス
 */
class NoranekoID {
    constructor(config) {
        // ブラウザサポートチェック
        checkBrowserSupport();
        // 設定の解決と検証
        this.config = resolveConfig(config);
        // ストレージの初期化
        this.storage = createStorage(this.config.tokenStorage);
        // 状態の初期化
        this.state = {
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
            expiresAt: null,
            scopes: []
        };
        // イベントリスナーの初期化
        this.eventListeners = new Map();
        // 既存のトークンを復元
        this.restoreTokens();
        debugLog('NoranekoID initialized', {
            clientId: this.config.clientId,
            issuer: this.config.issuer
        });
    }
    /**
     * イベントリスナーを追加
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event).add(callback);
    }
    /**
     * イベントリスナーを削除
     */
    off(event, callback) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.delete(callback);
        }
    }
    /**
     * イベントを発火
     */
    emit(event, data) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                }
                catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
    /**
     * OAuth2認証フローを開始
     */
    async startAuth(options = {}) {
        try {
            debugLog('Starting authentication', options);
            // PKCE パラメータを生成
            const pkceParams = await generatePKCEParams();
            // State パラメータを生成（指定されていない場合）
            const state = options.state || generateRandomString(32);
            // スコープの設定
            const scopes = options.scopes || this.config.scopes;
            const scope = scopes.join(' ');
            // リダイレクトURIの設定
            const redirectUri = options.redirectUri || this.config.redirectUri;
            // 認証URLのパラメータを構築
            const authParams = {
                response_type: this.config.responseType,
                client_id: this.config.clientId,
                redirect_uri: redirectUri,
                scope,
                state,
                code_challenge: pkceParams.codeChallenge,
                code_challenge_method: pkceParams.codeChallengeMethod,
                ...this.config.additionalParams,
                ...options.additionalParams
            };
            // PKCE情報をストレージに保存
            this.saveToStorage('pkce_code_verifier', pkceParams.codeVerifier);
            this.saveToStorage('pkce_state', state);
            // 認証URLを構築してリダイレクト
            const authUrl = addQueryParams(this.config.endpoints.authorization, authParams);
            debugLog('Redirecting to authorization endpoint', { authUrl });
            if (typeof window !== 'undefined') {
                window.location.href = authUrl;
            }
            else {
                throw new ConfigurationError('startAuth can only be called in browser environment');
            }
        }
        catch (error) {
            this.emit('error', error instanceof Error ? error : new Error('Unknown error'));
            throw error;
        }
    }
    /**
     * OAuth2コールバックを処理
     */
    async handleCallback(url) {
        try {
            // URLの取得
            const callbackUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
            if (!callbackUrl) {
                throw new AuthenticationError('Callback URL is not available', exports.ErrorCode.INVALID_STATE);
            }
            debugLog('Handling callback', { url: callbackUrl });
            // URLパラメータをパース
            const params = parseUrlParams(callbackUrl);
            // エラーパラメータをチェック
            const errorDetails = parseErrorParams(params);
            if (errorDetails) {
                throw createOAuth2Error(errorDetails.error, errorDetails.error_description, errorDetails.error_uri, errorDetails.state);
            }
            // 認可コードとStateを検証
            const code = params.code;
            const returnedState = params.state;
            if (!code) {
                throw new AuthenticationError('Authorization code not found', exports.ErrorCode.AUTHENTICATION_FAILED);
            }
            // Stateの検証
            const storedState = this.getFromStorage('pkce_state');
            if (!storedState || storedState !== returnedState) {
                throw new AuthenticationError('Invalid state parameter', exports.ErrorCode.INVALID_STATE);
            }
            // PKCE Code Verifierを取得
            const codeVerifier = this.getFromStorage('pkce_code_verifier');
            if (!codeVerifier) {
                throw new AuthenticationError('PKCE code verifier not found', exports.ErrorCode.PKCE_ERROR);
            }
            // アクセストークンを取得
            const tokenResponse = await this.exchangeCodeForToken(code, codeVerifier);
            // トークンを保存
            await this.saveTokens(tokenResponse);
            // PKCE関連のデータをクリア
            this.removeFromStorage('pkce_code_verifier');
            this.removeFromStorage('pkce_state');
            debugLog('Authentication successful');
            return tokenResponse;
        }
        catch (error) {
            this.emit('error', error instanceof Error ? error : new Error('Unknown error'));
            throw error;
        }
    }
    /**
     * 認証状態を確認
     */
    async isAuthenticated() {
        if (!this.state.accessToken) {
            return false;
        }
        // トークンの有効期限をチェック
        if (isTokenExpired(this.state.accessToken, this.config.clockSkewLeeway)) {
            // リフレッシュトークンがある場合は更新を試行
            if (this.state.refreshToken) {
                try {
                    await this.refreshTokens();
                    return true;
                }
                catch {
                    await this.clearTokens();
                    return false;
                }
            }
            else {
                await this.clearTokens();
                return false;
            }
        }
        return true;
    }
    /**
     * ユーザー情報を取得
     */
    async getUser() {
        if (!(await this.isAuthenticated())) {
            return null;
        }
        if (this.state.user) {
            return this.state.user;
        }
        try {
            const user = await this.fetchUserInfo();
            this.state.user = user;
            return user;
        }
        catch (error) {
            this.emit('error', error instanceof Error ? error : new Error('Failed to fetch user info'));
            throw error;
        }
    }
    /**
     * アクセストークンを取得
     */
    async getAccessToken() {
        if (!(await this.isAuthenticated())) {
            return null;
        }
        return this.state.accessToken;
    }
    /**
     * トークンを手動で更新
     */
    async refreshTokens() {
        if (!this.state.refreshToken) {
            throw new AuthenticationError('No refresh token available', exports.ErrorCode.TOKEN_REFRESH_FAILED);
        }
        try {
            debugLog('Refreshing tokens');
            const tokenResponse = await this.requestTokenRefresh(this.state.refreshToken);
            await this.saveTokens(tokenResponse);
            this.emit('tokenRefreshed', tokenResponse);
            return tokenResponse;
        }
        catch (error) {
            await this.clearTokens();
            const authError = error instanceof AuthenticationError
                ? error
                : new AuthenticationError('Token refresh failed', exports.ErrorCode.TOKEN_REFRESH_FAILED, error instanceof Error ? error : undefined);
            this.emit('error', authError);
            throw authError;
        }
    }
    /**
     * ログアウト
     */
    async logout(options = {}) {
        try {
            debugLog('Logging out', options);
            // ローカルトークンをクリア
            await this.clearTokens();
            // サーバー側のセッションもクリアする場合
            if (!options.localOnly) {
                // TODO: サーバー側のログアウトエンドポイントを呼び出し
                // 現在のバックエンド実装では明示的なログアウトエンドポイントがないため
                // 将来的に実装される予定
            }
            // ログアウト後のリダイレクト
            if (options.returnTo && typeof window !== 'undefined') {
                window.location.href = options.returnTo;
            }
            this.emit('unauthenticated', undefined);
        }
        catch (error) {
            this.emit('error', error instanceof Error ? error : new Error('Logout failed'));
            throw error;
        }
    }
    /**
     * 認可コードをアクセストークンに交換
     */
    async exchangeCodeForToken(code, codeVerifier) {
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: this.config.clientId,
            code,
            redirect_uri: this.config.redirectUri,
            code_verifier: codeVerifier
        });
        const response = await fetch(this.config.endpoints.token, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });
        if (!response.ok) {
            throw createNetworkError(response);
        }
        const data = await response.json();
        if (data.error) {
            throw createOAuth2Error(data.error, data.error_description, data.error_uri);
        }
        return data;
    }
    /**
     * リフレッシュトークンを使ってアクセストークンを更新
     */
    async requestTokenRefresh(refreshToken) {
        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: this.config.clientId,
            refresh_token: refreshToken
        });
        const response = await fetch(this.config.endpoints.token, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });
        if (!response.ok) {
            throw createNetworkError(response);
        }
        const data = await response.json();
        if (data.error) {
            throw createOAuth2Error(data.error, data.error_description, data.error_uri);
        }
        return data;
    }
    /**
     * ユーザー情報を取得
     */
    async fetchUserInfo() {
        if (!this.state.accessToken) {
            throw new AuthenticationError('No access token available', exports.ErrorCode.AUTHENTICATION_FAILED);
        }
        const response = await fetch(this.config.endpoints.userinfo, {
            headers: {
                'Authorization': `Bearer ${this.state.accessToken}`
            }
        });
        if (!response.ok) {
            throw createNetworkError(response);
        }
        return await response.json();
    }
    /**
     * トークンを保存
     */
    async saveTokens(tokenResponse) {
        this.state.accessToken = tokenResponse.access_token;
        this.state.refreshToken = tokenResponse.refresh_token || null;
        // 有効期限を計算
        if (tokenResponse.expires_in) {
            this.state.expiresAt = getCurrentTimestamp() + tokenResponse.expires_in;
        }
        // スコープを保存
        if (tokenResponse.scope) {
            this.state.scopes = tokenResponse.scope.split(' ');
        }
        // ストレージに保存
        this.saveToStorage('access_token', this.state.accessToken);
        if (this.state.refreshToken) {
            this.saveToStorage('refresh_token', this.state.refreshToken);
        }
        if (this.state.expiresAt) {
            this.saveToStorage('expires_at', this.state.expiresAt.toString());
        }
        this.saveToStorage('scopes', this.state.scopes.join(' '));
        // 状態を更新
        this.state.isAuthenticated = true;
        // ユーザー情報を取得
        try {
            this.state.user = await this.fetchUserInfo();
            this.emit('authenticated', this.state.user);
        }
        catch (error) {
            debugLog('Failed to fetch user info after token save', error);
        }
        // 自動リフレッシュタイマーを設定
        this.scheduleTokenRefresh();
    }
    /**
     * トークンをクリア
     */
    async clearTokens() {
        // 状態をクリア
        this.state = {
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
            expiresAt: null,
            scopes: []
        };
        // ストレージをクリア
        this.removeFromStorage('access_token');
        this.removeFromStorage('refresh_token');
        this.removeFromStorage('expires_at');
        this.removeFromStorage('scopes');
        // リフレッシュタイマーをクリア
        this.clearRefreshTimer();
    }
    /**
     * ストレージからトークンを復元
     */
    restoreTokens() {
        const accessToken = this.getFromStorage('access_token');
        const refreshToken = this.getFromStorage('refresh_token');
        const expiresAtStr = this.getFromStorage('expires_at');
        const scopesStr = this.getFromStorage('scopes');
        if (!accessToken) {
            return;
        }
        this.state.accessToken = accessToken;
        this.state.refreshToken = refreshToken;
        this.state.expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : null;
        this.state.scopes = scopesStr ? scopesStr.split(' ') : [];
        // トークンの有効性をチェック
        if (!isTokenExpired(accessToken, this.config.clockSkewLeeway)) {
            this.state.isAuthenticated = true;
            this.scheduleTokenRefresh();
        }
        else {
            // 期限切れの場合はクリア
            this.clearTokens();
        }
    }
    /**
     * 自動リフレッシュタイマーを設定
     */
    scheduleTokenRefresh() {
        this.clearRefreshTimer();
        if (!this.state.expiresAt || !this.state.refreshToken) {
            return;
        }
        const now = getCurrentTimestamp();
        const refreshTime = this.state.expiresAt - this.config.refreshThreshold;
        const delay = Math.max(0, refreshTime - now) * 1000; // ミリ秒に変換
        if (delay > 0) {
            this.refreshTimer = window.setTimeout(async () => {
                try {
                    await this.refreshTokens();
                }
                catch (error) {
                    this.emit('tokenExpired', undefined);
                }
            }, delay);
        }
    }
    /**
     * リフレッシュタイマーをクリア
     */
    clearRefreshTimer() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = undefined;
        }
    }
    /**
     * ストレージに値を保存
     */
    saveToStorage(key, value) {
        try {
            this.storage.setItem(this.config.storagePrefix + key, value);
        }
        catch (error) {
            debugLog('Failed to save to storage', { key, error });
        }
    }
    /**
     * ストレージから値を取得
     */
    getFromStorage(key) {
        try {
            return this.storage.getItem(this.config.storagePrefix + key);
        }
        catch (error) {
            debugLog('Failed to get from storage', { key, error });
            return null;
        }
    }
    /**
     * ストレージから値を削除
     */
    removeFromStorage(key) {
        try {
            this.storage.removeItem(this.config.storagePrefix + key);
        }
        catch (error) {
            debugLog('Failed to remove from storage', { key, error });
        }
    }
}

/**
 * noraneko-id JavaScript SDK
 *
 * OAuth2 + PKCE認証を簡単に実装するためのSDK
 */
// メインクラス

exports.AuthenticationError = AuthenticationError;
exports.ConfigurationError = ConfigurationError;
exports.NetworkError = NetworkError;
exports.NoranekoID = NoranekoID;
exports.NoranekoIDError = NoranekoIDError;
exports.PKCEError = PKCEError;
exports.StorageError = StorageError;
exports.UnsupportedBrowserError = UnsupportedBrowserError;
exports.base64UrlDecode = base64UrlDecode;
exports.base64UrlEncode = base64UrlEncode;
exports.checkBrowserSupport = checkBrowserSupport;
exports.createNetworkError = createNetworkError;
exports.createOAuth2Error = createOAuth2Error;
exports.decodeJWT = decodeJWT;
exports.default = NoranekoID;
exports.generateRandomString = generateRandomString;
exports.isTokenExpired = isTokenExpired;
exports.parseUrlParams = parseUrlParams;
//# sourceMappingURL=index.js.map
