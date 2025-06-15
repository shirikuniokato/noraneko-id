/**
 * NoranekoID Provider Component
 */
'use client';

import { useReducer, useCallback, useEffect, useRef, useMemo } from 'react';
import { NoranekoID } from '@noraneko/id-sdk';
import type {
  User,
  AuthOptions,
  TokenResponse,
  NoranekoIDEventType,
  EventCallback,
} from '@noraneko/id-sdk';

import { NoranekoIDContext } from './NoranekoIDContext';
import { noranekoIDReducer, initialState } from '../utils/reducer';
import { safeRedirect, isSafeRedirectUrl } from '../utils/url-validation';
import type {
  NoranekoIDProviderProps,
  NoranekoIDContextValue,
  EnhancedLogoutOptions,
} from '../types';

/**
 * NoranekoID Provider Component
 * 
 * アプリケーション全体に認証機能を提供するProvider
 */
export function NoranekoIDProvider({
  config,
  children,
  loadingComponent,
  errorComponent,
  onInitialized,
  onInitializationError,
}: NoranekoIDProviderProps) {
  const [state, dispatch] = useReducer(noranekoIDReducer, initialState);
  const sdkRef = useRef<NoranekoID | null>(null);
  const eventListenersRef = useRef<Map<string, Set<EventCallback<any>>>>(new Map());

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
        sdk.on('authenticated', (user: User) => {
          if (isMounted) {
            dispatch({ type: 'AUTH_SUCCESS', payload: user });
          }
        });

        sdk.on('unauthenticated', () => {
          if (isMounted) {
            dispatch({ type: 'LOGOUT_SUCCESS' });
          }
        });

        sdk.on('tokenRefreshed', (_tokens: TokenResponse) => {
          if (isMounted) {
            dispatch({ type: 'TOKEN_REFRESH_SUCCESS' });
          }
        });

        sdk.on('error', (error: Error) => {
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
      } catch (error) {
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
          if (!sdkRef.current || !isMounted) return;

          dispatch({ type: 'AUTH_START' });
          await sdkRef.current.handleCallback(url);
          
          // コールバック成功後、URLをクリーンアップ
          if (typeof window !== 'undefined') {
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        } catch (error) {
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
    
    return undefined;
  }, [state.isInitializing]);

  // ログイン関数
  const login = useCallback(async (options?: AuthOptions) => {
    if (!sdkRef.current) {
      throw new Error('SDK not initialized');
    }

    try {
      dispatch({ type: 'AUTH_START' });
      await sdkRef.current.startAuth(options);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Login failed');
      dispatch({ type: 'AUTH_ERROR', payload: err });
      throw err;
    }
  }, []);

  // OAuth2準拠の完全ログアウト関数
  const logout = useCallback(async (options?: EnhancedLogoutOptions) => {
    if (!sdkRef.current) {
      throw new Error('SDK not initialized');
    }

    const {
      redirectTo = '/login',
      clearLocalStorage = true,
      clearSessionStorage = true,
      skipRevoke = false,
      force = false,
      ...sdkOptions
    } = options || {};

    try {
      dispatch({ type: 'LOGOUT_START' });
      
      // Phase 1: SDK内部でOAuth2 revoke + Cookie削除を実行
      if (typeof window !== 'undefined') {
        try {
          const response = await fetch('/api/auth', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skipRevoke })
          });
          
          if (!response.ok && !force) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Logout API failed');
          }
          
          // レスポンス詳細をログ出力（デバッグ用）
          const result = await response.json().catch(() => ({}));
          console.log('Logout completed:', result.actions || []);
          
        } catch (fetchError) {
          console.warn('Logout API error:', fetchError);
          if (!force) {
            throw fetchError;
          }
        }
      }
      
      // Phase 2: 追加のローカル状態クリア
      if (typeof window !== 'undefined') {
        if (clearLocalStorage) {
          // noraneko-id関連のローカルストレージをクリア
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('noraneko_')) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
        }
        
        if (clearSessionStorage) {
          // noraneko-id関連のセッションストレージをクリア
          const keysToRemove = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith('noraneko_')) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => sessionStorage.removeItem(key));
        }
      }
      
      // Phase 3: SDK標準ログアウト（イベント発火用）
      try {
        await sdkRef.current.logout(sdkOptions);
      } catch (sdkError) {
        console.warn('SDK logout error:', sdkError);
        if (!force) {
          throw sdkError;
        }
      }
      
      // Phase 4: 状態更新（成功時）
      dispatch({ type: 'LOGOUT_SUCCESS' });
      
      // Phase 5: 安全な自動リダイレクト
      if (typeof window !== 'undefined' && redirectTo) {
        // URL検証してから安全にリダイレクト
        if (isSafeRedirectUrl(redirectTo)) {
          // 少し遅延させてstate更新を完了させる
          setTimeout(() => {
            safeRedirect(redirectTo, '/login');
          }, 100);
        } else {
          console.warn('Unsafe redirect URL detected, redirecting to default:', redirectTo);
          setTimeout(() => {
            safeRedirect('/login');
          }, 100);
        }
      }
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Logout failed');
      
      if (force) {
        // 強制ログアウト: エラーでも状態をクリアしてリダイレクト
        console.warn('Force logout due to error:', err);
        dispatch({ type: 'LOGOUT_SUCCESS' });
        
        if (typeof window !== 'undefined' && redirectTo) {
          if (isSafeRedirectUrl(redirectTo)) {
            setTimeout(() => {
              safeRedirect(redirectTo, '/login');
            }, 100);
          } else {
            console.warn('Unsafe redirect URL detected during force logout, redirecting to default:', redirectTo);
            setTimeout(() => {
              safeRedirect('/login');
            }, 100);
          }
        }
      } else {
        dispatch({ type: 'LOGOUT_ERROR', payload: err });
        throw err;
      }
    }
  }, []);

  // アクセストークン取得
  const getAccessToken = useCallback(async () => {
    if (!sdkRef.current) {
      return null;
    }

    try {
      return await sdkRef.current.getAccessToken();
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Token refresh failed');
      dispatch({ type: 'TOKEN_REFRESH_ERROR', payload: err });
      throw err;
    }
  }, []);

  // イベントリスナー管理
  const addEventListener = useCallback(<T extends NoranekoIDEventType>(
    event: T,
    callback: EventCallback<T>
  ) => {
    const listeners = eventListenersRef.current.get(event) || new Set();
    listeners.add(callback);
    eventListenersRef.current.set(event, listeners);

    if (sdkRef.current) {
      sdkRef.current.on(event, callback);
    }
  }, []);

  const removeEventListener = useCallback(<T extends NoranekoIDEventType>(
    event: T,
    callback: EventCallback<T>
  ) => {
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
  const contextValue: NoranekoIDContextValue = useMemo(() => ({
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
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>認証システム初期化エラー</h3>
        <p>{state.error.message}</p>
        <button onClick={() => window.location.reload()}>
          再読み込み
        </button>
      </div>
    );
  }

  // 初期化中の場合
  if (state.isInitializing) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>認証システムを初期化中...</p>
      </div>
    );
  }

  return (
    <NoranekoIDContext.Provider value={contextValue}>
      {children}
    </NoranekoIDContext.Provider>
  );
}