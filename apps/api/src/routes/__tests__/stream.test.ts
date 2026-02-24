/**
 * 🔱 EXHAUSTIVE STREAM ROUTE TESTS
 * Tests GET /api/stream/:sessionId
 * Checks ownership verification, terminal states, keep-alive headers,
 * proxy-buffering bypass, and initial progress state sync.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

let mockQueryResults: any[] = [];
let queryResultIndex = 0;

function setMockResults(results: any[]) {
    mockQueryResults = results;
    queryResultIndex = 0;
}

vi.mock('@ai-pandit/db', () => {
    const createQueryBuilder = () => {
        const qb: any = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            set: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
        };
        qb.then = function (resolve: any) {
            const res = mockQueryResults[queryResultIndex];
            queryResultIndex = Math.min(queryResultIndex + 1, mockQueryResults.length - 1);
            resolve(res || []);
        };
        return qb;
    };

    return {
        db: {
            select: vi.fn(() => createQueryBuilder()),
            update: vi.fn(() => createQueryBuilder()),
            delete: vi.fn(() => createQueryBuilder()),
        },
    };
});

vi.mock('@ai-pandit/db/schema', () => ({
    sessions: { id: 'id', status: 'status', userId: 'userId', clerkId: 'clerkId', errorMessage: 'errorMessage', updatedAt: 'updatedAt' },
}));

vi.mock('drizzle-orm', () => ({
    eq: vi.fn((col, val) => ({ op: 'eq', col, val })),
    and: vi.fn(),
}));

// Mock Auth Middleware to directly inject clerkId
vi.mock('../../middleware/auth.js', () => ({
    authMiddleware: (req: any, res: any, next: any) => {
        if (req.headers.authorization === 'Bearer VALID') {
            req.clerkId = 'valid-clerk';
            req.userId = '1';
        } else if (req.headers.authorization === 'Bearer VALID_OTHER') {
            req.clerkId = 'other-clerk';
            req.userId = '2';
        }
        next();
    },
}));

vi.mock('../../lib/logger.js', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../lib/progress-tracker.js', () => ({
    getSessionProgress: vi.fn(() => ({ currentStep: 1, totalSteps: 7, percentage: 14 })),
}));

vi.mock('../../lib/queue-manager.js', () => ({
    getQueueStatus: vi.fn(() => ({
        status: 'queued',
        position: 1,
        estimatedWaitSeconds: 120,
        totalInQueue: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        sessionId: 'sess-1',
        session: { fullName: 'encrypted', offsetConfig: 'encrypted', userId: '1' }
    })),
}));

vi.mock('../../lib/encryption/index.js', () => ({
    parseSensitiveField: vi.fn(() => 'decrypted'),
}));

import { db } from '@ai-pandit/db';
import streamRouter from '../stream.js';
import { EventEmitter } from 'events';

// Mock sessionEvents emitter
const mockEmitter = new EventEmitter();
vi.mock('../../lib/session-events.js', () => ({
    sessionEvents: {
        getEmitter: vi.fn(() => mockEmitter),
        getLastContext: vi.fn(() => null),
        getThinkingBuffers: vi.fn(() => []),
        getCalculationBuffer: vi.fn(() => []),
        getCandidateScoreBuffer: vi.fn(() => []),
        getDecisionBuffer: vi.fn(() => []),
        getNextSeq: vi.fn(() => 1),
        logEvent: vi.fn(),
    },
}));


const app = express();
app.use(express.json());
app.use('/api/stream', streamRouter);

// Helper to parse SSE lines into JSON objects
function parseSSE(text: string) {
    const lines = text.split('\n');
    const data = lines
        .filter(l => l.startsWith('data: '))
        .map(l => JSON.parse(l.replace('data: ', '')));
    return data;
}

// ═══════════════════════════════════════════════════════════════════════════
// SSE ENDPOINT TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('GET /api/stream/:sessionId', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should handle OPTIONS request correctly for CORS', async () => {
        const res = await request(app)
            .options('/api/stream/sess-1')
            .set('Origin', 'http://localhost:3000');

        expect(res.status).toBe(204);
        expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
        expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should return error if no clerkId (unauthorized)', async () => {
        const res = await request(app).get('/api/stream/sess-1');
        const sse = parseSSE(res.text);

        expect(res.headers['content-type']).toContain('text/event-stream');
        expect(sse[0].type).toBe('error');
        expect(sse[0].code).toBe('UNAUTHORIZED');
    });

    it('should return error if session not found', async () => {
        setMockResults([[]]); // session query returns empty

        const res = await request(app)
            .get('/api/stream/sess-1')
            .set('Authorization', 'Bearer VALID');

        const sse = parseSSE(res.text);
        expect(sse[0].type).toBe('error');
        expect(sse[0].code).toBe('NOT_FOUND');
    });

    it('should return error if clerkId does not match (IDOR Protection)', async () => {
        setMockResults([[{ clerkId: 'owner-clerk', status: 'pending' }]]);

        const res = await request(app)
            .get('/api/stream/sess-1')
            .set('Authorization', 'Bearer VALID'); // injects 'valid-clerk'

        const sse = parseSSE(res.text);
        expect(sse[0].type).toBe('error');
        expect(sse[0].code).toBe('FORBIDDEN');
    });

    it('should immediately send terminal_state if session is complete', async () => {
        setMockResults([[{ clerkId: 'valid-clerk', status: 'complete' }]]);

        const res = await request(app)
            .get('/api/stream/sess-1')
            .set('Authorization', 'Bearer VALID');

        const sse = parseSSE(res.text);
        expect(sse[0].type).toBe('terminal_state');
        expect(sse[0].status).toBe('complete');
        // connection closed automatically
    });

    it('should immediately send terminal_state if session is failed', async () => {
        setMockResults([[{ clerkId: 'valid-clerk', status: 'failed', errorMessage: 'OOM' }]]);

        const res = await request(app)
            .get('/api/stream/sess-1')
            .set('Authorization', 'Bearer VALID');

        const sse = parseSSE(res.text);
        expect(sse[0].type).toBe('terminal_state');
        expect(sse[0].status).toBe('failed');
        expect(sse[0].errorMessage).toBe('OOM');
    });

    it('should open active SSE connection for valid pending session', async () => {
        setMockResults([[{ clerkId: 'valid-clerk', status: 'processing', userId: '1' }]]);

        // Because it's a long-lived connection, supertest will hang unless the server closes it,
        // so we abort it locally or simulate the server sending an error to close.
        // But express testing of SSE can be simulated by immediately destroying the request socket.

        let responseHeaders: any;
        let responseText = '';

        await new Promise<void>((resolve) => {
            const req = request(app)
                .get('/api/stream/sess-1')
                .set('Authorization', 'Bearer VALID')
                .buffer()
                .parse((res, cb) => {
                    let chunkCount = 0;
                    res.on('data', chunk => {
                        const chunkStr = chunk.toString();
                        responseText += chunkStr;

                        // Count data events to know when initialization is done
                        if (chunkStr.includes('data: ')) {
                            chunkCount += (chunkStr.match(/data:/g) || []).length;
                        }

                        // Once we receive connected, initial_state, and metadata (3 events),
                        // we can trigger the complete event to close the stream.
                        if (chunkCount >= 3) {
                            mockEmitter.emit('event', { type: 'complete', time: '12:00' });
                        }
                    });
                    res.on('end', () => cb(null, responseText));
                });

            req.end((err, res) => {
                responseHeaders = res.headers;
                if (res.text) { responseText = res.text; }
                resolve();
            });

            // Fallback timeout just in case it hangs
            setTimeout(() => {
                mockEmitter.emit('event', { type: 'complete', time: '12:00' });
            }, 1000);
        });

        // 1. Check SSE Headers
        expect(responseHeaders['content-type']).toContain('text/event-stream');
        expect(responseHeaders['cache-control']).toContain('no-cache');
        expect(responseHeaders['connection']).toBe('keep-alive');
        expect(responseHeaders['x-accel-buffering']).toBe('no');

        // 2. Check Preamble (2048 spaces bypass nginx proxy buffering)
        expect(responseText).toContain(':' + ' '.repeat(2048));

        // 3. Check parsed SSE events
        const sse = parseSSE(responseText);

        // Ensure connected event arrived
        const connected = sse.find(e => e.type === 'connected');
        expect(connected).toBeDefined();

        // Ensure initial sync happened (metadata, initial_state)
        const initial = sse.find(e => e.type === 'initial_state');
        expect(initial).toBeDefined();

        const metadata = sse.find(e => e.type === 'metadata');
        expect(metadata).toBeDefined();
        // Since we mocked parseSensitiveField, metadata should have decrypted fields
        expect(metadata.data.fullName).toBe('decrypted');

        // Check the terminal complete event that closed the connection
        const complete = sse.find(e => e.type === 'complete');
        expect(complete).toBeDefined();
    });
});
