import type { User } from "@noranekoid/nextjs";

interface UserInfoSectionProps {
  userInfo: User;
}

export default function UserInfoSection({ userInfo }: UserInfoSectionProps) {
  // 新しいSDKではサーバーコンポーネントとして単純化
  // 動的な機能が必要な場合は、個別のクライアントコンポーネントとして分離
  const displayUser = userInfo;

  return (
    <div className="mt-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              ユーザー情報
            </h3>
            {/* Server-first アプローチでは自動更新機能は簡素化 */}
            <div className="text-xs text-gray-500">
              サーバーサイドで最新情報を取得済み
            </div>
          </div>
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                メールアドレス
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {displayUser.email}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">ユーザー名</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {displayUser.username || "N/A"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">名前</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {displayUser.display_name || "N/A"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">メール認証</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {displayUser.email_verified ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    認証済み
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    未認証
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">管理者権限</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {displayUser.is_admin ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    管理者
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    一般ユーザー
                  </span>
                )}
              </dd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
