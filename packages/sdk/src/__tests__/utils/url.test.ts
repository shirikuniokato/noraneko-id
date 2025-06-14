import { parseUrlParams, addQueryParams, getAbsoluteUrl } from '../../utils/url';

describe('URL Utils', () => {
  describe('parseUrlParams', () => {
    it('クエリパラメータを正しくパースする', () => {
      const url = 'http://example.com/callback?code=test-code&state=test-state';
      const params = parseUrlParams(url);

      expect(params).toEqual({
        code: 'test-code',
        state: 'test-state'
      });
    });

    it('URLエンコードされた値をデコードする', () => {
      const url = 'http://example.com/callback?message=Hello%20World&redirect_uri=http%3A%2F%2Fexample.com';
      const params = parseUrlParams(url);

      expect(params).toEqual({
        message: 'Hello World',
        redirect_uri: 'http://example.com'
      });
    });

    it('複数の同じキーがある場合、最後の値を使用する', () => {
      const url = 'http://example.com/callback?key=value1&key=value2';
      const params = parseUrlParams(url);

      expect(params).toEqual({
        key: 'value2'
      });
    });

    it('空のクエリストリングを処理する', () => {
      const url = 'http://example.com/callback';
      const params = parseUrlParams(url);

      expect(params).toEqual({});
    });

    it('ハッシュフラグメントを無視する', () => {
      const url = 'http://example.com/callback?code=test#fragment';
      const params = parseUrlParams(url);

      expect(params).toEqual({
        code: 'test'
      });
    });

    it('値のないパラメータを処理する', () => {
      const url = 'http://example.com/callback?flag&key=value';
      const params = parseUrlParams(url);

      expect(params).toEqual({
        flag: '',
        key: 'value'
      });
    });
  });

  describe('addQueryParams', () => {
    it('URLにクエリパラメータを追加する', () => {
      const baseUrl = 'http://example.com/auth';
      const params = {
        client_id: 'test-client',
        redirect_uri: 'http://example.com/callback'
      };

      const result = addQueryParams(baseUrl, params);

      expect(result).toBe('http://example.com/auth?client_id=test-client&redirect_uri=http%3A%2F%2Fexample.com%2Fcallback');
    });

    it('既存のクエリパラメータがある場合、追加する', () => {
      const baseUrl = 'http://example.com/auth?existing=value';
      const params = {
        client_id: 'test-client'
      };

      const result = addQueryParams(baseUrl, params);

      expect(result).toBe('http://example.com/auth?existing=value&client_id=test-client');
    });

    it('特殊文字を正しくエンコードする', () => {
      const baseUrl = 'http://example.com/auth';
      const params = {
        scope: 'openid profile email',
        message: 'Hello & Goodbye'
      };

      const result = addQueryParams(baseUrl, params);

      expect(result).toBe('http://example.com/auth?scope=openid+profile+email&message=Hello+%26+Goodbye');
    });

    it('null/undefined値を無視する', () => {
      const baseUrl = 'http://example.com/auth';
      const params = {
        client_id: 'test-client',
        optional: null,
        another: undefined,
        valid: 'value'
      };

      const result = addQueryParams(baseUrl, params);

      expect(result).toBe('http://example.com/auth?client_id=test-client&valid=value');
    });

    it('空のパラメータオブジェクトを処理する', () => {
      const baseUrl = 'http://example.com/auth';
      const params = {};

      const result = addQueryParams(baseUrl, params);

      expect(result).toBe('http://example.com/auth');
    });

    it('配列値を処理する', () => {
      const baseUrl = 'http://example.com/auth';
      const params = {
        scopes: ['openid', 'profile', 'email']
      };

      const result = addQueryParams(baseUrl, params);

      expect(result).toBe('http://example.com/auth?scopes=openid%2Cprofile%2Cemail');
    });
  });

  describe('getAbsoluteUrl', () => {
    // ブラウザ環境のモック
    const originalLocation = window.location;

    beforeEach(() => {
      delete (window as any).location;
      window.location = {
        protocol: 'http:',
        host: 'example.com',
        pathname: '/current/path',
        href: 'http://example.com/current/path'
      } as any;
    });

    afterEach(() => {
      window.location = originalLocation;
    });

    it('絶対URLをそのまま返す', () => {
      const url = 'https://example.com/path';
      const result = getAbsoluteUrl(url);

      expect(result).toBe('https://example.com/path');
    });

    it('プロトコル相対URLを処理する', () => {
      const url = '//other.com/path';
      const result = getAbsoluteUrl(url);

      expect(result).toBe('http://other.com/path');
    });

    it('ルート相対URLを処理する', () => {
      const url = '/api/endpoint';
      const result = getAbsoluteUrl(url);

      expect(result).toBe('http://example.com/api/endpoint');
    });

    it('相対URLを処理する', () => {
      const url = 'relative/path';
      const result = getAbsoluteUrl(url);

      expect(result).toBe('http://example.com/current/relative/path');
    });

    it('ベースURLを指定できる', () => {
      const url = '/api/endpoint';
      const baseUrl = 'https://api.example.com';
      const result = getAbsoluteUrl(url, baseUrl);

      expect(result).toBe('https://api.example.com/api/endpoint');
    });

    it('クエリパラメータとハッシュを保持する', () => {
      const url = '/path?query=value#hash';
      const result = getAbsoluteUrl(url);

      expect(result).toBe('http://example.com/path?query=value#hash');
    });
  });
});