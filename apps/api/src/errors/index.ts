/**
 * 🔱 AI-Pandit Custom Error Classes
 * =================================
 * Production-grade error handling with proper categorization,
 * HTTP status codes, and structured error responses.
 */

// ═════════════════════════════════════════════════════════════════════════════
// ERROR CODES
// ═════════════════════════════════════════════════════════════════════════════

export const ErrorCodes = {
  // Validation Errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_DATE_FORMAT: 'INVALID_DATE_FORMAT',
  INVALID_COORDINATES: 'INVALID_COORDINATES',
  INSUFFICIENT_LIFE_EVENTS: 'INSUFFICIENT_LIFE_EVENTS',
  
  // Authentication Errors (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Authorization Errors (403)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Not Found Errors (404)
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  
  // Conflict Errors (409)
  SESSION_ALREADY_EXISTS: 'SESSION_ALREADY_EXISTS',
  DUPLICATE_REQUEST: 'DUPLICATE_REQUEST',
  
  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // AI Service Errors (502)
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  AI_TIMEOUT: 'AI_TIMEOUT',
  AI_RATE_LIMIT: 'AI_RATE_LIMIT',
  AI_INVALID_RESPONSE: 'AI_INVALID_RESPONSE',
  
  // Queue Errors (503)
  QUEUE_FULL: 'QUEUE_FULL',
  QUEUE_TIMEOUT: 'QUEUE_TIMEOUT',
  PROCESSING_ERROR: 'PROCESSING_ERROR',
  
  // Database Errors (500)
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  
  // Internal Errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  CALCULATION_ERROR: 'CALCULATION_ERROR',
  EPHEMERIS_ERROR: 'EPHEMERIS_ERROR',
  
  // Cancellation (499)
  REQUEST_CANCELLED: 'REQUEST_CANCELLED',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ═════════════════════════════════════════════════════════════════════════════
// HTTP STATUS MAPPING
// ═════════════════════════════════════════════════════════════════════════════

const statusCodeMap: Record<ErrorCode, number> = {
  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.INVALID_INPUT]: 400,
  [ErrorCodes.INVALID_DATE_FORMAT]: 400,
  [ErrorCodes.INVALID_COORDINATES]: 400,
  [ErrorCodes.INSUFFICIENT_LIFE_EVENTS]: 400,
  
  [ErrorCodes.UNAUTHORIZED]: 401,
  [ErrorCodes.INVALID_TOKEN]: 401,
  [ErrorCodes.TOKEN_EXPIRED]: 401,
  
  [ErrorCodes.FORBIDDEN]: 403,
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: 403,
  
  [ErrorCodes.SESSION_NOT_FOUND]: 404,
  [ErrorCodes.USER_NOT_FOUND]: 404,
  [ErrorCodes.RESOURCE_NOT_FOUND]: 404,
  
  [ErrorCodes.SESSION_ALREADY_EXISTS]: 409,
  [ErrorCodes.DUPLICATE_REQUEST]: 409,
  
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 429,
  
  [ErrorCodes.AI_SERVICE_ERROR]: 502,
  [ErrorCodes.AI_TIMEOUT]: 504,
  [ErrorCodes.AI_RATE_LIMIT]: 502,
  [ErrorCodes.AI_INVALID_RESPONSE]: 502,
  
  [ErrorCodes.QUEUE_FULL]: 503,
  [ErrorCodes.QUEUE_TIMEOUT]: 504,
  [ErrorCodes.PROCESSING_ERROR]: 500,
  
  [ErrorCodes.DATABASE_ERROR]: 500,
  [ErrorCodes.CONNECTION_ERROR]: 500,
  
  [ErrorCodes.INTERNAL_ERROR]: 500,
  [ErrorCodes.CALCULATION_ERROR]: 500,
  [ErrorCodes.EPHEMERIS_ERROR]: 500,
  
  [ErrorCodes.REQUEST_CANCELLED]: 499,
};

// ═════════════════════════════════════════════════════════════════════════════
// BASE ERROR CLASS
// ═════════════════════════════════════════════════════════════════════════════

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;
  
  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
    isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCodeMap[code] || 500;
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
  
  toJSON(): Record<string, unknown> {
    return {
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
        timestamp: this.timestamp,
        ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
      },
    };
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SPECIALIZED ERROR CLASSES
// ═════════════════════════════════════════════════════════════════════════════

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorCodes.VALIDATION_ERROR, message, details);
  }
}

export class InvalidInputError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorCodes.INVALID_INPUT, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(ErrorCodes.UNAUTHORIZED, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(ErrorCodes.FORBIDDEN, message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    super(
      ErrorCodes.RESOURCE_NOT_FOUND,
      `${resource} not found${identifier ? `: ${identifier}` : ''}`,
      identifier ? { resource, identifier } : { resource }
    );
  }
}

export class SessionNotFoundError extends AppError {
  constructor(sessionId: string) {
    super(
      ErrorCodes.SESSION_NOT_FOUND,
      `Session not found: ${sessionId}`,
      { sessionId }
    );
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded. Please try again later.',
      retryAfter ? { retryAfter } : undefined
    );
  }
}

export class AIServiceError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorCodes.AI_SERVICE_ERROR, message, details);
  }
}

export class AITimeoutError extends AppError {
  constructor(timeoutMs: number) {
    super(
      ErrorCodes.AI_TIMEOUT,
      `AI service timeout after ${timeoutMs}ms`,
      { timeoutMs }
    );
  }
}

export class QueueFullError extends AppError {
  constructor(queueSize: number, maxSize: number) {
    super(
      ErrorCodes.QUEUE_FULL,
      'Processing queue is full. Please try again later.',
      { queueSize, maxSize, availableSlots: maxSize - queueSize }
    );
  }
}

export class ProcessingError extends AppError {
  constructor(message: string, sessionId?: string) {
    super(
      ErrorCodes.PROCESSING_ERROR,
      message,
      sessionId ? { sessionId } : undefined
    );
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorCodes.DATABASE_ERROR, message, details);
  }
}

export class CalculationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorCodes.CALCULATION_ERROR, message, details);
  }
}

export class CancellationError extends AppError {
  constructor(sessionId: string) {
    super(
      ErrorCodes.REQUEST_CANCELLED,
      'Request was cancelled by user',
      { sessionId }
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ERROR TYPE GUARDS
// ═════════════════════════════════════════════════════════════════════════════

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isOperationalError(error: unknown): boolean {
  return isAppError(error) && error.isOperational;
}

export function isCancellationError(error: unknown): boolean {
  return isAppError(error) && error.code === ErrorCodes.REQUEST_CANCELLED;
}

// ═════════════════════════════════════════════════════════════════════════════
// ERROR HANDLER UTILITIES
// ═════════════════════════════════════════════════════════════════════════════

export function handleUnknownError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AppError(
      ErrorCodes.INTERNAL_ERROR,
      error.message,
      { originalError: error.name },
      false
    );
  }
  
  return new AppError(
    ErrorCodes.INTERNAL_ERROR,
    'An unexpected error occurred',
    { originalError: String(error) },
    false
  );
}

export function getErrorStatusCode(error: unknown): number {
  if (isAppError(error)) {
    return error.statusCode;
  }
  return 500;
}

export function getErrorResponse(error: unknown): Record<string, unknown> {
  const appError = handleUnknownError(error);
  return appError.toJSON();
}
