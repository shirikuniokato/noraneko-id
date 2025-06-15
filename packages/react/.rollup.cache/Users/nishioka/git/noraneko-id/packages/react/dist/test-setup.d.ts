/**
 * Jest テストセットアップファイル
 */
import '@testing-library/jest-dom';
export declare const actAsync: (fn: () => Promise<void>) => Promise<void>;
export declare const mockUser: {
    id: string;
    email: string;
    username: string;
    display_name: string;
    email_verified: boolean;
    is_admin: boolean;
    created_at: string;
    updated_at: string;
};
export declare const mockConfig: {
    clientId: string;
    issuer: string;
    redirectUri: string;
    scopes: string[];
};
export declare const mockTokenResponse: {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    id_token: string;
};
//# sourceMappingURL=test-setup.d.ts.map