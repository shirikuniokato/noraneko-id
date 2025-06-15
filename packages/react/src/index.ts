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
export { 
  ProtectedRoute,
  LoginRequired,
  ConditionalRender,
  AuthenticatedOnly,
  UnauthenticatedOnly,
  withNoranekoID,
  withAuthRequired 
} from './components';

// Type definitions
export type {
  // Provider types
  NoranekoIDProviderProps,
  
  // Hook return types
  UseNoranekoIDResult,
  UseAuthStateResult,
  UseUserInfoResult,
  UseAccessTokenResult,
  UseAuthActionsResult,
  
  // Component types
  ProtectedRouteProps,
  LoginRequiredProps,
  ConditionalRenderProps,
  
  // Context types
  NoranekoIDContextValue,
  
  // State management types
  NoranekoIDState,
  NoranekoIDAction,
  
  // Utility types
  AuthenticationStatus,
  AuthenticationGuardOptions,
  WithNoranekoIDProps,
  ComponentWithNoranekoID,
  UseNoranekoIDOptions,
  EnhancedLogoutOptions,
} from './types';

// Re-export SDK types for convenience
export type {
  NoranekoIDConfig,
  User,
  AuthOptions,
  LogoutOptions,
  TokenResponse,
  RefreshTokenResponse,
  NoranekoIDEventType,
  NoranekoIDEventData,
  EventCallback,
  OAuth2Endpoints,
  PKCEParams,
  JWTPayload,
  ErrorDetails,
} from '@noraneko/id-sdk';

// Next.js specific utilities
export * as nextjs from './nextjs';

// Re-export SDK errors
export {
  NoranekoIDError,
  AuthenticationError,
  ConfigurationError,
  NetworkError,
  PKCEError,
  StorageError,
  UnsupportedBrowserError,
  ErrorCode,
} from '@noraneko/id-sdk';