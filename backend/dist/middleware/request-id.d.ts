/**
 * 🔱 AI-Pandit Request ID & Tracing Middleware
 * ============================================
 * Generates unique request IDs and sets up request-scoped logging.
 * Essential for distributed tracing and debugging.
 */
import type { Request, Response, NextFunction } from 'express';
import { createRequestLogger } from '../utils/logger.js';
declare global {
    namespace Express {
        interface Request {
            requestId: string;
            startTime: number;
            logger: ReturnType<typeof createRequestLogger>;
        }
    }
}
interface RequestIdOptions {
    headerName?: string;
    generator?: () => string;
    setHeader?: boolean;
    includeInResponse?: boolean;
}
export declare function requestIdMiddleware(options?: RequestIdOptions): (req: Request, res: Response, next: NextFunction) => void;
export declare function requestContextMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
interface TracingOptions {
    traceHeader?: string;
    parentSpanHeader?: string;
    baggageHeader?: string;
}
export declare function tracingMiddleware(options?: TracingOptions): (req: Request, res: Response, next: NextFunction) => void;
export declare function performanceMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
export declare function errorTrackingMiddleware(): (err: Error, req: Request, res: Response, next: NextFunction) => void;
export { RequestIdOptions, TracingOptions };
//# sourceMappingURL=request-id.d.ts.map