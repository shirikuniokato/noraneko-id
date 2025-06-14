'use client';

import { useNoranekoID } from '@noraneko/id-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, error } = useNoranekoID();

  useEffect(() => {
    // 認証完了後にホームページにリダイレクト
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">認証エラー</h1>
          <p className="text-gray-600 mb-6">
            認証処理中にエラーが発生しました。
          </p>
          <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-6">
            <p className="text-red-600 text-sm">{error.message}</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full"></div>
        <p className="mt-4 text-gray-600">認証処理中...</p>
        <p className="mt-2 text-sm text-gray-500">
          しばらくお待ちください。認証が完了次第、自動的にリダイレクトされます。
        </p>
      </div>
    </div>
  );
}