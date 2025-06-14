'use client';

import { useNoranekoID } from '@noraneko/id-react';
import { Suspense } from 'react';

function HomePage() {
  const { user, isAuthenticated, isLoading, error, login, logout } = useNoranekoID();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full"></div>
          <p className="mt-4 text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーション */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">noraneko-id Demo</h1>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    認証済み
                  </span>
                  <span className="text-gray-700">{user?.email}</span>
                  <button
                    onClick={() => logout()}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    ログアウト
                  </button>
                </>
              ) : (
                <>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                    未認証
                  </span>
                  <button
                    onClick={() => login()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    ログイン
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="text-red-800 font-medium">エラーが発生しました</h3>
            <p className="text-red-600 mt-1">{error.message}</p>
          </div>
        )}

        <div className="grid gap-6">
          {/* ウェルカムカード */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              noraneko-id Next.js デモアプリケーション
            </h2>
            <p className="text-gray-600 mb-6">
              このアプリケーションは、noraneko-id の React SDK を使用した認証機能のデモです。
              左上のログインボタンを押して認証フローを開始してください。
            </p>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">実装された機能</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                  OAuth2 + PKCE 認証フロー
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                  自動トークンリフレッシュ
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                  認証状態管理
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                  保護されたルート
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                  ユーザー情報取得
                </li>
              </ul>
            </div>
          </div>

          {/* 認証状態情報 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">現在の認証状態</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">認証状態:</span>
                <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
                  isAuthenticated 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {isAuthenticated ? '認証済み' : '未認証'}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">ローディング状態:</span>
                <span className="ml-2 text-sm text-gray-700">
                  {isLoading ? '読み込み中...' : '完了'}
                </span>
              </div>
              {user && (
                <div>
                  <span className="text-sm font-medium text-gray-500">ユーザー情報:</span>
                  <pre className="mt-2 p-3 bg-gray-50 rounded text-sm overflow-auto">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">アクション</h3>
            <div className="flex flex-wrap gap-4">
              {!isAuthenticated ? (
                <button
                  onClick={() => login()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  ログイン
                </button>
              ) : (
                <>
                  <button
                    onClick={() => logout()}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    ログアウト
                  </button>
                  <a
                    href="/dashboard"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors inline-block"
                  >
                    保護されたページへ
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full"></div>
      </div>
    }>
      <HomePage />
    </Suspense>
  );
}
