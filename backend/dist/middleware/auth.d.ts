import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    userId?: string;
    sessionId?: string;
}
/**
 * Middleware to verify Clerk authentication
 * Extracts user ID from Bearer token using industrial-grade verification
 */
export declare function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.d.ts.map