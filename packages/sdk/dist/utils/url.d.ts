/**
 * URLからクエリパラメータをパースする
 */
export declare function parseUrlParams(url: string): Record<string, string>;
/**
 * URLにクエリパラメータを追加する
 */
export declare function addQueryParams(baseUrl: string, params: Record<string, any>): string;
/**
 * 相対URLを絶対URLに変換する
 */
export declare function getAbsoluteUrl(url: string, baseUrl?: string): string;
//# sourceMappingURL=url.d.ts.map