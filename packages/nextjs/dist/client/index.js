"use client";

// src/client/index.ts
import "client-only";

// src/client/hooks.ts
import "client-only";

// src/client/providers.tsx
import "client-only";
import React, { createContext, useContext, useEffect, useState } from "react";
var SessionContext = createContext(void 0);
function SessionProvider({ children, session: initialSession }) {
  const [session, setSession] = useState(initialSession || null);
  const [status, setStatus] = useState(
    initialSession ? "authenticated" : "loading"
  );
  const updateSession = async () => {
    try {
      setStatus("loading");
      const response = await fetch("/api/auth/token");
      if (response.ok) {
        const data = await response.json();
        setSession(data);
        setStatus(data ? "authenticated" : "unauthenticated");
      } else {
        setSession(null);
        setStatus("unauthenticated");
      }
    } catch (error) {
      console.error("Failed to update token:", error);
      setSession(null);
      setStatus("unauthenticated");
    }
  };
  useEffect(() => {
    if (!initialSession) {
      updateSession();
    }
    const handleFocus = () => updateSession();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateSession();
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [initialSession]);
  useEffect(() => {
    if (!session || status !== "authenticated") return;
    const checkExpiration = () => {
      if (Date.now() >= session.expiresAt) {
        updateSession();
      }
    };
    const timeUntilExpiry = session.expiresAt - Date.now();
    const checkInterval = Math.min(timeUntilExpiry / 2, 6e4);
    const interval = setInterval(checkExpiration, checkInterval);
    return () => clearInterval(interval);
  }, [session, status]);
  const value = {
    data: session,
    status,
    update: updateSession
  };
  return /* @__PURE__ */ React.createElement(SessionContext.Provider, { value }, children);
}
function useSessionContext() {
  const context = useContext(SessionContext);
  if (context === void 0) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return context;
}

// src/client/useAuthCallback.ts
import "client-only";
import { useEffect as useEffect2, useState as useState2 } from "react";
import { useRouter, useSearchParams } from "next/navigation";
function useAuthCallback(options = {}) {
  const {
    successRedirect = "/",
    errorRedirect = "/login",
    disableAutoRedirect = false,
    onSuccess,
    onError
  } = options;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState2({
    status: "loading",
    error: null,
    isLoading: true,
    isSuccess: false,
    isError: false
  });
  useEffect2(() => {
    const processCallback = async () => {
      try {
        const params = {
          code: searchParams.get("code") || void 0,
          state: searchParams.get("state") || void 0,
          error: searchParams.get("error") || void 0,
          error_description: searchParams.get("error_description") || void 0,
          error_uri: searchParams.get("error_uri") || void 0
        };
        if (params.error) {
          const callbackError = {
            error: params.error,
            error_description: params.error_description,
            error_uri: params.error_uri
          };
          setState({
            status: "error",
            error: callbackError,
            isLoading: false,
            isSuccess: false,
            isError: true
          });
          onError?.(callbackError);
          if (!disableAutoRedirect) {
            const errorUrl = new URL(errorRedirect, window.location.origin);
            errorUrl.searchParams.set("callback_error", params.error);
            if (params.error_description) {
              errorUrl.searchParams.set("error_description", params.error_description);
            }
            router.push(errorUrl.toString());
          }
          return;
        }
        if (!params.code) {
          const callbackError = {
            error: "invalid_request",
            error_description: "Authorization code not found in callback parameters"
          };
          setState({
            status: "error",
            error: callbackError,
            isLoading: false,
            isSuccess: false,
            isError: true
          });
          onError?.(callbackError);
          if (!disableAutoRedirect) {
            router.push(`${errorRedirect}?error=no_code`);
          }
          return;
        }
        const callbackUrl = new URL("/api/auth/callback", window.location.origin);
        callbackUrl.search = window.location.search;
        const response = await fetch(callbackUrl.toString(), {
          method: "GET",
          credentials: "include"
        });
        if (!response.ok) {
          let errorMessage = "Authentication failed";
          try {
            const errorData = await response.json();
            errorMessage = errorData.error_description || errorData.error || errorMessage;
          } catch {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
          const callbackError = {
            error: "server_error",
            error_description: errorMessage
          };
          setState({
            status: "error",
            error: callbackError,
            isLoading: false,
            isSuccess: false,
            isError: true
          });
          onError?.(callbackError);
          if (!disableAutoRedirect) {
            router.push(`${errorRedirect}?error=server_error`);
          }
          return;
        }
        setState({
          status: "success",
          error: null,
          isLoading: false,
          isSuccess: true,
          isError: false
        });
        onSuccess?.(params);
        if (!disableAutoRedirect) {
          const originalRedirect = searchParams.get("callbackUrl") || successRedirect;
          router.push(originalRedirect);
        }
      } catch (error) {
        const callbackError = {
          error: "network_error",
          error_description: error instanceof Error ? error.message : "Network error occurred"
        };
        setState({
          status: "error",
          error: callbackError,
          isLoading: false,
          isSuccess: false,
          isError: true
        });
        onError?.(callbackError);
        if (!disableAutoRedirect) {
          router.push(`${errorRedirect}?error=network_error`);
        }
      }
    };
    processCallback();
  }, [searchParams, router, successRedirect, errorRedirect, disableAutoRedirect, onSuccess, onError]);
  return state;
}

// src/client/hooks.ts
function useSession() {
  const { data, status, update } = useSessionContext();
  return {
    data,
    status,
    update
  };
}
function useAuth() {
  const { data: session, status, update } = useSessionContext();
  const login = (redirectTo) => {
    const url = new URL("/api/auth/login", window.location.origin);
    if (redirectTo) {
      url.searchParams.set("callbackUrl", redirectTo);
    }
    window.location.href = url.toString();
  };
  const logout = (redirectTo) => {
    const url = new URL("/api/auth/logout", window.location.origin);
    if (redirectTo) {
      url.searchParams.set("callbackUrl", redirectTo);
    }
    window.location.href = url.toString();
  };
  return {
    session,
    user: session?.user || null,
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    login,
    logout,
    refresh: update
  };
}
function useUser() {
  const { data: session } = useSessionContext();
  return session?.user || null;
}
function useAuthStatus() {
  const { status } = useSessionContext();
  return status;
}
export {
  SessionProvider,
  useAuth,
  useAuthCallback,
  useAuthStatus,
  useSession,
  useUser
};
//# sourceMappingURL=index.js.map