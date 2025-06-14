/**
 * noraneko-id JavaScript SDK
 *
 * OAuth2 + PKCE認証を簡単に実装するためのSDK
 */
export { NoranekoID } from './noraneko-id';
export type { NoranekoIDConfig, ResolvedConfig, AuthOptions, LogoutOptions, TokenResponse, RefreshTokenResponse, User, AuthState, NoranekoIDEventType, NoranekoIDEventData, EventCallback, OAuth2Endpoints, PKCEParams, JWTPayload, ErrorDetails, TokenStorage } from './types';
export { NoranekoIDError, AuthenticationError, ConfigurationError, NetworkError, PKCEError, StorageError, UnsupportedBrowserError, ErrorCode, createOAuth2Error, createNetworkError } from './errors';
export { generateRandomString, base64UrlEncode, base64UrlDecode, decodeJWT, isTokenExpired, parseUrlParams, checkBrowserSupport } from './utils';
import { NoranekoID } from './noraneko-id';
export default NoranekoID;
//# sourceMappingURL=index.d.ts.map