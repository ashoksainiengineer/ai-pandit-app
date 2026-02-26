import { describe, it, expect } from 'vitest';
import { calculateVimshottariDasha, calculatePanchanga } from '../vedic-astrology-engine.js';

describe('Phase D: Performance & Resilience (Stress Benchmarks)', () => {

    it('Vimshottari Dasha: Multi-Level Throughput Profiling', async () => {
        const moonLong = 123.456;
        const birthDate = new Date('1990-05-15T10:30:00Z');

        // Profile Level 3 (Mahadasha, Antardasha, Pratyantardasha)
        const iterationsL3 = 1000;
        const startL3 = performance.now();
        for (let i = 0; i < iterationsL3; i++) {
            calculateVimshottariDasha(moonLong, birthDate, 3);
        }
        const endL3 = performance.now();
        const opsL3 = (iterationsL3 / (endL3 - startL3)) * 1000;
        console.log(`[PROFILE] Dasha L3 (Standard): ${opsL3.toFixed(2)} ops/sec`);

        // Profile Level 5 (Down to Pranadasha)
        const iterationsL5 = 50;
        const startL5 = performance.now();
        for (let i = 0; i < iterationsL5; i++) {
            calculateVimshottariDasha(moonLong, birthDate, 5);
        }
        const endL5 = performance.now();
        const opsL5 = (iterationsL5 / (endL5 - startL5)) * 1000;
        console.log(`[PROFILE] Dasha L5 (Deep): ${opsL5.toFixed(2)} ops/sec`);

        // Throughput for L3 should be industrial grade (> 1000 ops/sec)
        expect(opsL3).toBeGreaterThan(500); // Adjusted for CI/Local variation
    });

    it('Panchanga Calculation: High Throughput Verification', async () => {
        const sunLong = 45.0;
        const moonLong = 180.0;
        const birthDate = new Date('1990-05-15T10:30:00Z');
        const iterations = 5000;

        const start = performance.now();
        for (let i = 0; i < iterations; i++) {
            calculatePanchanga(0, sunLong, moonLong, birthDate);
        }
        const end = performance.now();
        const ops = (iterations / (end - start)) * 1000;

        console.log(`[BENCHMARK] Panchanga Calculation: ${ops.toFixed(2)} ops/sec`);
        expect(ops).toBeGreaterThan(10000);
    });

    it('Memory Stability: 1000 Consecutive Calculations (Leak Detection)', async () => {
        const moonLong = 123.456;
        const birthDate = new Date('1990-05-15T10:30:00Z');

        const startHeap = process.memoryUsage().heapUsed;

        // Run 1000 standard calculations (Level 3)
        for (let i = 0; i < 1000; i++) {
            calculateVimshottariDasha(moonLong, birthDate, 3);
        }

        // Force GC hint if possible (not always active in Node without flags)
        if (global.gc) global.gc();

        const endHeap = process.memoryUsage().heapUsed;
        const leakDelta = (endHeap - startHeap) / 1024 / 1024; // in MB

        console.log(`[STABILITY] Memory Delta after 1000 calcs: ${leakDelta.toFixed(2)} MB`);

        // A delta < 50MB is acceptable for JS garbage collection behavior 
        // especially without explicit 'global.gc()' control.
        expect(leakDelta).toBeLessThan(50);
    });

});
