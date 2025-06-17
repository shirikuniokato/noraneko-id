'use client';

import { useEffect } from 'react';

/**
 * グローバルエラーバウンダリ
 * Next.js App Routerのエラーハンドリングベストプラクティス
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーログをコンソールに出力（開発環境）
    if (process.env.NODE_ENV === 'development') {
      console.error('[App Error]', error);
    } else {
      // 本番環境: エラートラッキングサービスに送信
      // 例: Sentry.captureException(error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        
        <h2 className="mt-4 text-xl font-semibold text-center text-gray-900">
          エラーが発生しました
        </h2>
        
        <p className="mt-2 text-sm text-center text-gray-600">
          申し訳ございません。予期しないエラーが発生しました。
        </p>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-700">
            <p className="font-mono">{error.message}</p>
            {error.digest && (
              <p className="mt-1 text-gray-500">Error ID: {error.digest}</p>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={reset}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            再試行
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            ホームへ戻る
          </button>
        </div>
      </div>
    </div>
  );
}