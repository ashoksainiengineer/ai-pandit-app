import { createClerkClient, verifyToken } from '@clerk/backend';
const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
});
/**
 * Middleware to verify Clerk authentication
 * Extracts user ID from Bearer token using industrial-grade verification
 */
export async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'No authorization token provided',
                code: 'UNAUTHORIZED'
            });
            return;
        }
        const token = authHeader.split(' ')[1];
        // 🛡️ INDUSTRIAL GRADE VERIFICATION
        try {
            const session = await verifyToken(token, {
                secretKey: process.env.CLERK_SECRET_KEY,
            });
            if (session && session.sub) {
                req.userId = session.sub;
                req.sessionId = session.sid;
                next();
            }
            else {
                res.status(401).json({
                    success: false,
                    error: 'Invalid or expired session',
                    code: 'INVALID_SESSION'
                });
            }
        }
        catch (clerkError) {
            console.error('🔒 [Auth] Token verification failed:', clerkError.message);
            res.status(401).json({
                success: false,
                error: 'Authentication failed',
                code: 'AUTH_FAILED',
                details: process.env.NODE_ENV === 'development' ? clerkError.message : undefined
            });
        }
    }
    catch (error) {
        console.error('CRITICAL: Auth middleware error:', error);
        res.status(500).json({ success: false, error: 'Internal server error during authentication' });
    }
}
//# sourceMappingURL=auth.js.map