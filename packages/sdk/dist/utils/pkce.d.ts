/**
 * PKCE（Proof Key for Code Exchange）関連のユーティリティ
 */
/**
 * Base64URLエンコード
 */
export declare function base64URLEncode(buffer: Uint8Array): string;
/**
 * PKCEパラメータを生成
 */
export declare function generatePKCEParams(): Promise<{
    codeVerifier: string;
    codeChallenge: string;
    codeChallengeMethod: string;
}>;
/**
 * code_challengeを検証
 */
export declare function verifyCodeChallenge(codeVerifier: string, codeChallenge: string, method?: string): Promise<boolean>;
//# sourceMappingURL=pkce.d.ts.map