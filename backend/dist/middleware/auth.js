"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.optionalAuth = optionalAuth;
const backend_1 = require("@clerk/backend");
const clerk = (0, backend_1.createClerkClient)({
    secretKey: process.env.CLERK_SECRET_KEY,
});
/**
 * Middleware to verify Clerk authentication
 * Extracts user ID from Bearer token
 */
async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Allow dev bypass if configured
            if (process.env.NODE_ENV === 'development') {
                req.userId = 'dev-user';
                next();
                return;
            }
            res.status(401).json({ error: 'No authorization token provided' });
            return;
        }
        const token = authHeader.split(' ')[1];
        // Explicit dev token bypass (allow unconditionally for local testing if env is missing)
        if (token === 'dev-token-fallback' || (process.env.NODE_ENV === 'development' && token === 'dev-token-fallback')) {
            req.userId = 'dev-user';
            next();
            return;
        }
        try {
            // Verify the session token with Clerk
            const session = await clerk.sessions.verifySession(token, token);
            if (session && session.userId) {
                req.userId = session.userId;
                req.sessionId = session.id;
                next();
            }
            else {
                res.status(401).json({ error: 'Invalid session' });
            }
        }
        catch (clerkError) {
            // For development, allow requests without valid Clerk token
            if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️ Auth bypassed in development mode (fallback)');
                req.userId = 'dev-user';
                next();
                return;
            }
            console.error('Clerk verification error:', clerkError);
            res.status(401).json({ error: 'Token verification failed' });
        }
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication error' });
    }
}
/**
 * Optional auth - allows unauthenticated requests but attaches user if present
 */
async function optionalAuth(req, res, next) {
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
    }
    catch (error) {
        // Ignore auth errors for optional auth
        console.warn('Optional auth failed:', error);
    }
    next();
}
//# sourceMappingURL=auth.js.map