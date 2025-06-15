/**
 * URL Validation Utilities
 * セキュリティのためのURL検証機能（クライアント・サーバー共通）
 */

/**
 * 安全なリダイレクトURLかどうかを検証（共通ロジック）
 * - 相対パス（/で始まる）のみ許可
 * - プロトコル付きURL（http:, https:, javascript: 等）を拒否
 * - 二重スラッシュ（//）を拒否（プロトコル相対URLを防ぐ）
 */
function validateSafeRedirectUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // 空文字列やスペースのみは無効
  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return false;
  }

  // プロトコル付きURLを拒否
  if (trimmedUrl.includes(':')) {
    return false;
  }

  // 二重スラッシュを拒否（//example.com のようなプロトコル相対URLを防ぐ）
  if (trimmedUrl.startsWith('//')) {
    return false;
  }

  // 相対パス（/で始まる）のみ許可
  if (!trimmedUrl.startsWith('/')) {
    return false;
  }

  // バックスラッシュを含むものを拒否（Windows環境でのパス混乱攻撃を防ぐ）
  if (trimmedUrl.includes('\\')) {
    return false;
  }

  // 制御文字を含むものを拒否
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f\x7f-\x9f]/.test(trimmedUrl)) {
    return false;
  }

  return true;
}

/**
 * クライアントサイド用のURL検証
 * @param url 検証するURL
 * @returns 安全かどうか
 */
export function isSafeRedirectUrl(url: string): boolean {
  return validateSafeRedirectUrl(url);
}

/**
 * サーバーサイド用のURL検証（クライアント側と同じロジック）
 * @param url 検証するURL  
 * @returns 安全かどうか
 */
export function isSafeServerRedirectUrl(url: string): boolean {
  return validateSafeRedirectUrl(url);
}

/**
 * 安全なリダイレクトを実行（クライアントサイド）
 * 検証に失敗した場合はデフォルトURLにリダイレクト
 */
export function safeRedirect(url: string, defaultUrl: string = '/'): void {
  const targetUrl = isSafeRedirectUrl(url) ? url : defaultUrl;
  
  if (typeof window !== 'undefined') {
    window.location.href = targetUrl;
  }
}

/**
 * 安全なリダイレクト実行（サーバーサイド）
 * 検証に失敗した場合はデフォルトURLにリダイレクト
 * 
 * Note: この関数はNext.jsのredirect()を使用するため、
 * Next.js環境でのみ使用可能です。
 */
export function safeServerRedirect(url: string, defaultUrl: string = '/'): never {
  const targetUrl = isSafeServerRedirectUrl(url) ? url : defaultUrl;
  
  // Next.jsのredirect関数を動的インポートで使用
  if (typeof process !== 'undefined' && process.versions?.node) {
    // サーバー環境でのみ実行
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { redirect } = require('next/navigation');
      redirect(targetUrl);
    } catch (error) {
      console.error('Server redirect failed:', error);
      throw new Error(`Redirect failed: ${error}`);
    }
  }
  
  throw new Error('safeServerRedirect can only be used in server environment');
}

/**
 * デフォルトで許可されるリダイレクト先のリスト
 */
export const DEFAULT_SAFE_REDIRECT_PATHS = [
  '/',
  '/login',
  '/logout',
  '/dashboard',
  '/profile',
] as const;

/**
 * 事前定義されたパスかどうかをチェック
 */
export function isPreDefinedSafePath(url: string): boolean {
  return (DEFAULT_SAFE_REDIRECT_PATHS as readonly string[]).includes(url);
}

/**
 * より厳格な検証（事前定義されたパスのみ許可）
 */
export function validateStrictRedirectUrl(url: string, allowedPaths?: readonly string[]): boolean {
  if (!isSafeRedirectUrl(url)) {
    return false;
  }

  const allowed = allowedPaths || DEFAULT_SAFE_REDIRECT_PATHS;
  return (allowed as readonly string[]).includes(url);
}