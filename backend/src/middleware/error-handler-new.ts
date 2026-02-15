/**
 * 🔱 AI-Pandit Error Handler Middleware
 * =====================================
 * Centralized error handling with proper logging and response formatting.
 * Must be registered last in the middleware chain.
 */

import type { Request, Response, NextFunction } from 'express';
import { AppError, isAppError, handleUnknownError, getErrorStatusCode } from '../errors/index.js';
import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';

// ═════════════════════════════════════════════════════════════════════════════
// MAIN ERROR HANDLER
// ═════════════════════════════════════════════════════════════════════════════

export function errorHandlerMiddleware() {
  return (
    err: Error | AppError | unknown,
    req: Request,
    res: Response,
    _next: NextFunction
  ): void => {
    // Ensure response hasn't been sent
    if (res.headersSent) {
      return;
    }

    // Convert to AppError if needed
    const appError = handleUnknownError(err);

    // Log the error
    const logData = {
      requestId: (req as any).requestId,
      path: req.path,
      method: req.method,
      statusCode: appError.statusCode,
      errorCode: appError.code,
      ...(appError.details && { details: appError.details }),
    };

    if (appError.statusCode >= 500) {
      // Server errors - log as error
      if (req.logger) {
        req.logger.error('Server error', appError, logData);
      } else {
        logger.error('Server error (no request logger)', appError, logData);
      }
    } else if (appError.statusCode >= 400) {
      // Client errors - log as warn in production, debug in development
      const level = process.env.NODE_ENV === 'production' ? 'warn' : 'debug';
      if (req.logger) {
        req.logger[level]('Client error', logData);
      }
    }

    // Send error response
    sendError(res, appError, (req as any).requestId);
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// NOT FOUND HANDLER
// ═════════════════════════════════════════════════════════════════════════════

export function notFoundHandler() {
  return (req: Request, res: Response, _next: NextFunction): void => {
    const appError = new AppError(
      'RESOURCE_NOT_FOUND',
      `Route ${req.method} ${req.path} not found`,
      { path: req.path, method: req.method }
    );

    if (req.logger) {
      req.logger.debug('Route not found', { path: req.path, method: req.method });
    }

    sendError(res, appError, (req as any).requestId);
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// ASYNC HANDLER WRAPPER
// ═════════════════════════════════════════════════════════════════════════════

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// UNCAUGHT EXCEPTION HANDLER
// ═════════════════════════════════════════════════════════════════════════════

export function setupUncaughtExceptionHandlers(): void {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', error);

    // Give logger time to flush before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled Rejection', reason instanceof Error ? reason : new Error(String(reason)));
  });

  // Note: SIGTERM is handled in server.ts bootstrap() with proper HTTP server shutdown.
  // Do NOT register a duplicate handler here — it causes race conditions.
}
