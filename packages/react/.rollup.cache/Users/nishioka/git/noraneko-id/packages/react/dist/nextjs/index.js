/**
 * @noraneko/id-react - React integration for noraneko-id
 *
 * React Hooks and Components for OAuth2 authentication
 */
// Provider
export { NoranekoIDProvider } from './context/NoranekoIDProvider';
// Main Hook
export { useNoranekoID } from './hooks/useNoranekoID';
// Specialized Hooks
export { useAuthState } from './hooks/useAuthState';
export { useUserInfo } from './hooks/useUserInfo';
export { useAccessToken } from './hooks/useAccessToken';
export { useAuthActions } from './hooks/useAuthActions';
// Higher-Order Components and Utils
export { ProtectedRoute, LoginRequired, ConditionalRender, AuthenticatedOnly, UnauthenticatedOnly, withNoranekoID, withAuthRequired } from './components';
// Next.js specific utilities
export * as nextjs from './nextjs';
// Re-export SDK errors
export { NoranekoIDError, AuthenticationError, ConfigurationError, NetworkError, PKCEError, StorageError, UnsupportedBrowserError, ErrorCode, } from '@noraneko/id-sdk';
//# sourceMappingURL=index.js.map