/**
 * @noraneko/id-sdk のJestモック
 */

const mockSDK = {
  startAuth: jest.fn(),
  handleCallback: jest.fn(),
  isAuthenticated: jest.fn(() => false),
  getUser: jest.fn(() => Promise.resolve(null)),
  getAccessToken: jest.fn(() => Promise.resolve(null)),
  refreshTokens: jest.fn(() => Promise.resolve()),
  logout: jest.fn(() => Promise.resolve()),
  on: jest.fn(),
  off: jest.fn(),
};

module.exports = {
  NoranekoID: jest.fn(() => mockSDK),
  ErrorCode: {
    AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    NETWORK_ERROR: 'NETWORK_ERROR',
    CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
    PKCE_ERROR: 'PKCE_ERROR',
    STORAGE_ERROR: 'STORAGE_ERROR',
    UNSUPPORTED_BROWSER: 'UNSUPPORTED_BROWSER',
  },
  NoranekoIDError: class NoranekoIDError extends Error {
    constructor(message, code) {
      super(message);
      this.name = 'NoranekoIDError';
      this.code = code;
    }
  },
  AuthenticationError: class AuthenticationError extends Error {
    constructor(message, code) {
      super(message);
      this.name = 'AuthenticationError';
      this.code = code;
    }
  },
  NetworkError: class NetworkError extends Error {
    constructor(message, code, status) {
      super(message);
      this.name = 'NetworkError';
      this.code = code;
      this.status = status;
    }
  },
  ConfigurationError: class ConfigurationError extends Error {
    constructor(message, code) {
      super(message);
      this.name = 'ConfigurationError';
      this.code = code;
    }
  },
  PKCEError: class PKCEError extends Error {
    constructor(message, code) {
      super(message);
      this.name = 'PKCEError';
      this.code = code;
    }
  },
  StorageError: class StorageError extends Error {
    constructor(message, code) {
      super(message);
      this.name = 'StorageError';
      this.code = code;
    }
  },
  UnsupportedBrowserError: class UnsupportedBrowserError extends Error {
    constructor(message, code) {
      super(message);
      this.name = 'UnsupportedBrowserError';
      this.code = code;
    }
  },
};