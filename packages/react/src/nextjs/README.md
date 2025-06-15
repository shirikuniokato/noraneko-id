# @noraneko/id-react/nextjs

Zero-config OAuth2 authentication for Next.js App Router with HttpOnly cookies.

## Quick Start

### 1. Setup API Route Handler

Create `app/api/auth/noraneko/[...slug]/route.ts`:

```typescript
import { createNoranekoIDHandler } from '@noraneko/id-react/nextjs';

export const { GET, POST, DELETE } = createNoranekoIDHandler({
  issuer: process.env.NEXT_PUBLIC_API_URL!,
});
```

### 2. Setup Provider

Update your `app/layout.tsx`:

```typescript
import { NoranekoIDNextJSProvider } from '@noraneko/id-react/nextjs';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NoranekoIDNextJSProvider
          config={{
            issuer: process.env.NEXT_PUBLIC_API_URL!,
            clientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
            redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
            scopes: ['openid', 'profile', 'email'],
            useHttpOnlyCookies: true, // Secure HttpOnly cookies
          }}
        >
          {children}
        </NoranekoIDNextJSProvider>
      </body>
    </html>
  );
}
```

### 3. Use in Components

```typescript
'use client';
import { useNoranekoID } from '@noraneko/id-react/nextjs';

export default function LoginButton() {
  const { login, logout, isAuthenticated, userInfo } = useNoranekoID();

  if (isAuthenticated) {
    return (
      <div>
        <span>Welcome, {userInfo?.name}!</span>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return <button onClick={login}>Login</button>;
}
```

### 4. Server Components with Authentication

```typescript
import { requireAuth, getServerUserInfo } from '@noraneko/id-react/nextjs';

export default async function DashboardPage() {
  // Require authentication (auto-redirect to login if not authenticated)
  await requireAuth();
  
  // Get user info on server side
  const userInfo = await getServerUserInfo();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {userInfo?.name}!</p>
    </div>
  );
}
```

## Advanced Usage

### Middleware for Route Protection

Create `middleware.ts`:

```typescript
import { createAuthMiddleware, commonAuthorizers } from '@noraneko/id-react/nextjs';

export const middleware = createAuthMiddleware({
  protectedPaths: ['/dashboard', '/profile'],
  publicOnlyPaths: ['/login', '/register'],
  loginUrl: '/login',
  
  // Custom authorization logic
  authorizer: async (token, request, path) => {
    if (path.startsWith('/admin')) {
      // Check admin permissions
      return await commonAuthorizers.admin(token, request, path);
    }
    if (path.startsWith('/premium')) {
      // Check premium subscription
      return await checkPremiumStatus(token);
    }
    return true; // Allow access
  },
});

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/premium/:path*'],
};
```

### Custom Permission Checks

```typescript
import { 
  requireAuthWithPermission, 
  serverAuthorizers 
} from '@noraneko/id-react/nextjs';

// Admin-only page
export default async function AdminPage() {
  const userInfo = await requireAuthWithPermission(
    serverAuthorizers.admin
  );
  
  return <div>Admin panel for {userInfo.email}</div>;
}

// Company email only
export default async function InternalPage() {
  const userInfo = await requireAuthWithPermission(
    serverAuthorizers.emailDomain(['company.com', 'partner.com'])
  );
  
  return <div>Internal page</div>;
}

// Multiple conditions
export default async function SpecialPage() {
  const userInfo = await requireAuthWithPermission(
    serverAuthorizers.and(
      serverAuthorizers.verifiedEmail,
      serverAuthorizers.scopes(['premium']),
      serverAuthorizers.emailDomain(['company.com'])
    )
  );
  
  return <div>Special access page</div>;
}
```

### Role-based Middleware

```typescript
import { createAuthMiddleware, createRoleAuthorizer } from '@noraneko/id-react/nextjs';

export const middleware = createAuthMiddleware({
  protectedPaths: ['/'],
  authorizer: createRoleAuthorizer({
    '/admin': 'admin',
    '/moderator': ['admin', 'moderator'],
    '/premium': 'premium_user',
  }),
});
```

### API Authorizers

```typescript
import { createAPIAuthorizer } from '@noraneko/id-react/nextjs';

const customAuthorizer = createAPIAuthorizer('/api/check-permission', {
  timeout: 2000,
  headers: { 'X-App-Version': '1.0' },
});

export const middleware = createAuthMiddleware({
  protectedPaths: ['/dashboard'],
  authorizer: customAuthorizer,
});
```

### Server Actions with Authentication

```typescript
'use server';
import { authenticatedFetch } from '@noraneko/id-react/nextjs';

export async function updateProfile(formData: FormData) {
  const response = await authenticatedFetch('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(Object.fromEntries(formData)),
  });
  
  return response.json();
}
```

## Configuration Options

### Provider Config

```typescript
interface NextJSConfig {
  // OAuth2 settings
  issuer: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  
  // HttpOnly cookie settings
  useHttpOnlyCookies?: boolean; // default: true
  cookies?: {
    prefix?: string;    // default: 'noraneko'
    maxAge?: number;    // default: 7 days
    secure?: boolean;   // default: true in production
    sameSite?: 'strict' | 'lax' | 'none'; // default: 'lax'
    path?: string;      // default: '/'
  };
  
  // API route settings
  apiRoute?: {
    basePath?: string; // default: '/api/auth/noraneko'
  };
}
```

### Middleware Config

```typescript
interface MiddlewareConfig {
  cookiePrefix?: string;
  loginUrl?: string;
  protectedPaths?: string[];
  publicOnlyPaths?: string[];
  authorizer?: AuthorizerFunction;
  unauthorizedUrl?: string;
  skipPaths?: string[];
  onUnauthorized?: (request, reason) => NextResponse;
  onAuthenticatedPublicPath?: (request) => NextResponse;
}
```

## Examples

### E-commerce Site

```typescript
// middleware.ts
export const middleware = createAuthMiddleware({
  protectedPaths: ['/account', '/orders'],
  publicOnlyPaths: ['/login'],
  authorizer: async (token, request, path) => {
    if (path.startsWith('/admin')) {
      return checkAdminRole(token);
    }
    if (path.startsWith('/vendor')) {
      return checkVendorRole(token);
    }
    return true;
  },
});
```

### SaaS Application

```typescript
// middleware.ts  
export const middleware = createAuthMiddleware({
  protectedPaths: ['/app'],
  authorizer: serverAuthorizers.and(
    serverAuthorizers.verifiedEmail,
    serverAuthorizers.scopes(['app_access']),
    async (userInfo) => {
      // Check subscription status
      return await checkSubscription(userInfo.sub);
    }
  ),
});
```

### Content Management

```typescript
// app/admin/page.tsx
export default async function AdminDashboard() {
  const userInfo = await requireAuthWithPermission(
    serverAuthorizers.or(
      serverAuthorizers.admin,
      serverAuthorizers.scopes(['content_admin']),
      serverAuthorizers.emailDomain(['company.com'])
    )
  );

  return <AdminPanel user={userInfo} />;
}
```

## Migration from localStorage

If you're currently using localStorage, you can migrate gradually:

```typescript
// 1. Keep existing localStorage setup
<NoranekoIDNextJSProvider
  config={{
    // ... other config
    useHttpOnlyCookies: false, // Keep localStorage temporarily
  }}
>

// 2. Test HttpOnly cookies in development
<NoranekoIDNextJSProvider
  config={{
    // ... other config
    useHttpOnlyCookies: process.env.NODE_ENV === 'development',
  }}
>

// 3. Enable in production when ready
<NoranekoIDNextJSProvider
  config={{
    // ... other config
    useHttpOnlyCookies: true, // Secure HttpOnly cookies
  }}
>
```

## Benefits

- ✅ **Zero Boilerplate**: No manual API routes or storage adapters
- 🔒 **Secure by Default**: HttpOnly cookies prevent XSS attacks
- 🚀 **SSR Compatible**: Works with Server Components and Server Actions
- 🛠️ **Flexible Authorization**: Custom authorizers for any use case
- 📱 **Type Safe**: Full TypeScript support
- ⚡ **Performance**: Minimal client-side JavaScript

## Troubleshooting

### Common Issues

1. **Cookies not set**: Check that your API route is at `/api/auth/noraneko/[...slug]/route.ts`
2. **Redirect loops**: Ensure `publicOnlyPaths` includes your login page
3. **Permission denied**: Verify your `authorizer` function returns `true` for valid users
4. **CORS issues**: Ensure `credentials: 'include'` in your fetch requests

### Debug Mode

Enable debug logging in development:

```typescript
// Set environment variable
DEBUG=noraneko-id:*

// Or in your config
<NoranekoIDNextJSProvider
  config={{
    debug: process.env.NODE_ENV === 'development',
    // ... other config
  }}
>
```