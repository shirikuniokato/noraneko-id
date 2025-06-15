export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Noraneko ID
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            管理コンソール
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                管理コンソールへログイン
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                OAuth2+PKCEによるセキュアな認証を使用します。
              </p>
            </div>

            <div>
              <a
                href="/login"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ログイン
              </a>
            </div>

            {/* 開発者情報 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">開発者向け情報:</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <p>• OAuth2 Client ID: admin-dashboard-001</p>
                  <p>• 管理者アカウント: admin@example.com / password123</p>
                  <p>• API エンドポイント: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            このシステムはOAuth2 (RFC 6749) に準拠しています
          </p>
        </div>
      </div>
    </div>
  );
}