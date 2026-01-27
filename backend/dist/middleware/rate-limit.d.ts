/**
 * 🔱 AI-Pandit Rate Limiting Middleware
 * =====================================
 * Production-grade rate limiting with Redis-compatible in-memory store.
 * Supports sliding window algorithm for fair rate distribution.
 */
import type { Request, Response, NextFunction } from 'express';
interface RateLimitStore {
    get(key: string): Promise<RateLimitEntry | undefined>;
    set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void>;
    increment(key: string): Promise<number>;
    reset(key: string): Promise<void>;
}
interface RateLimitEntry {
    count: number;
    resetTime: number;
    windowStart: number;
}
interface RateLimitOptions {
    windowMs?: number;
    maxRequests?: number;
    keyGenerator?: (req: Request) => string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
    store?: RateLimitStore;
}
declare class MemoryStore implements RateLimitStore {
    private store;
    private timers;
    get(key: string): Promise<RateLimitEntry | undefined>;
    set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void>;
    increment(key: string): Promise<number>;
    reset(key: string): Promise<void>;
    destroy(): void;
}
declare class RateLimiter {
    private store;
    private windowMs;
    private maxRequests;
    private keyGenerator;
    private standardHeaders;
    private legacyHeaders;
    constructor(options?: RateLimitOptions);
    private defaultKeyGenerator;
    private getRetryAfter;
    private setHeaders;
    middleware(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const defaultRateLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const strictRateLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const apiRateLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const calculateRateLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function createRateLimiter(options?: RateLimitOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export { RateLimiter, MemoryStore };
export type { RateLimitOptions, RateLimitStore, RateLimitEntry };
//# sourceMappingURL=rate-limit.d.ts.map