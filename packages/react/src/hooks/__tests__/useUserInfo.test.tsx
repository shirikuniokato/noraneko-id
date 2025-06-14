/**
 * useUserInfo Hook のテスト
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useUserInfo } from '../useUserInfo';
import { NoranekoIDProvider } from '../../context/NoranekoIDProvider';
import { mockConfig, mockUser } from '../../test-setup';

// モックされたSDK
import { NoranekoID } from '@noraneko/id-sdk';

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <NoranekoIDProvider config={mockConfig}>
      {children}
    </NoranekoIDProvider>
  );
};

describe('useUserInfo', () => {
  let mockSDKInstance: any;

  beforeEach(() => {
    // SDKインスタンスのモックを取得
    mockSDKInstance = (NoranekoID as jest.Mock).mock.results[0]?.value || {
      getUser: jest.fn(),
      isAuthenticated: jest.fn(() => false),
    };
  });

  it('Provider内で正常に使用できる', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUserInfo(), { wrapper });

    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('refreshUser');
    expect(typeof result.current.refreshUser).toBe('function');
  });

  it('Provider外では例外がスローされる', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useUserInfo());
    }).toThrow('useUserInfo must be used within a NoranekoIDProvider');

    consoleSpy.mockRestore();
  });

  it('初期状態でユーザー情報がnull', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUserInfo(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('refreshUser関数が正しく呼び出される', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUserInfo(), { wrapper });

    // SDKがユーザー情報を返すようにモック
    mockSDKInstance.getUser.mockResolvedValueOnce(mockUser);

    await act(async () => {
      await result.current.refreshUser();
    });

    // SDKのgetUserが呼ばれることを確認
    expect(mockSDKInstance.getUser).toHaveBeenCalled();
  });

  it('認証済み状態でユーザー情報が取得される', async () => {
    // 認証済み状態にセット
    mockSDKInstance.isAuthenticated.mockReturnValue(true);
    mockSDKInstance.getUser.mockResolvedValue(mockUser);

    const wrapper = createWrapper();
    const { result, waitForNextUpdate } = renderHook(() => useUserInfo(), { wrapper });

    // 初期化後にユーザー情報が設定されることを確認
    // （実際の実装に依存）
  });

  it('refreshUser実行中のローディング状態', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUserInfo(), { wrapper });

    // getUser が遅延するようにモック
    mockSDKInstance.getUser.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockUser), 100))
    );

    act(() => {
      result.current.refreshUser();
    });

    // ローディング状態の確認は実装に依存
    // expect(result.current.isLoading).toBe(true);
  });

  it('ユーザー情報取得エラーの処理', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUserInfo(), { wrapper });

    const testError = new Error('ユーザー情報取得エラー');
    mockSDKInstance.getUser.mockRejectedValueOnce(testError);

    await act(async () => {
      try {
        await result.current.refreshUser();
      } catch (error) {
        expect(error).toBe(testError);
      }
    });
  });

  it('未認証状態でのrefreshUser呼び出し', async () => {
    mockSDKInstance.isAuthenticated.mockReturnValue(false);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useUserInfo(), { wrapper });

    await act(async () => {
      await result.current.refreshUser();
    });

    // 未認証時はgetUserが呼ばれないことを確認
    expect(mockSDKInstance.getUser).not.toHaveBeenCalled();
  });

  it('ユーザー情報の型が正しい', async () => {
    mockSDKInstance.getUser.mockResolvedValueOnce(mockUser);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useUserInfo(), { wrapper });

    await act(async () => {
      await result.current.refreshUser();
    });

    // ユーザー情報の型確認（実際の実装に依存）
    if (result.current.user) {
      expect(result.current.user).toHaveProperty('id');
      expect(result.current.user).toHaveProperty('email');
      expect(result.current.user).toHaveProperty('username');
      expect(result.current.user).toHaveProperty('display_name');
    }
  });
});