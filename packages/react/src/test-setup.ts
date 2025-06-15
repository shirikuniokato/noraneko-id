/**
 * Jest テストセットアップファイル
 */

import '@testing-library/jest-dom';

// React Testing Library の設定
import { configure } from '@testing-library/react';

configure({ testIdAttribute: 'data-testid' });

// noraneko-id SDK のモックは __mocks__ フォルダで管理

// Web Crypto API のモック
const mockCrypto = {
  getRandomValues: (array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
  subtle: {
    digest: async (_algorithm: string, data: BufferSource): Promise<ArrayBuffer> => {
      const str = new TextDecoder().decode(data);
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      const buffer = new ArrayBuffer(32);
      const view = new DataView(buffer);
      for (let i = 0; i < 8; i++) {
        view.setUint32(i * 4, hash + i);
      }
      return buffer;
    }
  }
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true
});

// TextEncoder/TextDecoder のポリフィル
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    readonly encoding = 'utf-8';
    
    encode(input?: string): Uint8Array {
      const str = input || '';
      const result = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) {
        result[i] = str.charCodeAt(i);
      }
      return result;
    }

    encodeInto(source: string, destination: Uint8Array): { read: number; written: number } {
      const encoded = this.encode(source);
      const toCopy = Math.min(encoded.length, destination.length);
      destination.set(encoded.subarray(0, toCopy));
      return { read: toCopy, written: toCopy };
    }
  } as any;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    readonly encoding: string;
    readonly fatal: boolean;
    readonly ignoreBOM: boolean;

    constructor(label?: string, options?: { fatal?: boolean; ignoreBOM?: boolean }) {
      this.encoding = label || 'utf-8';
      this.fatal = options?.fatal || false;
      this.ignoreBOM = options?.ignoreBOM || false;
    }

    decode(input?: BufferSource, _options?: { stream?: boolean }): string {
      if (!input) return '';
      const data = input instanceof ArrayBuffer ? new Uint8Array(input) : input as Uint8Array;
      return String.fromCharCode(...data);
    }
  } as any;
}

// fetch のモック
global.fetch = jest.fn();

// localStorage/sessionStorage のモック
const createStorageMock = () => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    length: 0,
    key: () => null,
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

// window.location のモック
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: jest.fn(),
    reload: jest.fn(),
    replace: jest.fn(),
  },
  writable: true
});

// console.error/warn を一時的に無効化（テスト出力をクリーンに保つ）
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  // 各テストでモックをリセット
  jest.clearAllMocks();
  
  // console のモック
  console.error = jest.fn();
  console.warn = jest.fn();
  
  // ストレージをクリア
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(() => {
  // console を復元
  console.error = originalError;
  console.warn = originalWarn;
});

// act の警告を抑制するためのヘルパー
import { act } from '@testing-library/react';

export const actAsync = async (fn: () => Promise<void>) => {
  await act(async () => {
    await fn();
  });
};

// テスト用のユーザー・設定データ
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User',
  email_verified: true,
  is_admin: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockConfig = {
  clientId: 'test-client-id',
  issuer: 'https://id.test.com',
  redirectUri: 'http://localhost:3000/auth/callback',
  scopes: ['openid', 'profile', 'email'],
};

export const mockTokenResponse = {
  access_token: 'mock-access-token',
  token_type: 'Bearer',
  expires_in: 3600,
  refresh_token: 'mock-refresh-token',
  scope: 'openid profile email',
  id_token: 'mock-id-token',
};