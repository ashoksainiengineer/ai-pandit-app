import { Request, Response, NextFunction } from 'express';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { logger } from '../lib/logger.js';

export const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
});


export interface AuthenticatedRequest extends Request {
    userId?: string;     // Internal DB UUID
    clerkId?: string;    // External Clerk User ID
    sessionId?: string;
}

/**
 * Middleware to verify Clerk authentication
 * Extracts user ID from Bearer token using industrial-grade verification
 */
export async function authMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        let token = '';
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.query.token) {
            // Support token in query for SSE (which doesn't support headers)
            token = req.query.token as string;
            logger.info('🔑 [Auth] Using query parameter token for authentication');
        }

        if (!token) {
            res.status(401).json({
                success: false,
                error: 'No authorization token provided',
                code: 'UNAUTHORIZED'
            });
            return;
        }

        // 🛡️ INDUSTRIAL GRADE VERIFICATION
        try {
            const session = await verifyToken(token, {
                secretKey: process.env.CLERK_SECRET_KEY,
            });

            if (session && session.sub) {
                req.clerkId = session.sub;
                req.sessionId = session.sid;
                // Note: userId (internal DB ID) is left for routes to populate or self-heal
                // as middleware shouldn't block on DB lookup per request if not mandatory.
                next();
            } else {
                res.status(401).json({
                    success: false,
                    error: 'Invalid or expired session',
                    code: 'INVALID_SESSION'
                });
            }
        } catch (clerkError: any) {
            console.error('🔒 [Auth] Token verification failed:', clerkError.message);

            res.status(401).json({
                success: false,
                error: 'Authentication failed',
                code: 'AUTH_FAILED',
                details: process.env.NODE_ENV === 'development' ? clerkError.message : undefined
            });
        }

    } catch (error) {
        console.error('CRITICAL: Auth middleware error:', error);
        res.status(500).json({ success: false, error: 'Internal server error during authentication' });
    }
}
