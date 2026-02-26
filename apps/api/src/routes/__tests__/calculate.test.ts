import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

vi.mock('@ai-pandit/db', () => ({
    db: {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue(undefined),
    },
    executeWithRetry: vi.fn((fn: any) => fn()),
}));

vi.mock('../../middleware/auth.js', () => ({
    authMiddleware: vi.fn((req: any, _res: any, next: any) => {
        req.clerkId = 'test_user_calc';
        next();
    }),
    clerk: {
        users: {
            getUser: vi.fn().mockResolvedValue({
                emailAddresses: [{ emailAddress: 'calc@test.com' }],
                firstName: 'Calc',
                lastName: 'User',
            }),
        },
    },
}));

vi.mock('../../lib/logger.js', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../lib/user-sync.js', () => ({
    syncUser: vi.fn().mockResolvedValue('internal-uuid-123'),
}));

vi.mock('../../lib/queue-manager.js', () => ({
    addToQueue: vi.fn().mockResolvedValue({ success: true, position: 1, estimatedWaitSeconds: 30 }),
}));

const mockEncryptData = vi.fn((data: string, _userId: string) => `ENC_${data}`);
vi.mock('../../lib/crypto-adapter.js', () => ({
    encryptData: (data: string, userId: string) => mockEncryptData(data, userId),
}));

vi.mock('../../lib/encryption/index.js', () => ({
    encryptData: vi.fn((data: any) => `ENC_${JSON.stringify(data)}`),
}));

import calculateRouter from '../../routes/calculate.js';

function createApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/calculate', calculateRouter);
    return app;
}

// Valid data matching the strict Zod schema in calculate.ts
const VALID_BIRTH_DATA = {
    fullName: 'John Doe',
    dateOfBirth: '1990-01-15',
    tentativeTime: '08:30:00',    // HH:MM:SS required
    birthPlace: 'Mumbai, India',
    latitude: 19.0760,
    longitude: 72.8777,
    timezone: 5.5,                // number, not string
    gender: 'male'
};

const VALID_LIFE_EVENTS = [
    { eventType: 'Marriage', category: 'marriage', eventDate: '2015-06-15', datePrecision: 'exact_date', importance: 'high', description: 'Married at central park' },
    { eventType: 'First Job', category: 'career', eventDate: '2012-07-01', datePrecision: 'exact_date', importance: 'medium', description: 'Started as a junior dev' },
    { eventType: 'Graduated', category: 'education', eventDate: '2011-05-20', datePrecision: 'exact_date', importance: 'medium', description: 'BSc Computer Science' },
];

const VALID_OFFSET_CONFIG = { preset: '1hour' as const, description: 'Standard offset' };

describe('Calculate Route - Integration Tests', () => {
    let app: ReturnType<typeof createApp>;

    beforeEach(() => {
        vi.clearAllMocks();
        app = createApp();
    });

    // ═════ Validation ═════

    describe('Input Validation', () => {
        it('should reject request with empty body', async () => {
            const res = await request(app).post('/api/calculate').send({});
            expect(res.status).toBe(400);
        });

        it('should reject request with < 3 life events', async () => {
            const res = await request(app).post('/api/calculate').send({
                birthData: VALID_BIRTH_DATA,
                lifeEvents: [VALID_LIFE_EVENTS[0]],
                offsetConfig: VALID_OFFSET_CONFIG,
            });
            expect(res.status).toBe(400);
            expect(JSON.stringify(res.body.details)).toContain('At least 3 life events');
        });

        it('should reject invalid date formats', async () => {
            const res = await request(app).post('/api/calculate').send({
                birthData: { ...VALID_BIRTH_DATA, dateOfBirth: '15-01-1990' },
                lifeEvents: VALID_LIFE_EVENTS,
                offsetConfig: VALID_OFFSET_CONFIG,
            });
            expect(res.status).toBe(400);
        });

        it('should reject out-of-range coordinates', async () => {
            const res = await request(app).post('/api/calculate').send({
                birthData: { ...VALID_BIRTH_DATA, latitude: 95 },
                lifeEvents: VALID_LIFE_EVENTS,
                offsetConfig: VALID_OFFSET_CONFIG,
            });
            expect(res.status).toBe(400);
        });

        it('should reject malformed JSON', async () => {
            const res = await request(app)
                .post('/api/calculate')
                .set('Content-Type', 'application/json')
                .send('{"birthData": { "fullName": "Broken" ');
            expect(res.status).toBe(400);
        });
    });

    // ═════ Security ═════

    describe('Security & Sanitization', () => {
        it('should sanitize XSS payloads in strings', async () => {
            const xssPayload = {
                birthData: { ...VALID_BIRTH_DATA, fullName: "John <script>alert('XSS')</script> Doe" },
                lifeEvents: VALID_LIFE_EVENTS.map((e, i) => i === 0 ? { ...e, description: "Vulnerable <img src=x onerror=alert(1)>" } : e),
                offsetConfig: VALID_OFFSET_CONFIG,
            };

            const res = await request(app).post('/api/calculate').send(xssPayload);
            expect([200, 201]).toContain(res.status);

            // Verify sanitization in encryption calls
            const { encryptData } = await import('../../lib/encryption/index.js');
            const encryptCalls = vi.mocked(encryptData).mock.calls;
            const fullNameCall = encryptCalls.find(call => call[0] === "John  Doe");
            expect(fullNameCall).toBeDefined();
        });
    });

    // ═════ Successful Submission ═════

    describe('Successful Submission', () => {
        it('should accept valid request and return sessionId', async () => {
            const res = await request(app).post('/api/calculate').send({
                birthData: VALID_BIRTH_DATA,
                lifeEvents: VALID_LIFE_EVENTS,
                offsetConfig: VALID_OFFSET_CONFIG,
            });

            expect([200, 201]).toContain(res.status);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('sessionId');
            expect(res.body.data).toHaveProperty('status', 'queued');
        }, 10000);
    });

    // ═════ Queue Failure ═════

    describe('Queue Failure', () => {
        it('should return 503 when queue is full', async () => {
            const { addToQueue } = await import('../../lib/queue-manager.js');
            vi.mocked(addToQueue).mockResolvedValueOnce({ success: false, error: 'Queue full' } as any);

            const res = await request(app).post('/api/calculate').send({
                birthData: VALID_BIRTH_DATA,
                lifeEvents: VALID_LIFE_EVENTS,
                offsetConfig: VALID_OFFSET_CONFIG,
            });

            expect(res.status).toBe(503);
            expect(res.body.success).toBe(false);
        });
    });
});
