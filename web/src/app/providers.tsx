import { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * 新しいSDKはProvider不要。
 * Server-first アプローチを採用し、
 * サーバーサイドでの認証状態管理を推奨。
 * 
 * 必要に応じて最小限のクライアントコンポーネントのみ配置
 */
export function Providers({ children }: ProvidersProps) {
  return <>{children}</>;
}