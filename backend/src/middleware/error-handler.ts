import { Request, Response, NextFunction } from 'express';

export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    console.error('Error:', err);

    // Handle known error types
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({ error: 'Unauthorized', message: err.message });
        return;
    }

    if (err.name === 'ValidationError') {
        res.status(400).json({ error: 'Validation Error', message: err.message });
        return;
    }

    // Default error response
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : err.message,
    });
}
