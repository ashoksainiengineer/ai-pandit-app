/**
 * 🔱 AI-Pandit Response Utilities
 * ================================
 * Standardized API response formatting with proper typing.
 * Ensures consistent response structure across all endpoints.
 */
import type { Response } from 'express';
import { AppError } from '../errors/index.js';
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    meta?: {
        timestamp: string;
        requestId?: string;
        pagination?: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
}
export interface PaginatedData<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}
export declare function sendSuccess<T>(res: Response, data: T, statusCode?: number, meta?: Omit<ApiResponse<T>['meta'], 'timestamp'>): void;
export declare function sendCreated<T>(res: Response, data: T, meta?: Omit<ApiResponse<T>['meta'], 'timestamp'>): void;
export declare function sendNoContent(res: Response): void;
export declare function sendPaginated<T>(res: Response, data: PaginatedData<T>, meta?: Omit<ApiResponse<T[]>['meta'], 'timestamp' | 'pagination'>): void;
export declare function sendError(res: Response, error: Error | AppError | unknown, requestId?: string): void;
export declare function sendValidationError(res: Response, message: string, details?: Record<string, unknown>, requestId?: string): void;
export declare function sendUnauthorized(res: Response, message?: string, requestId?: string): void;
export declare function sendForbidden(res: Response, message?: string, requestId?: string): void;
export declare function sendNotFound(res: Response, resource: string, identifier?: string, requestId?: string): void;
export declare function sendConflict(res: Response, message: string, details?: Record<string, unknown>, requestId?: string): void;
export declare function sendRateLimit(res: Response, retryAfter?: number, requestId?: string): void;
export declare function sendServiceUnavailable(res: Response, message?: string, requestId?: string): void;
export interface QueueStatusResponse {
    sessionId: string;
    status: 'pending' | 'queued' | 'processing' | 'complete' | 'failed';
    position?: number;
    estimatedWaitSeconds?: number;
    progress?: {
        currentStep: number;
        totalSteps: number;
        message: string;
    };
    result?: {
        rectifiedTime: string;
        accuracy: number;
        confidence: string;
    };
    error?: string;
}
export declare function sendQueueStatus(res: Response, status: QueueStatusResponse, requestId?: string): void;
export interface BtrResultResponse {
    sessionId: string;
    rectifiedTime: string;
    accuracy: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    precisionLevel: 'seconds' | 'minutes';
    marginOfError: number;
    methodsUsed: string[];
    processingTimeMs: number;
    analysisResult: Record<string, unknown>;
}
export declare function sendBtrResult(res: Response, result: BtrResultResponse, requestId?: string): void;
//# sourceMappingURL=response.d.ts.map