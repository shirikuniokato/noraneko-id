'use client';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import React, { createContext, useReducer, useRef, useEffect, useCallback, useMemo, useContext } from 'react';
import { NoranekoID } from '@noraneko/id-sdk';
export { AuthenticationError, ConfigurationError, ErrorCode, NetworkError, NoranekoIDError, PKCEError, StorageError, UnsupportedBrowserError } from '@noraneko/id-sdk';

/**
 * NoranekoID React Context
 */
/**
 * NoranekoID Context
 *
 * 認証状態とSDK機能をReactアプリ全体で共有するためのContext
 */
const NoranekoIDContext = createContext(null);
/**
 * Context表示名（デバッグ用）
 */
NoranekoIDContext.displayName = 'NoranekoIDContext';

/**
 * NoranekoID State Reducer
 */
/**
 * 初期状態
 */
const initialState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitializing: true,
    error: null,
};
/**
 * 状態管理用Reducer
 *
 * 認証状態の変更を一元的に管理
 */
function noranekoIDReducer(state, action) {
    switch (action.type) {
        case 'INITIALIZE_START':
            return {
                ...state,
                isInitializing: true,
                isLoading: true,
                error: null,
            };
        case 'INITIALIZE_SUCCESS':
            return {
                ...state,
                isInitializing: false,
                isLoading: false,
                error: null,
            };
        case 'INITIALIZE_ERROR':
            return {
                ...state,
                isInitializing: false,
                isLoading: false,
                error: action.payload,
            };
        case 'AUTH_START':
            return {
                ...state,
                isLoading: true,
                error: null,
            };
        case 'AUTH_SUCCESS':
            return {
                ...state,
                user: action.payload,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            };
        case 'AUTH_ERROR':
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: action.payload,
            };
        case 'LOGOUT_START':
            return {
                ...state,
                isLoading: true,
                error: null,
            };
        case 'LOGOUT_SUCCESS':
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            };
        case 'LOGOUT_ERROR':
            return {
                ...state,
                isLoading: false,
                error: action.payload,
            };
        case 'USER_UPDATE':
            return {
                ...state,
                user: action.payload,
                isAuthenticated: action.payload !== null,
            };
        case 'TOKEN_REFRESH_START':
            return {
                ...state,
                isLoading: true,
                error: null,
            };
        case 'TOKEN_REFRESH_SUCCESS':
            return {
                ...state,
                isLoading: false,
                error: null,
            };
        case 'TOKEN_REFRESH_ERROR':
            return {
                ...state,
                isLoading: false,
                error: action.payload,
            };
        case 'CLEAR_ERROR':
            return {
                ...state,
                error: null,
            };
        case 'SET_LOADING':
            return {
                ...state,
                isLoading: action.payload,
            };
        default:
            return state;
    }
}

/**
 * NoranekoID Provider Component
 */
/**
 * NoranekoID Provider Component
 *
 * アプリケーション全体に認証機能を提供するProvider
 */
function NoranekoIDProvider({ config, children, loadingComponent, errorComponent, onInitialized, onInitializationError, }) {
    const [state, dispatch] = useReducer(noranekoIDReducer, initialState);
    const sdkRef = useRef(null);
    const eventListenersRef = useRef(new Map());
    // SDK初期化
    useEffect(() => {
        let isMounted = true;
        async function initializeSDK() {
            try {
                dispatch({ type: 'INITIALIZE_START' });
                // SDK インスタンス作成
                const sdk = new NoranekoID(config);
                sdkRef.current = sdk;
                // SDK イベントリスナーを設定
                sdk.on('authenticated', (user) => {
                    if (isMounted) {
                        dispatch({ type: 'AUTH_SUCCESS', payload: user });
                    }
                });
                sdk.on('unauthenticated', () => {
                    if (isMounted) {
                        dispatch({ type: 'LOGOUT_SUCCESS' });
                    }
                });
                sdk.on('tokenRefreshed', (tokens) => {
                    if (isMounted) {
                        dispatch({ type: 'TOKEN_REFRESH_SUCCESS' });
                    }
                });
                sdk.on('error', (error) => {
                    if (isMounted) {
                        dispatch({ type: 'AUTH_ERROR', payload: error });
                    }
                });
                sdk.on('tokenExpired', () => {
                    if (isMounted) {
                        dispatch({ type: 'TOKEN_REFRESH_ERROR', payload: new Error('Token expired') });
                    }
                });
                // 認証状態を確認
                const isAuthenticated = await sdk.isAuthenticated();
                if (isAuthenticated) {
                    const user = await sdk.getUser();
                    if (isMounted && user) {
                        dispatch({ type: 'AUTH_SUCCESS', payload: user });
                    }
                }
                if (isMounted) {
                    dispatch({ type: 'INITIALIZE_SUCCESS' });
                    onInitialized?.();
                }
            }
            catch (error) {
                if (isMounted) {
                    const err = error instanceof Error ? error : new Error('Initialization failed');
                    dispatch({ type: 'INITIALIZE_ERROR', payload: err });
                    onInitializationError?.(err);
                }
            }
        }
        initializeSDK();
        return () => {
            isMounted = false;
        };
    }, [config, onInitialized, onInitializationError]);
    // コールバック処理（URLにコールバックパラメータがある場合）
    useEffect(() => {
        if (typeof window === 'undefined' || !sdkRef.current || state.isInitializing) {
            return;
        }
        const url = window.location.href;
        const urlParams = new URLSearchParams(window.location.search);
        // OAuth2コールバックパラメータをチェック
        if (urlParams.has('code') && urlParams.has('state')) {
            let isMounted = true;
            async function handleCallback() {
                try {
                    if (!sdkRef.current || !isMounted)
                        return;
                    dispatch({ type: 'AUTH_START' });
                    await sdkRef.current.handleCallback(url);
                    // コールバック成功後、URLをクリーンアップ
                    if (typeof window !== 'undefined') {
                        const cleanUrl = window.location.origin + window.location.pathname;
                        window.history.replaceState({}, document.title, cleanUrl);
                    }
                }
                catch (error) {
                    if (isMounted) {
                        const err = error instanceof Error ? error : new Error('Callback handling failed');
                        dispatch({ type: 'AUTH_ERROR', payload: err });
                    }
                }
            }
            handleCallback();
            return () => {
                isMounted = false;
            };
        }
    }, [state.isInitializing]);
    // ログイン関数
    const login = useCallback(async (options) => {
        if (!sdkRef.current) {
            throw new Error('SDK not initialized');
        }
        try {
            dispatch({ type: 'AUTH_START' });
            await sdkRef.current.startAuth(options);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Login failed');
            dispatch({ type: 'AUTH_ERROR', payload: err });
            throw err;
        }
    }, []);
    // ログアウト関数
    const logout = useCallback(async (options) => {
        if (!sdkRef.current) {
            throw new Error('SDK not initialized');
        }
        try {
            dispatch({ type: 'LOGOUT_START' });
            await sdkRef.current.logout(options);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Logout failed');
            dispatch({ type: 'LOGOUT_ERROR', payload: err });
            throw err;
        }
    }, []);
    // アクセストークン取得
    const getAccessToken = useCallback(async () => {
        if (!sdkRef.current) {
            return null;
        }
        try {
            return await sdkRef.current.getAccessToken();
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Failed to get access token');
            dispatch({ type: 'AUTH_ERROR', payload: err });
            return null;
        }
    }, []);
    // ユーザー情報更新
    const refreshUser = useCallback(async () => {
        if (!sdkRef.current) {
            return null;
        }
        try {
            const user = await sdkRef.current.getUser();
            dispatch({ type: 'USER_UPDATE', payload: user });
            return user;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Failed to refresh user');
            dispatch({ type: 'AUTH_ERROR', payload: err });
            return null;
        }
    }, []);
    // トークン更新
    const refreshTokens = useCallback(async () => {
        if (!sdkRef.current) {
            throw new Error('SDK not initialized');
        }
        try {
            dispatch({ type: 'TOKEN_REFRESH_START' });
            const tokens = await sdkRef.current.refreshTokens();
            dispatch({ type: 'TOKEN_REFRESH_SUCCESS' });
            return tokens;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error('Token refresh failed');
            dispatch({ type: 'TOKEN_REFRESH_ERROR', payload: err });
            throw err;
        }
    }, []);
    // イベントリスナー管理
    const addEventListener = useCallback((event, callback) => {
        const listeners = eventListenersRef.current.get(event) || new Set();
        listeners.add(callback);
        eventListenersRef.current.set(event, listeners);
        if (sdkRef.current) {
            sdkRef.current.on(event, callback);
        }
    }, []);
    const removeEventListener = useCallback((event, callback) => {
        const listeners = eventListenersRef.current.get(event);
        if (listeners) {
            listeners.delete(callback);
            if (listeners.size === 0) {
                eventListenersRef.current.delete(event);
            }
        }
        if (sdkRef.current) {
            sdkRef.current.off(event, callback);
        }
    }, []);
    // Context Value を作成
    const contextValue = useMemo(() => ({
        // 状態
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
        isInitializing: state.isInitializing,
        error: state.error,
        // アクション
        login,
        logout,
        getAccessToken,
        refreshUser,
        refreshTokens,
        // SDK インスタンス
        sdk: sdkRef.current,
        // イベント管理
        addEventListener,
        removeEventListener,
    }), [
        state.user,
        state.isAuthenticated,
        state.isLoading,
        state.isInitializing,
        state.error,
        login,
        logout,
        getAccessToken,
        refreshUser,
        refreshTokens,
        addEventListener,
        removeEventListener,
    ]);
    // 初期化エラーの場合
    if (state.error && state.isInitializing) {
        if (errorComponent) {
            return typeof errorComponent === 'function'
                ? errorComponent(state.error)
                : errorComponent;
        }
        return (jsxs("div", { style: { padding: '20px', textAlign: 'center' }, children: [jsx("h3", { children: "\u8A8D\u8A3C\u30B7\u30B9\u30C6\u30E0\u521D\u671F\u5316\u30A8\u30E9\u30FC" }), jsx("p", { children: state.error.message }), jsx("button", { onClick: () => window.location.reload(), children: "\u518D\u8AAD\u307F\u8FBC\u307F" })] }));
    }
    // 初期化中の場合
    if (state.isInitializing) {
        if (loadingComponent) {
            return jsx(Fragment, { children: loadingComponent });
        }
        return (jsx("div", { style: { padding: '20px', textAlign: 'center' }, children: jsx("p", { children: "\u8A8D\u8A3C\u30B7\u30B9\u30C6\u30E0\u3092\u521D\u671F\u5316\u4E2D..." }) }));
    }
    return (jsx(NoranekoIDContext.Provider, { value: contextValue, children: children }));
}

/**
 * useNoranekoID - メイン認証Hook
 */
/**
 * useNoranekoID Hook
 *
 * noraneko-id認証機能の包括的なアクセスを提供するメインHook
 *
 * @param options - Hook オプション
 * @returns 認証状態と操作関数
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     user,
 *     isAuthenticated,
 *     isLoading,
 *     login,
 *     logout
 *   } = useNoranekoID();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return isAuthenticated ? (
 *     <div>
 *       Welcome, {user?.display_name}!
 *       <button onClick={() => logout()}>Logout</button>
 *     </div>
 *   ) : (
 *     <button onClick={() => login()}>Login</button>
 *   );
 * }
 * ```
 */
function useNoranekoID(options = {}) {
    const context = useContext(NoranekoIDContext);
    if (!context) {
        throw new Error('useNoranekoID must be used within a NoranekoIDProvider. ' +
            'Make sure to wrap your component tree with <NoranekoIDProvider>.');
    }
    // コンテキストから必要な値を取得
    const { user, isAuthenticated, isLoading, isInitializing, error, login, logout, getAccessToken, refreshUser, refreshTokens, } = context;
    // オプションに基づいた戻り値の調整
    // 将来的な拡張のために options パラメータを用意
    // 現在は使用していないが、以下のような機能を追加予定:
    // - skipUserInfo: ユーザー情報の自動取得をスキップ
    // - retryCount: エラー時の自動リトライ回数
    // - retryDelay: リトライ間隔
    return {
        // 認証状態
        user,
        isAuthenticated,
        isLoading,
        isInitializing,
        error,
        // 認証操作
        login,
        logout,
        // データ取得・操作
        getAccessToken,
        refreshUser,
        refreshTokens,
    };
}

/**
 * useAuthState - 認証状態専用Hook
 */
/**
 * useAuthState Hook
 *
 * 認証状態のみを監視する軽量Hook
 * ユーザー情報や操作関数が不要な場合に使用
 *
 * @returns 認証状態
 *
 * @example
 * ```tsx
 * function AuthIndicator() {
 *   const { isAuthenticated, isLoading } = useAuthState();
 *
 *   if (isLoading) return <span>⏳</span>;
 *   return <span>{isAuthenticated ? '🔓' : '🔒'}</span>;
 * }
 * ```
 */
function useAuthState() {
    const context = useContext(NoranekoIDContext);
    if (!context) {
        throw new Error('useAuthState must be used within a NoranekoIDProvider. ' +
            'Make sure to wrap your component tree with <NoranekoIDProvider>.');
    }
    return {
        isAuthenticated: context.isAuthenticated,
        isLoading: context.isLoading,
        isInitializing: context.isInitializing,
        error: context.error,
    };
}

/**
 * useUserInfo - ユーザー情報専用Hook
 */
/**
 * useUserInfo Hook
 *
 * ユーザー情報とその管理機能に特化したHook
 * プロフィール表示やユーザー情報更新に使用
 *
 * @returns ユーザー情報と更新関数
 *
 * @example
 * ```tsx
 * function UserProfile() {
 *   const { user, isLoading, refreshUser } = useUserInfo();
 *
 *   if (isLoading) return <div>Loading user...</div>;
 *   if (!user) return <div>No user data</div>;
 *
 *   return (
 *     <div>
 *       <h1>{user.display_name}</h1>
 *       <p>{user.email}</p>
 *       <button onClick={() => refreshUser()}>
 *         Refresh Profile
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
function useUserInfo() {
    const context = useContext(NoranekoIDContext);
    if (!context) {
        throw new Error('useUserInfo must be used within a NoranekoIDProvider. ' +
            'Make sure to wrap your component tree with <NoranekoIDProvider>.');
    }
    return {
        user: context.user,
        isLoading: context.isLoading,
        error: context.error,
        refreshUser: context.refreshUser,
    };
}

/**
 * useAccessToken - アクセストークン管理Hook
 */
/**
 * useAccessToken Hook
 *
 * アクセストークンの取得・管理に特化したHook
 * API呼び出し時のトークン取得に使用
 *
 * @returns アクセストークンと管理関数
 *
 * @example
 * ```tsx
 * function ApiDataFetcher() {
 *   const { getAccessToken, refreshTokens } = useAccessToken();
 *
 *   const fetchData = async () => {
 *     try {
 *       const token = await getAccessToken();
 *       if (!token) {
 *         throw new Error('No access token available');
 *       }
 *
 *       const response = await fetch('/api/data', {
 *         headers: {
 *           'Authorization': `Bearer ${token}`
 *         }
 *       });
 *
 *       if (response.status === 401) {
 *         // トークンが無効な場合は更新を試行
 *         await refreshTokens();
 *         // 再度取得してリトライ...
 *       }
 *
 *       return response.json();
 *     } catch (error) {
 *       console.error('API call failed:', error);
 *     }
 *   };
 *
 *   return (
 *     <button onClick={fetchData}>
 *       Fetch Protected Data
 *     </button>
 *   );
 * }
 * ```
 *
 * @example
 * // カスタムフック内での使用
 * ```tsx
 * function useAuthenticatedFetch() {
 *   const { getAccessToken } = useAccessToken();
 *
 *   return useCallback(async (url: string, options: RequestInit = {}) => {
 *     const token = await getAccessToken();
 *
 *     return fetch(url, {
 *       ...options,
 *       headers: {
 *         ...options.headers,
 *         ...(token && { 'Authorization': `Bearer ${token}` })
 *       }
 *     });
 *   }, [getAccessToken]);
 * }
 * ```
 */
function useAccessToken() {
    const context = useContext(NoranekoIDContext);
    if (!context) {
        throw new Error('useAccessToken must be used within a NoranekoIDProvider. ' +
            'Make sure to wrap your component tree with <NoranekoIDProvider>.');
    }
    // アクセストークンの値は直接公開せず、関数経由でのみ取得可能にする
    // これにより：
    // 1. トークンの最新状態を常に取得できる
    // 2. セキュリティ上の理由でトークンを直接変数に保存しない
    // 3. 取得時に自動的な有効性チェックが可能
    return {
        accessToken: null, // セキュリティのため直接公開しない
        isLoading: context.isLoading,
        error: context.error,
        getAccessToken: context.getAccessToken,
        refreshTokens: context.refreshTokens,
    };
}

/**
 * useAuthActions - 認証操作専用Hook
 */
/**
 * useAuthActions Hook
 *
 * 認証操作（ログイン・ログアウト）に特化したHook
 * ボタンコンポーネントや操作専用コンポーネントで使用
 *
 * @returns 認証操作関数
 *
 * @example
 * ```tsx
 * function AuthButtons() {
 *   const { login, logout, isLoading } = useAuthActions();
 *   const { isAuthenticated } = useAuthState();
 *
 *   const handleLogin = () => {
 *     login({
 *       scopes: ['openid', 'profile', 'email'],
 *       additionalParams: {
 *         prompt: 'login' // 常にログイン画面を表示
 *       }
 *     });
 *   };
 *
 *   const handleLogout = () => {
 *     logout({
 *       returnTo: window.location.origin // ログアウト後にホームに戻る
 *     });
 *   };
 *
 *   if (isLoading) {
 *     return <div>Processing...</div>;
 *   }
 *
 *   return isAuthenticated ? (
 *     <button onClick={handleLogout}>Logout</button>
 *   ) : (
 *     <button onClick={handleLogin}>Login</button>
 *   );
 * }
 * ```
 *
 * @example
 * // 条件付きログイン
 * ```tsx
 * function ConditionalLoginButton({ requiredScopes }: { requiredScopes: string[] }) {
 *   const { login, isLoading } = useAuthActions();
 *
 *   const handleLogin = () => {
 *     login({
 *       scopes: ['openid', ...requiredScopes],
 *       additionalParams: {
 *         prompt: 'consent' // 常に同意画面を表示
 *       }
 *     });
 *   };
 *
 *   return (
 *     <button onClick={handleLogin} disabled={isLoading}>
 *       {isLoading ? 'Logging in...' : 'Login with Enhanced Permissions'}
 *     </button>
 *   );
 * }
 * ```
 */
function useAuthActions() {
    const context = useContext(NoranekoIDContext);
    if (!context) {
        throw new Error('useAuthActions must be used within a NoranekoIDProvider. ' +
            'Make sure to wrap your component tree with <NoranekoIDProvider>.');
    }
    return {
        login: context.login,
        logout: context.logout,
        isLoading: context.isLoading,
        error: context.error,
    };
}

/**
 * ProtectedRoute - 認証保護ルートコンポーネント
 */
/**
 * ProtectedRoute Component
 *
 * 認証が必要なルートを保護するコンポーネント
 * 未認証の場合は自動ログインまたはfallbackコンポーネントを表示
 *
 * @example
 * ```tsx
 * // 基本的な使用
 * function App() {
 *   return (
 *     <NoranekoIDProvider config={config}>
 *       <ProtectedRoute>
 *         <Dashboard />
 *       </ProtectedRoute>
 *     </NoranekoIDProvider>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // カスタムfallback
 * function App() {
 *   return (
 *     <ProtectedRoute
 *       fallback={<LoginPage />}
 *       disableAutoLogin={true}
 *     >
 *       <Dashboard />
 *     </ProtectedRoute>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // 管理者権限が必要なルート
 * function AdminApp() {
 *   return (
 *     <ProtectedRoute
 *       requiredScopes={['admin']}
 *       loginOptions={{
 *         scopes: ['openid', 'profile', 'admin'],
 *         additionalParams: { prompt: 'consent' }
 *       }}
 *       fallback={<div>管理者権限が必要です</div>}
 *     >
 *       <AdminDashboard />
 *     </ProtectedRoute>
 *   );
 * }
 * ```
 */
function ProtectedRoute({ children, fallback, requiredScopes = [], disableAutoLogin = false, loginOptions = {} }) {
    const { isAuthenticated, isLoading, isInitializing } = useAuthState();
    const { login } = useAuthActions();
    // 初期化中はローディング表示
    if (isInitializing || isLoading) {
        return (jsx("div", { style: {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '200px'
            }, children: jsx("div", { children: "\u8A8D\u8A3C\u72B6\u614B\u3092\u78BA\u8A8D\u4E2D..." }) }));
    }
    // 認証済みの場合は子コンポーネントを表示
    if (isAuthenticated) {
        // TODO: 将来的にスコープチェック機能を追加
        // 現在はisAuthenticatedのみチェック
        return jsx(Fragment, { children: children });
    }
    // 未認証の場合
    if (fallback || disableAutoLogin) {
        // fallbackコンポーネントがある、または自動ログインが無効な場合
        return jsx(Fragment, { children: fallback || jsx("div", { children: "\u30ED\u30B0\u30A4\u30F3\u304C\u5FC5\u8981\u3067\u3059" }) });
    }
    // 自動ログインを実行
    React.useEffect(() => {
        if (!isAuthenticated && !isLoading && !disableAutoLogin) {
            const scopes = loginOptions.scopes || ['openid', 'profile', ...requiredScopes];
            login({
                scopes,
                additionalParams: loginOptions.additionalParams
            });
        }
    }, [isAuthenticated, isLoading, disableAutoLogin, login, requiredScopes, loginOptions]);
    // 自動ログイン実行中
    return (jsx("div", { style: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px'
        }, children: jsx("div", { children: "\u30ED\u30B0\u30A4\u30F3\u51E6\u7406\u4E2D..." }) }));
}

/**
 * LoginRequired - ログイン必須コンポーネント
 */
/**
 * LoginRequired Component
 *
 * ログインが必要なコンテンツを表示し、未認証時はログインボタンを提供
 * ProtectedRouteと異なり、自動リダイレクトせずユーザーの明示的な操作を待つ
 *
 * @example
 * ```tsx
 * // 基本的な使用
 * function UserProfile() {
 *   return (
 *     <div>
 *       <h1>ユーザープロフィール</h1>
 *       <LoginRequired>
 *         <UserDetails />
 *       </LoginRequired>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // カスタムメッセージとスコープ
 * function PremiumContent() {
 *   return (
 *     <LoginRequired
 *       message="プレミアムコンテンツにアクセスするにはログインが必要です"
 *       loginButtonText="プレミアムアカウントでログイン"
 *       loginOptions={{
 *         scopes: ['openid', 'profile', 'premium'],
 *         additionalParams: { prompt: 'consent' }
 *       }}
 *     >
 *       <PremiumDashboard />
 *     </LoginRequired>
 *   );
 * }
 * ```
 */
function LoginRequired({ children, message = 'このコンテンツにアクセスするにはログインが必要です', loginButtonText = 'ログイン', loginOptions = {}, className, style }) {
    const { isAuthenticated, isLoading, isInitializing } = useAuthState();
    const { login, isLoading: isLoginLoading } = useAuthActions();
    // 初期化中はローディング表示
    if (isInitializing) {
        return (jsx("div", { className: className, style: style, children: jsx("div", { style: { textAlign: 'center', padding: '20px' }, children: "\u8A8D\u8A3C\u72B6\u614B\u3092\u78BA\u8A8D\u4E2D..." }) }));
    }
    // 認証済みの場合は子コンポーネントを表示
    if (isAuthenticated) {
        return jsx(Fragment, { children: children });
    }
    // 未認証の場合はログインプロンプトを表示
    const handleLogin = () => {
        const scopes = loginOptions.scopes || ['openid', 'profile'];
        login({
            scopes,
            additionalParams: loginOptions.additionalParams
        });
    };
    const containerStyle = {
        textAlign: 'center',
        padding: '40px 20px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        backgroundColor: '#f8fafc',
        ...style
    };
    const messageStyle = {
        marginBottom: '20px',
        color: '#4a5568',
        fontSize: '16px'
    };
    const buttonStyle = {
        backgroundColor: '#4f46e5',
        color: 'white',
        padding: '12px 24px',
        border: 'none',
        borderRadius: '6px',
        fontSize: '16px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        opacity: isLoginLoading || isLoading ? 0.6 : 1
    };
    return (jsxs("div", { className: className, style: containerStyle, children: [jsx("div", { style: messageStyle, children: message }), jsx("button", { onClick: handleLogin, disabled: isLoginLoading || isLoading, style: buttonStyle, onMouseOver: (e) => {
                    if (!isLoginLoading && !isLoading) {
                        e.currentTarget.style.backgroundColor = '#4338ca';
                    }
                }, onMouseOut: (e) => {
                    e.currentTarget.style.backgroundColor = '#4f46e5';
                }, children: isLoginLoading || isLoading ? 'ログイン中...' : loginButtonText })] }));
}

/**
 * ConditionalRender - 認証状態による条件付きレンダリング
 */
/**
 * ConditionalRender Component
 *
 * 認証状態に基づいて異なるコンポーネントを条件的にレンダリング
 * if-else文の代わりとして使用し、コードをより宣言的にする
 *
 * @example
 * ```tsx
 * // 基本的な使用
 * function Header() {
 *   return (
 *     <header>
 *       <h1>My App</h1>
 *       <ConditionalRender
 *         authenticated={<UserMenu />}
 *         unauthenticated={<LoginButton />}
 *         loading={<Spinner />}
 *       />
 *     </header>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // childrenを使った簡潔な記法
 * function ProtectedContent() {
 *   return (
 *     <ConditionalRender unauthenticated={<LoginPrompt />}>
 *       <SecretContent />
 *     </ConditionalRender>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // 複雑な条件分岐
 * function Dashboard() {
 *   return (
 *     <ConditionalRender
 *       authenticated={
 *         <div>
 *           <WelcomeMessage />
 *           <UserDashboard />
 *         </div>
 *       }
 *       unauthenticated={
 *         <div>
 *           <Hero />
 *           <LoginForm />
 *         </div>
 *       }
 *       loading={
 *         <div className="loading-screen">
 *           <Spinner />
 *           <p>アカウント情報を読み込み中...</p>
 *         </div>
 *       }
 *       error={
 *         <ErrorBoundary />
 *       }
 *     />
 *   );
 * }
 * ```
 */
function ConditionalRender({ authenticated, unauthenticated, loading, error, children }) {
    const { isAuthenticated, isLoading, isInitializing, error: authError } = useAuthState();
    // エラー状態
    if (authError && error) {
        return jsx(Fragment, { children: error });
    }
    // 初期化中またはローディング中
    if (isInitializing || isLoading) {
        if (loading) {
            return jsx(Fragment, { children: loading });
        }
        // デフォルトローディング
        return (jsx("div", { style: {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px'
            }, children: jsx("div", { children: "\u8AAD\u307F\u8FBC\u307F\u4E2D..." }) }));
    }
    // 認証済み
    if (isAuthenticated) {
        // childrenがある場合はchildrenを優先、なければauthenticatedを使用
        return jsx(Fragment, { children: children || authenticated });
    }
    // 未認証
    if (unauthenticated) {
        return jsx(Fragment, { children: unauthenticated });
    }
    // 何も指定されていない場合はnullを返す
    return null;
}
function AuthenticatedOnly({ children, fallback }) {
    return (jsx(ConditionalRender, { authenticated: children, unauthenticated: fallback }));
}
function UnauthenticatedOnly({ children, fallback }) {
    return (jsx(ConditionalRender, { unauthenticated: children, authenticated: fallback }));
}

/**
 * withNoranekoID - 高階コンポーネント（HOC）
 */
/**
 * withNoranekoID HOC
 *
 * クラスコンポーネントや既存のコンポーネントにNoranekoID機能を注入
 * Hooksが使えない環境やレガシーコンポーネントで使用
 *
 * @param WrappedComponent 機能を注入する対象コンポーネント
 * @returns NoranekoID機能が注入されたコンポーネント
 *
 * @example
 * ```tsx
 * // 関数コンポーネントでの使用
 * interface MyComponentProps {
 *   title: string;
 * }
 *
 * function MyComponent({ title, noranekoID }: MyComponentProps & WithNoranekoIDProps) {
 *   const handleLogin = () => {
 *     noranekoID.login({ scopes: ['openid', 'profile'] });
 *   };
 *
 *   if (noranekoID.isLoading) {
 *     return <div>Loading...</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <h1>{title}</h1>
 *       {noranekoID.isAuthenticated ? (
 *         <div>
 *           <p>Welcome, {noranekoID.user?.display_name}!</p>
 *           <button onClick={() => noranekoID.logout()}>Logout</button>
 *         </div>
 *       ) : (
 *         <button onClick={handleLogin}>Login</button>
 *       )}
 *     </div>
 *   );
 * }
 *
 * export default withNoranekoID(MyComponent);
 * ```
 *
 * @example
 * ```tsx
 * // クラスコンポーネントでの使用
 * class UserDashboard extends React.Component<WithNoranekoIDProps> {
 *   componentDidMount() {
 *     if (this.props.noranekoID.isAuthenticated) {
 *       this.props.noranekoID.refreshUser();
 *     }
 *   }
 *
 *   render() {
 *     const { noranekoID } = this.props;
 *
 *     if (!noranekoID.isAuthenticated) {
 *       return <div>Please log in to access the dashboard.</div>;
 *     }
 *
 *     return (
 *       <div>
 *         <h1>Dashboard</h1>
 *         <p>User: {noranekoID.user?.email}</p>
 *         <button onClick={() => noranekoID.logout()}>
 *           Logout
 *         </button>
 *       </div>
 *     );
 *   }
 * }
 *
 * export default withNoranekoID(UserDashboard);
 * ```
 *
 * @example
 * ```tsx
 * // TypeScript with generic props
 * interface ProductListProps {
 *   category: string;
 *   onProductClick: (id: string) => void;
 * }
 *
 * function ProductList({
 *   category,
 *   onProductClick,
 *   noranekoID
 * }: ProductListProps & WithNoranekoIDProps) {
 *   const fetchProducts = async () => {
 *     const token = await noranekoID.getAccessToken();
 *     if (!token) return;
 *
 *     const response = await fetch(`/api/products?category=${category}`, {
 *       headers: {
 *         'Authorization': `Bearer ${token}`
 *       }
 *     });
 *     // ... handle response
 *   };
 *
 *   useEffect(() => {
 *     if (noranekoID.isAuthenticated) {
 *       fetchProducts();
 *     }
 *   }, [noranekoID.isAuthenticated, category]);
 *
 *   // ... rest of component
 * }
 *
 * export default withNoranekoID<ProductListProps>(ProductList);
 * ```
 */
function withNoranekoID(WrappedComponent) {
    const WithNoranekoIDComponent = (props) => {
        const noranekoIDData = useNoranekoID();
        return (jsx(WrappedComponent, { ...props, noranekoID: noranekoIDData }));
    };
    // デバッグ時に役立つようにdisplayNameを設定
    WithNoranekoIDComponent.displayName = `withNoranekoID(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
    return WithNoranekoIDComponent;
}
/**
 * withAuthRequired HOC
 *
 * 認証が必要なコンポーネントをラップし、未認証時は自動ログインを実行
 *
 * @param WrappedComponent 認証が必要なコンポーネント
 * @param options 認証オプション
 * @returns 認証保護されたコンポーネント
 */
function withAuthRequired(WrappedComponent, options = {}) {
    const { requiredScopes = [], loginOptions = {}, fallback: Fallback } = options;
    const WithAuthRequiredComponent = (props) => {
        const noranekoIDData = useNoranekoID();
        // 初期化中はローディング表示
        if (noranekoIDData.isInitializing || noranekoIDData.isLoading) {
            return (jsx("div", { style: {
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '200px'
                }, children: jsx("div", { children: "\u8A8D\u8A3C\u72B6\u614B\u3092\u78BA\u8A8D\u4E2D..." }) }));
        }
        // 認証済みの場合はコンポーネントを表示
        if (noranekoIDData.isAuthenticated) {
            return (jsx(WrappedComponent, { ...props, noranekoID: noranekoIDData }));
        }
        // 未認証の場合
        if (Fallback) {
            return jsx(Fallback, {});
        }
        // 自動ログインを実行
        React.useEffect(() => {
            if (!noranekoIDData.isAuthenticated && !noranekoIDData.isLoading) {
                const scopes = loginOptions.scopes || ['openid', 'profile', ...requiredScopes];
                noranekoIDData.login({
                    scopes,
                    additionalParams: loginOptions.additionalParams
                });
            }
        }, [noranekoIDData.isAuthenticated, noranekoIDData.isLoading]);
        return (jsx("div", { style: {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '200px'
            }, children: jsx("div", { children: "\u30ED\u30B0\u30A4\u30F3\u51E6\u7406\u4E2D..." }) }));
    };
    WithAuthRequiredComponent.displayName = `withAuthRequired(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
    return WithAuthRequiredComponent;
}

export { AuthenticatedOnly, ConditionalRender, LoginRequired, NoranekoIDProvider, ProtectedRoute, UnauthenticatedOnly, useAccessToken, useAuthActions, useAuthState, useNoranekoID, useUserInfo, withAuthRequired, withNoranekoID };
//# sourceMappingURL=index.esm.js.map
