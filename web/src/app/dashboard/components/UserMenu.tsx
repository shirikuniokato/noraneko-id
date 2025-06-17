/**
 * UserMenu - Server-first アプローチによるユーザーメニュー
 * 新しいSDKではProvider不要でサーバーアクションを使用
 */
// import { clearSession } from "@noranekoid/nextjs/server";
import { redirect } from "next/navigation";
// import type { User } from "@noranekoid/nextjs";

// TODO: 一時的な型定義
interface User {
  id: string;
  email: string;
  email_verified: boolean;
  display_name?: string;
  username?: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

interface UserMenuProps {
  user: User;
}

export default function UserMenu({ user }: UserMenuProps) {
  // サーバーアクション: ログアウト処理
  async function handleLogout() {
    "use server";
    // TODO: await clearSession();
    redirect("/login");
  }

  return (
    <div className="relative">
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-700">
          こんにちは、{user.display_name || user.username || user.email}
        </span>
        <form action={handleLogout}>
          <button
            type="submit"
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            ログアウト
          </button>
        </form>
      </div>
    </div>
  );
}
