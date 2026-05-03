/**
 * 🔱 AI-Pandit Response Utilities
 * ================================
 * Standardized API response formatting with proper typing.
 * Ensures consistent response structure across all endpoints.
 */

import type { Response } from 'express';
import { AppError, getErrorResponse, getErrorStatusCode } from '../errors/index.js';


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


export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Omit<ApiResponse<T>['meta'], 'timestamp'>
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };

  res.status(statusCode).json(response);
}

export function sendCreated<T>(
  res: Response,
  data: T,
  meta?: Omit<ApiResponse<T>['meta'], 'timestamp'>
): void {
  sendSuccess(res, data, 201, meta);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}


export function sendPaginated<T>(
  res: Response,
  data: PaginatedData<T>,
  meta?: Omit<ApiResponse<T[]>['meta'], 'timestamp' | 'pagination'>
): void {
  const { items, total, page, limit } = data;
  const totalPages = Math.ceil(total / limit);

  sendSuccess(res, items, 200, {
    ...meta,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
}


export function sendError(
  res: Response,
  error: Error | AppError | unknown,
  requestId?: string
): void {
  const statusCode = getErrorStatusCode(error);
  const errorResponse = getErrorResponse(error);
  const details = (errorResponse.error as { details?: Record<string, unknown> }).details;
  const retryAfterSeconds = typeof details?.retryAfterSeconds === 'number'
    ? details.retryAfterSeconds
    : typeof details?.retryAfter === 'number'
      ? details.retryAfter
      : undefined;

  const response: ApiResponse = {
    success: false,
    error: {
      code: (errorResponse.error as { code: string }).code || 'INTERNAL_ERROR',
      message: (errorResponse.error as { message: string }).message || 'An error occurred',
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  if (statusCode === 429 && retryAfterSeconds && retryAfterSeconds > 0) {
    res.setHeader('Retry-After', String(Math.ceil(retryAfterSeconds)));
  }

  // Explicit, stable 429 contract for clients to branch retry logic.
  if (statusCode === 429) {
    res.setHeader('X-RateLimit-Contract', 'v2026-03-12');
  }

  res.status(statusCode).json(response);
}

export function sendValidationError(
  res: Response,
  message: string,
  details?: Record<string, unknown>,
  requestId?: string
): void {
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  res.status(400).json(response);
}

export function sendUnauthorized(
  res: Response,
  message = 'Authentication required',
  requestId?: string
): void {
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  res.status(401).json(response);
}

export function sendForbidden(
  res: Response,
  message = 'Access denied',
  requestId?: string
): void {
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'FORBIDDEN',
      message,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  res.status(403).json(response);
}

export function sendNotFound(
  res: Response,
  resource: string,
  identifier?: string,
  requestId?: string
): void {
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'RESOURCE_NOT_FOUND',
      message: `${resource} not found${identifier ? `: ${identifier}` : ''}`,
      details: identifier ? { resource, identifier } : { resource },
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  res.status(404).json(response);
}

export function sendConflict(
  res: Response,
  message: string,
  details?: Record<string, unknown>,
  requestId?: string
): void {
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'CONFLICT',
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  res.status(409).json(response);
}

export function sendRateLimit(
  res: Response,
  retryAfter?: number,
  requestId?: string
): void {
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded. Please try again later.',
      details: retryAfter ? { retryAfter } : undefined,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  if (retryAfter) {
    res.setHeader('Retry-After', retryAfter);
  }

  res.status(429).json(response);
}

export function sendServiceUnavailable(
  res: Response,
  message = 'Service temporarily unavailable',
  requestId?: string
): void {
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'SERVICE_UNAVAILABLE',
      message,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  res.status(503).json(response);
}


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

export function sendQueueStatus(
  res: Response,
  status: QueueStatusResponse,
  requestId?: string
): void {
  sendSuccess(res, status, 200, { requestId });
}


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

export function sendBtrResult(
  res: Response,
  result: BtrResultResponse,
  requestId?: string
): void {
  sendSuccess(res, result, 200, { requestId });
}
