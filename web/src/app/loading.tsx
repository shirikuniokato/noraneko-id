/**
 * ルートレベルのローディング状態
 * Next.js App Routerのローディングベストプラクティス
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">読み込み中</h2>
        <p className="text-gray-600">しばらくお待ちください...</p>
      </div>
    </div>
  );
}