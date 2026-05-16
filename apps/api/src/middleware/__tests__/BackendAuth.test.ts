import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextFunction } from 'express';
import { authMiddleware } from '../auth.js';
import { verifyToken } from '@clerk/backend';

// Mock Clerk backend
vi.mock('@clerk/backend', () => ({
    createClerkClient: vi.fn(() => ({
        sessions: {
            getSession: vi.fn(),
        },
    })),
    verifyToken: vi.fn(),
}));

// Mock logger to prevent noise
vi.mock('../../lib/logger.js', () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));



describe('BackendAuth Middleware', () => {
    let mockReq: any;
    let mockRes: any;
    let nextFunction: NextFunction;

    beforeEach(() => {
        vi.clearAllMocks();
        mockReq = {
            url: '/api/test',
            originalUrl: '/api/test',
            method: 'GET',
            headers: {},
            query: {},
        };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            setHeader: vi.fn().mockReturnThis(),
            write: vi.fn().mockReturnThis(),
            flushHeaders: vi.fn().mockReturnThis(),
            end: vi.fn().mockReturnThis(),
        };
        nextFunction = vi.fn();
    });

    it('should pass with a valid Bearer token', async () => {
        mockReq.headers.authorization = 'Bearer valid-token';
        (verifyToken as any).mockResolvedValue({
            sub: 'user_123',
            sid: 'sess_123',
        });

        await authMiddleware(mockReq, mockRes, nextFunction);

        expect(nextFunction).toHaveBeenCalled();
        expect(mockReq.externalId).toBe('user_123');
        expect(mockReq.sessionId).toBe('sess_123');
    });

    it('should reject auth token in query parameter', async () => {
        mockReq.query.sid = 'valid-token-in-query';

        await authMiddleware(mockReq, mockRes, nextFunction);

        expect(nextFunction).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 401 when no token is provided', async () => {
        await authMiddleware(mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            code: 'UNAUTHORIZED'
        }));
    });

    it('should return 401 when token is "null" or "undefined" string', async () => {
        mockReq.headers.authorization = 'Bearer null';
        await authMiddleware(mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(401);

        mockReq.headers.authorization = 'Bearer undefined';
        await authMiddleware(mockReq, mockRes, nextFunction);
        expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should handle clock skew within 15 minutes', async () => {
        mockReq.headers.authorization = 'Bearer valid-token';
        (verifyToken as any).mockResolvedValue({
            sub: 'user_123',
            sid: 'sess_123',
        });

        await authMiddleware(mockReq, mockRes, nextFunction);

        expect(verifyToken).toHaveBeenCalledWith('valid-token', expect.objectContaining({
            clockSkewInMs: 900000 // 15 minutes
        }));
    });

    it('should return 401 on expired or invalid tokens', async () => {
        mockReq.headers.authorization = 'Bearer expired-token';
        (verifyToken as any).mockRejectedValue(new Error('Token expired'));

        await authMiddleware(mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            code: 'INVALID_SESSION'
        }));
    });

    it('should reject test script bypass in non-development mode', async () => {
        mockReq.headers['x-test-bypass-auth'] = 'super-secret-test-key';

        await authMiddleware(mockReq, mockRes, nextFunction);

        expect(nextFunction).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(401);
    });
});
