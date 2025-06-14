/**
 * サーバーサイドでのセッション取得ユーティリティ
 */
import type { SessionData, AuthMiddlewareConfig } from './types';
/**
 * Server Components や Server Actions でセッション情報を取得
 *
 * @param config 認証設定
 * @returns セッション情報（認証されていない場合はnull）
 *
 * @example
 * ```typescript
 * // app/dashboard/page.tsx (Server Component)
 * import { getServerSession } from '@noraneko/id-react/middleware';
 *
 * export default async function DashboardPage() {
 *   const session = await getServerSession({
 *     issuer: 'https://id.example.com',
 *   });
 *
 *   if (!session) {
 *     redirect('/auth/login');
 *   }
 *
 *   return (
 *     <div>
 *       <h1>Welcome, {session.user.display_name}!</h1>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Server Action での使用
 * async function updateProfile(formData: FormData) {
 *   'use server';
 *
 *   const session = await getServerSession({
 *     issuer: process.env.NORANEKO_ISSUER!,
 *   });
 *
 *   if (!session) {
 *     throw new Error('Unauthorized');
 *   }
 *
 *   // プロフィール更新処理...
 * }
 * ```
 */
export declare function getServerSession(config: AuthMiddlewareConfig): Promise<SessionData | null>;
/**
 * 現在のリクエストヘッダーからセッション情報を取得
 * ミドルウェアで設定されたヘッダーから情報を読み取る
 *
 * @returns セッション情報（簡易版）
 */
export declare function getSessionFromHeaders(): Promise<{
    isAuthenticated: boolean;
    userId?: string;
    isAdmin?: boolean;
} | null>;
/**
 * セッション検証のヘルパー関数
 */
export declare function requireAuth(config: AuthMiddlewareConfig): Promise<SessionData>;
/**
 * 管理者権限の検証
 */
export declare function requireAdmin(config: AuthMiddlewareConfig): Promise<SessionData>;
/**
 * 特定のスコープの検証
 */
export declare function requireScopes(config: AuthMiddlewareConfig, requiredScopes: string[]): Promise<SessionData>;
//# sourceMappingURL=getServerSession.d.ts.map