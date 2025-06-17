import { S as Session, U as User, A as AuthConfig } from '../types-od4YWh0d.js';
export { a as AuthError } from '../types-od4YWh0d.js';
export { AuthenticationRequiredError, InvalidTokenError, NoranekoAuthError, OAuthError, TokenExpiredError } from '../index.js';

declare function auth(): Promise<Session | null>;
declare function requireAuth(): Promise<User>;
declare function saveSession(session: Session): Promise<void>;
declare function clearSession(): Promise<void>;
declare function exchangeCodeForTokens(code: string, codeVerifier: string, redirectUri: string): Promise<Session>;

interface DiscoveryDocument {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    jwks_uri: string;
    response_types_supported: string[];
    subject_types_supported: string[];
    id_token_signing_alg_values_supported: string[];
    userinfo_endpoint?: string;
    registration_endpoint?: string;
    scopes_supported?: string[];
    claims_supported?: string[];
    revocation_endpoint?: string;
    introspection_endpoint?: string;
    code_challenge_methods_supported?: string[];
    grant_types_supported?: string[];
    token_endpoint_auth_methods_supported?: string[];
    end_session_endpoint?: string;
}

declare function getAuthConfig(): AuthConfig;
declare function createAuth(config: AuthConfig): void;

export { AuthConfig, type DiscoveryDocument, Session, User, auth, clearSession, createAuth, exchangeCodeForTokens, getAuthConfig, requireAuth, saveSession };
