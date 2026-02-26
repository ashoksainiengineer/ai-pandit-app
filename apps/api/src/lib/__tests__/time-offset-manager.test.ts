import { describe, it, expect } from 'vitest';
import {
    getDynamicBatchSize,
    getDynamicSurvivors,
    getAdaptiveInterval,
    getExpectedCandidateCount,
    generateCandidateTimes,
    splitIntoBatches,
    injectSafetyNetCandidates,
    generateRefinementGrid,
    validateOffsetConfig,
    MAX_BATCH_SIZE
} from '../time-offset-manager';

describe('Time Offset Manager (BTR Candidate Generation)', () => {

    describe('Dynamic Batch & Survivor Logic', () => {
        it('should return correct dynamic batch size based on offset minutes', () => {
            expect(getDynamicBatchSize(100, 10)).toBe(5); // <= 15m
            expect(getDynamicBatchSize(100, 25)).toBe(6); // <= 30m
            expect(getDynamicBatchSize(100, 50)).toBe(7); // <= 60m
            expect(getDynamicBatchSize(100, 100)).toBe(8); // <= 120m
            expect(getDynamicBatchSize(100, 200)).toBe(9); // <= 360m
            expect(getDynamicBatchSize(100, 400)).toBe(10); // > 360m
        });

        it('should calculate dynamic survivor counts correctly', () => {
            const batchSize = 10;
            // Gear 1: <= 15m (~25%)
            expect(getDynamicSurvivors(batchSize, 10)).toBe(3); // ceil(10 * 0.25)
            // Gear 2: <= 30m (~30%)
            expect(getDynamicSurvivors(batchSize, 20)).toBe(3); // ceil(10 * 0.30)
            // Gear 3: <= 120m (~40%)
            expect(getDynamicSurvivors(batchSize, 60)).toBe(4); // ceil(10 * 0.40)
            // Gear 4: <= 360m (~50%)
            expect(getDynamicSurvivors(batchSize, 200)).toBe(5); // ceil(10 * 0.50)
            // Gear 5: > 360m (~60%)
            expect(getDynamicSurvivors(batchSize, 400)).toBe(6); // ceil(10 * 0.60)
        });

        it('should add elasticity safety net for round 1 survivors', () => {
            const batchSize = 10;
            const standardSurvivors = getDynamicSurvivors(batchSize, 60, false);
            const r1Survivors = getDynamicSurvivors(batchSize, 60, true);
            expect(r1Survivors).toBeGreaterThan(standardSurvivors);
        });
    });

    describe('Interval & Candidate Count Calculations', () => {
        it('should compute adaptive interval based on offset size', () => {
            expect(getAdaptiveInterval(5)).toBe(0.25); // 15 sec
            expect(getAdaptiveInterval(15)).toBe(0.5); // 30 sec
            expect(getAdaptiveInterval(30)).toBe(1); // 1 min
            expect(getAdaptiveInterval(120)).toBe(1.5); // 90 sec
            expect(getAdaptiveInterval(240)).toBe(3); // 3 min
            expect(getAdaptiveInterval(360)).toBe(4); // 4 min
            expect(getAdaptiveInterval(720)).toBe(5); // 5 min
        });

        it('should estimate candidate count correctly', () => {
            // For 30m offset, interval is 1m. Total range = 60m. 60 / 1 + 1 = 61
            const count = getExpectedCandidateCount(30);
            expect(count).toBe(61);
        });
    });

    describe('generateCandidateTimes', () => {
        it('should generate properly ordered candidates for custom minutes', () => {
            const candidates = generateCandidateTimes('12:00:00', { customMinutes: 30, description: 'test' });
            expect(candidates.length).toBe(61);
            expect(candidates[0].offsetMinutes).toBe(-30);
            expect(candidates[candidates.length - 1].offsetMinutes).toBe(30);

            // Should contain center tentative point
            const center = candidates.find(c => c.offsetMinutes === 0);
            expect(center).toBeDefined();
            expect(center?.time).toBe('12:00:00');
        });

        it('should handle presets correctly', () => {
            const candidates = generateCandidateTimes('10:00:00', { preset: '1hour', description: 'test' });
            // interval for 60m is 1.5. Range is 120m. 120 / 1.5 + 1 = 81
            expect(candidates.length).toBe(81);
            expect(candidates[0].offsetMinutes).toBe(-60);
        });

        it('should wrap around days properly when offset goes past midnight', () => {
            const candidates = generateCandidateTimes('00:15:00', { customMinutes: 30, description: 'test' });
            const earliest = candidates[0];
            expect(earliest.offsetMinutes).toBe(-30);
            expect(earliest.time).toBe('23:45:00');
            expect(earliest.offsetDescription).toContain('Previous day');

            const candidatesLate = generateCandidateTimes('23:45:00', { customMinutes: 30, description: 'test' });
            const latest = candidatesLate[candidatesLate.length - 1];
            expect(latest.offsetMinutes).toBe(30);
            expect(latest.time).toBe('00:15:00');
            expect(latest.offsetDescription).toContain('Next day');
        });
    });

    describe('splitIntoBatches', () => {
        it('should randomize and split into chunks of max batch size', () => {
            const candidates = Array.from({ length: 25 }, (_, i) => ({ time: `12:${i}:00` }));
            const batches = splitIntoBatches(candidates, 10);
            expect(batches.length).toBe(3);
            expect(batches[0].length).toBe(10);
            expect(batches[1].length).toBe(10);
            expect(batches[2].length).toBe(5);
        });
    });

    describe('injectSafetyNetCandidates', () => {
        it('should ensure critical tentative times are included and deduplicated', () => {
            const baseCandidates = [
                { time: '12:00:00', offsetMinutes: 0, offsetDescription: '' },
                { time: '12:05:00', offsetMinutes: 5, offsetDescription: '' }
            ];
            const combined = injectSafetyNetCandidates('12:00:00', baseCandidates);
            const times = combined.map(c => c.time);

            // Base 0 and +5 were there.
            // Safety net adds: 0, -1, +1, -2, +2, -5, +5
            // Deduped count = 7 safety net items (-5, -2, -1, 0, 1, 2, 5)
            expect(combined.length).toBe(7);
            expect(times).toContain('12:00:00');
            expect(times).toContain('11:55:00'); // -5
            expect(times).toContain('12:01:00'); // +1
        });
    });

    describe('generateRefinementGrid', () => {
        it('should generate sub-minute offset grids accurately', () => {
            const grid = generateRefinementGrid('12:00:00', 1, 15); // +/- 1 min (2 mins total = 120s), 15s steps
            // 120 / 15 + 1 = 9 items
            expect(grid.length).toBe(9);
            expect(grid[0].offsetMinutes).toBe(-1); // -60s
            expect(grid[grid.length - 1].offsetMinutes).toBe(1); // +60s
        });
    });

    describe('validateOffsetConfig', () => {
        it('should enforce offset configuration bounds', () => {
            expect(validateOffsetConfig({} as any).valid).toBe(false);
            expect(validateOffsetConfig({ customMinutes: 0, description: 'test' }).valid).toBe(false);
            expect(validateOffsetConfig({ customMinutes: 1000, description: 'test' }).valid).toBe(false); // > 720

            const warnCheck = validateOffsetConfig({ customMinutes: 400, description: 'test' });
            expect(warnCheck.valid).toBe(true);
            expect(warnCheck.warning).toBeDefined();

            expect(validateOffsetConfig({ preset: '12hours', description: 'test' }).valid).toBe(true);
        });
    });

});
