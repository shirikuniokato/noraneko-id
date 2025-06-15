/**
 * @noraneko/id-react/nextjs - Next.js App Router specific utilities
 * 
 * Zero-config OAuth2 authentication with HttpOnly cookies for Next.js
 * 
 * WARNING: This module exports both client and server code.
 * For better tree-shaking, use:
 * - @noraneko/id-react/nextjs/client/ for client-side code
 * - @noraneko/id-react/nextjs/server/ for server-side code
 * - @noraneko/id-react/nextjs/api/ for API routes
 * - @noraneko/id-react/nextjs/middleware/ for middleware utilities
 */

// Re-export client components and hooks
export * from './client/';

// Re-export server utilities (may cause bundling issues in client code)
export * from './server/';

// Re-export API utilities
export * from './api/';

// Re-export middleware utilities
export * from './middleware/';