import { Request, Response, NextFunction } from 'express';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { logger } from '../lib/logger.js';
import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'requeue_debug.txt');

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
        const timestamp = new Date().toISOString();
        const logEntry = `\n--- ${timestamp} ---\n` +
            `URL: ${req.url}\n` +
            `OriginalURL: ${req.originalUrl}\n` +
            `Method: ${req.method}\n` +
            `Query: ${JSON.stringify(req.query)}\n` +
            `Headers: ${JSON.stringify(req.headers, null, 2)}\n`;
        fs.appendFileSync(LOG_FILE, logEntry);

        const isStreamRequest = req.originalUrl.includes('/stream');
        let token = '';
        const authHeader = req.headers.authorization;
        const queryToken = req.query.token as string;

        // 🔍 DETAILED LOGGING (Sanitized)
        const hasAuthHeader = !!authHeader;
        const hasQueryToken = !!queryToken;
        const authHeaderPrefix = authHeader ? authHeader.substring(0, 15) : 'NONE';

        logger.debug('🔑 [Auth] Token detection initiated', {
            path: req.path,
            hasAuthHeader,
            authHeaderPrefix,
            hasQueryToken,
            requestId: (req as any).requestId
        });

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (queryToken) {
            token = queryToken;
            logger.info('🔑 [Auth] Using query parameter token');
        }

        // Clean up common malformed token scenarios
        if (token === 'null' || token === 'undefined' || token === '[object Object]') {
            token = '';
        }

        if (!token) {
            // HEAVY DIAGNOSTIC LOGGING
            logger.warn('🔒 [Auth] Authentication failed: No token provided', {
                path: req.originalUrl,
                method: req.method,
                isStreamRequest,
                incomingHeaders: Object.keys(req.headers),
                authorizationPresent: !!req.headers.authorization,
                cookiePresent: !!req.headers.cookie
            });

            if (isStreamRequest) {
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');

                res.write(`event: error\ndata: ${JSON.stringify({
                    error: 'Unauthorized: No valid session token',
                    code: 'UNAUTHORIZED',
                    isAuthError: true
                })}\n\n`);
                res.end();
            } else {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized: No valid session token found in Header or Query',
                    code: 'UNAUTHORIZED'
                });
            }
            return;
        }

        // 🛡️ INDUSTRIAL GRADE VERIFICATION
        try {
            const session = await verifyToken(token, {
                secretKey: process.env.CLERK_SECRET_KEY,
                clockSkewInMs: 900000, // 15 minutes leeway for clock skew
            });

            if (session && session.sub) {
                req.clerkId = session.sub;
                req.sessionId = session.sid;
                // Note: userId (internal DB ID) is left for routes to populate or self-heal
                // as middleware shouldn't block on DB lookup per request if not mandatory.
                logger.debug('🔑 [Auth] Token verified successfully', {
                    sessionId: session.sid,
                    clerkId: session.sub
                });
                next();
            } else {
                logger.warn('🔒 [Auth] Token verification failed: Invalid or expired session (no sub)', {
                    tokenPrefix: token.substring(0, 10),
                    path: req.originalUrl
                });
                res.status(401).json({
                    success: false,
                    error: 'Invalid or expired session',
                    code: 'INVALID_SESSION'
                });
            }
        } catch (clerkError: any) {
            logger.error('🔒 [Auth] Token verification failed', {
                error: clerkError.message,
                tokenPrefix: token.substring(0, 10),
                path: req.originalUrl
            });
            if (isStreamRequest) {
                res.setHeader('Content-Type', 'text/event-stream');
                res.write(`event: error\ndata: ${JSON.stringify({
                    type: 'error',
                    error: 'Authentication failed',
                    code: 'AUTH_FAILED',
                    details: clerkError.message
                })}\n\n`);
                res.end();
            } else {
                res.status(401).json({
                    success: false,
                    error: 'Authentication failed',
                    code: 'AUTH_FAILED',
                    details: process.env.NODE_ENV === 'development' ? clerkError.message : undefined
                });
            }
        }

    } catch (error) {
        console.error('CRITICAL: Auth middleware error:', error);
        res.status(500).json({ success: false, error: 'Internal server error during authentication' });
    }
}
