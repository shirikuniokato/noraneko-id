// import { clearSession } from '@noranekoid/nextjs/server';
import { redirect } from 'next/navigation';

export default function LogoutButton() {
  // サーバーアクション: ログアウト処理
  async function handleLogout() {
    'use server';
    // TODO: await clearSession();
    redirect('/login');
  }

  return (
    <form action={handleLogout}>
      <button
        type="submit"
        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
      >
        ログアウト
      </button>
    </form>
  );
}