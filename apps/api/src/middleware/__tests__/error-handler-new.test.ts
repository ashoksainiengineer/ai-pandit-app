/**
 * 🔱 ERROR HANDLER MIDDLEWARE TESTS
 * Tests centralized error handling with proper logging and response formatting.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

const {
    mockSendError,
    mockLoggerError,
    mockLoggerWarn,
    mockLoggerDebug,
} = vi.hoisted(() =>
 ({
    mockSendError: vi.fn(),
    mockLoggerError: vi.fn(),
    mockLoggerWarn: vi.fn(),
    mockLoggerDebug: vi.fn(),
}));

vi.mock('../../errors/index.js', () =>
 ({
    AppError: class AppError extends Error {
        code: string;
        statusCode: number;
        isOperational: boolean;
        details?: Record<string, unknown>;
        timestamp: string;
        constructor(code: string, message: string, details?: Record<string, unknown>, isOperational = true) {
            super(message);
            this.name = 'AppError';
            this.code = code;
            const statusMap: Record<string, number> = { INTERNAL_ERROR: 500, RESOURCE_NOT_FOUND: 404, VALIDATION_ERROR: 400, RATE_LIMIT_EXCEEDED: 429 };
            this.statusCode = statusMap[code] || 400;
            this.isOperational = isOperational;
            this.details = details;
            this.timestamp = new Date().toISOString();
        }
        toJSON() {
            return {
                error: {
                    code: this.code,
                    message: this.message,
                    statusCode: this.statusCode,
                    details: this.details,
                    timestamp: this.timestamp,
                },
            };
        }
    },
    handleUnknownError: vi.fn((err: unknown) =>
 {
        if (err && typeof err === 'object' && 'code' in err) return err as any;
        return new (class extends Error {
            code = 'INTERNAL_ERROR';
            statusCode = 500;
            isOperational = false;
            details = { originalError: (err as Error)?.name };
            timestamp = new Date().toISOString();
            toJSON() {
                return { error: { code: this.code, message: this.message, statusCode: this.statusCode, details: this.details, timestamp: this.timestamp } };
            }
        })(String((err as Error)?.message || 'An unexpected error occurred'));
    }),
}));

vi.mock('../../config/index.js', () =>
 ({
    config: {
        app: { isProduction: false },
    },
}));

vi.mock('../../utils/logger.js', () =>
 ({
    logger: {
        error: mockLoggerError,
        warn: mockLoggerWarn,
        debug: mockLoggerDebug,
    },
}));

vi.mock('../../utils/response.js', () =>
 ({
    sendError: mockSendError,
}));

import {
    errorHandlerMiddleware,
    notFoundHandler,
    asyncHandler,
    setupUncaughtExceptionHandlers,
} from '../error-handler-new.js';
import { AppError, handleUnknownError } from '../../errors/index.js';

function createMockReq(overrides: Partial<Request> = {}): Request {
    return {
        path: '/test',
        method: 'GET',
        requestId: 'req-123',
        logger: {
            error: vi.fn(),
            warn: vi.fn(),
            debug: vi.fn(),
        } as any,
        ...overrides,
    } as unknown as Request;
}

function createMockRes(): Response {
    return {
        headersSent: false,
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        setHeader: vi.fn().mockReturnThis(),
    } as unknown as Response;
}

describe('errorHandlerMiddleware', () =>
 {
    const next = vi.fn() as unknown as NextFunction;

    beforeEach(() =>
 {
        vi.clearAllMocks();
    });

    it('should do nothing if headers already sent', () =>
 {
        const handler = errorHandlerMiddleware();
        const req = createMockReq();
        const res = createMockRes();
        res.headersSent = true;

        handler(new Error('boom'), req, res, next);

        expect(mockSendError).not.toHaveBeenCalled();
    });

    it('should convert unknown error to AppError and send response', () =>
 {
        const handler = errorHandlerMiddleware();
        const req = createMockReq();
        const res = createMockRes();
        const err = new Error('Something broke');

        handler(err, req, res, next);

        expect(handleUnknownError).toHaveBeenCalledWith(err);
        expect(mockSendError).toHaveBeenCalledWith(res, expect.any(Object), 'req-123');
    });

    it('should log server errors (>=500) with request logger', () =>
 {
        const handler = errorHandlerMiddleware();
        const req = createMockReq();
        const res = createMockRes();
        const appErr = new AppError('INTERNAL_ERROR', 'Server broke', {}, false);
        (appErr as any).statusCode = 500;

        vi.mocked(handleUnknownError).mockReturnValueOnce(appErr as any);

        handler(appErr, req, res, next);

        expect(req.logger.error).toHaveBeenCalled();
        expect(mockSendError).toHaveBeenCalledWith(res, appErr, 'req-123');
    });

    it('should log client errors (>=400) as warn in production', async () =>
 {
        const { config } = await import('../../config/index.js');
        config.app.isProduction = true;

        const handler = errorHandlerMiddleware();
        const req = createMockReq();
        const res = createMockRes();
        const appErr = new AppError('VALIDATION_ERROR', 'Bad input', {});
        (appErr as any).statusCode = 400;

        vi.mocked(handleUnknownError).mockReturnValueOnce(appErr as any);

        handler(appErr, req, res, next);

        expect(req.logger.warn).toHaveBeenCalled();
        expect(mockSendError).toHaveBeenCalledWith(res, appErr, 'req-123');

        config.app.isProduction = false;
    });

    it('should fall back to root logger when req.logger is absent', () =>
 {
        const handler = errorHandlerMiddleware();
        const req = createMockReq({ logger: undefined });
        const res = createMockRes();
        const appErr = new AppError('INTERNAL_ERROR', 'Server broke', {}, false);
        (appErr as any).statusCode = 500;

        vi.mocked(handleUnknownError).mockReturnValueOnce(appErr as any);

        handler(appErr, req, res, next);

        expect(mockLoggerError).toHaveBeenCalled();
    });
});

describe('notFoundHandler', () =>
 {
    it('should return 404 with structured error', () =>
 {
        const handler = notFoundHandler();
        const req = createMockReq({ path: '/missing', method: 'POST', requestId: 'req-404' });
        const res = createMockRes();
        const next = vi.fn() as unknown as NextFunction;

        handler(req, res, next);

        expect(mockSendError).toHaveBeenCalledWith(res, expect.any(Object), 'req-404');
    });

    it('should log route not found at debug level when logger exists', () =>
 {
        const handler = notFoundHandler();
        const req = createMockReq();
        const res = createMockRes();
        const next = vi.fn() as unknown as NextFunction;

        handler(req, res, next);

        expect(req.logger.debug).toHaveBeenCalledWith(
            'Route not found',
            expect.objectContaining({ path: '/test', method: 'GET' })
        );
    });
});

describe('asyncHandler', () =>
 {
    it('should call the async function and pass errors to next()', async () =>
 {
        const error = new Error('async boom');
        const fn = vi.fn().mockRejectedValue(error);
        const wrapped = asyncHandler(fn);

        const req = createMockReq();
        const res = createMockRes();
        const next = vi.fn() as unknown as NextFunction;

        wrapped(req, res, next);
        await new Promise((r) =>
 setTimeout(r, 10));

        expect(fn).toHaveBeenCalledWith(req, res, next);
        expect(next).toHaveBeenCalledWith(error);
    });

    it('should resolve successfully without calling next on error', async () =>
 {
        const fn = vi.fn().mockResolvedValue('ok');
        const wrapped = asyncHandler(fn);

        const req = createMockReq();
        const res = createMockRes();
        const next = vi.fn() as unknown as NextFunction;

        wrapped(req, res, next);
        await new Promise((r) =>
 setTimeout(r, 10));

        expect(fn).toHaveBeenCalledWith(req, res, next);
        expect(next).not.toHaveBeenCalled();
    });
});

describe('setupUncaughtExceptionHandlers', () =>
 {
    it('should register uncaughtException and unhandledRejection handlers', () =>
 {
        const onSpy = vi.spyOn(process, 'on').mockImplementation(() =>
 process);
        setupUncaughtExceptionHandlers();

        const calls = onSpy.mock.calls;
        const eventNames = calls.map((c) =>
 c[0]);
        expect(eventNames).toContain('uncaughtException');
        expect(eventNames).toContain('unhandledRejection');

        onSpy.mockRestore();
    });
});
