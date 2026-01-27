import { logger } from '../lib/logger.js';
export function errorHandler(err, req, res, next) {
    const requestId = req.id || 'unknown';
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
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(err.statusCode || 500).json({
        error: 'Internal Server Error',
        message: isDev ? err.message : 'An unexpected error occurred',
        ...(isDev && { stack: err.stack }),
        requestId,
    });
}
//# sourceMappingURL=error-handler.js.map