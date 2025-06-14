/**
 * Jest テストセットアップファイル
 */
declare const mockCrypto: {
    getRandomValues: (array: Uint8Array) => Uint8Array<ArrayBufferLike>;
    subtle: {
        digest: (_algorithm: string, data: BufferSource) => Promise<ArrayBuffer>;
    };
};
declare const createStorageMock: () => {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
    clear: () => void;
};
declare const originalError: {
    (...data: any[]): void;
    (message?: any, ...optionalParams: any[]): void;
};
declare const originalWarn: {
    (...data: any[]): void;
    (message?: any, ...optionalParams: any[]): void;
};
//# sourceMappingURL=test-setup.d.ts.map