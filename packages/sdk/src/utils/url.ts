/**
 * URLからクエリパラメータをパースする
 */
export function parseUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const urlObj = new URL(url);
  
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
}

/**
 * URLにクエリパラメータを追加する
 */
export function addQueryParams(baseUrl: string, params: Record<string, any>): string {
  const url = new URL(baseUrl);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        url.searchParams.set(key, value.join(','));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  });
  
  return url.toString();
}

/**
 * 相対URLを絶対URLに変換する
 */
export function getAbsoluteUrl(url: string, baseUrl?: string): string {
  // すでに絶対URLの場合はそのまま返す
  if (/^https?:\/\//.test(url)) {
    return url;
  }
  
  // ベースURLを決定
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.href : '');
  
  try {
    return new URL(url, base).toString();
  } catch {
    // URLコンストラクタが失敗した場合のフォールバック
    if (url.startsWith('//')) {
      const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
      return `${protocol}${url}`;
    }
    
    if (url.startsWith('/')) {
      const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
      return `${origin}${url}`;
    }
    
    // 相対パス
    const basePath = base.substring(0, base.lastIndexOf('/') + 1);
    return `${basePath}${url}`;
  }
}