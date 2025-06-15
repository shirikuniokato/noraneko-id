import React from 'react';
export interface LoginRequiredProps {
    /** 認証済み時に表示する子コンポーネント */
    children: React.ReactNode;
    /** 未認証時のメッセージ */
    message?: string;
    /** ログインボタンのテキスト */
    loginButtonText?: string;
    /** ログイン時のオプション */
    loginOptions?: {
        scopes?: string[];
        additionalParams?: Record<string, string>;
    };
    /** カスタムスタイル */
    className?: string;
    /** カスタムスタイル（インライン） */
    style?: React.CSSProperties;
}
/**
 * LoginRequired Component
 *
 * ログインが必要なコンテンツを表示し、未認証時はログインボタンを提供
 * ProtectedRouteと異なり、自動リダイレクトせずユーザーの明示的な操作を待つ
 *
 * @example
 * ```tsx
 * // 基本的な使用
 * function UserProfile() {
 *   return (
 *     <div>
 *       <h1>ユーザープロフィール</h1>
 *       <LoginRequired>
 *         <UserDetails />
 *       </LoginRequired>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // カスタムメッセージとスコープ
 * function PremiumContent() {
 *   return (
 *     <LoginRequired
 *       message="プレミアムコンテンツにアクセスするにはログインが必要です"
 *       loginButtonText="プレミアムアカウントでログイン"
 *       loginOptions={{
 *         scopes: ['openid', 'profile', 'premium'],
 *         additionalParams: { prompt: 'consent' }
 *       }}
 *     >
 *       <PremiumDashboard />
 *     </LoginRequired>
 *   );
 * }
 * ```
 */
export declare function LoginRequired({ children, message, loginButtonText, loginOptions, className, style }: LoginRequiredProps): JSX.Element;
//# sourceMappingURL=LoginRequired.d.ts.map