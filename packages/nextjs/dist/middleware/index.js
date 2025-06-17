// src/middleware/index.ts
import { NextResponse } from "next/server";
function createAuthMiddleware(config = {}) {
  const {
    protectedPaths = [],
    publicOnlyPaths = [],
    loginUrl = "/api/auth/login",
    callbackUrl = "/"
  } = config;
  return async function middleware(request) {
    const { pathname } = request.nextUrl;
    const hasSession = request.cookies.has("noraneko-auth.token");
    if (protectedPaths.some((path) => pathname.startsWith(path))) {
      if (!hasSession) {
        const loginUrlWithCallback = new URL(loginUrl, request.url);
        loginUrlWithCallback.searchParams.set("callbackUrl", request.url);
        return NextResponse.redirect(loginUrlWithCallback);
      }
    }
    if (publicOnlyPaths.some((path) => pathname.startsWith(path))) {
      if (hasSession) {
        return NextResponse.redirect(new URL(callbackUrl, request.url));
      }
    }
    return NextResponse.next();
  };
}
function chain(middlewares) {
  return async function chainedMiddleware(request) {
    for (const middleware of middlewares) {
      const response = await middleware(request);
      if (response) {
        return response;
      }
    }
    return NextResponse.next();
  };
}
var defaultMiddleware = createAuthMiddleware({
  protectedPaths: ["/dashboard"],
  publicOnlyPaths: ["/login"],
  loginUrl: "/api/auth/login"
});
export {
  chain,
  createAuthMiddleware,
  defaultMiddleware
};
//# sourceMappingURL=index.js.map