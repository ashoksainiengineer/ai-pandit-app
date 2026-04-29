import { describe, it, expect, vi } from 'vitest';
import { stage3RefinementGrid } from '../stage3-refinement-grid.js';
import { stage5MicroGrid } from '../stage5-micro-grid.js';

type Stage3Input = Parameters<typeof stage3RefinementGrid>[0];
type Stage3Candidates = Parameters<typeof stage3RefinementGrid>[1];
type Stage3Progress = Parameters<typeof stage3RefinementGrid>[2];
type Stage5Input = Parameters<typeof stage5MicroGrid>[0];
type Stage5Candidates = Parameters<typeof stage5MicroGrid>[1];
type Stage5Progress = Parameters<typeof stage5MicroGrid>[2];

const mockProgress = {
    startStep: vi.fn().mockResolvedValue(undefined),
    completeStep: vi.fn().mockResolvedValue(undefined),
};

describe('Adaptive Grid Focus', () => {
    it('Stage 3 should prioritize adaptive top-K survivors and exclude far outlier at 30m offset mode', async () => {
        const input: Stage3Input = {
            offsetConfig: { preset: '30min' },
        } as Stage3Input;
        const survivors: Stage3Candidates = [
            { time: '18:00:00', offsetMinutes: 40, offsetDescription: '+40m' }, // should be excluded
            { time: '12:00:00', offsetMinutes: 0, offsetDescription: 'exact' },
            { time: '12:10:00', offsetMinutes: 10, offsetDescription: '+10m' },
            { time: '11:50:00', offsetMinutes: -10, offsetDescription: '-10m' },
            { time: '12:05:00', offsetMinutes: 5, offsetDescription: '+5m' },
            { time: '11:55:00', offsetMinutes: -5, offsetDescription: '-5m' },
            { time: '12:15:00', offsetMinutes: 15, offsetDescription: '+15m' },
            { time: '11:45:00', offsetMinutes: -15, offsetDescription: '-15m' },
        ];

        const result = await stage3RefinementGrid(input, survivors, mockProgress as unknown as Stage3Progress);
        expect(result.candidates.length).toBeGreaterThan(0);
        expect(result.candidates.some(c => c.time === '18:00:00')).toBe(false);
    });

    it('Stage 5 should use adaptive micro focus and skip farthest survivor for tight offsets', async () => {
        const input: Stage5Input = {
            offsetConfig: { preset: '30min' },
        } as Stage5Input;
        const survivors: Stage5Candidates = [
            { time: '12:00:00', offsetMinutes: 0, offsetDescription: 'exact' },
            { time: '12:01:00', offsetMinutes: 1, offsetDescription: '+1m' },
            { time: '11:59:00', offsetMinutes: -1, offsetDescription: '-1m' },
            { time: '12:02:00', offsetMinutes: 2, offsetDescription: '+2m' },
            { time: '11:58:00', offsetMinutes: -2, offsetDescription: '-2m' },
            { time: '17:00:00', offsetMinutes: 300, offsetDescription: '+300m' }, // should be excluded
        ];

        const result = await stage5MicroGrid(input, survivors, mockProgress as unknown as Stage5Progress);
        expect(result.candidates.length).toBeGreaterThan(0);
        expect(result.candidates.some(c => c.time === '17:00:00')).toBe(false);
    });

    it('Stage 3 should keep far-but-higher-provenance survivor in adaptive focus set', async () => {
        const input: Stage3Input = {
            offsetConfig: { preset: '30min' },
        } as Stage3Input;
        const survivors: Stage3Candidates = [
            { time: '12:00:00', offsetMinutes: 0, offsetDescription: 'exact', priority: 90 },
            { time: '12:01:00', offsetMinutes: 1, offsetDescription: '+1m', priority: 85 },
            { time: '11:59:00', offsetMinutes: -1, offsetDescription: '-1m', priority: 80 },
            { time: '12:02:00', offsetMinutes: 2, offsetDescription: '+2m', priority: 70 },
            { time: '11:58:00', offsetMinutes: -2, offsetDescription: '-2m', priority: 65 },
            { time: '12:03:00', offsetMinutes: 3, offsetDescription: '+3m', priority: 60 },
            { time: '11:57:00', offsetMinutes: -3, offsetDescription: '-3m', priority: 55 },
            { time: '18:00:00', offsetMinutes: 40, offsetDescription: '+40m', priority: 1 },
        ];

        const result = await stage3RefinementGrid(input, survivors, mockProgress as unknown as Stage3Progress);
        expect(result.candidates.some(c => c.time === '18:00:00')).toBe(true);
    });

    it('Stage 5 should keep far-but-higher-provenance survivor in micro focus set', async () => {
        const input: Stage5Input = {
            offsetConfig: { preset: '30min' },
        } as Stage5Input;
        const survivors: Stage5Candidates = [
            { time: '12:00:00', offsetMinutes: 0, offsetDescription: 'exact', priority: 90 },
            { time: '12:01:00', offsetMinutes: 1, offsetDescription: '+1m', priority: 80 },
            { time: '11:59:00', offsetMinutes: -1, offsetDescription: '-1m', priority: 70 },
            { time: '12:02:00', offsetMinutes: 2, offsetDescription: '+2m', priority: 60 },
            { time: '11:58:00', offsetMinutes: -2, offsetDescription: '-2m', priority: 50 },
            { time: '17:00:00', offsetMinutes: 300, offsetDescription: '+300m', priority: 1 },
        ];

        const result = await stage5MicroGrid(input, survivors, mockProgress as unknown as Stage5Progress);
        expect(result.candidates.some(c => c.time === '17:00:00')).toBe(true);
    });
});
