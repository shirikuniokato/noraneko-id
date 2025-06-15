/**
 * Next.js App Router用の認証HOC
 */
import React from 'react';
import { ServerUserInfo } from './auth';
/**
 * 保護ルートのオプション
 */
export interface WithAuthOptions {
    /** 管理者権限が必要か */
    requireAdmin?: boolean;
    /** カスタム認証チェック関数 */
    customAuthCheck?: (userInfo: ServerUserInfo) => boolean;
    /** 未認証時のリダイレクト先 */
    loginUrl?: string;
    /** 権限不足時のリダイレクト先 */
    unauthorizedUrl?: string;
    /** ローディングコンポーネント */
    loading?: React.ComponentType;
    /** 未認証時のフォールバックコンポーネント */
    fallback?: React.ComponentType;
    /** 権限不足時のフォールバックコンポーネント */
    unauthorized?: React.ComponentType;
}
/**
 * Server Componentを認証で保護するHOC
 *
 * @param WrappedComponent 保護対象のServer Component
 * @param options 認証オプション
 * @returns 認証保護されたコンポーネント
 *
 * @example
 * ```typescript
 * // app/dashboard/page.tsx
 * import { withAuth } from '@noraneko/id-react/nextjs/server';
 *
 * async function DashboardPage({ userInfo }: { userInfo: ServerUserInfo }) {
 *   return (
 *     <div>
 *       <h1>Welcome, {userInfo.user.display_name}!</h1>
 *       <p>Email: {userInfo.user.email}</p>
 *     </div>
 *   );
 * }
 *
 * export default withAuth(DashboardPage);
 * ```
 */
export declare function withAuth<P extends object = {}>(WrappedComponent: React.ComponentType<P & {
    userInfo: ServerUserInfo;
}>, options?: WithAuthOptions): React.ComponentType<P>;
/**
 * Client Component用の認証HOC
 * Next.js App Routerでクライアントサイドの認証保護を実現
 *
 * @example
 * ```typescript
 * // app/dashboard/client-page.tsx
 * 'use client';
 *
 * import { withClientAuth } from '@noraneko/id-react/nextjs/server';
 * import { useNoranekoID } from '@noraneko/id-react';
 *
 * function ClientDashboard() {
 *   const { user } = useNoranekoID();
 *
 *   return (
 *     <div>
 *       <h1>Client Dashboard</h1>
 *       <p>User: {user?.display_name}</p>
 *     </div>
 *   );
 * }
 *
 * export default withClientAuth(ClientDashboard, {
 *   requireAdmin: true
 * });
 * ```
 */
export declare function withClientAuth<P extends object = {}>(WrappedComponent: React.ComponentType<P>, options?: WithAuthOptions): React.ComponentType<P>;
/**
 * 条件付き認証HOC
 * 特定の条件下でのみ認証を要求
 *
 * @example
 * ```typescript
 * function ProfilePage({ userInfo }: { userInfo?: ServerUserInfo }) {
 *   if (userInfo) {
 *     return <AuthenticatedProfile user={userInfo.user} />;
 *   }
 *
 *   return <PublicProfile />;
 * }
 *
 * export default withConditionalAuth(ProfilePage, {
 *   condition: (pathname) => pathname.includes('/edit')
 * });
 * ```
 */
export declare function withConditionalAuth<P extends object = {}>(WrappedComponent: React.ComponentType<P & {
    userInfo?: ServerUserInfo;
}>, options: WithAuthOptions & {
    condition: (pathname: string) => boolean;
}): React.ComponentType<P>;
//# sourceMappingURL=with-auth.d.ts.map