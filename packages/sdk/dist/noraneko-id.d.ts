/**
 * noraneko-id SDK メインクラス
 */
import { NoranekoIDConfig, AuthOptions, TokenResponse, User, LogoutOptions, NoranekoIDEventType, EventCallback } from './types';
/**
 * noraneko-id JavaScript SDK メインクラス
 */
export declare class NoranekoID {
    private config;
    private storage;
    private state;
    private eventListeners;
    private refreshTimer?;
    constructor(config: NoranekoIDConfig);
    /**
     * イベントリスナーを追加
     */
    on<T extends NoranekoIDEventType>(event: T, callback: EventCallback<T>): void;
    /**
     * イベントリスナーを削除
     */
    off<T extends NoranekoIDEventType>(event: T, callback: EventCallback<T>): void;
    /**
     * イベントを発火
     */
    private emit;
    /**
     * OAuth2認証フローを開始
     */
    startAuth(options?: AuthOptions): Promise<void>;
    /**
     * OAuth2コールバックを処理
     */
    handleCallback(url?: string): Promise<TokenResponse>;
    /**
     * 認証状態を確認
     */
    isAuthenticated(): Promise<boolean>;
    /**
     * ユーザー情報を取得
     */
    getUser(): Promise<User | null>;
    /**
     * アクセストークンを取得
     */
    getAccessToken(): Promise<string | null>;
    /**
     * トークンを手動で更新
     */
    refreshTokens(): Promise<TokenResponse>;
    /**
     * ログアウト
     */
    logout(options?: LogoutOptions): Promise<void>;
    /**
     * 認可コードをアクセストークンに交換
     */
    private exchangeCodeForToken;
    /**
     * リフレッシュトークンを使ってアクセストークンを更新
     */
    private requestTokenRefresh;
    /**
     * ユーザー情報を取得
     */
    private fetchUserInfo;
    /**
     * トークンを保存
     */
    private saveTokens;
    /**
     * トークンをクリア
     */
    private clearTokens;
    /**
     * ストレージからトークンを復元
     */
    private restoreTokens;
    /**
     * 自動リフレッシュタイマーを設定
     */
    private scheduleTokenRefresh;
    /**
     * リフレッシュタイマーをクリア
     */
    private clearRefreshTimer;
    /**
     * ストレージに値を保存
     */
    private saveToStorage;
    /**
     * ストレージから値を取得
     */
    private getFromStorage;
    /**
     * ストレージから値を削除
     */
    private removeFromStorage;
}
//# sourceMappingURL=noraneko-id.d.ts.map