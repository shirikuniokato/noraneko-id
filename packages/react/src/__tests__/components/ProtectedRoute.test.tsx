import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { NoranekoIDProvider } from '../../context/NoranekoIDProvider';
import { NoranekoID } from '@noraneko/id-sdk';

// SDKのモック
jest.mock('@noraneko/id-sdk');

describe('ProtectedRoute', () => {
  const mockConfig = {
    clientId: 'test-client',
    issuer: 'http://localhost:8080',
    redirectUri: 'http://localhost:3000/callback'
  };

  const mockUser = {
    sub: 'user-123',
    email: 'test@example.com',
    email_verified: true,
    scopes: ['openid', 'profile', 'email', 'admin']
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

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <NoranekoIDProvider config={mockConfig}>
      {children}
    </NoranekoIDProvider>
  );

  it('認証済みユーザーに対してchildrenを表示する', async () => {
    mockSDK.isAuthenticated.mockResolvedValue(true);
    mockSDK.getUser.mockResolvedValue(mockUser);

    render(
      <TestWrapper>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('未認証ユーザーに対してfallbackを表示する', async () => {
    mockSDK.isAuthenticated.mockResolvedValue(false);
    mockSDK.getUser.mockResolvedValue(null);

    render(
      <TestWrapper>
        <ProtectedRoute
          fallback={<div>Please login</div>}
        >
          <div>Protected Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Please login')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  it('ローディング中はローディング表示を行う', () => {
    mockSDK.isAuthenticated.mockImplementation(() => new Promise(() => {})); // 永遠にペンディング

    render(
      <TestWrapper>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('自動ログインが有効な場合、未認証時にstartAuthを呼ぶ', async () => {
    mockSDK.isAuthenticated.mockResolvedValue(false);
    mockSDK.getUser.mockResolvedValue(null);

    render(
      <TestWrapper>
        <ProtectedRoute
          fallback={<div>Please login</div>}
          loginOptions={{ prompt: 'login' }}
        >
          <div>Protected Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockSDK.startAuth).toHaveBeenCalledWith({ prompt: 'login' });
    });
  });

  it('自動ログインが無効な場合、startAuthを呼ばない', async () => {
    mockSDK.isAuthenticated.mockResolvedValue(false);
    mockSDK.getUser.mockResolvedValue(null);

    render(
      <TestWrapper>
        <ProtectedRoute
          fallback={<div>Please login</div>}
          disableAutoLogin
        >
          <div>Protected Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Please login')).toBeInTheDocument();
    });

    expect(mockSDK.startAuth).not.toHaveBeenCalled();
  });

  it('必要なスコープをチェックする', async () => {
    mockSDK.isAuthenticated.mockResolvedValue(true);
    mockSDK.getUser.mockResolvedValue(mockUser);

    render(
      <TestWrapper>
        <ProtectedRoute requiredScopes={['admin']}>
          <div>Admin Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });
  });

  it('必要なスコープが不足している場合、fallbackを表示する', async () => {
    mockSDK.isAuthenticated.mockResolvedValue(true);
    mockSDK.getUser.mockResolvedValue({
      ...mockUser,
      scopes: ['openid', 'profile'] // adminスコープなし
    });

    render(
      <TestWrapper>
        <ProtectedRoute
          requiredScopes={['admin']}
          fallback={<div>Insufficient permissions</div>}
        >
          <div>Admin Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Insufficient permissions')).toBeInTheDocument();
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });
  });

  it('onAuthRequired コールバックを呼ぶ', async () => {
    mockSDK.isAuthenticated.mockResolvedValue(false);
    mockSDK.getUser.mockResolvedValue(null);

    const onAuthRequired = jest.fn();

    render(
      <TestWrapper>
        <ProtectedRoute
          onAuthRequired={onAuthRequired}
          disableAutoLogin
        >
          <div>Protected Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(onAuthRequired).toHaveBeenCalled();
    });
  });

  it('エラー時にfallbackを表示する', async () => {
    mockSDK.isAuthenticated.mockRejectedValue(new Error('Auth error'));

    render(
      <TestWrapper>
        <ProtectedRoute
          fallback={<div>Error occurred</div>}
        >
          <div>Protected Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
    });
  });
});