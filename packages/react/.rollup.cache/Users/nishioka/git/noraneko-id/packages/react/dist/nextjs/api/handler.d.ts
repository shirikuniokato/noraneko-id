import { NextRequest, NextResponse } from 'next/server';
import { ApiHandlerConfig } from '../types';
/**
 * Create Next.js API route handlers for OAuth2 token management
 * Usage: export const { GET, POST, DELETE } = createNoranekoIDHandler(config);
 */
export declare function createNoranekoIDHandler(config: ApiHandlerConfig): {
    GET: (request: NextRequest) => Promise<NextResponse<{
        access_token: string | null;
        refresh_token: string | null;
        id_token: string | null;
    }> | NextResponse<{
        error: string;
    }>>;
    POST: (request: NextRequest) => Promise<NextResponse<{
        success: boolean;
    }> | NextResponse<{
        error: string;
    }>>;
    DELETE: (request: NextRequest) => Promise<NextResponse<{
        success: boolean;
        message: string;
        actions: string[];
    }>>;
};
/**
 * Default handler with standard configuration
 * For quick setup without custom config
 */
export declare function createDefaultNoranekoIDHandler(): {
    GET: (request: NextRequest) => Promise<NextResponse<{
        access_token: string | null;
        refresh_token: string | null;
        id_token: string | null;
    }> | NextResponse<{
        error: string;
    }>>;
    POST: (request: NextRequest) => Promise<NextResponse<{
        success: boolean;
    }> | NextResponse<{
        error: string;
    }>>;
    DELETE: (request: NextRequest) => Promise<NextResponse<{
        success: boolean;
        message: string;
        actions: string[];
    }>>;
};
//# sourceMappingURL=handler.d.ts.map