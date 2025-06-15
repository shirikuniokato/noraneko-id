'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { NoranekoIDProvider } from '../../context/NoranekoIDProvider';
/**
 * Next.js App Router optimized provider with HttpOnly cookie support
 */
export function NoranekoIDNextJSProvider({ children, config }) {
    const { useHttpOnlyCookies = true, cookies = {}, apiRoute = {}, ...sdkConfig } = config;
    // Cookie settings with defaults
    const cookieConfig = {
        prefix: 'noraneko',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        ...cookies,
    };
    // API route settings with defaults
    const apiConfig = {
        basePath: '/api/auth',
        ...apiRoute,
    };
    // Create HttpOnly cookie storage adapter
    const httpOnlyCookieStorage = useHttpOnlyCookies ? {
        getItem: async (key) => {
            try {
                const response = await fetch(`${apiConfig.basePath}/token`, {
                    method: 'GET',
                    credentials: 'include',
                    cache: 'no-store',
                });
                if (!response.ok) {
                    return null;
                }
                const data = await response.json();
                return data[key] || null;
            }
            catch (error) {
                console.warn('Failed to retrieve token from HttpOnly cookie:', error);
                return null;
            }
        },
        setItem: async (key, value) => {
            try {
                const response = await fetch(`${apiConfig.basePath}/token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ [key]: value }),
                    credentials: 'include',
                });
                if (!response.ok) {
                    throw new Error(`Failed to store token: ${response.status}`);
                }
            }
            catch (error) {
                console.error('Failed to store token in HttpOnly cookie:', error);
                throw error;
            }
        },
        removeItem: async (key) => {
            try {
                const response = await fetch(`${apiConfig.basePath}/token`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ key }),
                    credentials: 'include',
                });
                if (!response.ok) {
                    throw new Error(`Failed to remove token: ${response.status}`);
                }
            }
            catch (error) {
                console.error('Failed to remove token from HttpOnly cookie:', error);
                throw error;
            }
        },
    } : undefined;
    // Merge SDK config with Next.js specific settings
    const finalConfig = {
        ...sdkConfig,
        storage: httpOnlyCookieStorage || sdkConfig.storage || 'localStorage',
    };
    return (_jsx(NoranekoIDProvider, { config: finalConfig, children: children }));
}
//# sourceMappingURL=provider.js.map