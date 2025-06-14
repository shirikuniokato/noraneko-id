'use client';

import { ProtectedRoute } from '@noraneko/id-react';
import { useNoranekoID } from '@noraneko/id-react';
import { Suspense } from 'react';

function DashboardContent() {
  const { user, logout } = useNoranekoID();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーション */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a href="/" className="text-xl font-bold text-blue-600">noraneko-id Demo</a>
              <span className="ml-4 text-gray-500">/</span>
              <span className="ml-4 text-gray-700">ダッシュボード</span>
            </div>
            <div className="flex items-center space-x-4">
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
            </div>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          {/* ヘッダー */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ダッシュボード
            </h1>
            <p className="text-gray-600">
              🎉 保護されたページにアクセスできました！これは認証が必要なページです。
            </p>
          </div>

          {/* ユーザー情報 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">ユーザー情報</h2>
            {user && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">ユーザーID</dt>
                    <dd className="text-sm text-gray-900 font-mono">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
                    <dd className="text-sm text-gray-900">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">表示名</dt>
                    <dd className="text-sm text-gray-900">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">メール確認</dt>
                    <dd className="text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.email_verified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.email_verified ? '確認済み' : '未確認'}
                      </span>
                    </dd>
                  </div>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-2">完全なユーザー情報（JSON）</dt>
                  <dd>
                    <pre className="p-3 bg-gray-50 rounded text-xs overflow-auto">
                      {JSON.stringify(user, null, 2)}
                    </pre>
                  </dd>
                </div>
              </div>
            )}
          </div>

          {/* アクセストークン情報 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">トークン情報</h2>
            <div className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-2">アクセストークン</dt>
                <dd>
                  <div className="p-3 bg-gray-50 rounded text-xs font-mono break-all">
                    アクセストークンは内部的に管理されています
                  </div>
                </dd>
              </div>
              <p className="text-xs text-gray-500">
                ※ このトークンを使用してAPIリクエストを送信できます。
              </p>
            </div>
          </div>

          {/* API呼び出し例 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">API呼び出し例</h2>
            <div className="space-y-4">
              <p className="text-gray-600">
                以下のようにアクセストークンを使用してAPIを呼び出すことができます：
              </p>
              
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto">
                <pre className="text-sm">{`// JavaScript example
const response = await fetch('${process.env.NORANEKO_ISSUER || 'http://localhost:8080'}/oauth2/userinfo', {
  headers: {
    'Authorization': \`Bearer \${accessToken}\`,
  },
});

const userInfo = await response.json();
console.log(userInfo);`}</pre>
              </div>
              
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto">
                <pre className="text-sm">{`# curl example
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
     ${process.env.NORANEKO_ISSUER || 'http://localhost:8080'}/oauth2/userinfo`}</pre>
              </div>
            </div>
          </div>

          {/* ナビゲーション */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">ナビゲーション</h2>
            <div className="flex flex-wrap gap-4">
              <a
                href="/"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                ← ホームに戻る
              </a>
              <button
                onClick={() => logout()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full"></div>
      </div>
    }>
      <ProtectedRoute
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="text-yellow-600 text-5xl mb-4">🔒</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">認証が必要です</h1>
              <p className="text-gray-600 mb-6">
                このページにアクセスするにはログインが必要です。
              </p>
              <a
                href="/"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                ホームに戻る
              </a>
            </div>
          </div>
        }
      >
        <DashboardContent />
      </ProtectedRoute>
    </Suspense>
  );
}