/**
 * このコンポーネントは新しいSDKでは使用されません。
 * ログインページでサーバーアクションを直接使用しています。
 * 
 * 互換性のために残していますが、実際には使用されません。
 */

interface LoginFormProps {
  errorParam?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function LoginForm(_props: LoginFormProps) {
  return (
    <div className="text-center text-gray-500">
      <p>新しいSDKではサーバーアクションを使用してログインを処理します。</p>
      <p className="text-sm mt-2">このコンポーネントは使用されません。</p>
    </div>
  );
}