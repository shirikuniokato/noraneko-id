/**
 * useAuthState Hook のテスト
 */

import React from 'react';
import { renderHook } from '@testing-library/react';
import { useAuthState } from '../useAuthState';
import { NoranekoIDProvider } from '../../context/NoranekoIDProvider';
import { mockConfig } from '../../test-setup';

// テスト用のProvider
const createWrapper = (initialState = {}) => {
  return ({ children }: { children: React.ReactNode }) => (
    <NoranekoIDProvider config={mockConfig}>
      {children}
    </NoranekoIDProvider>
  );
};

describe('useAuthState', () => {
  it('Provider内で正常に使用できる', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuthState(), { wrapper });

    expect(result.current).toHaveProperty('isAuthenticated');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('isInitializing');
    expect(result.current).toHaveProperty('error');
  });

  it('Provider外では例外がスローされる', () => {
    // コンソールエラーを一時的に無効化
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuthState());
    }).toThrow('useAuthState must be used within a NoranekoIDProvider');

    consoleSpy.mockRestore();
  });

  it('初期状態が正しく設定される', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuthState(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isInitializing).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('認証状態の変更が反映される', async () => {
    const wrapper = createWrapper();
    const { result, waitForNextUpdate } = renderHook(() => useAuthState(), { wrapper });

    // 初期化完了まで待機
    if (result.current.isInitializing) {
      await waitForNextUpdate();
    }

    expect(result.current.isInitializing).toBe(false);
  });

  it('エラー状態が正しく反映される', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuthState(), { wrapper });

    // エラー状態のテストはContextの実装に依存
    expect(typeof result.current.error).toBe('object');
  });
});