import { describe, it, expect, vi } from 'vitest';
import { stage3RefinementGrid } from '../stage3-refinement-grid.js';
import { stage5MicroGrid } from '../stage5-micro-grid.js';

const mockProgress = {
    startStep: vi.fn().mockResolvedValue(undefined),
    completeStep: vi.fn().mockResolvedValue(undefined),
};

describe('Adaptive Grid Focus', () => {
    it('Stage 3 should prioritize adaptive top-K survivors and exclude far outlier at 30m offset mode', async () => {
        const input = {
            offsetConfig: { preset: '30min' },
        };
        const survivors = [
            { time: '18:00:00', offsetMinutes: 40, offsetDescription: '+40m' }, // should be excluded
            { time: '12:00:00', offsetMinutes: 0, offsetDescription: 'exact' },
            { time: '12:10:00', offsetMinutes: 10, offsetDescription: '+10m' },
            { time: '11:50:00', offsetMinutes: -10, offsetDescription: '-10m' },
            { time: '12:05:00', offsetMinutes: 5, offsetDescription: '+5m' },
            { time: '11:55:00', offsetMinutes: -5, offsetDescription: '-5m' },
            { time: '12:15:00', offsetMinutes: 15, offsetDescription: '+15m' },
            { time: '11:45:00', offsetMinutes: -15, offsetDescription: '-15m' },
        ];

        const result = await stage3RefinementGrid(input as any, survivors as any, mockProgress as any);
        expect(result.candidates.length).toBeGreaterThan(0);
        expect(result.candidates.some(c => c.time === '18:00:00')).toBe(false);
    });

    it('Stage 5 should use adaptive micro focus and skip farthest survivor for tight offsets', async () => {
        const input = {
            offsetConfig: { preset: '30min' },
        };
        const survivors = [
            { time: '12:00:00', offsetMinutes: 0, offsetDescription: 'exact' },
            { time: '12:01:00', offsetMinutes: 1, offsetDescription: '+1m' },
            { time: '11:59:00', offsetMinutes: -1, offsetDescription: '-1m' },
            { time: '12:02:00', offsetMinutes: 2, offsetDescription: '+2m' },
            { time: '11:58:00', offsetMinutes: -2, offsetDescription: '-2m' },
            { time: '17:00:00', offsetMinutes: 300, offsetDescription: '+300m' }, // should be excluded
        ];

        const result = await stage5MicroGrid(input as any, survivors as any, mockProgress as any);
        expect(result.candidates.length).toBeGreaterThan(0);
        expect(result.candidates.some(c => c.time === '17:00:00')).toBe(false);
    });
});
