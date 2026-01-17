"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, req, res, next) {
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
//# sourceMappingURL=error-handler.js.map