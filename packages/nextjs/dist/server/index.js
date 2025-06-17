// src/server/index.ts
import "server-only";

// src/server/auth.ts
import "server-only";
import { cookies } from "next/headers";

// src/server/config.ts
import "server-only";
var globalConfig = null;
var discoveryConfig = null;
function setAuthConfig(config) {
  globalConfig = {
    scopes: ["openid", "profile", "email"],
    redirectUri: "/api/auth/callback",
    loginPath: "/api/auth/login",
    callbackPath: "/api/auth/callback",
    logoutPath: "/api/auth/logout",
    cookiePrefix: "noraneko-auth",
    cookieSecure: process.env.NODE_ENV === "production",
    debug: process.env.NODE_ENV === "development",
    autoRefresh: {
      enabled: true,
      refreshThreshold: 5 * 60 * 1e3,
      // 5分前
      maxRetries: 3,
      retryInterval: 5 * 1e3,
      // 5秒間隔
      ...config.autoRefresh || {}
    },
    ...config
  };
  const discoveryJson = process.env.NORANEKO_DISCOVERY_CONFIG;
  if (!discoveryJson) {
    throw new Error(
      "NORANEKO_DISCOVERY_CONFIG environment variable not found. Make sure to add the discovery configuration to your next.config.js. See: https://github.com/noraneko-id/nextjs#build-time-discovery"
    );
  }
  try {
    discoveryConfig = JSON.parse(discoveryJson);
    if (!discoveryConfig || !discoveryConfig.authorization_endpoint || !discoveryConfig.token_endpoint) {
      throw new Error("Invalid discovery configuration embedded at build time");
    }
    if (config.debug) {
      console.log("Using build-time OIDC discovery configuration:", {
        authorization_endpoint: discoveryConfig.authorization_endpoint,
        token_endpoint: discoveryConfig.token_endpoint,
        userinfo_endpoint: discoveryConfig.userinfo_endpoint
      });
    }
  } catch (error) {
    throw new Error(`Failed to parse discovery configuration: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
function initializeFromEnv() {
  const issuer = process.env.NORANEKO_ISSUER;
  const clientId = process.env.NORANEKO_CLIENT_ID;
  if (!issuer || !clientId) {
    throw new Error("NORANEKO_ISSUER and NORANEKO_CLIENT_ID environment variables are required");
  }
  return {
    issuer,
    clientId,
    clientSecret: process.env.NORANEKO_CLIENT_SECRET,
    scopes: ["openid", "profile", "email"],
    redirectUri: "/api/auth/callback",
    loginPath: "/api/auth/login",
    callbackPath: "/api/auth/callback",
    logoutPath: "/api/auth/logout",
    cookiePrefix: "noraneko-auth",
    cookieSecure: process.env.NODE_ENV === "production",
    debug: process.env.NODE_ENV === "development",
    autoRefresh: {
      enabled: true,
      refreshThreshold: 5 * 60 * 1e3,
      // 5分前
      maxRetries: 3,
      retryInterval: 5 * 1e3
      // 5秒間隔
    }
  };
}
function getAuthConfig() {
  if (!globalConfig) {
    try {
      globalConfig = initializeFromEnv();
    } catch (error) {
      throw new Error("Auth config not initialized. Call createAuth() first or set environment variables.");
    }
  }
  return globalConfig;
}
function createAuth(config) {
  setAuthConfig(config);
}
function getDiscoveryConfig() {
  return discoveryConfig;
}

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

// src/shared/utils.ts
function isTokenExpired(expiresAt) {
  return Date.now() >= expiresAt;
}
function isTokenExpiringSoon(expiresAt, bufferMs = 6e4) {
  return Date.now() >= expiresAt - bufferMs;
}
function getCookieName(prefix, name) {
  return `${prefix}.${name}`;
}
function parseCookieValue(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
function serializeCookieValue(value) {
  return JSON.stringify(value);
}

// src/server/auth.ts
async function auth() {
  try {
    const config = getAuthConfig();
    const session = await getSession();
    if (!session) {
      return null;
    }
    if (!config.autoRefresh?.enabled) {
      if (isTokenExpired(session.expiresAt)) {
        await clearSession();
        return null;
      }
      return session;
    }
    if (isTokenExpired(session.expiresAt)) {
      if (session.refreshToken) {
        const refreshed = await refreshSessionWithRetry(
          session.refreshToken,
          config.autoRefresh.maxRetries || 3,
          config.autoRefresh.retryInterval || 5e3
        );
        if (refreshed) {
          await saveSession(refreshed);
          return refreshed;
        }
      }
      await clearSession();
      return null;
    }
    const threshold = config.autoRefresh.refreshThreshold || 5 * 60 * 1e3;
    if (session.refreshToken && isTokenExpiringSoon(session.expiresAt, threshold)) {
      refreshSessionWithRetry(
        session.refreshToken,
        config.autoRefresh.maxRetries || 3,
        config.autoRefresh.retryInterval || 5e3
      ).then((refreshed) => refreshed && saveSession(refreshed)).catch((error) => {
        if (config.debug) {
          console.error("Background token refresh failed:", error);
        }
      });
    }
    return session;
  } catch (error) {
    if (getAuthConfig().debug) {
      console.error("Auth error:", error);
    }
    return null;
  }
}
async function requireAuth() {
  const session = await auth();
  if (!session) {
    throw new AuthenticationRequiredError();
  }
  return session.user;
}
async function getSession() {
  const config = getAuthConfig();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(getCookieName(config.cookiePrefix, "token"));
  return parseCookieValue(sessionCookie?.value);
}
async function saveSession(session) {
  const config = getAuthConfig();
  const cookieStore = await cookies();
  cookieStore.set(getCookieName(config.cookiePrefix, "token"), serializeCookieValue(session), {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "lax",
    maxAge: Math.floor((session.expiresAt - Date.now()) / 1e3),
    path: "/"
  });
}
async function clearSession() {
  const config = getAuthConfig();
  const cookieStore = await cookies();
  cookieStore.delete(getCookieName(config.cookiePrefix, "token"));
}
async function exchangeCodeForTokens(code, codeVerifier, redirectUri) {
  const config = getAuthConfig();
  const discovery = getDiscoveryConfig();
  if (!discovery) {
    throw new Error("Discovery configuration not available");
  }
  const tokenResponse = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    })
  });
  if (!tokenResponse.ok) {
    const error = await tokenResponse.json().catch(() => ({}));
    throw new OAuthError(error.error || "token_exchange_failed", error.error_description);
  }
  const tokens = await tokenResponse.json();
  const userInfo = await fetchUserInfo(tokens.access_token);
  const session = {
    user: {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      image: userInfo.picture
    },
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + tokens.expires_in * 1e3,
    scope: tokens.scope
  };
  return session;
}
async function refreshSessionWithRetry(refreshToken, maxRetries = 3, retryInterval = 5e3) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const session = await refreshSession(refreshToken);
      if (session) {
        if (getAuthConfig().debug && attempt > 1) {
          console.log(`Token refresh succeeded on attempt ${attempt}`);
        }
        return session;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
      if (getAuthConfig().debug) {
        console.warn(`Token refresh attempt ${attempt}/${maxRetries} failed:`, lastError.message);
      }
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryInterval));
      }
    }
  }
  if (getAuthConfig().debug) {
    console.error(`Token refresh failed after ${maxRetries} attempts. Last error:`, lastError?.message);
  }
  return null;
}
async function refreshSession(refreshToken) {
  const config = getAuthConfig();
  const discovery = getDiscoveryConfig();
  if (!discovery) {
    throw new Error("Discovery configuration not available");
  }
  const tokenResponse = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: config.clientId,
      refresh_token: refreshToken
    })
  });
  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.json().catch(() => ({}));
    throw new TokenExpiredError(`Failed to refresh token: ${errorData.error || tokenResponse.statusText}`);
  }
  const tokens = await tokenResponse.json();
  const userInfo = await fetchUserInfo(tokens.access_token);
  return {
    user: {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      image: userInfo.picture
    },
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || refreshToken,
    // 新しいリフレッシュトークンがなければ既存を使用
    expiresAt: Date.now() + tokens.expires_in * 1e3,
    scope: tokens.scope
  };
}
async function fetchUserInfo(accessToken) {
  const config = getAuthConfig();
  const discovery = getDiscoveryConfig();
  if (!discovery || !discovery.userinfo_endpoint) {
    throw new Error("Discovery configuration or userinfo endpoint not available");
  }
  const userResponse = await fetch(discovery.userinfo_endpoint, {
    headers: {
      "Authorization": `Bearer ${accessToken}`
    }
  });
  if (!userResponse.ok) {
    throw new InvalidTokenError("Failed to fetch user info");
  }
  return userResponse.json();
}
export {
  AuthenticationRequiredError,
  InvalidTokenError,
  NoranekoAuthError,
  OAuthError,
  TokenExpiredError,
  auth,
  clearSession,
  createAuth,
  exchangeCodeForTokens,
  getAuthConfig,
  requireAuth,
  saveSession
};
//# sourceMappingURL=index.js.map