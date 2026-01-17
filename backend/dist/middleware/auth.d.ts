import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    userId?: string;
    sessionId?: string;
}
/**
 * Middleware to verify Clerk authentication
 * Extracts user ID from Bearer token
 */
export declare function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
/**
 * Optional auth - allows unauthenticated requests but attaches user if present
 */
export declare function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.d.ts.map