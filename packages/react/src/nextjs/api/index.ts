/**
 * Next.js API Routes 用ユーティリティ
 * 
 * API Routes で使用する認証・トークン管理機能を提供します。
 */

// API Routes ハンドラー
export { createNoranekoIDHandler } from './handler';

// 型定義
export type { ApiHandlerConfig } from '../types';