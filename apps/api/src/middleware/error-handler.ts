import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';
import { config } from '../config/index.js';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}

export function errorHandler(
    err: CustomError,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    const requestId = (req as any).id || 'unknown';

    logger.error('Request error', {
        requestId,
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    // Handle specific error types
    if (err.name === 'UnauthorizedError' || err.message?.includes('unauthorized')) {
        res.status(401).json({
            error: 'Unauthorized',
            message: err.message,
            requestId
        });
        return;
    }

    if (err.name === 'ValidationError' || err.message?.includes('validation')) {
        res.status(400).json({
            error: 'Validation Error',
            message: err.message,
            requestId
        });
        return;
    }

    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(409).json({
            error: 'Conflict',
            message: 'Resource already exists',
            requestId
        });
        return;
    }

    // Default: don't leak error details in production
    const isDev = config.app.isDevelopment;

    res.status(err.statusCode || 500).json({
        error: 'Internal Server Error',
        message: isDev ? err.message : 'An unexpected error occurred',
        ...(isDev && { stack: err.stack }),
        requestId,
    });
    /* eslint-disable no-empty */
}
