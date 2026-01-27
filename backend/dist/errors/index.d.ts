/**
 * 🔱 AI-Pandit Custom Error Classes
 * =================================
 * Production-grade error handling with proper categorization,
 * HTTP status codes, and structured error responses.
 */
export declare const ErrorCodes: {
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly INVALID_INPUT: "INVALID_INPUT";
    readonly INVALID_DATE_FORMAT: "INVALID_DATE_FORMAT";
    readonly INVALID_COORDINATES: "INVALID_COORDINATES";
    readonly INSUFFICIENT_LIFE_EVENTS: "INSUFFICIENT_LIFE_EVENTS";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly INVALID_TOKEN: "INVALID_TOKEN";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS";
    readonly SESSION_NOT_FOUND: "SESSION_NOT_FOUND";
    readonly USER_NOT_FOUND: "USER_NOT_FOUND";
    readonly RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND";
    readonly SESSION_ALREADY_EXISTS: "SESSION_ALREADY_EXISTS";
    readonly DUPLICATE_REQUEST: "DUPLICATE_REQUEST";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly AI_SERVICE_ERROR: "AI_SERVICE_ERROR";
    readonly AI_TIMEOUT: "AI_TIMEOUT";
    readonly AI_RATE_LIMIT: "AI_RATE_LIMIT";
    readonly AI_INVALID_RESPONSE: "AI_INVALID_RESPONSE";
    readonly QUEUE_FULL: "QUEUE_FULL";
    readonly QUEUE_TIMEOUT: "QUEUE_TIMEOUT";
    readonly PROCESSING_ERROR: "PROCESSING_ERROR";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly CONNECTION_ERROR: "CONNECTION_ERROR";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly CALCULATION_ERROR: "CALCULATION_ERROR";
    readonly EPHEMERIS_ERROR: "EPHEMERIS_ERROR";
    readonly REQUEST_CANCELLED: "REQUEST_CANCELLED";
};
export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
export declare class AppError extends Error {
    readonly code: ErrorCode;
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly details?: Record<string, unknown>;
    readonly timestamp: string;
    constructor(code: ErrorCode, message: string, details?: Record<string, unknown>, isOperational?: boolean);
    toJSON(): Record<string, unknown>;
}
export declare class ValidationError extends AppError {
    constructor(message: string, details?: Record<string, unknown>);
}
export declare class InvalidInputError extends AppError {
    constructor(message: string, details?: Record<string, unknown>);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(resource: string, identifier?: string);
}
export declare class SessionNotFoundError extends AppError {
    constructor(sessionId: string);
}
export declare class RateLimitError extends AppError {
    constructor(retryAfter?: number);
}
export declare class AIServiceError extends AppError {
    constructor(message: string, details?: Record<string, unknown>);
}
export declare class AITimeoutError extends AppError {
    constructor(timeoutMs: number);
}
export declare class QueueFullError extends AppError {
    constructor(queueSize: number, maxSize: number);
}
export declare class ProcessingError extends AppError {
    constructor(message: string, sessionId?: string);
}
export declare class DatabaseError extends AppError {
    constructor(message: string, details?: Record<string, unknown>);
}
export declare class CalculationError extends AppError {
    constructor(message: string, details?: Record<string, unknown>);
}
export declare class CancellationError extends AppError {
    constructor(sessionId: string);
}
export declare function isAppError(error: unknown): error is AppError;
export declare function isOperationalError(error: unknown): boolean;
export declare function isCancellationError(error: unknown): boolean;
export declare function handleUnknownError(error: unknown): AppError;
export declare function getErrorStatusCode(error: unknown): number;
export declare function getErrorResponse(error: unknown): Record<string, unknown>;
//# sourceMappingURL=index.d.ts.map