import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useNoranekoID } from '../../hooks/useNoranekoID';
import { NoranekoIDProvider } from '../../context/NoranekoIDProvider';
import { NoranekoID } from '@noraneko/id-sdk';

// SDKのモック
jest.mock('@noraneko/id-sdk');

describe('useNoranekoID', () => {
  const mockConfig = {
    clientId: 'test-client',
    issuer: 'http://localhost:8080',
    redirectUri: 'http://localhost:3000/callback'
  };

  const mockUser = {
    sub: 'user-123',
    email: 'test@example.com',
    email_verified: true
  };

  let mockSDK: jest.Mocked<NoranekoID>;

  beforeEach(() => {
    mockSDK = {
      startAuth: jest.fn(),
      handleCallback: jest.fn(),
      logout: jest.fn(),
      getUser: jest.fn(),
      isAuthenticated: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn()
    } as any;

    (NoranekoID as jest.Mock).mockImplementation(() => mockSDK);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NoranekoIDProvider config={mockConfig}>
      {children}
    </NoranekoIDProvider>
  );

  it('初期状態を正しく返す', () => {
    mockSDK.isAuthenticated.mockResolvedValue(false);
    mockSDK.getUser.mockResolvedValue(null);

    const { result } = renderHook(() => useNoranekoID(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('認証済み状態を正しく処理する', async () => {
    mockSDK.isAuthenticated.mockResolvedValue(true);
    mockSDK.getUser.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useNoranekoID(), { wrapper });

    // 初期化を待つ
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toEqual(mockUser);
  });

  it('login関数が正しく動作する', async () => {
    mockSDK.isAuthenticated.mockResolvedValue(false);
    mockSDK.getUser.mockResolvedValue(null);

    const { result } = renderHook(() => useNoranekoID(), { wrapper });

    await act(async () => {
      await result.current.login({ additionalScopes: ['custom'] });
    });

    expect(mockSDK.startAuth).toHaveBeenCalledWith({
      additionalScopes: ['custom']
    });
  });

  it('logout関数が正しく動作する', async () => {
    mockSDK.isAuthenticated.mockResolvedValue(true);
    mockSDK.getUser.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useNoranekoID(), { wrapper });

    await act(async () => {
      await result.current.logout({ redirectTo: '/goodbye' });
    });

    expect(mockSDK.logout).toHaveBeenCalledWith({
      redirectTo: '/goodbye'
    });
  });

  it('エラーを正しく処理する', async () => {
    const mockError = new Error('Authentication failed');
    mockSDK.isAuthenticated.mockRejectedValue(mockError);

    const { result } = renderHook(() => useNoranekoID(), { wrapper });

    // エラーが発生するまで待つ
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toEqual(mockError);
    expect(result.current.isLoading).toBe(false);
  });

  it('SDKイベントに正しく反応する', async () => {
    mockSDK.isAuthenticated.mockResolvedValue(false);
    mockSDK.getUser.mockResolvedValue(null);

    const { result } = renderHook(() => useNoranekoID(), { wrapper });

    // SDKイベントリスナーを取得
    const authenticatedHandler = mockSDK.on.mock.calls.find(
      call => call[0] === 'authenticated'
    )?.[1];

    // 認証イベントを発火
    await act(async () => {
      authenticatedHandler?.(mockUser);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('コンテキスト外で使用するとエラーを投げる', () => {
    // コンソールエラーを抑制
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      renderHook(() => useNoranekoID());
    }).toThrow('useNoranekoID must be used within a NoranekoIDProvider');

    consoleSpy.mockRestore();
  });

  it('再認証を試みる', async () => {
    mockSDK.isAuthenticated.mockResolvedValue(false);
    mockSDK.getUser.mockResolvedValue(null);

    const { result } = renderHook(() => useNoranekoID(), { wrapper });

    await act(async () => {
      await result.current.checkAuth();
    });

    expect(mockSDK.isAuthenticated).toHaveBeenCalled();
  });
});