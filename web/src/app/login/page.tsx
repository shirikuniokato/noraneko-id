// import { auth } from "@noranekoid/nextjs/server";
import { redirect } from "next/navigation";

interface LoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // TODO: 既に認証済みの場合はダッシュボードにリダイレクト
  // const session = await auth();
  // if (session) {
  //   redirect('/dashboard');
  // }

  // URLパラメータを取得
  const params = await searchParams;
  const errorParam = params.error;

  // サーバーアクション: ログイン処理
  async function handleLogin() {
    'use server';
    // OAuth2認証フローを開始
    const loginUrl = `/api/auth/login`;
    redirect(loginUrl);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Server-side でレンダリングされるヘッダー */}
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100">
            <svg
              className="h-6 w-6 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            管理者ログイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Noraneko ID 管理コンソール
          </p>
        </div>

        {/* エラーメッセージ表示 */}
        {errorParam && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-800">
              ログインに失敗しました。再度お試しください。
              {process.env.NODE_ENV === "development" && (
                <p className="mt-1 text-xs">Error: {errorParam}</p>
              )}
            </div>
          </div>
        )}

        {/* サーバーアクションによるログインフォーム（JavaScript不要） */}
        <form action={handleLogin} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="text-center">
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Noraneko ID でログイン
              </button>
            </div>
          </div>
        </form>

        {/* 開発情報 */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="text-sm text-yellow-800">
              <h4 className="font-medium mb-2">開発者情報:</h4>
              <div className="space-y-1 text-xs">
                <p>Client ID: {process.env.NEXT_PUBLIC_OAUTH2_CLIENT_ID}</p>
                <p>API URL: {process.env.NEXT_PUBLIC_API_URL}</p>
                <p>実装: Server Component + Server Actions（JavaScript不要）</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
