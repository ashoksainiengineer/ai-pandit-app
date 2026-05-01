import { Request, Response, NextFunction } from 'express';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';
import fs from 'fs';
import path from 'path';
import { consumeStreamTicket } from '../lib/stream-ticket-manager.js';

const LOG_FILE = path.join(process.cwd(), 'requeue_debug.txt');

export const clerk = createClerkClient({
    secretKey: config.security.clerkSecretKey,
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
        const sanitizeUrl = (url: string): string => url.replace(/([?&])(sid|token|ticket)=[^&]*/gi, '$1$2=[REDACTED]');
        const safeQuery = { ...req.query } as Record<string, unknown>;
        if (safeQuery.sid) safeQuery.sid = '[REDACTED]';
        if (safeQuery.token) safeQuery.token = '[REDACTED]';
        if (safeQuery.ticket) safeQuery.ticket = '[REDACTED]';

        const safeHeaders = { ...req.headers } as Record<string, unknown>;
        if (safeHeaders.authorization) safeHeaders.authorization = '[REDACTED]';
        if (safeHeaders.cookie) safeHeaders.cookie = '[REDACTED]';

        const timestamp = new Date().toISOString();
        const logEntry = `\n--- ${timestamp} ---\n` +
            `URL: ${sanitizeUrl(req.url)}\n` +
            `OriginalURL: ${sanitizeUrl(req.originalUrl)}\n` +
            `Method: ${req.method}\n` +
            `Query: ${JSON.stringify(safeQuery)}\n` +
            `Headers: ${JSON.stringify(safeHeaders, null, 2)}\n`;
        if (config.app.nodeEnv === 'development') {
            fs.appendFileSync(LOG_FILE, logEntry);
        }

        const isStreamRequest = req.originalUrl.includes('/stream');

        let token = '';
        const authHeader = req.headers.authorization;
        const streamTicket = req.query.ticket as string | undefined;

        // 🔍 DETAILED LOGGING (Sanitized)
        const hasAuthHeader = !!authHeader;

        logger.debug('🔑 [Auth] Token detection initiated', {
            path: req.path,
            hasAuthHeader,
            authHeaderPrefix: hasAuthHeader ? 'Bearer [REDACTED]' : 'NONE',
            hasStreamTicket: !!streamTicket,
            requestId: (req as any).requestId
        });

        if (!authHeader && isStreamRequest && streamTicket) {
            const ticketPayload = consumeStreamTicket(streamTicket);
            if (ticketPayload) {
                req.clerkId = ticketPayload.clerkId;
                req.sessionId = ticketPayload.sessionId;
                logger.debug('🔑 [Auth] Stream ticket accepted', {
                    sessionId: ticketPayload.sessionId,
                    clerkIdPrefix: ticketPayload.clerkId.slice(0, 12),
                });
                return next();
            }
        }

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7).trim();
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
                // 🔧 FIX: Send as regular message, not named event (onmessage can't receive named events)
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                res.setHeader('X-Accel-Buffering', 'no');
                res.flushHeaders();

                // Preamble for proxy buffer bypass
                res.write(':' + ' '.repeat(1024) + '\n\n');

                // Send as regular data message (not named event)
                res.write(`data: ${JSON.stringify({
                    type: 'error',
                    message: 'Unauthorized: No valid session token',
                    error: 'Unauthorized: No valid session token',
                    code: 'UNAUTHORIZED',
                    isAuthError: true
                })}\n\n`);

                if ((res as any).flush) (res as any).flush();
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
                secretKey: config.security.clerkSecretKey,
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
                    rawPrefix: token.substring(0, 10),
                    path: req.originalUrl
                });
                res.status(401).json({
                    success: false,
                    error: 'Invalid or expired session',
                    code: 'INVALID_SESSION'
                });
            }
        } catch (clerkError: unknown) {
            const errorStr = clerkError instanceof Error
                ? clerkError.message
                : typeof clerkError === 'object'
                    ? JSON.stringify(clerkError, Object.getOwnPropertyNames(clerkError))
                    : String(clerkError);

            logger.error('🔒 [Auth] Token verification failed', {
                error: errorStr,
                rawPrefix: token.substring(0, 10),
                path: req.originalUrl
            });
            if (isStreamRequest) {
                // 🔧 FIX: Send as regular message, not named event
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('X-Accel-Buffering', 'no');
                res.flushHeaders();

                // Preamble for proxy buffer bypass
                res.write(':' + ' '.repeat(1024) + '\n\n');

                res.write(`data: ${JSON.stringify({
                    type: 'error',
                    message: 'Authentication failed',
                    error: 'Authentication failed',
                    code: 'AUTH_FAILED',
                })}\n\n`);

                if ((res as any).flush) (res as any).flush();
                res.end();
            } else {
                res.status(401).json({
                    success: false,
                    error: 'Authentication failed',
                    code: 'AUTH_FAILED',
                    details: config.app.nodeEnv === 'development' ? (clerkError instanceof Error ? clerkError.message : JSON.stringify(clerkError)) : undefined
                });
            }
        }

    } catch (error) {
        logger.error('CRITICAL: Auth middleware error', {
            error: error instanceof Error ? error.message : String(error),
            path: req.originalUrl
        });
        res.status(500).json({ success: false, error: 'Internal server error during authentication' });
    }
}
