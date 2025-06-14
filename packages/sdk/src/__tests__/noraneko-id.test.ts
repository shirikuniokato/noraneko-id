import { NoranekoID } from '../noraneko-id';
import { ConfigurationError } from '../errors';

// グローバルモック
const mockFetch = jest.fn();
global.fetch = mockFetch;

// localStorageモック
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// locationモック
delete (window as any).location;
window.location = { href: '' } as any;

describe('NoranekoID - 基本テスト', () => {
  const defaultConfig = {
    clientId: 'test-client-id',
    issuer: 'http://localhost:8080',
    redirectUri: 'http://localhost:3000/callback',
    scopes: ['openid', 'profile']
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    window.location.href = '';
  });

  describe('初期化', () => {
    it('正しい設定で初期化できる', () => {
      expect(() => new NoranekoID(defaultConfig)).not.toThrow();
    });

    it('clientIdが無い場合エラーになる', () => {
      expect(() => new NoranekoID({
        ...defaultConfig,
        clientId: ''
      })).toThrow(ConfigurationError);
    });

    it('issuerが無い場合エラーになる', () => {
      expect(() => new NoranekoID({
        ...defaultConfig,
        issuer: ''
      })).toThrow(ConfigurationError);
    });
  });

  describe('基本メソッド', () => {
    let sdk: NoranekoID;

    beforeEach(() => {
      sdk = new NoranekoID(defaultConfig);
    });

    it('ストレージキーを使用してデータを保存・取得できる', () => {
      const value = 'test-value';
      sdk.saveToStorage('test-key', value);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'noraneko_test-key',
        value
      );
    });

    it('ストレージから値を削除できる', () => {
      sdk.removeFromStorage('test-key');
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'noraneko_test-key'
      );
    });

    it('イベントリスナーを追加・削除できる', () => {
      const handler = jest.fn();
      
      sdk.on('authenticated', handler);
      sdk.emit('authenticated', { sub: 'user-123' });
      expect(handler).toHaveBeenCalledWith({ sub: 'user-123' });
      
      sdk.off('authenticated', handler);
      sdk.emit('authenticated', { sub: 'user-456' });
      expect(handler).toHaveBeenCalledTimes(1); // 以前の呼び出しのみ
    });

    it('認証状態チェックでトークンの有無を確認する', async () => {
      // トークンなし
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(await sdk.isAuthenticated()).toBe(false);
      
      // トークンあり（有効期限内）
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'noraneko_access_token') return 'valid-token';
        if (key === 'noraneko_expires_at') return String(Date.now() + 3600000);
        return null;
      });
      expect(await sdk.isAuthenticated()).toBe(true);
      
      // トークンあり（期限切れ）
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'noraneko_access_token') return 'expired-token';
        if (key === 'noraneko_expires_at') return String(Date.now() - 1000);
        return null;
      });
      expect(await sdk.isAuthenticated()).toBe(false);
    });
  });
});