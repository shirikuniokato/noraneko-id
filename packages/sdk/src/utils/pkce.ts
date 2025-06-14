/**
 * PKCE（Proof Key for Code Exchange）関連のユーティリティ
 */

/**
 * Base64URLエンコード
 */
export function base64URLEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * ランダムな文字列を生成
 */
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const array = new Uint8Array(length);
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    throw new Error('crypto.getRandomValues is not available');
  }
  
  return Array.from(array, byte => charset[byte % charset.length]).join('');
}

/**
 * SHA-256ハッシュを計算
 */
async function sha256(data: string): Promise<ArrayBuffer> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('crypto.subtle is not available');
  }
  
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  return await crypto.subtle.digest('SHA-256', dataBuffer);
}

/**
 * PKCEパラメータを生成
 */
export async function generatePKCEParams(): Promise<{
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: string;
}> {
  // 43-128文字のランダムな文字列を生成
  const length = Math.floor(Math.random() * (128 - 43 + 1)) + 43;
  const codeVerifier = generateRandomString(length);
  
  // code_challengeを生成（SHA-256ハッシュのBase64URLエンコード）
  const hashBuffer = await sha256(codeVerifier);
  const codeChallenge = base64URLEncode(new Uint8Array(hashBuffer));
  
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256'
  };
}

/**
 * code_challengeを検証
 */
export async function verifyCodeChallenge(
  codeVerifier: string,
  codeChallenge: string,
  method: string = 'S256'
): Promise<boolean> {
  if (method === 'plain') {
    return codeVerifier === codeChallenge;
  }
  
  if (method === 'S256') {
    const hashBuffer = await sha256(codeVerifier);
    const calculatedChallenge = base64URLEncode(new Uint8Array(hashBuffer));
    return calculatedChallenge === codeChallenge;
  }
  
  throw new Error(`Unsupported code challenge method: ${method}`);
}