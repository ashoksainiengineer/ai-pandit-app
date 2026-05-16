import { Request, Response, NextFunction } from 'express';
import { clerkAuthProvider } from '../lib/auth/clerk-provider.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
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
    message: string,
    code: string,
    statusCode: number = 401
): void {
    res.status(statusCode).json({
        success: false,
        error: message,
        code
    });
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


        let token = '';
        const authHeader = req.headers.authorization;
        const hasAuthHeader = !!authHeader;

        logger.debug('🔑 [Auth] Token detection initiated', {
            path: req.path,
            hasAuthHeader,
            authHeaderPrefix: hasAuthHeader ? 'Bearer [REDACTED]' : 'NONE',
            requestId: (req as AuthenticatedRequest & { requestId?: string }).requestId
        });

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
                incomingHeaders: Object.keys(req.headers),
                authorizationPresent: !!req.headers.authorization,
                cookiePresent: !!req.headers.cookie
            });

            sendAuthError(res, 'Unauthorized: No valid session token', 'UNAUTHORIZED');
            return;
        }

        // Test mode bypass: accept test_token_* without real Clerk verification
        // This allows integration tests to run against real DB/Redis without needing
        // a real Clerk JWT. Test tokens are only accepted in non-production environments.
        if (process.env.NODE_ENV !== 'production' && token.startsWith('test_token_')) {
            req.externalId = token;
            req.userId = token;
            logger.debug('🔑 [Auth] Test token accepted (bypass)', { tokenPrefix: token.substring(0, 15) });
            return next();
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
                sendAuthError(res, result.error || 'Invalid or expired session', 'INVALID_SESSION');
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
            sendAuthError(res, 'Authentication failed', 'AUTH_FAILED');
        }

    } catch (error) {
        logger.error('CRITICAL: Auth middleware error', {
            error: error instanceof Error ? error.message : String(error),
            path: req.originalUrl
        });
        res.status(500).json({ success: false, error: 'Internal server error during authentication' });
    }
}