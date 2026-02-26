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
    parseSensitiveField: vi.fn((val) => val === 'encrypted' ? 'decrypted' : val),
}));

import { db } from '@ai-pandit/db';
import streamRouter from '../stream.js';
import { sessionEvents } from '../../lib/session-events.js';
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
        getEventsSince: vi.fn(() => []),
    },
}));


const app = express();
app.use(express.json());
app.use('/api/stream', streamRouter);

// Helper to parse SSE lines into JSON objects
function parseSSE(text: string) {
    const lines = text.split('\n');
    const data: any[] = [];
    for (const line of lines) {
        if (line.startsWith('data: ')) {
            try {
                const jsonStr = line.replace('data: ', '').trim();
                if (jsonStr) {
                    data.push(JSON.parse(jsonStr));
                }
            } catch (e) { }
        }
    }
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

                        if (chunkStr.includes('data: ')) {
                            chunkCount += (chunkStr.match(/data:/g) || []).length;
                        }

                        if (chunkCount >= 3) {
                            mockEmitter.emit('event', { type: 'complete', time: '12:00' });
                        }
                    });
                    res.on('end', () => cb(null, responseText));
                });

            req.end((err, res) => {
                if (res) {
                    responseHeaders = res.headers;
                    if (res.text) { responseText = res.text; }
                }
                resolve();
            });

            setTimeout(() => {
                mockEmitter.emit('event', { type: 'complete', time: '12:00' });
            }, 1000);
        });

        expect(responseHeaders['content-type']).toContain('text/event-stream');
        expect(responseText).toContain(':' + ' '.repeat(2048));
        const sse = parseSSE(responseText);
        expect(sse.find(e => e.type === 'connected')).toBeDefined();
        expect(sse.find(e => e.type === 'initial_state')).toBeDefined();
        expect(sse.find(e => e.type === 'metadata')).toBeDefined();
        expect(sse.find(e => e.type === 'complete')).toBeDefined();
    });

    describe('Last-Event-ID Reconnection Replay', () => {
        it('should replay missed events when Last-Event-ID header is provided', { timeout: 10000 }, async () => {
            const sessionId = 'sess-reconnect';
            setMockResults([[{ clerkId: 'valid-clerk', status: 'processing', userId: '1' }]]);

            const missedEvent = { type: 'ai_thinking', chunk: 'replayed' };
            (sessionEvents.getEventsSince as any).mockReturnValue([{ seq: 5, event: missedEvent }]);

            let responseText = '';
            let resolveDone: () => void;
            const done = new Promise<void>(r => resolveDone = r);

            const req = request(app)
                .get(`/api/stream/${sessionId}`)
                .set('Authorization', 'Bearer VALID')
                .set('Last-Event-ID', '4')
                .parse((res, cb) => {
                    res.on('data', chunk => {
                        const chunkStr = chunk.toString();
                        responseText += chunkStr;
                        if (chunkStr.includes('replayed')) {
                            // Delay slightly to let other stuff settle if any
                            setTimeout(() => {
                                mockEmitter.emit('event', { type: 'complete' });
                                resolveDone();
                            }, 50);
                        }
                    });
                    res.on('end', () => cb(null, responseText));
                });

            req.end();

            await done;

            const sse = parseSSE(responseText);
            const replayed = sse.find(e => e.type === 'ai_thinking' && e.chunk === 'replayed');
            expect(replayed).toBeDefined();
            expect(sessionEvents.getEventsSince).toHaveBeenCalledWith(sessionId, 4);
        });

        it('should correctly format sequenced SSE events with id: field', async () => {
            setMockResults([[{ clerkId: 'valid-clerk', status: 'processing', userId: '1' }]]);
            (sessionEvents.getNextSeq as any).mockReturnValue(42);

            let responseText = '';
            let resolveDone: () => void;
            const done = new Promise<void>(r => resolveDone = r);

            const req = request(app)
                .get('/api/stream/sess-id-check')
                .set('Authorization', 'Bearer VALID')
                .parse((res, cb) => {
                    res.on('data', chunk => {
                        responseText += chunk.toString();
                        if (responseText.includes('initial_state')) {
                            mockEmitter.emit('event', { type: 'complete' });
                            resolveDone();
                        }
                    });
                    res.on('end', () => cb(null, responseText));
                });
            req.end();
            await done;

            expect(responseText).toContain('id: 42');
            expect(responseText).toContain('"type":"initial_state"');
        });
    });

    describe('High-Frequency Throughput', () => {
        it('should handle rapid event emission without dropping events', { timeout: 10000 }, async () => {
            setMockResults([[{ clerkId: 'valid-clerk', status: 'processing', userId: '1' }]]);

            let receivedEvents: any[] = [];
            let resolveDone: () => void;
            const done = new Promise<void>(r => resolveDone = r);

            const req = request(app)
                .get('/api/stream/sess-hf')
                .set('Authorization', 'Bearer VALID')
                .parse((res, cb) => {
                    res.on('data', chunk => {
                        const chunkStr = chunk.toString();
                        if (chunkStr.includes('data:')) {
                            const parsed = parseSSE(chunkStr);
                            receivedEvents.push(...parsed);
                            const thinking = receivedEvents.filter(e => e.type === 'ai_thinking');
                            if (thinking.length >= 5) { // Reduced count for faster test
                                mockEmitter.emit('event', { type: 'complete' });
                                resolveDone();
                            }
                        }
                    });
                    res.on('end', () => cb(null, ''));
                });

            req.end();

            await new Promise(r => setTimeout(r, 300));

            for (let i = 0; i < 5; i++) {
                mockEmitter.emit('event', { type: 'ai_thinking', chunk: `chunk-${i}` });
            }

            await done;

            const chunks = receivedEvents.filter(e => e.type === 'ai_thinking');
            expect(chunks.length).toBeGreaterThanOrEqual(5);
        });
    });
});
