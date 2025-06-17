/**
 * ダッシュボードページのローディング状態
 * スケルトンローディングでより良いUXを提供
 */
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダースケルトン */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex items-center space-x-4">
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* ナビゲーションスケルトン */}
      <nav className="bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 h-16">
            <div className="h-4 w-24 bg-gray-600 rounded animate-pulse my-auto"></div>
            <div className="h-4 w-24 bg-gray-600 rounded animate-pulse my-auto"></div>
            <div className="h-4 w-24 bg-gray-600 rounded animate-pulse my-auto"></div>
          </div>
        </div>
      </nav>

      {/* メインコンテンツスケルトン */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 統計カードスケルトン */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>

          {/* ユーザー情報セクションスケルトン */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}