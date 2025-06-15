'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNoranekoID } from '@noraneko/id-react/nextjs/client';

export default function LoginSDKPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error } = useNoranekoID();
  const [loginError, setLoginError] = useState<string>('');

  useEffect(() => {
    // URLパラメータからエラーメッセージを取得
    const errorParam = searchParams.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'access_denied':
          setLoginError('アクセスが拒否されました。');
          break;
        case 'invalid_callback':
          setLoginError('コールバック処理に失敗しました。');
          break;
        case 'callback_failed':
          setLoginError('認証処理に失敗しました。');
          break;
        default:
          setLoginError('ログインに失敗しました。');
      }
    }
  }, [searchParams]);

  // Middleware が認証済みユーザーを自動的にリダイレクトするため、手動リダイレクト不要

  const handleLogin = async () => {
    try {
      setLoginError('');
      await login();
      // login()は認証フローを開始するため、リダイレクトが発生
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('ログインの開始に失敗しました。再度お試しください。');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">読み込み中...</h2>
          <p className="text-gray-600">少々お待ちください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* ヘッダー */}
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100">
            <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            管理者ログイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Noraneko ID 管理コンソール
          </p>
        </div>

        {/* エラーメッセージ */}
        {(loginError || error) && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {loginError || error?.message || 'エラーが発生しました'}
                </h3>
              </div>
            </div>
          </div>
        )}

        {/* ログインフォーム */}
        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm space-y-4">
            <div className="bg-white px-4 py-5 border border-gray-300 rounded-lg">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  OAuth2認証でログイン
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  安全な認証システムを使用してログインします
                </p>
                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      認証処理中...
                    </>
                  ) : (
                    'ログイン'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 従来のログイン方法へのリンク */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              従来のログイン方法をご希望の場合は{' '}
              <button
                onClick={() => router.push('/login')}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                こちら
              </button>
            </p>
          </div>
        </div>

        {/* 開発情報 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="text-sm text-yellow-800">
              <h4 className="font-medium mb-2">開発者情報:</h4>
              <div className="space-y-1 text-xs">
                <p>Client ID: {process.env.NEXT_PUBLIC_OAUTH2_CLIENT_ID}</p>
                <p>Redirect URI: {process.env.NEXT_PUBLIC_OAUTH2_REDIRECT_URI}</p>
                <p>API URL: {process.env.NEXT_PUBLIC_API_URL}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}