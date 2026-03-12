import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

const {
  requestLogger,
  createRequestLoggerMock,
  rootLoggerErrorMock,
} = vi.hoisted(() => {
  const scopedLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  return {
    requestLogger: scopedLogger,
    createRequestLoggerMock: vi.fn(() => scopedLogger),
    rootLoggerErrorMock: vi.fn(),
  };
});

vi.mock('../../utils/logger.js', () => ({
  createRequestLogger: createRequestLoggerMock,
  logger: {
    error: rootLoggerErrorMock,
  },
}));

import {
  requestIdMiddleware,
  requestContextMiddleware,
  tracingMiddleware,
  performanceMiddleware,
  errorTrackingMiddleware,
} from '../request-id.js';

interface MockReqRes {
  req: Request & Record<string, unknown>;
  res: Response & Record<string, unknown>;
}

function makeReqRes(): MockReqRes {
  const headers: Record<string, string> = {};
  const responseHeaders: Record<string, string> = {};
  const listeners = new Map<string, () => void>();

  const req = {
    method: 'POST',
    path: '/api/test',
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    query: {},
    body: {},
    headers,
    get(name: string) {
      return headers[name.toLowerCase()];
    },
  } as unknown as Request & Record<string, unknown>;

  const res = {
    statusCode: 200,
    setHeader(name: string, value: string) {
      responseHeaders[name.toLowerCase()] = value;
    },
    get(name: string) {
      return responseHeaders[name.toLowerCase()];
    },
    on(event: string, callback: () => void) {
      listeners.set(event, callback);
      return this;
    },
    json(body: unknown) {
      return body;
    },
    __headers: responseHeaders,
    __listeners: listeners,
  } as unknown as Response & Record<string, unknown>;

  return { req, res };
}

describe('request-id middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('propagates incoming x-request-id and writes it to response', () => {
    const { req, res } = makeReqRes();
    req.headers['x-request-id'] = 'req-existing-123';

    const next = vi.fn() as unknown as NextFunction;
    requestIdMiddleware()(req, res, next);

    expect(req.requestId).toBe('req-existing-123');
    expect((res.__headers as Record<string, string>)['x-request-id']).toBe('req-existing-123');
    expect(createRequestLoggerMock).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('generates request id when missing and redacts sensitive nested fields', () => {
    const { req, res } = makeReqRes();
    req.body = {
      normal: 'ok',
      token: 'secret-token',
      nested: {
        apiKey: 'abc',
        profile: { authorization: 'Bearer x' },
      },
    };

    const next = vi.fn() as unknown as NextFunction;
    requestIdMiddleware({ generator: () => 'generated-req-id' })(req, res, next);

    expect(req.requestId).toBe('generated-req-id');
    expect(req.headers['x-request-id']).toBe('generated-req-id');

    expect(requestLogger.debug).toHaveBeenCalledWith(
      'Request started',
      expect.objectContaining({
        body: {
          normal: 'ok',
          token: '[REDACTED]',
          nested: {
            apiKey: 'abc',
            profile: { authorization: '[REDACTED]' },
          },
        },
      })
    );

    expect(next).toHaveBeenCalled();
  });

  it('logs completion at warn level for 4xx/5xx responses', () => {
    const { req, res } = makeReqRes();
    const next = vi.fn() as unknown as NextFunction;

    requestIdMiddleware({ generator: () => 'req-id-500' })(req, res, next);

    res.statusCode = 500;
    const finish = (res.__listeners as Map<string, () => void>).get('finish');
    expect(finish).toBeDefined();
    finish?.();

    expect(requestLogger.warn).toHaveBeenCalledWith(
      'Request completed',
      expect.objectContaining({ statusCode: 500 })
    );
  });
});

describe('request context + tracing + performance middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requestContextMiddleware throws when requestId middleware has not run', () => {
    const { req, res } = makeReqRes();
    const next = vi.fn() as unknown as NextFunction;

    expect(() => requestContextMiddleware()(req, res, next)).toThrow(
      'requestIdMiddleware must be installed before requestContextMiddleware'
    );
  });

  it('tracingMiddleware attaches trace context and parses baggage', () => {
    const { req, res } = makeReqRes();
    req.requestId = 'req-1';
    req.logger = requestLogger;
    req.headers['x-baggage'] = 'tenant=acme,plan=premium%20pro';

    const next = vi.fn() as unknown as NextFunction;
    tracingMiddleware()(req, res, next);

    const traceContext = (req as Request & { traceContext?: { baggage?: Record<string, string> } }).traceContext;

    expect(traceContext).toBeDefined();
    expect(traceContext?.baggage).toEqual({ tenant: 'acme', plan: 'premium pro' });
    expect((res.__headers as Record<string, string>)['x-trace-id']).toBeDefined();
    expect((res.__headers as Record<string, string>)['x-span-id']).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  it('performanceMiddleware sets x-response-time header on json response', () => {
    const { req, res } = makeReqRes();
    req.requestId = 'req-perf';
    req.logger = requestLogger;
    req.startTime = Date.now() - 25;

    const next = vi.fn() as unknown as NextFunction;
    performanceMiddleware()(req, res, next);

    res.json({ ok: true });

    const headerValue = (res.__headers as Record<string, string>)['x-response-time'];
    expect(headerValue).toBeDefined();
    expect(headerValue.endsWith('ms')).toBe(true);
  });

  it('errorTrackingMiddleware falls back to root logger if req.logger is absent', () => {
    const { req, res } = makeReqRes();
    req.requestId = 'req-err';
    const next = vi.fn() as unknown as NextFunction;

    errorTrackingMiddleware()(new Error('boom'), req, res, next);

    expect(rootLoggerErrorMock).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
