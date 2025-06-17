'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * ダッシュボード専用エラーバウンダリ
 * 認証エラーの場合は自動的にログインページへリダイレクト
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // 認証エラーの場合は自動リダイレクト
    if (error.message?.includes('認証') || error.message?.includes('auth')) {
      router.push('/login?error=session_expired');
    }
    
    // エラーログ
    console.error('[Dashboard Error]', error);
  }, [error, router]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            ダッシュボードエラー
          </h3>
          
          <p className="mt-2 text-sm text-gray-600">
            ダッシュボードの読み込み中にエラーが発生しました。
          </p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={reset}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
            >
              再試行
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300"
            >
              トップへ戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}