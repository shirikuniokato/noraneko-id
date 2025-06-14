/**
 * Next.js App Router用の認証HOC
 */
import React from 'react';
import type { WithAuthOptions, AuthMiddlewareConfig, SessionData } from './types';
/**
 * Server Componentを認証で保護するHOC
 *
 * @param WrappedComponent 保護対象のServer Component
 * @param config 認証設定
 * @param options 認証オプション
 * @returns 認証保護されたコンポーネント
 *
 * @example
 * ```typescript
 * // app/dashboard/page.tsx
 * import { withAuth } from '@noraneko/id-react/middleware';
 *
 * async function DashboardPage({ session }: { session: SessionData }) {
 *   return (
 *     <div>
 *       <h1>Welcome, {session.user.display_name}!</h1>
 *       <p>Email: {session.user.email}</p>
 *     </div>
 *   );
 * }
 *
 * export default withAuth(DashboardPage, {
 *   issuer: process.env.NORANEKO_ISSUER!,
 * });
 * ```
 *
 * @example
 * ```typescript
 * // 管理者専用ページ
 * async function AdminPage({ session }: { session: SessionData }) {
 *   return <AdminDashboard user={session.user} />;
 * }
 *
 * export default withAuth(AdminPage,
 *   { issuer: process.env.NORANEKO_ISSUER! },
 *   { requireAdmin: true }
 * );
 * ```
 */
export declare function withAuth<P extends object = {}>(WrappedComponent: React.ComponentType<P & {
    session: SessionData;
}>, config: AuthMiddlewareConfig, options?: WithAuthOptions): React.ComponentType<P>;
/**
 * Client Component用の認証HOC
 * Next.js App Routerでクライアントサイドの認証保護を実現
 *
 * @example
 * ```typescript
 * // app/dashboard/client-page.tsx
 * 'use client';
 *
 * import { withClientAuth } from '@noraneko/id-react/middleware';
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
 * function ProfilePage({ session }: { session?: SessionData }) {
 *   if (session) {
 *     return <AuthenticatedProfile user={session.user} />;
 *   }
 *
 *   return <PublicProfile />;
 * }
 *
 * export default withConditionalAuth(ProfilePage,
 *   { issuer: process.env.NORANEKO_ISSUER! },
 *   { condition: (pathname) => pathname.includes('/edit') }
 * );
 * ```
 */
export declare function withConditionalAuth<P extends object = {}>(WrappedComponent: React.ComponentType<P & {
    session?: SessionData;
}>, config: AuthMiddlewareConfig, options: WithAuthOptions & {
    condition: (pathname: string) => boolean;
}): React.ComponentType<P>;
//# sourceMappingURL=withAuth.d.ts.map