/**
 * Jest テストセットアップファイル
 */

// Web Crypto API のモック（テスト環境用）
const mockCrypto = {
  getRandomValues: (array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
  subtle: {
    digest: async (_algorithm: string, data: BufferSource): Promise<ArrayBuffer> => {
      // SHA-256のシンプルなモック実装
      const str = new TextDecoder().decode(data);
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32bit整数に変換
      }
      
      // ArrayBufferに変換
      const buffer = new ArrayBuffer(32);
      const view = new DataView(buffer);
      for (let i = 0; i < 8; i++) {
        view.setUint32(i * 4, hash + i);
      }
      return buffer;
    }
  }
};

// グローバルオブジェクトにCrypto APIを設定
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true
});

// TextEncoder/TextDecoder のポリフィル
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class MockTextEncoder {
    encoding = 'utf-8';
    encode(str: string): Uint8Array {
      const result = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) {
        result[i] = str.charCodeAt(i);
      }
      return result;
    }
    encodeInto() { throw new Error('Not implemented'); }
  } as any;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = class MockTextDecoder {
    encoding = 'utf-8';
    fatal = false;
    ignoreBOM = false;
    decode(data: Uint8Array): string {
      return String.fromCharCode(...data);
    }
  } as any;
}

// URL のポリフィル
if (typeof global.URL === 'undefined') {
  global.URL = class MockURL {
    public searchParams: URLSearchParams;
    public href: string;
    public origin: string;
    public pathname: string;
    public search: string;
    public hash: string;

    constructor(url: string, _base?: string) {
      this.href = url;
      const parts = url.split('?');
      this.pathname = parts[0];
      this.search = parts[1] ? '?' + parts[1].split('#')[0] : '';
      this.hash = url.includes('#') ? '#' + url.split('#')[1] : '';
      this.origin = this.pathname.includes('://') 
        ? this.pathname.split('/').slice(0, 3).join('/')
        : 'http://localhost';
      
      this.searchParams = new URLSearchParams(this.search);
    }

    toString(): string {
      const search = this.searchParams.toString();
      return this.pathname + (search ? '?' + search : '') + this.hash;
    }

    static canParse(): boolean { return true; }
    static createObjectURL(): string { return 'mock-url'; }
    static parse(): MockURL | null { return null; }
    static revokeObjectURL(): void {}
  } as any;
}

// URLSearchParams のポリフィル
if (typeof global.URLSearchParams === 'undefined') {
  global.URLSearchParams = class MockURLSearchParams {
    private params: Map<string, string> = new Map();

    constructor(init?: string | URLSearchParams | Record<string, string>) {
      if (typeof init === 'string') {
        if (init.startsWith('?')) {
          init = init.slice(1);
        }
        if (init) {
          init.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) {
              this.params.set(
                decodeURIComponent(key),
                decodeURIComponent(value || '')
              );
            }
          });
        }
      } else if (init instanceof URLSearchParams) {
        this.params = new Map((init as any).params);
      } else if (init && typeof init === 'object') {
        Object.entries(init).forEach(([key, value]) => {
          this.params.set(key, value);
        });
      }
    }

    get size(): number { return this.params.size; }

    append(name: string, value: string): void {
      this.params.set(name, value);
    }

    get(name: string): string | null {
      return this.params.get(name) || null;
    }

    getAll(name: string): string[] {
      const value = this.params.get(name);
      return value ? [value] : [];
    }

    set(name: string, value: string): void {
      this.params.set(name, value);
    }

    delete(name: string): void {
      this.params.delete(name);
    }

    has(name: string): boolean {
      return this.params.has(name);
    }

    sort(): void {
      // Mock implementation
    }

    forEach(callback: (value: string, key: string) => void): void {
      this.params.forEach(callback);
    }

    keys(): IterableIterator<string> {
      return this.params.keys();
    }

    values(): IterableIterator<string> {
      return this.params.values();
    }

    entries(): IterableIterator<[string, string]> {
      return this.params.entries();
    }

    toString(): string {
      const pairs: string[] = [];
      this.params.forEach((value, key) => {
        pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
      });
      return pairs.join('&');
    }
  } as any;
}

// fetch のモック
global.fetch = jest.fn();

// window.location のモック
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: ''
  },
  writable: true
});

// localStorage/sessionStorage のモック
const createStorageMock = () => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
};

Object.defineProperty(window, 'localStorage', {
  value: createStorageMock(),
  writable: true
});

Object.defineProperty(window, 'sessionStorage', {
  value: createStorageMock(),
  writable: true
});

// console.error/warn のモック（テスト出力をクリーンに保つため）
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
});