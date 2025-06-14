'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface AuthorizeRequest {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
}

interface ClientInfo {
  id: string;
  name: string;
  description?: string;
  redirect_uri: string;
}

function OAuth2AuthorizeForm() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [authorizeRequest, setAuthorizeRequest] = useState<AuthorizeRequest | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [scopes, setScopes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      // ユーザーが未認証の場合、ログインページにリダイレクト
      const currentUrl = window.location.href;
      router.push(`/login?redirect_uri=${encodeURIComponent(currentUrl)}`);
      return;
    }

    if (user) {
      // URLパラメータから認可リクエストを取得
      const request: AuthorizeRequest = {
        response_type: searchParams.get('response_type') || '',
        client_id: searchParams.get('client_id') || '',
        redirect_uri: searchParams.get('redirect_uri') || '',
        scope: searchParams.get('scope') || 'openid',
        state: searchParams.get('state') || undefined,
        code_challenge: searchParams.get('code_challenge') || undefined,
        code_challenge_method: searchParams.get('code_challenge_method') || 'S256',
      };

      // 基本的なバリデーション
      if (!request.response_type || !request.client_id || !request.redirect_uri) {
        setError('必要なパラメータが不足しています');
        return;
      }

      if (request.response_type !== 'code') {
        setError('サポートされていないレスポンスタイプです');
        return;
      }

      setAuthorizeRequest(request);
      setScopes(request.scope.split(' ').filter(s => s.length > 0));
      
      // クライアント情報を取得
      fetchClientInfo(request.client_id);
    }
  }, [user, loading, router, searchParams]);

  const fetchClientInfo = async (clientId: string) => {
    try {
      const response = await fetch(`http://localhost:8080/oauth2/client-info/${clientId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('クライアント情報の取得に失敗しました');
      }
      
      const data = await response.json();
      setClientInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'クライアント情報の取得に失敗しました');
    }
  };

  const handleApprove = async () => {
    if (!authorizeRequest) return;

    setSubmitting(true);
    try {
      // 認可エンドポイントに同意のリクエストを送信
      const params = new URLSearchParams({
        response_type: authorizeRequest.response_type,
        client_id: authorizeRequest.client_id,
        redirect_uri: authorizeRequest.redirect_uri,
        scope: authorizeRequest.scope,
        approve: 'true',
        ...(authorizeRequest.state && { state: authorizeRequest.state }),
        ...(authorizeRequest.code_challenge && { code_challenge: authorizeRequest.code_challenge }),
        ...(authorizeRequest.code_challenge_method && { code_challenge_method: authorizeRequest.code_challenge_method }),
      });

      const response = await fetch(`http://localhost:8080/oauth2/authorize?${params}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.redirected) {
        // リダイレクトレスポンスの場合、そのURLにリダイレクト
        window.location.href = response.url;
      } else {
        const data = await response.json();
        if (data.redirect_uri) {
          window.location.href = data.redirect_uri;
        } else {
          throw new Error('認可に失敗しました');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '認可に失敗しました');
      setSubmitting(false);
    }
  };

  const handleDeny = () => {
    if (!authorizeRequest) return;

    // 拒否時はerror=access_deniedでリダイレクト
    const redirectUrl = new URL(authorizeRequest.redirect_uri);
    redirectUrl.searchParams.set('error', 'access_denied');
    redirectUrl.searchParams.set('error_description', 'ユーザーがアクセスを拒否しました');
    if (authorizeRequest.state) {
      redirectUrl.searchParams.set('state', authorizeRequest.state);
    }
    
    window.location.href = redirectUrl.toString();
  };

  const getScopeDescription = (scope: string): string => {
    const descriptions: Record<string, string> = {
      'openid': 'あなたの基本的なプロフィール情報（ユーザーID）',
      'profile': 'あなたのプロフィール情報（ユーザー名、表示名）',
      'email': 'あなたのメールアドレス',
      'read': 'あなたの情報を読み取り',
      'write': 'あなたの情報を更新',
    };
    return descriptions[scope] || `${scope}スコープ`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <svg className="w-8 h-8 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h1 className="text-xl font-semibold text-gray-900">認可エラー</h1>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
            >
              ダッシュボードに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!authorizeRequest || !clientInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">認可情報を読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white shadow rounded-lg p-6">
          {/* ヘッダー */}
          <div className="text-center mb-6">
            <svg className="mx-auto h-12 w-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">アプリケーションの認可</h2>
            <p className="mt-2 text-sm text-gray-600">
              <strong>{clientInfo.name}</strong> があなたのnoraneko-idアカウントへのアクセスを求めています
            </p>
          </div>

          {/* クライアント情報 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">アプリケーション情報</h3>
            <div className="text-sm text-gray-600">
              <p><strong>名前:</strong> {clientInfo.name}</p>
              {clientInfo.description && (
                <p><strong>説明:</strong> {clientInfo.description}</p>
              )}
              <p><strong>リダイレクトURI:</strong> {clientInfo.redirect_uri}</p>
            </div>
          </div>

          {/* ユーザー情報 */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">認可されるアカウント</h3>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user.display_name || user.username}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
          </div>

          {/* スコープ情報 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              このアプリケーションは以下の権限を要求しています：
            </h3>
            <ul className="space-y-2">
              {scopes.map((scope) => (
                <li key={scope} className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-700">{getScopeDescription(scope)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 注意事項 */}
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex">
              <svg className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-yellow-800">
                <p className="font-medium">認可する前に確認してください</p>
                <p>信頼できるアプリケーションのみに認可を与えてください。認可後は管理画面で権限を取り消すことができます。</p>
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex space-x-4">
            <button
              onClick={handleDeny}
              disabled={submitting}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              拒否
            </button>
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '認可中...' : '認可する'}
            </button>
          </div>
        </div>

        {/* フッター */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Powered by <strong>noraneko-id</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OAuth2AuthorizePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div>Loading...</div></div>}>
      <OAuth2AuthorizeForm />
    </Suspense>
  );
}