'use client';

// useRouter, useEffectは削除（middlewareが認証チェックを処理）
import { useNoranekoID, useUserInfo, useAccessToken } from '@noraneko/id-react/nextjs/client';
import Link from 'next/link';

export default function DashboardSDKPage() {
  const { isAuthenticated, isLoading, logout, error } = useNoranekoID();
  const { user: userInfo, isLoading: userLoading, error: userError } = useUserInfo();
  const { accessToken } = useAccessToken();

  // Middleware が認証チェックを処理するため、手動リダイレクトは不要

  const handleLogout = async () => {
    try {
      await logout();
      // middlewareが自動的に/loginにリダイレクトするため、手動リダイレクト不要
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (isLoading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // リダイレクト処理中
  }

  if (error || userError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {error?.message || userError?.message || 'エラーが発生しました'}
              </h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              管理ダッシュボード (SDK版)
            </h1>
            <div className="flex items-center space-x-4">
              {userInfo && (
                <div className="text-sm text-gray-700">
                  ようこそ、{userInfo.display_name || userInfo.email}さん
                </div>
              )}
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ナビゲーション */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              href="/dashboard-sdk"
              className="border-b-2 border-indigo-500 text-gray-900 px-1 py-4 text-sm font-medium"
            >
              ダッシュボード
            </Link>
            <Link
              href="/dashboard/clients"
              className="text-gray-500 hover:text-gray-700 px-1 py-4 text-sm font-medium"
            >
              OAuth2クライアント
            </Link>
            <Link
              href="/dashboard/users"
              className="text-gray-500 hover:text-gray-700 px-1 py-4 text-sm font-medium"
            >
              ユーザー管理
            </Link>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 統計カード */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* 認証状況カード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">認証状況</dt>
                      <dd className="text-lg font-medium text-gray-900">認証済み</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* トークン情報カード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2h-6m6 0v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2h2m0-4a2 2 0 012 2v2a2 2 0 01-2 2H9a2 2 0 01-2-2V5a2 2 0 012-2h2z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">アクセストークン</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {accessToken ? '有効' : '無効'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* ユーザー情報カード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">ユーザー</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {userInfo?.display_name || userInfo?.username || 'ユーザー'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ユーザー詳細情報 */}
          {userInfo && (
            <div className="mt-8">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    ユーザー情報
                  </h3>
                  <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
                      <dd className="mt-1 text-sm text-gray-900">{userInfo.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">ユーザー名</dt>
                      <dd className="mt-1 text-sm text-gray-900">{userInfo.username || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">名前</dt>
                      <dd className="mt-1 text-sm text-gray-900">{userInfo.display_name || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">メール認証</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {userInfo.email_verified ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            認証済み
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            未認証
                          </span>
                        )}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* デバッグ情報（開発環境のみ） */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">デバッグ情報:</h4>
                <div className="text-xs text-yellow-700 space-y-1">
                  <p>SDK使用: はい</p>
                  <p>認証状態: {isAuthenticated ? '認証済み' : '未認証'}</p>
                  <p>トークン: {accessToken ? '有効' : '無効'}</p>
                  {userInfo && <p>ユーザーID: {userInfo.id}</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}