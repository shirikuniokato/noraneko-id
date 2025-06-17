// src/api/handlers/login.ts
import { NextResponse } from "next/server";

// src/server/config.ts
import "server-only";
var globalConfig = null;
var discoveryConfig = null;
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
function getDiscoveryConfig() {
  return discoveryConfig;
}

// src/shared/utils.ts
import crypto from "crypto";
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString("base64url");
}
function generateCodeChallenge(verifier) {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}
function generateState() {
  return crypto.randomBytes(16).toString("base64url");
}
function buildAuthUrl(config) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(" "),
    state: config.state,
    code_challenge: config.codeChallenge,
    code_challenge_method: "S256"
  });
  return `${config.authorizationEndpoint}?${params.toString()}`;
}
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

// src/api/handlers/login.ts
function createLoginHandler() {
  return async function loginHandler(request) {
    try {
      const config = getAuthConfig();
      const { searchParams } = new URL(request.url);
      const callbackUrl = searchParams.get("callbackUrl") || "/";
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);
      const state = generateState();
      const discovery = getDiscoveryConfig();
      if (!discovery) {
        throw new Error("Discovery configuration not available");
      }
      const authUrl = buildAuthUrl({
        issuer: config.issuer,
        clientId: config.clientId,
        redirectUri: new URL(config.redirectUri, request.url).toString(),
        scopes: config.scopes,
        state,
        codeChallenge,
        authorizationEndpoint: discovery.authorization_endpoint
      });
      const response = NextResponse.redirect(authUrl);
      response.cookies.set(
        getCookieName(config.cookiePrefix, "code_verifier"),
        codeVerifier,
        {
          httpOnly: true,
          secure: config.cookieSecure,
          sameSite: "lax",
          maxAge: 600,
          // 10分
          path: "/"
        }
      );
      response.cookies.set(
        getCookieName(config.cookiePrefix, "state"),
        state,
        {
          httpOnly: true,
          secure: config.cookieSecure,
          sameSite: "lax",
          maxAge: 600,
          // 10分
          path: "/"
        }
      );
      response.cookies.set(
        getCookieName(config.cookiePrefix, "callback_url"),
        callbackUrl,
        {
          httpOnly: true,
          secure: config.cookieSecure,
          sameSite: "lax",
          maxAge: 600,
          // 10分
          path: "/"
        }
      );
      return response;
    } catch (error) {
      console.error("Login handler error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

// src/api/handlers/callback.ts
import { NextResponse as NextResponse2 } from "next/server";

// src/server/auth.ts
import "server-only";
import { cookies } from "next/headers";

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
var OAuthError = class extends NoranekoAuthError {
  constructor(oauthError, oauthErrorDescription) {
    super("OAUTH_ERROR", `OAuth error: ${oauthError}${oauthErrorDescription ? ` - ${oauthErrorDescription}` : ""}`);
    this.oauthError = oauthError;
    this.oauthErrorDescription = oauthErrorDescription;
  }
};

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

// src/api/handlers/callback.ts
function createCallbackHandler() {
  return async function callbackHandler(request) {
    try {
      const config = getAuthConfig();
      const { searchParams } = new URL(request.url);
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");
      if (error) {
        throw new OAuthError(error, errorDescription || void 0);
      }
      if (!code || !state) {
        throw new Error("Missing required OAuth parameters");
      }
      const codeVerifier = request.cookies.get(getCookieName(config.cookiePrefix, "code_verifier"))?.value;
      const savedState = request.cookies.get(getCookieName(config.cookiePrefix, "state"))?.value;
      const callbackUrl = request.cookies.get(getCookieName(config.cookiePrefix, "callback_url"))?.value || "/";
      if (!codeVerifier || !savedState) {
        throw new Error("Missing PKCE parameters");
      }
      if (state !== savedState) {
        throw new Error("Invalid state parameter");
      }
      const session = await exchangeCodeForTokens(
        code,
        codeVerifier,
        new URL(config.redirectUri, request.url).toString()
      );
      await saveSession(session);
      const response = NextResponse2.redirect(new URL(callbackUrl, request.url));
      response.cookies.delete(getCookieName(config.cookiePrefix, "code_verifier"));
      response.cookies.delete(getCookieName(config.cookiePrefix, "state"));
      response.cookies.delete(getCookieName(config.cookiePrefix, "callback_url"));
      return response;
    } catch (error) {
      console.error("Callback handler error:", error);
      const errorUrl = new URL("/login", request.url);
      errorUrl.searchParams.set("error", "callback_error");
      if (error instanceof OAuthError) {
        errorUrl.searchParams.set("error_description", error.message);
      }
      return NextResponse2.redirect(errorUrl);
    }
  };
}

// src/api/handlers/logout.ts
import { NextResponse as NextResponse3 } from "next/server";
function createLogoutHandler() {
  return async function logoutHandler(request) {
    try {
      const config = getAuthConfig();
      const { searchParams } = new URL(request.url);
      const callbackUrl = searchParams.get("callbackUrl") || "/";
      const session = await auth();
      await clearSession();
      if (session?.accessToken) {
        const discovery = getDiscoveryConfig();
        if (discovery?.revocation_endpoint) {
          try {
            await fetch(discovery.revocation_endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded"
              },
              body: new URLSearchParams({
                token: session.accessToken,
                client_id: config.clientId,
                client_secret: config.clientSecret || ""
              })
            });
          } catch (error) {
            if (config.debug) {
              console.error("Token revocation failed:", error);
            }
          }
        }
        const endSessionEndpoint = discovery?.end_session_endpoint;
        if (endSessionEndpoint) {
          const logoutUrl = new URL(endSessionEndpoint);
          logoutUrl.searchParams.set("post_logout_redirect_uri", new URL(callbackUrl, request.url).toString());
          if (session.accessToken) {
            logoutUrl.searchParams.set("id_token_hint", session.accessToken);
          }
          return NextResponse3.redirect(logoutUrl);
        }
      }
      return NextResponse3.redirect(new URL(callbackUrl, request.url));
    } catch (error) {
      console.error("Logout handler error:", error);
      const { searchParams } = new URL(request.url);
      const callbackUrl = searchParams.get("callbackUrl") || "/";
      return NextResponse3.redirect(new URL(callbackUrl, request.url));
    }
  };
}

// src/api/handlers/token.ts
import { NextResponse as NextResponse4 } from "next/server";
async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse4.json(null, { status: 200 });
    }
    const tokenResponse = {
      user: session.user,
      expires_at: Math.floor(session.expiresAt / 1e3),
      // Unix timestamp (seconds)
      scope: session.scope
    };
    return NextResponse4.json(tokenResponse, { status: 200 });
  } catch (error) {
    console.error("Token handler error:", error);
    return NextResponse4.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse4.json(
        {
          error: "invalid_token",
          error_description: "No valid session found"
        },
        { status: 401 }
      );
    }
    const tokenResponse = {
      user: session.user,
      expires_at: Math.floor(session.expiresAt / 1e3),
      // Unix timestamp (seconds)
      scope: session.scope
    };
    return NextResponse4.json(tokenResponse, { status: 200 });
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse4.json(
      {
        error: "server_error",
        error_description: "Internal server error during token refresh"
      },
      { status: 500 }
    );
  }
}

// src/api/handlers.ts
var handlers = {
  GET: async (request) => {
    const { pathname } = new URL(request.url);
    const segments = pathname.split("/").filter(Boolean);
    const action = segments[segments.length - 1];
    switch (action) {
      case "login":
        return createLoginHandler()(request);
      case "callback":
        return createCallbackHandler()(request);
      case "logout":
        return createLogoutHandler()(request);
      case "token":
        return GET(request);
      default:
        return GET(request);
    }
  },
  POST: async (request) => {
    const { pathname } = new URL(request.url);
    const segments = pathname.split("/").filter(Boolean);
    const action = segments[segments.length - 1];
    switch (action) {
      case "token":
        return POST(request);
      default:
        return new Response("Method not allowed", { status: 405 });
    }
  }
};

// src/api/create-handlers.ts
function createHandlers(config = {}) {
  const {
    paths = {
      login: "login",
      callback: "callback",
      logout: "logout",
      token: "token"
      // RFC準拠: デフォルト
    },
    defaultAction = "token"
    // RFC準拠: デフォルト
  } = config;
  const finalPaths = {
    login: "login",
    callback: "callback",
    logout: "logout",
    token: "token",
    // RFC準拠
    ...paths
  };
  return {
    GET: async (request) => {
      const { pathname } = new URL(request.url);
      const segments = pathname.split("/").filter(Boolean);
      const action = segments[segments.length - 1];
      let targetAction = defaultAction;
      for (const [key, value] of Object.entries(finalPaths)) {
        if (action === value) {
          targetAction = key;
          break;
        }
      }
      switch (targetAction) {
        case "login":
          return createLoginHandler()(request);
        case "callback":
          return createCallbackHandler()(request);
        case "logout":
          return createLogoutHandler()(request);
        case "token":
          return GET(request);
        default:
          return GET(request);
      }
    },
    POST: async (request) => {
      const { pathname } = new URL(request.url);
      const segments = pathname.split("/").filter(Boolean);
      const action = segments[segments.length - 1];
      let targetAction = defaultAction;
      for (const [key, value] of Object.entries(finalPaths)) {
        if (action === value) {
          targetAction = key;
          break;
        }
      }
      switch (targetAction) {
        case "token":
          return POST(request);
        default:
          return new Response("Method not allowed", { status: 405 });
      }
    }
  };
}
export {
  createCallbackHandler,
  createHandlers,
  createLoginHandler,
  createLogoutHandler,
  handlers,
  GET as tokenHandler,
  POST as tokenRefreshHandler
};
//# sourceMappingURL=index.js.map