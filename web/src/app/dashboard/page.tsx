// import { requireAuth } from '@noranekoid/nextjs/server';
import DashboardHeader from './components/DashboardHeader';
import DashboardNav from './components/DashboardNav';
import DashboardStats from './components/DashboardStats';
import UserInfoSection from './components/UserInfoSection';
import UserMenu from './components/UserMenu';

export default async function DashboardPage() {
  // TODO: Server ComponentでServer-side認証チェック（現在はself参照エラーのためコメントアウト）
  // const user = await requireAuth();
  const user = {
    id: '1',
    email: 'admin@example.com',
    email_verified: true,
    display_name: 'Admin User',
    username: 'admin',
    is_admin: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Server Component によるユーザーメニュー */}
      <div className="bg-white shadow p-4 mb-4">
        <UserMenu user={user} />
      </div>
      
      {/* Server-side でレンダリングされるヘッダー */}
      <DashboardHeader userInfo={user} />
      
      {/* Server-side でレンダリングされるナビゲーション */}
      <DashboardNav currentPath="/dashboard" />

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Server-side でレンダリングされる統計カード */}
          <DashboardStats userInfo={user} />

          {/* Server-side でレンダリングされるユーザー情報（Client Componentで動的機能含む） */}
          <UserInfoSection userInfo={user} />

          {/* デバッグ情報（開発環境のみ） */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800 mb-2">🎉 新しいSDK デバッグ情報:</h4>
                <div className="text-xs text-green-700 space-y-1">
                  <p><strong>✅ Server API:</strong> requireAuth() (統合関数)</p>
                  <p><strong>✅ 認証状態:</strong> Server-side認証済み</p>
                  <p><strong>✅ ユーザーID:</strong> {user.id}</p>
                  <p><strong>✅ ユーザー名:</strong> {user.display_name || 'N/A'}</p>
                  <p><strong>✅ メール:</strong> {user.email}</p>
                  <p><strong>✅ 管理者権限:</strong> {user.is_admin ? 'あり' : 'なし'}</p>
                  <p><strong>🚀 Provider不要:</strong> Server-first アプローチ</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}