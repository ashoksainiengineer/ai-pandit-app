/**
 * Performance Benchmark Tests
 *
 * Industry-standard performance benchmarks for critical operations.
 * Uses Vitest bench for consistent performance testing.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { calculateEphemeris, initEphemerisProvider } from '../ephemeris.js';
import { buildCandidateDataPackage } from '../btr/data-package-builder.js';
import { createBirthInput, TEST_TIMEOUTS, KNOWN_BIRTH_CHARTS } from './test-utils.js';

describe('Performance Benchmarks', () => {
  
  beforeAll(async () => {
    await initEphemerisProvider();
  }, TEST_TIMEOUTS.INTEGRATION);

  describe('Ephemeris Calculation Performance', () => {
    describe('Given standard birth chart calculation', () => {
      it('Then should complete within acceptable time', async () => {
        const start = performance.now();
        
        await calculateEphemeris(
          KNOWN_BIRTH_CHARTS.delhiNoon.dateOfBirth,
          KNOWN_BIRTH_CHARTS.delhiNoon.time,
          KNOWN_BIRTH_CHARTS.delhiNoon.latitude,
          KNOWN_BIRTH_CHARTS.delhiNoon.longitude,
          KNOWN_BIRTH_CHARTS.delhiNoon.timezone
        );
        
        const duration = performance.now() - start;
        
        // Single ephemeris calculation should complete within 2 seconds
        expect(duration).toBeLessThan(2000);
      }, TEST_TIMEOUTS.INTEGRATION);
    });

    describe('Given multiple sequential calculations', () => {
      it('Then average time should be consistent', async () => {
        const iterations = 5;
        const times: number[] = [];
        
        for (let i = 0; i < iterations; i++) {
          const start = performance.now();
          await calculateEphemeris(
            KNOWN_BIRTH_CHARTS.delhiNoon.dateOfBirth,
            KNOWN_BIRTH_CHARTS.delhiNoon.time,
            KNOWN_BIRTH_CHARTS.delhiNoon.latitude,
            KNOWN_BIRTH_CHARTS.delhiNoon.longitude,
            KNOWN_BIRTH_CHARTS.delhiNoon.timezone
          );
          times.push(performance.now() - start);
        }
        
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const max = Math.max(...times);
        
        // Average should be under 2 seconds, max under 5 seconds
        expect(avg).toBeLessThan(2000);
        expect(max).toBeLessThan(5000);
      }, TEST_TIMEOUTS.PERFORMANCE);
    });
  });

  describe('Data Package Builder Performance', () => {
    describe('Given standard data package build', () => {
      it('Then should complete within acceptable time', async () => {
        const input = createBirthInput();
        const time = '12:00:00';
        
        const start = performance.now();
        await buildCandidateDataPackage(time, 0, input);
        const duration = performance.now() - start;
        
        // Data package build should complete within 5 seconds
        expect(duration).toBeLessThan(5000);
      }, TEST_TIMEOUTS.INTEGRATION);
    });

    describe('Given multiple data package builds', () => {
      it('Then batch processing should be efficient', async () => {
        const input = createBirthInput();
        const times = ['11:30:00', '12:00:00', '12:30:00'];
        
        const start = performance.now();
        
        for (const time of times) {
          await buildCandidateDataPackage(time, 0, input);
        }
        
        const totalDuration = performance.now() - start;
        
        // 3 sequential builds should complete within 15 seconds
        expect(totalDuration).toBeLessThan(15000);
      }, TEST_TIMEOUTS.PERFORMANCE);
    });
  });

  describe('Memory Usage Patterns', () => {
    describe('Given large candidate generation', () => {
      it('Then memory should not grow unbounded', async () => {
        const input = createBirthInput();
        const initialMemory = process.memoryUsage().heapUsed;
        
        // Build 10 data packages
        for (let i = 0; i < 10; i++) {
          await buildCandidateDataPackage(`12:${String(i * 5).padStart(2, '0')}:00`, 0, input);
        }
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
        
        const finalMemory = process.memoryUsage().heapUsed;
        const growth = (finalMemory - initialMemory) / 1024 / 1024; // MB
        
        // Memory growth should be under 100MB for 10 packages
        expect(growth).toBeLessThan(100);
      }, TEST_TIMEOUTS.PERFORMANCE);
    });
  });
});

/**
 * Baseline Performance Metrics
 * 
 * These values represent the expected performance characteristics:
 * 
 * | Operation | Target | Max Acceptable |
 * |-----------|--------|----------------|
 * | Single ephemeris | 500ms | 2000ms |
 * | Data package | 1000ms | 5000ms |
 * | Memory growth (10 ops) | 50MB | 100MB |
 * | Sequential batch (3) | 3000ms | 15000ms |
 */
