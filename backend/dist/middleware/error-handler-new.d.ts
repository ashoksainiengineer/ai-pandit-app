/**
 * 🔱 AI-Pandit Error Handler Middleware
 * =====================================
 * Centralized error handling with proper logging and response formatting.
 * Must be registered last in the middleware chain.
 */
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/index.js';
export declare function errorHandlerMiddleware(): (err: Error | AppError | unknown, req: Request, res: Response, _next: NextFunction) => void;
export declare function notFoundHandler(): (req: Request, res: Response, _next: NextFunction) => void;
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): (req: Request, res: Response, next: NextFunction) => void;
export declare function setupUncaughtExceptionHandlers(): void;
//# sourceMappingURL=error-handler-new.d.ts.map