import { describe, it, expect, beforeEach } from 'vitest';
import {
    recordRequestSample,
    getSloSnapshot,
    getSloAlerts,
    __resetSloSamplesForTests,
} from './slo-monitor.js';

describe('slo-monitor', () => {
    beforeEach(() => {
        __resetSloSamplesForTests();
    });

    describe('recordRequestSample', () => {
        it('records a sample', () => {
            recordRequestSample({ ts: Date.now(), durationMs: 100, statusCode: 200, method: 'GET', path: '/health' });
            const snapshot = getSloSnapshot();
            expect(snapshot.sampleSize).toBe(1);
        });

        it('caps samples at MAX_SAMPLES', () => {
            for (let i = 0; i < 5010; i++) {
                recordRequestSample({ ts: Date.now(), durationMs: 10, statusCode: 200, method: 'GET', path: '/' });
            }
            const snapshot = getSloSnapshot();
            expect(snapshot.sampleSize).toBeLessThanOrEqual(5000);
        });
    });

    describe('getSloSnapshot', () => {
        it('returns zero values when no samples', () => {
            const snapshot = getSloSnapshot();
            expect(snapshot.sampleSize).toBe(0);
            expect(snapshot.errorCount).toBe(0);
            expect(snapshot.errorRatePercent).toBe(0);
            expect(snapshot.latency.p50).toBe(0);
            expect(snapshot.latency.p95).toBe(0);
            expect(snapshot.latency.p99).toBe(0);
            expect(snapshot.latency.max).toBe(0);
        });

        it('calculates latency percentiles correctly', () => {
            const now = Date.now();
            for (let i = 1; i <= 100; i++) {
                recordRequestSample({ ts: now, durationMs: i * 10, statusCode: 200, method: 'GET', path: '/' });
            }
            const snapshot = getSloSnapshot();
            expect(snapshot.sampleSize).toBe(100);
            expect(snapshot.latency.p50).toBe(500);
            expect(snapshot.latency.p95).toBe(950);
            expect(snapshot.latency.p99).toBe(990);
            expect(snapshot.latency.max).toBe(1000);
        });

        it('calculates error rate from 5xx status codes', () => {
            const now = Date.now();
            for (let i = 0; i < 8; i++) {
                recordRequestSample({ ts: now, durationMs: 50, statusCode: 200, method: 'GET', path: '/' });
            }
            for (let i = 0; i < 2; i++) {
                recordRequestSample({ ts: now, durationMs: 50, statusCode: 500, method: 'GET', path: '/' });
            }
            const snapshot = getSloSnapshot();
            expect(snapshot.errorCount).toBe(2);
            expect(snapshot.errorRatePercent).toBe(20);
        });

        it('respects windowMs parameter', () => {
            const now = Date.now();
            recordRequestSample({ ts: now - 10 * 60 * 1000, durationMs: 100, statusCode: 200, method: 'GET', path: '/' });
            recordRequestSample({ ts: now, durationMs: 200, statusCode: 200, method: 'GET', path: '/' });
            const snapshot = getSloSnapshot(5 * 60 * 1000);
            expect(snapshot.sampleSize).toBe(1);
            expect(snapshot.latency.p50).toBe(200);
        });
    });

    describe('getSloAlerts', () => {
        it('returns empty when sample size below min', () => {
            recordRequestSample({ ts: Date.now(), durationMs: 100, statusCode: 500, method: 'GET', path: '/' });
            const alerts = getSloAlerts({ windowMs: 60000, minSampleSize: 5, errorRateAlertPercent: 1, p95LatencyAlertMs: 1000 });
            expect(alerts).toEqual([]);
        });

        it('triggers error rate alert', () => {
            const now = Date.now();
            for (let i = 0; i < 5; i++) {
                recordRequestSample({ ts: now, durationMs: 50, statusCode: 500, method: 'GET', path: '/' });
            }
            const alerts = getSloAlerts({ windowMs: 60000, minSampleSize: 1, errorRateAlertPercent: 50, p95LatencyAlertMs: 1000 });
            expect(alerts.length).toBe(1);
            expect(alerts[0].code).toBe('SLO_ERROR_RATE_ALERT');
            expect(alerts[0].severity).toBe('critical');
        });

        it('triggers p95 latency alert', () => {
            const now = Date.now();
            for (let i = 0; i < 10; i++) {
                recordRequestSample({ ts: now, durationMs: 2000, statusCode: 200, method: 'GET', path: '/' });
            }
            const alerts = getSloAlerts({ windowMs: 60000, minSampleSize: 1, errorRateAlertPercent: 100, p95LatencyAlertMs: 1000 });
            expect(alerts.length).toBe(1);
            expect(alerts[0].code).toBe('SLO_P95_LATENCY_ALERT');
            expect(alerts[0].severity).toBe('warning');
        });
    });
});
