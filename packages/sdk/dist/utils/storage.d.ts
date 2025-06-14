/**
 * ストレージアダプターインターフェース
 */
export interface StorageAdapter {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}
/**
 * ストレージアダプターを作成する
 */
export declare function createStorageAdapter(type?: 'local' | 'session' | 'memory' | StorageAdapter): StorageAdapter;
//# sourceMappingURL=storage.d.ts.map