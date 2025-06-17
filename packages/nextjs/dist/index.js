// src/shared/errors.ts
var NoranekoAuthError = class extends Error {
  constructor(code, message, cause) {
    super(message);
    this.code = code;
    this.cause = cause;
    this.name = "NoranekoAuthError";
  }
  type = "AuthError";
};
var TokenExpiredError = class extends NoranekoAuthError {
  constructor(message = "Token has expired") {
    super("TOKEN_EXPIRED", message);
  }
};
var InvalidTokenError = class extends NoranekoAuthError {
  constructor(message = "Invalid token") {
    super("INVALID_TOKEN", message);
  }
};
var AuthenticationRequiredError = class extends NoranekoAuthError {
  constructor(message = "Authentication required") {
    super("AUTHENTICATION_REQUIRED", message);
  }
};
var OAuthError = class extends NoranekoAuthError {
  constructor(oauthError, oauthErrorDescription) {
    super("OAUTH_ERROR", `OAuth error: ${oauthError}${oauthErrorDescription ? ` - ${oauthErrorDescription}` : ""}`);
    this.oauthError = oauthError;
    this.oauthErrorDescription = oauthErrorDescription;
  }
};
export {
  AuthenticationRequiredError,
  InvalidTokenError,
  NoranekoAuthError,
  OAuthError,
  TokenExpiredError
};
//# sourceMappingURL=index.js.map