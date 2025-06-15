'use client';

import { ReactNode } from 'react';
import { NoranekoIDProvider } from '../../context/NoranekoIDProvider';
import { NextJSConfig } from '../types';

/**
 * Next.js App Router optimized provider with HttpOnly cookie support
 */
export function NoranekoIDNextJSProvider({ 
  children, 
  config 
}: { 
  children: ReactNode;
  config: NextJSConfig;
}) {
  const {
    useHttpOnlyCookies = true,
    cookies = {},
    apiRoute = {},
    ...sdkConfig
  } = config;

  // NOTE: Cookie configuration is handled internally

  // API route settings with defaults
  const apiConfig = {
    basePath: '/api/auth',
    ...apiRoute,
  };

  // Create HttpOnly cookie storage adapter
  const httpOnlyCookieStorage = useHttpOnlyCookies ? {
    getItem: async (key: string): Promise<string | null> => {
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
      } catch (error) {
        console.warn('Failed to retrieve token from HttpOnly cookie:', error);
        return null;
      }
    },
    
    setItem: async (key: string, value: string): Promise<void> => {
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
      } catch (error) {
        console.error('Failed to store token in HttpOnly cookie:', error);
        throw error;
      }
    },
    
    removeItem: async (key: string): Promise<void> => {
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
      } catch (error) {
        console.error('Failed to remove token from HttpOnly cookie:', error);
        throw error;
      }
    },
  } : undefined;

  // Merge SDK config with Next.js specific settings
  const finalConfig = httpOnlyCookieStorage ? {
    ...sdkConfig,
    tokenStorage: httpOnlyCookieStorage as any, // Custom storage implementation
  } : {
    ...sdkConfig,
    tokenStorage: sdkConfig.tokenStorage || 'localStorage',
  };

  return (
    <NoranekoIDProvider config={finalConfig}>
      {children}
    </NoranekoIDProvider>
  );
}