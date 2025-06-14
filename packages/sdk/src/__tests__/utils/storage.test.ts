import { StorageAdapter, createStorageAdapter } from '../../utils/storage';
import { StorageError } from '../../errors';

describe('Storage Utils', () => {
  let mockLocalStorage: Storage;
  let mockSessionStorage: Storage;

  beforeEach(() => {
    // localStorageのモック
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      key: jest.fn(),
      length: 0
    };

    // sessionStorageのモック
    mockSessionStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      key: jest.fn(),
      length: 0
    };

    // グローバルオブジェクトの設定
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      configurable: true
    });
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      configurable: true
    });
  });

  describe('createStorageAdapter', () => {
    it('デフォルトでlocalStorageアダプターを作成する', () => {
      const adapter = createStorageAdapter();
      
      adapter.setItem('test', 'value');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test', 'value');
    });

    it('sessionStorageアダプターを作成できる', () => {
      const adapter = createStorageAdapter('session');
      
      adapter.setItem('test', 'value');
      
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('test', 'value');
    });

    it('memoryアダプターを作成できる', () => {
      const adapter = createStorageAdapter('memory');
      
      adapter.setItem('test', 'value');
      const value = adapter.getItem('test');
      
      expect(value).toBe('value');
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('カスタムアダプターを使用できる', () => {
      const customAdapter: StorageAdapter = {
        getItem: jest.fn().mockReturnValue('custom'),
        setItem: jest.fn(),
        removeItem: jest.fn()
      };
      
      const adapter = createStorageAdapter(customAdapter);
      
      adapter.setItem('test', 'value');
      const value = adapter.getItem('test');
      
      expect(customAdapter.setItem).toHaveBeenCalledWith('test', 'value');
      expect(value).toBe('custom');
    });
  });

  describe('LocalStorageAdapter', () => {
    let adapter: StorageAdapter;

    beforeEach(() => {
      adapter = createStorageAdapter('local');
    });

    it('値を保存・取得できる', () => {
      (mockLocalStorage.getItem as jest.Mock).mockReturnValue('stored-value');
      
      adapter.setItem('key', 'value');
      const result = adapter.getItem('key');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('key', 'value');
      expect(result).toBe('stored-value');
    });

    it('値を削除できる', () => {
      adapter.removeItem('key');
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('key');
    });

    it('存在しないキーはnullを返す', () => {
      (mockLocalStorage.getItem as jest.Mock).mockReturnValue(null);
      
      const result = adapter.getItem('nonexistent');
      
      expect(result).toBeNull();
    });

    it('ストレージエラーを処理する', () => {
      (mockLocalStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      
      expect(() => adapter.setItem('key', 'value')).toThrow(StorageError);
    });
  });

  describe('MemoryStorageAdapter', () => {
    let adapter: StorageAdapter;

    beforeEach(() => {
      adapter = createStorageAdapter('memory');
    });

    it('値を保存・取得できる', () => {
      adapter.setItem('key1', 'value1');
      adapter.setItem('key2', 'value2');
      
      expect(adapter.getItem('key1')).toBe('value1');
      expect(adapter.getItem('key2')).toBe('value2');
    });

    it('値を上書きできる', () => {
      adapter.setItem('key', 'initial');
      adapter.setItem('key', 'updated');
      
      expect(adapter.getItem('key')).toBe('updated');
    });

    it('値を削除できる', () => {
      adapter.setItem('key', 'value');
      adapter.removeItem('key');
      
      expect(adapter.getItem('key')).toBeNull();
    });

    it('存在しないキーはnullを返す', () => {
      expect(adapter.getItem('nonexistent')).toBeNull();
    });

    it('異なるインスタンスは独立したストレージを持つ', () => {
      const adapter1 = createStorageAdapter('memory');
      const adapter2 = createStorageAdapter('memory');
      
      adapter1.setItem('key', 'value1');
      adapter2.setItem('key', 'value2');
      
      expect(adapter1.getItem('key')).toBe('value1');
      expect(adapter2.getItem('key')).toBe('value2');
    });
  });

  describe('ストレージが利用できない環境', () => {
    beforeEach(() => {
      // localStorageを削除
      delete (window as any).localStorage;
    });

    it('メモリアダプターにフォールバックする', () => {
      const adapter = createStorageAdapter('local');
      
      adapter.setItem('key', 'value');
      const value = adapter.getItem('key');
      
      expect(value).toBe('value');
    });
  });
});