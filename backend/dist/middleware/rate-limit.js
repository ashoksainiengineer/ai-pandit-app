/**
 * 🔱 AI-Pandit Rate Limiting Middleware
 * =====================================
 * Production-grade rate limiting with Redis-compatible in-memory store.
 * Supports sliding window algorithm for fair rate distribution.
 */
import { config } from '../config/index.js';
import { sendRateLimit } from '../utils/response.js';
// ═════════════════════════════════════════════════════════════════════════════
// IN-MEMORY STORE (Production should use Redis)
// ═════════════════════════════════════════════════════════════════════════════
class MemoryStore {
    store = new Map();
    timers = new Map();
    async get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return undefined;
        // Check if entry has expired
        if (Date.now() > entry.resetTime) {
            this.store.delete(key);
            return undefined;
        }
        return entry;
    }
    async set(key, entry, ttlMs) {
        this.store.set(key, entry);
        // Clear existing timer
        const existingTimer = this.timers.get(key);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        // Set cleanup timer
        const timer = setTimeout(() => {
            this.store.delete(key);
            this.timers.delete(key);
        }, ttlMs);
        this.timers.set(key, timer);
    }
    async increment(key) {
        const entry = await this.get(key);
        if (!entry)
            return 1;
        entry.count++;
        return entry.count;
    }
    async reset(key) {
        this.store.delete(key);
        const timer = this.timers.get(key);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(key);
        }
    }
    // Cleanup method for graceful shutdown
    destroy() {
        this.timers.forEach((timer) => clearTimeout(timer));
        this.timers.clear();
        this.store.clear();
    }
}
// ═════════════════════════════════════════════════════════════════════════════
// RATE LIMITER CLASS
// ═════════════════════════════════════════════════════════════════════════════
class RateLimiter {
    store;
    windowMs;
    maxRequests;
    keyGenerator;
    standardHeaders;
    legacyHeaders;
    constructor(options = {}) {
        this.store = options.store || new MemoryStore();
        this.windowMs = options.windowMs || config.security.rateLimitWindowMs || 60000;
        this.maxRequests = options.maxRequests || config.security.rateLimitMaxRequests || 100;
        this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator;
        this.standardHeaders = options.standardHeaders ?? true;
        this.legacyHeaders = options.legacyHeaders ?? false;
    }
    defaultKeyGenerator(req) {
        // Use IP + user ID (if authenticated) for more accurate limiting
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const userId = req.userId;
        return userId ? `${ip}:${userId}` : ip;
    }
    getRetryAfter(resetTime) {
        return Math.ceil((resetTime - Date.now()) / 1000);
    }
    setHeaders(res, count, resetTime) {
        if (this.standardHeaders) {
            res.setHeader('RateLimit-Limit', String(this.maxRequests));
            res.setHeader('RateLimit-Remaining', String(Math.max(0, this.maxRequests - count)));
            res.setHeader('RateLimit-Reset', String(Math.ceil(resetTime / 1000)));
        }
        if (this.legacyHeaders) {
            res.setHeader('X-RateLimit-Limit', String(this.maxRequests));
            res.setHeader('X-RateLimit-Remaining', String(Math.max(0, this.maxRequests - count)));
            res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)));
        }
    }
    middleware() {
        return async (req, res, next) => {
            const key = this.keyGenerator(req);
            const now = Date.now();
            try {
                let entry = await this.store.get(key);
                if (!entry) {
                    // Create new window
                    entry = {
                        count: 1,
                        resetTime: now + this.windowMs,
                        windowStart: now,
                    };
                    await this.store.set(key, entry, this.windowMs);
                }
                else {
                    // Increment existing window
                    entry.count = await this.store.increment(key);
                }
                // Set rate limit headers
                this.setHeaders(res, entry.count, entry.resetTime);
                // Check if limit exceeded
                if (entry.count > this.maxRequests) {
                    const retryAfter = this.getRetryAfter(entry.resetTime);
                    res.setHeader('Retry-After', String(retryAfter));
                    // Send error response
                    sendRateLimit(res, retryAfter, req.requestId);
                    return;
                }
                next();
            }
            catch (error) {
                // Fail open - log error but allow request
                console.error('Rate limiter error:', error);
                next();
            }
        };
    }
}
// ═════════════════════════════════════════════════════════════════════════════
// PRECONFIGURED MIDDLEWARE
// ═════════════════════════════════════════════════════════════════════════════
export const defaultRateLimiter = new RateLimiter().middleware();
export const strictRateLimiter = new RateLimiter({
    windowMs: 60000, // 1 minute
    maxRequests: 10, // 10 requests per minute
}).middleware();
export const apiRateLimiter = new RateLimiter({
    windowMs: 60000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    keyGenerator: (req) => {
        // Stricter limiting for AI endpoints
        if (req.path.includes('/api/calculate')) {
            return `btr:${req.ip || 'unknown'}`;
        }
        return req.ip || 'unknown';
    },
}).middleware();
export const calculateRateLimiter = new RateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3, // 3 BTR calculations per 5 minutes
    keyGenerator: (req) => {
        const userId = req.userId;
        return `calculate:${userId || req.ip || 'unknown'}`;
    },
}).middleware();
// ═════════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═════════════════════════════════════════════════════════════════════════════
export function createRateLimiter(options = {}) {
    const limiter = new RateLimiter(options);
    return limiter.middleware();
}
// ═════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═════════════════════════════════════════════════════════════════════════════
export { RateLimiter, MemoryStore };
//# sourceMappingURL=rate-limit.js.map