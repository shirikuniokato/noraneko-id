/**
 * noraneko-id SDK メインクラス
 */

import {
  NoranekoIDConfig,
  ResolvedConfig,
  AuthOptions,
  TokenResponse,
  RefreshTokenResponse,
  User,
  AuthState,
  LogoutOptions,
  NoranekoIDEventType,
  EventCallback,
  NoranekoIDEventData,
  TokenStorage
} from './types';

import {
  AuthenticationError,
  ConfigurationError,
  ErrorCode,
  createOAuth2Error,
  createNetworkError
} from './errors';

import {
  resolveConfig,
  createStorage,
  generatePKCEParams,
  generateRandomString,
  parseUrlParams,
  parseErrorParams,
  isTokenExpired,
  getCurrentTimestamp,
  addQueryParams,
  checkBrowserSupport,
  debugLog
} from './utils';

/**
 * noraneko-id JavaScript SDK メインクラス
 */
export class NoranekoID {
  private config: ResolvedConfig;
  private storage: TokenStorage;
  private state: AuthState;
  private eventListeners: Map<NoranekoIDEventType, Set<EventCallback<any>>>;
  private refreshTimer?: number;

  constructor(config: NoranekoIDConfig) {
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
  public on<T extends NoranekoIDEventType>(
    event: T,
    callback: EventCallback<T>
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * イベントリスナーを削除
   */
  public off<T extends NoranekoIDEventType>(
    event: T,
    callback: EventCallback<T>
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * イベントを発火
   */
  private emit<T extends NoranekoIDEventType>(
    event: T,
    data: NoranekoIDEventData[T]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * OAuth2認証フローを開始
   */
  public async startAuth(options: AuthOptions = {}): Promise<void> {
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
      const authParams: Record<string, string> = {
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
      } else {
        throw new ConfigurationError('startAuth can only be called in browser environment');
      }
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * OAuth2コールバックを処理
   */
  public async handleCallback(url?: string): Promise<TokenResponse> {
    try {
      // URLの取得
      const callbackUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
      if (!callbackUrl) {
        throw new AuthenticationError(
          'Callback URL is not available',
          ErrorCode.INVALID_STATE
        );
      }

      debugLog('Handling callback', { url: callbackUrl });

      // URLパラメータをパース
      const params = parseUrlParams(callbackUrl);
      
      // エラーパラメータをチェック
      const errorDetails = parseErrorParams(params);
      if (errorDetails) {
        throw createOAuth2Error(
          errorDetails.error,
          errorDetails.error_description,
          errorDetails.error_uri,
          errorDetails.state
        );
      }

      // 認可コードとStateを検証
      const code = params.code;
      const returnedState = params.state;
      
      if (!code) {
        throw new AuthenticationError(
          'Authorization code not found',
          ErrorCode.AUTHENTICATION_FAILED
        );
      }

      // Stateの検証
      const storedState = this.getFromStorage('pkce_state');
      if (!storedState || storedState !== returnedState) {
        throw new AuthenticationError(
          'Invalid state parameter',
          ErrorCode.INVALID_STATE
        );
      }

      // PKCE Code Verifierを取得
      const codeVerifier = this.getFromStorage('pkce_code_verifier');
      if (!codeVerifier) {
        throw new AuthenticationError(
          'PKCE code verifier not found',
          ErrorCode.PKCE_ERROR
        );
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
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * 認証状態を確認
   */
  public async isAuthenticated(): Promise<boolean> {
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
        } catch {
          await this.clearTokens();
          return false;
        }
      } else {
        await this.clearTokens();
        return false;
      }
    }

    return true;
  }

  /**
   * ユーザー情報を取得
   */
  public async getUser(): Promise<User | null> {
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
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error('Failed to fetch user info'));
      throw error;
    }
  }

  /**
   * アクセストークンを取得
   */
  public async getAccessToken(): Promise<string | null> {
    if (!(await this.isAuthenticated())) {
      return null;
    }
    return this.state.accessToken;
  }

  /**
   * トークンを手動で更新
   */
  public async refreshTokens(): Promise<TokenResponse> {
    if (!this.state.refreshToken) {
      throw new AuthenticationError(
        'No refresh token available',
        ErrorCode.TOKEN_REFRESH_FAILED
      );
    }

    try {
      debugLog('Refreshing tokens');
      
      const tokenResponse = await this.requestTokenRefresh(this.state.refreshToken);
      await this.saveTokens(tokenResponse);
      
      this.emit('tokenRefreshed', tokenResponse);
      
      return tokenResponse;
    } catch (error) {
      await this.clearTokens();
      
      const authError = error instanceof AuthenticationError 
        ? error 
        : new AuthenticationError(
            'Token refresh failed',
            ErrorCode.TOKEN_REFRESH_FAILED,
            error instanceof Error ? error : undefined
          );
      
      this.emit('error', authError);
      throw authError;
    }
  }

  /**
   * ログアウト
   */
  public async logout(options: LogoutOptions = {}): Promise<void> {
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
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error('Logout failed'));
      throw error;
    }
  }

  /**
   * 認可コードをアクセストークンに交換
   */
  private async exchangeCodeForToken(code: string, codeVerifier: string): Promise<TokenResponse> {
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
      throw createOAuth2Error(
        data.error,
        data.error_description,
        data.error_uri
      );
    }

    return data;
  }

  /**
   * リフレッシュトークンを使ってアクセストークンを更新
   */
  private async requestTokenRefresh(refreshToken: string): Promise<RefreshTokenResponse> {
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
      throw createOAuth2Error(
        data.error,
        data.error_description,
        data.error_uri
      );
    }

    return data;
  }

  /**
   * ユーザー情報を取得
   */
  private async fetchUserInfo(): Promise<User> {
    if (!this.state.accessToken) {
      throw new AuthenticationError(
        'No access token available',
        ErrorCode.AUTHENTICATION_FAILED
      );
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
  private async saveTokens(tokenResponse: TokenResponse): Promise<void> {
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
    } catch (error) {
      debugLog('Failed to fetch user info after token save', error);
    }

    // 自動リフレッシュタイマーを設定
    this.scheduleTokenRefresh();
  }

  /**
   * トークンをクリア
   */
  private async clearTokens(): Promise<void> {
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
  private restoreTokens(): void {
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
    } else {
      // 期限切れの場合はクリア
      this.clearTokens();
    }
  }

  /**
   * 自動リフレッシュタイマーを設定
   */
  private scheduleTokenRefresh(): void {
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
        } catch (error) {
          this.emit('tokenExpired', undefined);
        }
      }, delay);
    }
  }

  /**
   * リフレッシュタイマーをクリア
   */
  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  /**
   * ストレージに値を保存
   */
  private saveToStorage(key: string, value: string): void {
    try {
      this.storage.setItem(this.config.storagePrefix + key, value);
    } catch (error) {
      debugLog('Failed to save to storage', { key, error });
    }
  }

  /**
   * ストレージから値を取得
   */
  private getFromStorage(key: string): string | null {
    try {
      return this.storage.getItem(this.config.storagePrefix + key);
    } catch (error) {
      debugLog('Failed to get from storage', { key, error });
      return null;
    }
  }

  /**
   * ストレージから値を削除
   */
  private removeFromStorage(key: string): void {
    try {
      this.storage.removeItem(this.config.storagePrefix + key);
    } catch (error) {
      debugLog('Failed to remove from storage', { key, error });
    }
  }
}