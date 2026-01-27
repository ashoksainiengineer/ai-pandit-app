/**
 * 🔱 AI-Pandit Request ID & Tracing Middleware
 * ============================================
 * Generates unique request IDs and sets up request-scoped logging.
 * Essential for distributed tracing and debugging.
 */
import { randomUUID } from 'crypto';
import { logger, createRequestLogger } from '../utils/logger.js';
// ═════════════════════════════════════════════════════════════════════════════
// REQUEST ID MIDDLEWARE
// ═════════════════════════════════════════════════════════════════════════════
export function requestIdMiddleware(options = {}) {
    const { headerName = 'x-request-id', generator = () => randomUUID(), setHeader = true, includeInResponse = true, } = options;
    return (req, res, next) => {
        // Generate or extract request ID
        const requestId = req.get(headerName) || generator();
        // Attach to request
        req.requestId = requestId;
        req.startTime = Date.now();
        // Set up request-scoped logger
        req.logger = createRequestLogger({
            requestId,
            method: req.method,
            path: req.path,
            ip: req.ip || req.socket.remoteAddress,
            userAgent: req.get('user-agent'),
            userId: req.userId,
        });
        // Set request ID header on request (for downstream services)
        if (setHeader && !req.get(headerName)) {
            req.headers[headerName] = requestId;
        }
        // Set request ID header on response
        if (includeInResponse) {
            res.setHeader(headerName, requestId);
        }
        // Log request start
        req.logger.debug('Request started', {
            query: req.query,
            body: sanitizeBody(req.body),
        });
        // Track response time and log completion
        res.on('finish', () => {
            const duration = Date.now() - req.startTime;
            const level = res.statusCode >= 400 ? 'warn' : 'info';
            req.logger[level]('Request completed', {
                statusCode: res.statusCode,
                durationMs: duration,
                contentLength: res.get('content-length'),
            });
        });
        next();
    };
}
// ═════════════════════════════════════════════════════════════════════════════
// REQUEST CONTEXT MIDDLEWARE
// ═════════════════════════════════════════════════════════════════════════════
export function requestContextMiddleware() {
    return (req, res, next) => {
        // Ensure requestId middleware ran first
        if (!req.requestId) {
            throw new Error('requestIdMiddleware must be installed before requestContextMiddleware');
        }
        // Attach user context if available
        if (req.auth?.userId) {
            req.logger = createRequestLogger({
                requestId: req.requestId,
                method: req.method,
                path: req.path,
                ip: req.ip || req.socket.remoteAddress,
                userAgent: req.get('user-agent'),
                userId: req.auth.userId,
            });
        }
        next();
    };
}
export function tracingMiddleware(options = {}) {
    const { traceHeader = 'x-trace-id', parentSpanHeader = 'x-parent-span-id', baggageHeader = 'x-baggage', } = options;
    return (req, res, next) => {
        const traceId = req.get(traceHeader) || randomUUID();
        const parentSpanId = req.get(parentSpanHeader);
        const baggage = parseBaggage(req.get(baggageHeader));
        // Attach tracing info to request
        req.traceContext = {
            traceId,
            parentSpanId,
            spanId: randomUUID(),
            baggage,
        };
        // Set tracing headers on response
        res.setHeader(traceHeader, traceId);
        res.setHeader('x-span-id', req.traceContext.spanId);
        req.logger.debug('Tracing context attached', {
            traceId,
            parentSpanId,
            spanId: req.traceContext.spanId,
        });
        next();
    };
}
// ═════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════
function sanitizeBody(body) {
    if (!body || typeof body !== 'object')
        return body;
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization'];
    const sanitized = {};
    for (const [key, value] of Object.entries(body)) {
        if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
            sanitized[key] = '[REDACTED]';
        }
        else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeBody(value);
        }
        else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}
function parseBaggage(header) {
    if (!header)
        return {};
    const baggage = {};
    const pairs = header.split(',');
    for (const pair of pairs) {
        const [key, value] = pair.trim().split('=');
        if (key && value) {
            baggage[key.trim()] = decodeURIComponent(value.trim());
        }
    }
    return baggage;
}
// ═════════════════════════════════════════════════════════════════════════════
// PERFORMANCE MIDDLEWARE
// ═════════════════════════════════════════════════════════════════════════════
export function performanceMiddleware() {
    return (req, res, next) => {
        if (!req.startTime) {
            req.startTime = Date.now();
        }
        const originalJson = res.json.bind(res);
        res.json = function (body) {
            const duration = Date.now() - req.startTime;
            // Add performance headers
            res.setHeader('x-response-time', `${duration}ms`);
            // Log slow requests
            if (duration > 5000) {
                req.logger.warn('Slow request detected', {
                    durationMs: duration,
                    path: req.path,
                    method: req.method,
                });
            }
            return originalJson(body);
        };
        next();
    };
}
// ═════════════════════════════════════════════════════════════════════════════
// ERROR TRACKING MIDDLEWARE
// ═════════════════════════════════════════════════════════════════════════════
export function errorTrackingMiddleware() {
    return (err, req, res, next) => {
        if (req.logger) {
            req.logger.error('Request error', err, {
                path: req.path,
                method: req.method,
                query: req.query,
            });
        }
        else {
            logger.error('Request error (no request logger)', err, {
                path: req.path,
                method: req.method,
                requestId: req.requestId,
            });
        }
        next(err);
    };
}
//# sourceMappingURL=request-id.js.map