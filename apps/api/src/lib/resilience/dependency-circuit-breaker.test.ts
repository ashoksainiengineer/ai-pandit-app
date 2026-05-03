import { describe, it, expect, beforeEach } from 'vitest';
import {
    recordDependencyFailure,
    recordDependencySuccess,
    recordGlobalProcessingSuccess,
    getCircuitSnapshots,
    getBlockingCircuitBreakers,
    resetAllCircuitBreakersForTests,
    type CircuitDependency,
} from './dependency-circuit-breaker.js';

describe('dependency-circuit-breaker', () => {
    beforeEach(() => {
        resetAllCircuitBreakersForTests();
    });

    describe('recordDependencyFailure', () => {
        it('increments consecutive failures', () => {
            recordDependencyFailure('ai_provider');
            const snapshot = getCircuitSnapshots().find(s => s.dependency === 'ai_provider');
            expect(snapshot!.consecutiveFailures).toBe(1);
            expect(snapshot!.isOpen).toBe(false);
        });

        it('opens circuit after threshold exceeded', () => {
            for (let i = 0; i < 5; i++) {
                recordDependencyFailure('ai_provider');
            }
            const snapshot = getCircuitSnapshots().find(s => s.dependency === 'ai_provider');
            expect(snapshot!.isOpen).toBe(true);
            expect(snapshot!.remainingMs).toBeGreaterThan(0);
        });
    });

    describe('recordDependencySuccess', () => {
        it('resets failures to zero', () => {
            recordDependencyFailure('database');
            recordDependencyFailure('database');
            recordDependencySuccess('database');
            const snapshot = getCircuitSnapshots().find(s => s.dependency === 'database');
            expect(snapshot!.consecutiveFailures).toBe(0);
            expect(snapshot!.isOpen).toBe(false);
        });
    });

    describe('recordGlobalProcessingSuccess', () => {
        it('resets all circuits', () => {
            recordDependencyFailure('ai_provider');
            recordDependencyFailure('database');
            recordGlobalProcessingSuccess();
            const snapshots = getCircuitSnapshots();
            for (const snap of snapshots) {
                expect(snap.consecutiveFailures).toBe(0);
                expect(snap.isOpen).toBe(false);
            }
        });
    });

    describe('getCircuitSnapshots', () => {
        it('returns snapshots for all dependencies', () => {
            const snapshots = getCircuitSnapshots();
            expect(snapshots.length).toBe(4);
            const deps = snapshots.map(s => s.dependency);
            expect(deps).toContain('ai_provider');
            expect(deps).toContain('database');
            expect(deps).toContain('network');
            expect(deps).toContain('processing');
        });
    });

    describe('getBlockingCircuitBreakers', () => {
        it('returns only ai_provider and database when open', () => {
            for (let i = 0; i < 5; i++) recordDependencyFailure('ai_provider');
            for (let i = 0; i < 5; i++) recordDependencyFailure('database');
            for (let i = 0; i < 6; i++) recordDependencyFailure('network');

            const blocking = getBlockingCircuitBreakers();
            const deps = blocking.map(s => s.dependency);
            expect(deps).toContain('ai_provider');
            expect(deps).toContain('database');
            expect(deps).not.toContain('network');
            expect(deps).not.toContain('processing');
        });

        it('returns empty array when no circuits are open', () => {
            expect(getBlockingCircuitBreakers()).toEqual([]);
        });
    });
});
