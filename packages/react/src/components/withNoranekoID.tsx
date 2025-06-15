/**
 * withNoranekoID - 高階コンポーネント（HOC）
 */
'use client';

import React from 'react';
import { useNoranekoID } from '../hooks/useNoranekoID';
import type { UseNoranekoIDResult } from '../types';

/**
 * HOCによって注入されるProps
 */
export interface WithNoranekoIDProps {
  noranekoID: UseNoranekoIDResult;
}

/**
 * withNoranekoID HOC
 * 
 * クラスコンポーネントや既存のコンポーネントにNoranekoID機能を注入
 * Hooksが使えない環境やレガシーコンポーネントで使用
 * 
 * @param WrappedComponent 機能を注入する対象コンポーネント
 * @returns NoranekoID機能が注入されたコンポーネント
 * 
 * @example
 * ```tsx
 * // 関数コンポーネントでの使用
 * interface MyComponentProps {
 *   title: string;
 * }
 * 
 * function MyComponent({ title, noranekoID }: MyComponentProps & WithNoranekoIDProps) {
 *   const handleLogin = () => {
 *     noranekoID.login({ scopes: ['openid', 'profile'] });
 *   };
 * 
 *   if (noranekoID.isLoading) {
 *     return <div>Loading...</div>;
 *   }
 * 
 *   return (
 *     <div>
 *       <h1>{title}</h1>
 *       {noranekoID.isAuthenticated ? (
 *         <div>
 *           <p>Welcome, {noranekoID.user?.display_name}!</p>
 *           <button onClick={() => noranekoID.logout()}>Logout</button>
 *         </div>
 *       ) : (
 *         <button onClick={handleLogin}>Login</button>
 *       )}
 *     </div>
 *   );
 * }
 * 
 * export default withNoranekoID(MyComponent);
 * ```
 * 
 * @example
 * ```tsx
 * // クラスコンポーネントでの使用
 * class UserDashboard extends React.Component<WithNoranekoIDProps> {
 *   componentDidMount() {
 *     if (this.props.noranekoID.isAuthenticated) {
 *       this.props.noranekoID.refreshUser();
 *     }
 *   }
 * 
 *   render() {
 *     const { noranekoID } = this.props;
 * 
 *     if (!noranekoID.isAuthenticated) {
 *       return <div>Please log in to access the dashboard.</div>;
 *     }
 * 
 *     return (
 *       <div>
 *         <h1>Dashboard</h1>
 *         <p>User: {noranekoID.user?.email}</p>
 *         <button onClick={() => noranekoID.logout()}>
 *           Logout
 *         </button>
 *       </div>
 *     );
 *   }
 * }
 * 
 * export default withNoranekoID(UserDashboard);
 * ```
 * 
 * @example
 * ```tsx
 * // TypeScript with generic props
 * interface ProductListProps {
 *   category: string;
 *   onProductClick: (id: string) => void;
 * }
 * 
 * function ProductList({ 
 *   category, 
 *   onProductClick, 
 *   noranekoID 
 * }: ProductListProps & WithNoranekoIDProps) {
 *   const fetchProducts = async () => {
 *     const token = await noranekoID.getAccessToken();
 *     if (!token) return;
 * 
 *     const response = await fetch(`/api/products?category=${category}`, {
 *       headers: {
 *         'Authorization': `Bearer ${token}`
 *       }
 *     });
 *     // ... handle response
 *   };
 * 
 *   useEffect(() => {
 *     if (noranekoID.isAuthenticated) {
 *       fetchProducts();
 *     }
 *   }, [noranekoID.isAuthenticated, category]);
 * 
 *   // ... rest of component
 * }
 * 
 * export default withNoranekoID<ProductListProps>(ProductList);
 * ```
 */
export function withNoranekoID<P extends object = {}>(
  WrappedComponent: React.ComponentType<P & WithNoranekoIDProps>
): React.ComponentType<P> {
  const WithNoranekoIDComponent = (props: P) => {
    const noranekoIDData = useNoranekoID();

    return (
      <WrappedComponent
        {...props}
        noranekoID={noranekoIDData}
      />
    );
  };

  // デバッグ時に役立つようにdisplayNameを設定
  WithNoranekoIDComponent.displayName = `withNoranekoID(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithNoranekoIDComponent;
}

/**
 * 認証が必要なコンポーネント用のHOC
 * 未認証時は自動的にログイン画面にリダイレクトする
 */
export interface WithAuthRequiredOptions {
  /** 必要なスコープ */
  requiredScopes?: string[];
  /** ログイン時の追加パラメータ */
  loginOptions?: {
    scopes?: string[];
    additionalParams?: Record<string, string>;
  };
  /** 未認証時の代替コンポーネント */
  fallback?: React.ComponentType<any>;
}

/**
 * withAuthRequired HOC
 * 
 * 認証が必要なコンポーネントをラップし、未認証時は自動ログインを実行
 * 
 * @param WrappedComponent 認証が必要なコンポーネント
 * @param options 認証オプション
 * @returns 認証保護されたコンポーネント
 */
export function withAuthRequired<P extends object = {}>(
  WrappedComponent: React.ComponentType<P & WithNoranekoIDProps>,
  options: WithAuthRequiredOptions = {}
): React.ComponentType<P> {
  const { requiredScopes = [], loginOptions = {}, fallback: Fallback } = options;

  const WithAuthRequiredComponent = (props: P) => {
    const noranekoIDData = useNoranekoID();

    // 初期化中はローディング表示
    if (noranekoIDData.isInitializing || noranekoIDData.isLoading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '200px' 
        }}>
          <div>認証状態を確認中...</div>
        </div>
      );
    }

    // 認証済みの場合はコンポーネントを表示
    if (noranekoIDData.isAuthenticated) {
      return (
        <WrappedComponent
          {...props}
          noranekoID={noranekoIDData}
        />
      );
    }

    // 未認証の場合
    if (Fallback) {
      return <Fallback />;
    }

    // 自動ログインを実行
    React.useEffect(() => {
      if (!noranekoIDData.isAuthenticated && !noranekoIDData.isLoading) {
        const scopes = loginOptions.scopes || ['openid', 'profile', ...requiredScopes];
        const authOptions: any = { scopes };
        
        if (loginOptions.additionalParams) {
          authOptions.additionalParams = loginOptions.additionalParams;
        }
        
        noranekoIDData.login(authOptions);
      }
    }, [noranekoIDData.isAuthenticated, noranekoIDData.isLoading]);

    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px' 
      }}>
        <div>ログイン処理中...</div>
      </div>
    );
  };

  WithAuthRequiredComponent.displayName = `withAuthRequired(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithAuthRequiredComponent;
}