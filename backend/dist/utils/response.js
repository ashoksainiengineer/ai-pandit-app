/**
 * 🔱 AI-Pandit Response Utilities
 * ================================
 * Standardized API response formatting with proper typing.
 * Ensures consistent response structure across all endpoints.
 */
import { getErrorResponse, getErrorStatusCode } from '../errors/index.js';
// ═════════════════════════════════════════════════════════════════════════════
// SUCCESS RESPONSES
// ═════════════════════════════════════════════════════════════════════════════
export function sendSuccess(res, data, statusCode = 200, meta) {
    const response = {
        success: true,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            ...meta,
        },
    };
    res.status(statusCode).json(response);
}
export function sendCreated(res, data, meta) {
    sendSuccess(res, data, 201, meta);
}
export function sendNoContent(res) {
    res.status(204).send();
}
// ═════════════════════════════════════════════════════════════════════════════
// PAGINATED RESPONSES
// ═════════════════════════════════════════════════════════════════════════════
export function sendPaginated(res, data, meta) {
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
// ═════════════════════════════════════════════════════════════════════════════
// ERROR RESPONSES
// ═════════════════════════════════════════════════════════════════════════════
export function sendError(res, error, requestId) {
    const statusCode = getErrorStatusCode(error);
    const errorResponse = getErrorResponse(error);
    const response = {
        success: false,
        error: {
            code: errorResponse.error.code || 'INTERNAL_ERROR',
            message: errorResponse.error.message || 'An error occurred',
            details: errorResponse.error.details,
        },
        meta: {
            timestamp: new Date().toISOString(),
            requestId,
        },
    };
    res.status(statusCode).json(response);
}
export function sendValidationError(res, message, details, requestId) {
    const response = {
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
export function sendUnauthorized(res, message = 'Authentication required', requestId) {
    const response = {
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
export function sendForbidden(res, message = 'Access denied', requestId) {
    const response = {
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
export function sendNotFound(res, resource, identifier, requestId) {
    const response = {
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
export function sendConflict(res, message, details, requestId) {
    const response = {
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
export function sendRateLimit(res, retryAfter, requestId) {
    const response = {
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
export function sendServiceUnavailable(res, message = 'Service temporarily unavailable', requestId) {
    const response = {
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
export function sendQueueStatus(res, status, requestId) {
    sendSuccess(res, status, 200, { requestId });
}
export function sendBtrResult(res, result, requestId) {
    sendSuccess(res, result, 200, { requestId });
}
//# sourceMappingURL=response.js.map