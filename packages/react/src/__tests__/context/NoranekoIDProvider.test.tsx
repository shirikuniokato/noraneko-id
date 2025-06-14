import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { NoranekoIDProvider } from '../../context/NoranekoIDProvider';
import { useNoranekoID } from '../../hooks/useNoranekoID';
import { NoranekoID } from '@noraneko/id-sdk';

// SDKのモック
jest.mock('@noraneko/id-sdk');

// テスト用コンポーネント
const TestComponent = () => {
  const { isAuthenticated, isLoading, user, error } = useNoranekoID();
  
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</div>
      <div data-testid="loading-status">{isLoading ? 'loading' : 'ready'}</div>
      <div data-testid="user-email">{user?.email || 'no-user'}</div>
      <div data-testid="error">{error?.message || 'no-error'}</div>
    </div>
  );
};

describe('NoranekoIDProvider', () => {
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

  it('SDKを初期化して認証状態を確認する', async () => {
    mockSDK.isAuthenticated.mockResolvedValue(false);
    mockSDK.getUser.mockResolvedValue(null);

    render(
      <NoranekoIDProvider config={mockConfig}>
        <TestComponent />
      </NoranekoIDProvider>
    );

    // 初期状態
    expect(screen.getByTestId('loading-status')).toHaveTextContent('loading');

    // 初期化完了後
    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('ready');
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');
    expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');
    expect(mockSDK.isAuthenticated).toHaveBeenCalled();
  });

  it('認証済みユーザー情報を提供する', async () => {
    mockSDK.isAuthenticated.mockResolvedValue(true);
    mockSDK.getUser.mockResolvedValue(mockUser);

    render(
      <NoranekoIDProvider config={mockConfig}>
        <TestComponent />
      </NoranekoIDProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
  });

  it('SDKイベントをリッスンする', async () => {
    mockSDK.isAuthenticated.mockResolvedValue(false);
    mockSDK.getUser.mockResolvedValue(null);

    render(
      <NoranekoIDProvider config={mockConfig}>
        <TestComponent />
      </NoranekoIDProvider>
    );

    // SDKイベントリスナーの登録を確認
    expect(mockSDK.on).toHaveBeenCalledWith('authenticated', expect.any(Function));
    expect(mockSDK.on).toHaveBeenCalledWith('unauthenticated', expect.any(Function));
    expect(mockSDK.on).toHaveBeenCalledWith('tokenRefreshed', expect.any(Function));
    expect(mockSDK.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('コールバックURLを自動的に処理する', async () => {
    // URLにcodeパラメータを設定
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      href: 'http://localhost:3000/callback?code=test-code&state=test-state',
      pathname: '/callback'
    } as any;

    mockSDK.isAuthenticated.mockResolvedValue(false);
    mockSDK.getUser.mockResolvedValue(null);
    mockSDK.handleCallback.mockResolvedValue({
      access_token: 'test-token',
      token_type: 'Bearer',
      expires_in: 3600
    });

    render(
      <NoranekoIDProvider config={mockConfig}>
        <TestComponent />
      </NoranekoIDProvider>
    );

    await waitFor(() => {
      expect(mockSDK.handleCallback).toHaveBeenCalledWith(
        'http://localhost:3000/callback?code=test-code&state=test-state'
      );
    });

    // 元に戻す
    window.location = originalLocation;
  });

  it('初期化エラーを処理する', async () => {
    const initError = new Error('Initialization failed');
    mockSDK.isAuthenticated.mockRejectedValue(initError);

    render(
      <NoranekoIDProvider config={mockConfig}>
        <TestComponent />
      </NoranekoIDProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Initialization failed');
    });

    expect(screen.getByTestId('loading-status')).toHaveTextContent('ready');
  });

  it('コンポーネントアンマウント時にリスナーをクリーンアップする', async () => {
    mockSDK.isAuthenticated.mockResolvedValue(false);
    mockSDK.getUser.mockResolvedValue(null);

    const { unmount } = render(
      <NoranekoIDProvider config={mockConfig}>
        <TestComponent />
      </NoranekoIDProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('ready');
    });

    unmount();

    // イベントリスナーの削除を確認
    expect(mockSDK.off).toHaveBeenCalledWith('authenticated', expect.any(Function));
    expect(mockSDK.off).toHaveBeenCalledWith('unauthenticated', expect.any(Function));
    expect(mockSDK.off).toHaveBeenCalledWith('tokenRefreshed', expect.any(Function));
    expect(mockSDK.off).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('複数の子コンポーネントで状態を共有する', async () => {
    mockSDK.isAuthenticated.mockResolvedValue(true);
    mockSDK.getUser.mockResolvedValue(mockUser);

    const TestComponent2 = () => {
      const { user } = useNoranekoID();
      return <div data-testid="user-id">{user?.sub || 'no-id'}</div>;
    };

    render(
      <NoranekoIDProvider config={mockConfig}>
        <TestComponent />
        <TestComponent2 />
      </NoranekoIDProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('user-id')).toHaveTextContent('user-123');
    });
  });
});