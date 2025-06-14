import { StorageError } from '../errors';

/**
 * ストレージアダプターインターフェース
 */
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * ブラウザのlocalStorageアダプター
 */
class LocalStorageAdapter implements StorageAdapter {
  private isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  getItem(key: string): string | null {
    try {
      if (!this.isAvailable()) return null;
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn('Failed to get item from localStorage:', error);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      if (!this.isAvailable()) {
        throw new StorageError('localStorage is not available');
      }
      window.localStorage.setItem(key, value);
    } catch (error) {
      throw new StorageError(`Failed to set item in localStorage: ${error}`);
    }
  }

  removeItem(key: string): void {
    try {
      if (!this.isAvailable()) return;
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove item from localStorage:', error);
    }
  }
}

/**
 * ブラウザのsessionStorageアダプター
 */
class SessionStorageAdapter implements StorageAdapter {
  private isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      window.sessionStorage.setItem(test, test);
      window.sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  getItem(key: string): string | null {
    try {
      if (!this.isAvailable()) return null;
      return window.sessionStorage.getItem(key);
    } catch (error) {
      console.warn('Failed to get item from sessionStorage:', error);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      if (!this.isAvailable()) {
        throw new StorageError('sessionStorage is not available');
      }
      window.sessionStorage.setItem(key, value);
    } catch (error) {
      throw new StorageError(`Failed to set item in sessionStorage: ${error}`);
    }
  }

  removeItem(key: string): void {
    try {
      if (!this.isAvailable()) return;
      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove item from sessionStorage:', error);
    }
  }
}

/**
 * メモリストレージアダプター（フォールバック用）
 */
class MemoryStorageAdapter implements StorageAdapter {
  private storage = new Map<string, string>();

  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }
}

/**
 * ストレージアダプターを作成する
 */
export function createStorageAdapter(
  type: 'local' | 'session' | 'memory' | StorageAdapter = 'local'
): StorageAdapter {
  // カスタムアダプター
  if (typeof type === 'object' && type !== null) {
    return type;
  }

  // ブラウザ環境でない場合はメモリアダプターを使用
  if (typeof window === 'undefined') {
    return new MemoryStorageAdapter();
  }

  // 指定されたタイプに応じてアダプターを作成
  switch (type) {
    case 'local':
      try {
        const adapter = new LocalStorageAdapter();
        // 利用可能かテスト
        adapter.setItem('__test__', 'test');
        adapter.removeItem('__test__');
        return adapter;
      } catch {
        return new MemoryStorageAdapter();
      }
    
    case 'session':
      try {
        const adapter = new SessionStorageAdapter();
        // 利用可能かテスト
        adapter.setItem('__test__', 'test');
        adapter.removeItem('__test__');
        return adapter;
      } catch {
        return new MemoryStorageAdapter();
      }
    
    case 'memory':
      return new MemoryStorageAdapter();
    
    default:
      return new MemoryStorageAdapter();
  }
}