import { Request, Response, NextFunction } from 'express';
import { createClerkClient } from '@clerk/backend';

const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
});

export interface AuthenticatedRequest extends Request {
    userId?: string;
    sessionId?: string;
}

/**
 * Middleware to verify Clerk authentication
 * Extracts user ID from Bearer token
 */
export async function authMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No authorization token provided' });
            return;
        }

        const token = authHeader.split(' ')[1];

        try {
            // Verify the session token with Clerk
            const session = await clerk.sessions.verifySession(token, token);

            if (session && session.userId) {
                req.userId = session.userId;
                req.sessionId = session.id;
                next();
            } else {
                res.status(401).json({ error: 'Invalid session' });
            }
        } catch (clerkError) {
            // For development, allow requests without valid Clerk token
            if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️ Auth bypassed in development mode');
                req.userId = 'dev-user';
                next();
                return;
            }

            console.error('Clerk verification error:', clerkError);
            res.status(401).json({ error: 'Token verification failed' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication error' });
    }
}

/**
 * Optional auth - allows unauthenticated requests but attaches user if present
 */
export async function optionalAuth(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
    }

    try {
        const token = authHeader.split(' ')[1];
        const session = await clerk.sessions.verifySession(token, token);

        if (session && session.userId) {
            req.userId = session.userId;
            req.sessionId = session.id;
        }
    } catch (error) {
        // Ignore auth errors for optional auth
        console.warn('Optional auth failed:', error);
    }

    next();
}
