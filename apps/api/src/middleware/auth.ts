import { Request, Response, NextFunction } from 'express';
import { clerkAuthProvider } from '../lib/auth/clerk-provider.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { consumeStreamTicket } from '../lib/stream-ticket-manager.js';
import { getClerkAdminClient } from '../lib/auth/clerk-provider.js';
import { UnauthorizedError } from '../errors/index.js';

/** @deprecated Use clerkAuthProvider or getClerkAdminClient instead */
export const getClerk = getClerkAdminClient;



export interface AuthenticatedRequest extends Request {
    userId?: string;     // Internal DB UUID
    externalId?: string;    // External Auth Provider User ID
    sessionId?: string;
}

/**
 * Extract externalId with null-guard for defense-in-depth (BUG-014).
 * Throws UnauthorizedError if externalId is missing (shouldn't happen behind authMiddleware).
 */
export function requireExternalId(req: AuthenticatedRequest): string {
    if (!req.externalId) {
        throw new UnauthorizedError('Authentication required: externalId missing from request');
    }
    return req.externalId;
}

/**
 * Send standardized authentication error response
 */
function sendAuthError(
    res: Response,
    isStreamRequest: boolean,
    message: string,
    code: string,
    statusCode: number = 401
): void {
    if (isStreamRequest) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        res.write(':' + ' '.repeat(1024) + '\n\n');

        res.write(`data: ${JSON.stringify({
            type: 'error',
            message,
            error: message,
            code,
            isAuthError: true
        })}\n\n`);

        const flushable = res as { flush?: () => void };
        flushable.flush?.();
        res.end();
    } else {
        res.status(statusCode).json({
            success: false,
            error: message,
            code
        });
    }
}

/**
 * Middleware to verify Clerk authentication
 * Extracts user ID from Bearer token using Clerk token verification
 */
export async function authMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // BUG-015 fix: Test bypass restricted to development only — prevents production auth bypass
        if (config.app.isDevelopment) {
          const testBypass = req.headers['x-test-bypass-auth'] as string | undefined;
          if (testBypass === 'super-secret-test-key') {
            req.externalId = 'TEST_SCRIPT';
            next();
            return;
          }
        }

        const safeQuery = { ...req.query } as Record<string, unknown>;
        if (safeQuery.sid) safeQuery.sid = '[REDACTED]';
        if (safeQuery.token) safeQuery.token = '[REDACTED]';
        if (safeQuery.ticket) safeQuery.ticket = '[REDACTED]';

        const safeHeaders = { ...req.headers } as Record<string, unknown>;
        if (safeHeaders.authorization) safeHeaders.authorization = '[REDACTED]';
        if (safeHeaders.cookie) safeHeaders.cookie = '[REDACTED]';


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
            requestId: (req as AuthenticatedRequest & { requestId?: string }).requestId
        });

        // 🔑 Stream Ticket Auth (EventSource workaround)
        // -----------------------------------------------------------------
        // Browser-native EventSource API does not support custom HTTP headers,
        // so Authorization: Bearer <token> cannot be sent on SSE requests.
        // Instead, the frontend obtains a single-use ticket via POST
        // /api/stream/ticket/:sessionId (authenticated with Bearer token),
        // then passes it as ?ticket= in the EventSource URL.
        //
        // This block consumes the ticket to authenticate the SSE connection
        // when no Authorization header is present. See:
        //   - lib/stream-ticket-manager.ts (ticket lifecycle)
        //   - routes/stream.ts POST /ticket/:sessionId (ticket creation)
        //   - web/lib/use-stream-progress.ts (frontend ticket acquisition)
        if (!authHeader && isStreamRequest && streamTicket) {
            const ticketPayload = consumeStreamTicket(streamTicket);
            if (ticketPayload) {
                req.externalId = ticketPayload.externalId;
                req.sessionId = ticketPayload.sessionId;
                logger.debug('🔑 [Auth] Stream ticket accepted', {
                    sessionId: ticketPayload.sessionId,
                    externalIdPrefix: ticketPayload.externalId.slice(0, 12),
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
            // Diagnostic logging
            logger.warn('🔒 [Auth] Authentication failed: No token provided', {
                path: req.originalUrl,
                method: req.method,
                isStreamRequest,
                incomingHeaders: Object.keys(req.headers),
                authorizationPresent: !!req.headers.authorization,
                cookiePresent: !!req.headers.cookie
            });

            sendAuthError(res, isStreamRequest, 'Unauthorized: No valid session token', 'UNAUTHORIZED');
            return;
        }

        // Verify token via auth provider (abstracted from specific provider)
        try {
            const result = await clerkAuthProvider.verifyToken(token);

            if (result.identity) {
                req.externalId = result.identity.providerId;  // provider-specific ID
                req.userId = result.identity.userId;        // internal UUID
                req.sessionId = result.identity.sessionId;  // provider session
                logger.debug('🔑 [Auth] Token verified successfully', {
                    providerId: result.identity.providerId,
                    userId: result.identity.userId,
                });
                next();
            } else {
                logger.warn('🔒 [Auth] Token verification failed', {
                    path: req.originalUrl,
                    error: result.error,
                });
                sendAuthError(res, isStreamRequest, result.error || 'Invalid or expired session', 'INVALID_SESSION');
            }
        } catch (error: unknown) {
            const errorStr = error instanceof Error
                ? error.message
                : String(error);

            logger.error('🔒 [Auth] Token verification exception', {
                error: errorStr,
                rawPrefix: token.substring(0, 10),
                path: req.originalUrl,
            });
            sendAuthError(res, isStreamRequest, 'Authentication failed', 'AUTH_FAILED');
        }

    } catch (error) {
        logger.error('CRITICAL: Auth middleware error', {
            error: error instanceof Error ? error.message : String(error),
            path: req.originalUrl
        });
        res.status(500).json({ success: false, error: 'Internal server error during authentication' });
    }
}