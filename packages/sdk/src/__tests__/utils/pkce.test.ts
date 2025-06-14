import { generatePKCEParams, verifyCodeChallenge, base64URLEncode } from '../../utils/pkce';

// crypto.getRandomValuesのモック
const mockGetRandomValues = jest.fn();
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: mockGetRandomValues,
    subtle: {
      digest: jest.fn()
    }
  }
});

describe('PKCE Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePKCEParams', () => {
    it('正しいPKCEパラメータを生成する', async () => {
      const params = await generatePKCEParams();

      expect(params).toHaveProperty('codeVerifier');
      expect(params).toHaveProperty('codeChallenge');
      expect(params).toHaveProperty('codeChallengeMethod', 'S256');

      // codeVerifierの長さを確認（43-128文字）
      expect(params.codeVerifier.length).toBeGreaterThanOrEqual(43);
      expect(params.codeVerifier.length).toBeLessThanOrEqual(128);

      // codeVerifierが正しい文字セットを使用しているか確認
      expect(params.codeVerifier).toMatch(/^[A-Za-z0-9\-._~]+$/);
    });

    it('異なる呼び出しで異なる値を生成する', async () => {
      // 実際のcryptoを使用してランダム性をテスト
      const params1 = await generatePKCEParams();
      const params2 = await generatePKCEParams();

      expect(params1.codeVerifier).not.toBe(params2.codeVerifier);
      expect(params1.codeChallenge).not.toBe(params2.codeChallenge);
    });
  });

  describe('verifyCodeChallenge', () => {
    it('正しいcode_verifierとcode_challengeのペアを検証する', async () => {
      const codeVerifier = 'test-code-verifier-123';
      
      // SHA-256ハッシュのモック
      const mockHash = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        mockHash[i] = i;
      }
      (crypto.subtle.digest as jest.Mock).mockResolvedValue(mockHash.buffer);

      const expectedChallenge = base64URLEncode(mockHash);
      const isValid = await verifyCodeChallenge(codeVerifier, expectedChallenge, 'S256');

      expect(isValid).toBe(true);
    });

    it('間違ったcode_challengeを拒否する', async () => {
      const codeVerifier = 'test-code-verifier-123';
      const wrongChallenge = 'wrong-challenge';

      const isValid = await verifyCodeChallenge(codeVerifier, wrongChallenge, 'S256');

      expect(isValid).toBe(false);
    });

    it('plainメソッドをサポートする', async () => {
      const codeVerifier = 'test-code-verifier-123';

      const isValid = await verifyCodeChallenge(codeVerifier, codeVerifier, 'plain');

      expect(isValid).toBe(true);
    });

    it('サポートされていないメソッドでエラーを投げる', async () => {
      const codeVerifier = 'test-code-verifier-123';

      await expect(
        verifyCodeChallenge(codeVerifier, 'challenge', 'unsupported' as any)
      ).rejects.toThrow('Unsupported code challenge method');
    });
  });

  describe('base64URLEncode', () => {
    it('Uint8Arrayを正しくBase64URLエンコードする', () => {
      const input = new Uint8Array([255, 254, 253, 252, 251]);
      const encoded = base64URLEncode(input);

      // Base64URLエンコードの特徴を確認
      expect(encoded).not.toContain('+');
      expect(encoded).not.toContain('/');
      expect(encoded).not.toContain('=');
      expect(encoded).toMatch(/^[A-Za-z0-9\-_]+$/);
    });

    it('空の配列を処理できる', () => {
      const input = new Uint8Array(0);
      const encoded = base64URLEncode(input);

      expect(encoded).toBe('');
    });

    it('パディングを正しく削除する', () => {
      // 1バイト -> Base64では == のパディングが必要
      const input1 = new Uint8Array([0]);
      const encoded1 = base64URLEncode(input1);
      expect(encoded1).not.toContain('=');

      // 2バイト -> Base64では = のパディングが必要
      const input2 = new Uint8Array([0, 0]);
      const encoded2 = base64URLEncode(input2);
      expect(encoded2).not.toContain('=');
    });
  });
});