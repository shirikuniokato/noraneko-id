/**
 * NoranekoID React Context
 */

import { createContext } from 'react';
import type { NoranekoIDContextValue } from '../types';

/**
 * NoranekoID Context
 * 
 * 認証状態とSDK機能をReactアプリ全体で共有するためのContext
 */
export const NoranekoIDContext = createContext<NoranekoIDContextValue | null>(null);

/**
 * Context表示名（デバッグ用）
 */
NoranekoIDContext.displayName = 'NoranekoIDContext';