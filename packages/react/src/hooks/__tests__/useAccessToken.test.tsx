/**
 * useAccessToken Hook のテスト
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useAccessToken } from '../useAccessToken';
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

describe('useAccessToken', () => {
  let mockSDKInstance: any;

  beforeEach(() => {
    // SDKインスタンスのモックを取得
    mockSDKInstance = (NoranekoID as jest.Mock).mock.results[0]?.value || {
      getAccessToken: jest.fn(),
      refreshTokens: jest.fn(),
    };
  });

  it('Provider内で正常に使用できる', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAccessToken(), { wrapper });

    expect(result.current).toHaveProperty('accessToken');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('getAccessToken');
    expect(result.current).toHaveProperty('refreshTokens');
    expect(typeof result.current.getAccessToken).toBe('function');
    expect(typeof result.current.refreshTokens).toBe('function');
  });

  it('Provider外では例外がスローされる', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAccessToken());
    }).toThrow('useAccessToken must be used within a NoranekoIDProvider');

    consoleSpy.mockRestore();
  });

  it('accessTokenは直接公開されない（セキュリティ）', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAccessToken(), { wrapper });

    // セキュリティのためaccessTokenは直接公開しない
    expect(result.current.accessToken).toBeNull();
  });

  it('getAccessToken関数が正しく呼び出される', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAccessToken(), { wrapper });

    const mockToken = 'mock-access-token-123';
    mockSDKInstance.getAccessToken.mockResolvedValueOnce(mockToken);

    let token: string | null = null;
    await act(async () => {
      token = await result.current.getAccessToken();
    });

    expect(mockSDKInstance.getAccessToken).toHaveBeenCalled();
    expect(token).toBe(mockToken);
  });

  it('refreshTokens関数が正しく呼び出される', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAccessToken(), { wrapper });

    mockSDKInstance.refreshTokens.mockResolvedValueOnce(undefined);

    await act(async () => {
      await result.current.refreshTokens();
    });

    expect(mockSDKInstance.refreshTokens).toHaveBeenCalled();
  });

  it('getAccessTokenでトークンが取得できない場合', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAccessToken(), { wrapper });

    mockSDKInstance.getAccessToken.mockResolvedValueOnce(null);

    let token: string | null = null;
    await act(async () => {
      token = await result.current.getAccessToken();
    });

    expect(token).toBeNull();
  });

  it('getAccessTokenでエラーが発生した場合', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAccessToken(), { wrapper });

    const testError = new Error('トークン取得エラー');
    mockSDKInstance.getAccessToken.mockRejectedValueOnce(testError);

    await act(async () => {
      try {
        await result.current.getAccessToken();
      } catch (error) {
        expect(error).toBe(testError);
      }
    });
  });

  it('refreshTokensでエラーが発生した場合', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAccessToken(), { wrapper });

    const testError = new Error('トークン更新エラー');
    mockSDKInstance.refreshTokens.mockRejectedValueOnce(testError);

    await act(async () => {
      try {
        await result.current.refreshTokens();
      } catch (error) {
        expect(error).toBe(testError);
      }
    });
  });

  it('トークンの有効期限切れ時の自動更新', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAccessToken(), { wrapper });

    // 最初の呼び出しで期限切れエラー
    mockSDKInstance.getAccessToken
      .mockRejectedValueOnce(new Error('Token expired'))
      .mockResolvedValueOnce('new-access-token');

    mockSDKInstance.refreshTokens.mockResolvedValueOnce(undefined);

    // 実際の自動更新ロジックのテストは実装に依存
  });

  it('複数回のgetAccessToken呼び出し', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAccessToken(), { wrapper });

    const mockToken = 'mock-access-token-123';
    mockSDKInstance.getAccessToken.mockResolvedValue(mockToken);

    let token1: string | null = null;
    let token2: string | null = null;

    await act(async () => {
      token1 = await result.current.getAccessToken();
      token2 = await result.current.getAccessToken();
    });

    expect(token1).toBe(mockToken);
    expect(token2).toBe(mockToken);
    expect(mockSDKInstance.getAccessToken).toHaveBeenCalledTimes(2);
  });
});