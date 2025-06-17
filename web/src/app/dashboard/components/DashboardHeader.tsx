import type { User } from "@noranekoid/nextjs";
import LogoutButton from "./LogoutButton";

interface DashboardHeaderProps {
  userInfo: User;
}

export default function DashboardHeader({ userInfo }: DashboardHeaderProps) {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            管理ダッシュボード
          </h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700">
              ようこそ、{userInfo.display_name || userInfo.email}さん
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
