/**
 * useAuthState - 認証状態専用Hook
 */

import { useContext } from 'react';
import { NoranekoIDContext } from '../context/NoranekoIDContext';
import type { UseAuthStateResult } from '../types';

/**
 * useAuthState Hook
 * 
 * 認証状態のみを監視する軽量Hook
 * ユーザー情報や操作関数が不要な場合に使用
 * 
 * @returns 認証状態
 * 
 * @example
 * ```tsx
 * function AuthIndicator() {
 *   const { isAuthenticated, isLoading } = useAuthState();
 * 
 *   if (isLoading) return <span>⏳</span>;
 *   return <span>{isAuthenticated ? '🔓' : '🔒'}</span>;
 * }
 * ```
 */
export function useAuthState(): UseAuthStateResult {
  const context = useContext(NoranekoIDContext);

  if (!context) {
    throw new Error(
      'useAuthState must be used within a NoranekoIDProvider. ' +
      'Make sure to wrap your component tree with <NoranekoIDProvider>.'
    );
  }

  return {
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    isInitializing: context.isInitializing,
    error: context.error,
  };
}