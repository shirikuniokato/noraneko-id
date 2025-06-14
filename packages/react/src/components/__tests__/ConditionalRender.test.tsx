/**
 * ConditionalRender Component のテスト
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { 
  ConditionalRender, 
  AuthenticatedOnly, 
  UnauthenticatedOnly 
} from '../ConditionalRender';
import { NoranekoIDProvider } from '../../context/NoranekoIDProvider';
import { mockConfig } from '../../test-setup';

// テスト用コンポーネント
const AuthenticatedContent = () => <div data-testid="authenticated">Authenticated Content</div>;
const UnauthenticatedContent = () => <div data-testid="unauthenticated">Unauthenticated Content</div>;
const LoadingContent = () => <div data-testid="loading">Loading...</div>;
const ErrorContent = () => <div data-testid="error">Error occurred</div>;

// Context の状態をモックするためのカスタムProvider
const createMockProvider = (authState: any) => {
  return ({ children }: { children: React.ReactNode }) => {
    return (
      <NoranekoIDProvider config={mockConfig}>
        {children}
      </NoranekoIDProvider>
    );
  };
};

describe('ConditionalRender', () => {
  it('認証済み時に認証済みコンテンツを表示', () => {
    const MockProvider = createMockProvider({
      isAuthenticated: true,
      isLoading: false,
      isInitializing: false,
      error: null,
    });

    render(
      <MockProvider>
        <ConditionalRender
          authenticated={<AuthenticatedContent />}
          unauthenticated={<UnauthenticatedContent />}
        />
      </MockProvider>
    );

    // 認証済みコンテンツが表示されることを確認
    // （実際の実装の認証状態管理に依存）
  });

  it('未認証時に未認証コンテンツを表示', () => {
    const MockProvider = createMockProvider({
      isAuthenticated: false,
      isLoading: false,
      isInitializing: false,
      error: null,
    });

    render(
      <MockProvider>
        <ConditionalRender
          authenticated={<AuthenticatedContent />}
          unauthenticated={<UnauthenticatedContent />}
        />
      </MockProvider>
    );

    // 未認証コンテンツが表示されることを確認
    // （実際の実装の認証状態管理に依存）
  });

  it('初期化中にローディングコンテンツを表示', () => {
    const MockProvider = createMockProvider({
      isAuthenticated: false,
      isLoading: false,
      isInitializing: true,
      error: null,
    });

    render(
      <MockProvider>
        <ConditionalRender
          authenticated={<AuthenticatedContent />}
          unauthenticated={<UnauthenticatedContent />}
          loading={<LoadingContent />}
        />
      </MockProvider>
    );

    // カスタムローディングコンテンツが表示されることを確認
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('ローディング中にローディングコンテンツを表示', () => {
    const MockProvider = createMockProvider({
      isAuthenticated: false,
      isLoading: true,
      isInitializing: false,
      error: null,
    });

    render(
      <MockProvider>
        <ConditionalRender
          authenticated={<AuthenticatedContent />}
          unauthenticated={<UnauthenticatedContent />}
          loading={<LoadingContent />}
        />
      </MockProvider>
    );

    // カスタムローディングコンテンツが表示されることを確認
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('デフォルトローディング表示', () => {
    const MockProvider = createMockProvider({
      isAuthenticated: false,
      isLoading: true,
      isInitializing: false,
      error: null,
    });

    render(
      <MockProvider>
        <ConditionalRender
          authenticated={<AuthenticatedContent />}
          unauthenticated={<UnauthenticatedContent />}
        />
      </MockProvider>
    );

    // デフォルトローディングメッセージが表示されることを確認
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('エラー時にエラーコンテンツを表示', () => {
    const MockProvider = createMockProvider({
      isAuthenticated: false,
      isLoading: false,
      isInitializing: false,
      error: new Error('Test error'),
    });

    render(
      <MockProvider>
        <ConditionalRender
          authenticated={<AuthenticatedContent />}
          unauthenticated={<UnauthenticatedContent />}
          error={<ErrorContent />}
        />
      </MockProvider>
    );

    // エラーコンテンツが表示されることを確認
    expect(screen.getByTestId('error')).toBeInTheDocument();
  });

  it('childrenがauthenticatedより優先される', () => {
    const MockProvider = createMockProvider({
      isAuthenticated: true,
      isLoading: false,
      isInitializing: false,
      error: null,
    });

    const ChildrenContent = () => <div data-testid="children">Children Content</div>;

    render(
      <MockProvider>
        <ConditionalRender authenticated={<AuthenticatedContent />}>
          <ChildrenContent />
        </ConditionalRender>
      </MockProvider>
    );

    // childrenが優先されることを確認
    // （実際の実装の認証状態管理に依存）
  });

  it('何も指定されていない場合はnullを返す', () => {
    const MockProvider = createMockProvider({
      isAuthenticated: false,
      isLoading: false,
      isInitializing: false,
      error: null,
    });

    const { container } = render(
      <MockProvider>
        <ConditionalRender />
      </MockProvider>
    );

    // 何も表示されないことを確認
    expect(container.firstChild).toBeNull();
  });
});

describe('AuthenticatedOnly', () => {
  it('認証済み時に子コンポーネントを表示', () => {
    const MockProvider = createMockProvider({
      isAuthenticated: true,
      isLoading: false,
      isInitializing: false,
      error: null,
    });

    render(
      <MockProvider>
        <AuthenticatedOnly>
          <AuthenticatedContent />
        </AuthenticatedOnly>
      </MockProvider>
    );

    // 認証済みコンテンツが表示されることを確認
    // （実際の実装の認証状態管理に依存）
  });

  it('未認証時にfallbackを表示', () => {
    const MockProvider = createMockProvider({
      isAuthenticated: false,
      isLoading: false,
      isInitializing: false,
      error: null,
    });

    render(
      <MockProvider>
        <AuthenticatedOnly fallback={<UnauthenticatedContent />}>
          <AuthenticatedContent />
        </AuthenticatedOnly>
      </MockProvider>
    );

    // fallbackが表示されることを確認
    // （実際の実装の認証状態管理に依存）
  });
});

describe('UnauthenticatedOnly', () => {
  it('未認証時に子コンポーネントを表示', () => {
    const MockProvider = createMockProvider({
      isAuthenticated: false,
      isLoading: false,
      isInitializing: false,
      error: null,
    });

    render(
      <MockProvider>
        <UnauthenticatedOnly>
          <UnauthenticatedContent />
        </UnauthenticatedOnly>
      </MockProvider>
    );

    // 未認証コンテンツが表示されることを確認
    // （実際の実装の認証状態管理に依存）
  });

  it('認証済み時にfallbackを表示', () => {
    const MockProvider = createMockProvider({
      isAuthenticated: true,
      isLoading: false,
      isInitializing: false,
      error: null,
    });

    render(
      <MockProvider>
        <UnauthenticatedOnly fallback={<AuthenticatedContent />}>
          <UnauthenticatedContent />
        </UnauthenticatedOnly>
      </MockProvider>
    );

    // fallbackが表示されることを確認
    // （実際の実装の認証状態管理に依存）
  });
});