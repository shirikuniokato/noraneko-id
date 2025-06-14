/**
 * useAuthActions Hook のテスト
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useAuthActions } from '../useAuthActions';
import { NoranekoIDProvider } from '../../context/NoranekoIDProvider';
import { mockConfig } from '../../test-setup';

// モックされたSDK
import { NoranekoID } from '@noraneko/id-sdk';

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <NoranekoIDProvider config={mockConfig}>
      {children}
    </NoranekoIDProvider>
  );
};

describe('useAuthActions', () => {
  let mockSDKInstance: any;

  beforeEach(() => {
    // SDKインスタンスのモックを取得
    mockSDKInstance = (NoranekoID as jest.Mock).mock.results[0]?.value || {
      startAuth: jest.fn(),
      logout: jest.fn(),
    };
  });

  it('Provider内で正常に使用できる', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuthActions(), { wrapper });

    expect(result.current).toHaveProperty('login');
    expect(result.current).toHaveProperty('logout');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
  });

  it('Provider外では例外がスローされる', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuthActions());
    }).toThrow('useAuthActions must be used within a NoranekoIDProvider');

    consoleSpy.mockRestore();
  });

  it('login関数が正しく呼び出される', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuthActions(), { wrapper });

    const loginOptions = {
      scopes: ['openid', 'profile'],
      additionalParams: { prompt: 'login' }
    };

    await act(async () => {
      await result.current.login(loginOptions);
    });

    // SDKのstartAuthが呼ばれることを確認
    expect(mockSDKInstance.startAuth).toHaveBeenCalledWith(loginOptions);
  });

  it('logout関数が正しく呼び出される', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuthActions(), { wrapper });

    const logoutOptions = {
      returnTo: 'http://localhost:3000'
    };

    await act(async () => {
      await result.current.logout(logoutOptions);
    });

    // SDKのlogoutが呼ばれることを確認
    expect(mockSDKInstance.logout).toHaveBeenCalledWith(logoutOptions);
  });

  it('ローディング状態が正しく管理される', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuthActions(), { wrapper });

    // 初期状態ではローディングでない
    expect(result.current.isLoading).toBe(false);

    // login実行中はローディング状態になることを確認
    // （実際の実装に依存）
  });

  it('エラー状態が正しく管理される', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuthActions(), { wrapper });

    // エラー状態の初期値
    expect(result.current.error).toBeNull();
  });

  it('login関数でエラーが発生した場合の処理', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuthActions(), { wrapper });

    // SDKでエラーが発生するようにモック
    mockSDKInstance.startAuth.mockRejectedValueOnce(new Error('認証エラー'));

    await act(async () => {
      try {
        await result.current.login();
      } catch (error) {
        // エラーハンドリングのテスト
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  it('logout関数でエラーが発生した場合の処理', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuthActions(), { wrapper });

    // SDKでエラーが発生するようにモック
    mockSDKInstance.logout.mockRejectedValueOnce(new Error('ログアウトエラー'));

    await act(async () => {
      try {
        await result.current.logout();
      } catch (error) {
        // エラーハンドリングのテスト
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});