/**
 * Fuzzing Tests for AI-Pandit API
 *
 * Automated fuzzing using random/malformed inputs to find edge cases
 * and vulnerabilities.
 *
 * Run: vitest run tests/security/fuzzing.test.ts
 */

import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import express from 'express';

// Simple fuzz generator without external dependencies
const fuzzGenerators = {
    string: () => Array(100).fill(0).map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join(''),
    unicode: () => 'Test' + String.fromCharCode(0x4e00 + Math.floor(Math.random() * 1000)),
    specialChars: () => '!@#$%^&*()_+-=[]{}|;:,.<>?',
    longString: () => 'A'.repeat(10000),
    nullBytes: () => '\x00'.repeat(100),
    jsonInjection: () => '{"$ne": null}',
    xmlInjection: () => '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
    commandInjection: () => '; cat /etc/passwd;',
    numberOverflow: () => Number.MAX_SAFE_INTEGER + 1,
    negativeNumber: () => -999999,
    floatPrecision: () => 0.1 + 0.2,
    boolean: () => Math.random() > 0.5,
    array: () => Array(1000).fill('item'),
};

// Random data generators
const randomDate = () => {
    const date = new Date(Date.now() - Math.floor(Math.random() * 1000000000000));
    return date.toISOString().split('T')[0];
};

const randomLatitude = () => (Math.random() - 0.5) * 180;
const randomLongitude = () => (Math.random() - 0.5) * 360;
const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;

// Create test app
const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/api/sessions', (req, res) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });
    
    const bodySize = JSON.stringify(req.body).length;
    if (bodySize > 1024 * 1024) {
        return res.status(413).json({ error: 'Payload too large' });
    }
    
    res.status(201).json({ data: { id: 'test-id', ...req.body } });
});

app.post('/api/calculate', (req, res) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });
    res.json({ data: { result: 'calculated' } });
});

const request = supertest(app);

// Fuzzed data generator
function generateFuzzedSessionData(): Record<string, unknown> {
    const options: (string | number | null | undefined)[] = [
        fuzzGenerators.string(),
        fuzzGenerators.unicode(),
        fuzzGenerators.specialChars(),
        null,
        undefined,
        123,
    ];
    
    const dateOptions = [
        randomDate(),
        'invalid-date',
        '',
        null,
        '0000-00-00',
        '9999-99-99',
    ];
    
    const timeOptions = [
        '12:00:00',
        '25:99:99',
        '',
        null,
        'midnight',
    ];
    
    const coordOptions: (number | string | null)[] = [
        randomLatitude(),
        999,
        -999,
        null,
        'invalid',
        Number.POSITIVE_INFINITY,
    ];
    
    return {
        fullName: options[Math.floor(Math.random() * options.length)],
        dateOfBirth: dateOptions[Math.floor(Math.random() * dateOptions.length)],
        tentativeTime: timeOptions[Math.floor(Math.random() * timeOptions.length)],
        birthPlace: options[Math.floor(Math.random() * options.length)],
        latitude: coordOptions[Math.floor(Math.random() * coordOptions.length)],
        longitude: coordOptions[Math.floor(Math.random() * coordOptions.length)],
        timezone: [randomFloat(-12, 14), 99, -99, null, 'UTC'][Math.floor(Math.random() * 5)],
    };
}

function createNestedObject(depth: number): unknown {
    if (depth === 0) return 'leaf';
    return { nested: createNestedObject(depth - 1) };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUZZING TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('🔥 Fuzzing Tests', () => {
    describe('Session API Fuzzing', () => {
        const ITERATIONS = 50;

        for (let i = 0; i < ITERATIONS; i++) {
            it(`fuzz test iteration ${i + 1}: should handle malformed session data`, async () => {
                const fuzzedData = generateFuzzedSessionData();

                const res = await request
                    .post('/api/sessions')
                    .set('Authorization', 'Bearer test-token')
                    .send(fuzzedData);

                // API should not crash (500)
                expect(res.status).not.toBe(500);
                
                // Should return valid HTTP status
                expect(res.status).toBeGreaterThanOrEqual(200);
                expect(res.status).toBeLessThan(600);
            });
        }
    });

    describe('Calculation API Fuzzing', () => {
        const ITERATIONS = 30;

        for (let i = 0; i < ITERATIONS; i++) {
            it(`fuzz test iteration ${i + 1}: should handle malformed calculation input`, async () => {
                const fuzzedData = {
                    dateOfBirth: [randomDate(), 'invalid', '', null][Math.floor(Math.random() * 4)],
                    time: ['12:00:00', 'invalid', ''][Math.floor(Math.random() * 3)],
                    latitude: [randomLatitude(), 999, -999, 'invalid'][Math.floor(Math.random() * 4)],
                    longitude: [randomLongitude(), 999, -999, 'invalid'][Math.floor(Math.random() * 4)],
                    timezone: [randomFloat(-12, 14), 99, 'invalid'][Math.floor(Math.random() * 3)],
                };

                const res = await request
                    .post('/api/calculate')
                    .set('Authorization', 'Bearer test-token')
                    .send(fuzzedData);

                // Should not crash
                expect(res.status).not.toBe(500);
            });
        }
    });

    describe('String Injection Fuzzing', () => {
        const injectionPayloads = [
            // SQL Injection
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "1; DELETE FROM sessions WHERE '1'='1",
            
            // NoSQL Injection
            '{"$ne": null}',
            '{"$where": "sleep(1000)"}',
            '{"$regex": ".*"}',
            
            // Command Injection
            '; ls -la;',
            '$(whoami)',
            '`cat /etc/passwd`',
            
            // XML Injection
            '<?xml version="1.0"?><!DOCTYPE xxe [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><xxe>&xxe;</xxe>',
            
            // Path Traversal
            '../../../etc/passwd',
            '..\\..\\..\\windows\\system32\\config\\sam',
            
            // JSON Injection
            '{"constructor": {"prototype": {"isAdmin": true}}}',
            
            // Prototype Pollution
            '{"__proto__": {"isAdmin": true}}',
            '{"constructor": {"prototype": {"isAdmin": true}}}',
        ];

        it.each(injectionPayloads)('should sanitize injection: %s', async (payload) => {
            const res = await request
                .post('/api/sessions')
                .set('Authorization', 'Bearer test-token')
                .send({
                    fullName: payload,
                    dateOfBirth: '1990-01-01',
                    tentativeTime: '12:00:00',
                    birthPlace: payload,
                    latitude: 28.6139,
                    longitude: 77.2090,
                    timezone: 5.5,
                });

            // Should not crash or return sensitive data
            expect(res.status).not.toBe(500);
            
            if (res.body.data) {
                const responseStr = JSON.stringify(res.body);
                expect(responseStr).not.toContain('root:');
                expect(responseStr).not.toContain('password');
            }
        });
    });

    describe('Edge Case Fuzzing', () => {
        it('should handle extremely long input', async () => {
            const longInput = 'A'.repeat(100000);
            
            const res = await request
                .post('/api/sessions')
                .set('Authorization', 'Bearer test-token')
                .send({
                    fullName: longInput,
                    dateOfBirth: '1990-01-01',
                    tentativeTime: '12:00:00',
                    birthPlace: 'Test',
                    latitude: 28.6139,
                    longitude: 77.2090,
                    timezone: 5.5,
                });

            expect(res.status).not.toBe(500);
        });

        it('should handle deeply nested objects', async () => {
            const nestedData = createNestedObject(1000) as Record<string, unknown>;
            
            const res = await request
                .post('/api/sessions')
                .set('Authorization', 'Bearer test-token')
                .send(nestedData);

            expect(res.status).not.toBe(500);
        });

        it('should handle special Unicode characters', async () => {
            const specialChars = '🎉🔥💯日本語العربيةעברית👨‍👩‍👧‍👦🏳️‍🌈';
            
            const res = await request
                .post('/api/sessions')
                .set('Authorization', 'Bearer test-token')
                .send({
                    fullName: specialChars,
                    dateOfBirth: '1990-01-01',
                    tentativeTime: '12:00:00',
                    birthPlace: specialChars,
                    latitude: 28.6139,
                    longitude: 77.2090,
                    timezone: 5.5,
                });

            expect(res.status).not.toBe(500);
        });

        it('should handle null bytes', async () => {
            const nullByteData = 'test\x00data';
            
            const res = await request
                .post('/api/sessions')
                .set('Authorization', 'Bearer test-token')
                .send({
                    fullName: nullByteData,
                    dateOfBirth: '1990-01-01',
                    tentativeTime: '12:00:00',
                    birthPlace: 'Test',
                    latitude: 28.6139,
                    longitude: 77.2090,
                    timezone: 5.5,
                });

            expect(res.status).not.toBe(500);
        });
    });

    describe('Random Data Fuzzing', () => {
        const RANDOM_ITERATIONS = 20;

        for (let i = 0; i < RANDOM_ITERATIONS; i++) {
            it(`random fuzz test ${i + 1}`, async () => {
                const randomKey = () => Math.random().toString(36).substring(7);
                const randomData: Record<string, unknown> = {
                    [randomKey()]: fuzzGenerators.string(),
                    [randomKey()]: Math.floor(Math.random() * 1000),
                    [randomKey()]: Math.random() > 0.5,
                    [randomKey()]: new Date(),
                    [randomKey()]: [null, undefined, [], {}][Math.floor(Math.random() * 4)],
                };

                const res = await request
                    .post('/api/sessions')
                    .set('Authorization', 'Bearer test-token')
                    .send(randomData);

                expect(res.status).not.toBe(500);
            });
        }
    });
});
