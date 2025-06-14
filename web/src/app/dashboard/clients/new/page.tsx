'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function NewClientPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    redirect_uri: '',
    scopes: 'read',
    grant_types: 'authorization_code',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.oauth2.createClient({
        name: formData.name,
        description: formData.description || undefined,
        redirect_uri: formData.redirect_uri,
        scopes: formData.scopes.split(',').map(s => s.trim()),
        grant_types: formData.grant_types.split(',').map(s => s.trim()),
      });
      router.push('/dashboard/clients');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'クライアントの作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/clients"
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                新しいOAuth2クライアント
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  クライアント名 *
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="My Application"
                  value={formData.name}
                  onChange={handleInputChange}
                />
                <p className="mt-1 text-sm text-gray-500">
                  アプリケーションの名前を入力してください
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  説明
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="アプリケーションの説明を入力してください"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label htmlFor="redirect_uri" className="block text-sm font-medium text-gray-700">
                  リダイレクトURI *
                </label>
                <input
                  type="url"
                  name="redirect_uri"
                  id="redirect_uri"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="https://example.com/oauth/callback"
                  value={formData.redirect_uri}
                  onChange={handleInputChange}
                />
                <p className="mt-1 text-sm text-gray-500">
                  認証後にユーザーをリダイレクトするURIを入力してください
                </p>
              </div>

              <div>
                <label htmlFor="scopes" className="block text-sm font-medium text-gray-700">
                  スコープ *
                </label>
                <input
                  type="text"
                  name="scopes"
                  id="scopes"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="read,write,profile"
                  value={formData.scopes}
                  onChange={handleInputChange}
                />
                <p className="mt-1 text-sm text-gray-500">
                  カンマ区切りでスコープを入力してください（例: read, write, profile）
                </p>
              </div>

              <div>
                <label htmlFor="grant_types" className="block text-sm font-medium text-gray-700">
                  グラントタイプ *
                </label>
                <select
                  name="grant_types"
                  id="grant_types"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.grant_types}
                  onChange={handleInputChange}
                >
                  <option value="authorization_code">Authorization Code</option>
                  <option value="authorization_code,refresh_token">Authorization Code + Refresh Token</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  OAuth2のグラントタイプを選択してください
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <Link
                  href="/dashboard/clients"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  キャンセル
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '作成中...' : 'クライアント作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}