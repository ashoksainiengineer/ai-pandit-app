import { describe, it, expect } from 'vitest';
import { processCandidatesInChunks, maintainTopCandidates } from './streaming-processor.js';
import type { CandidateAnalysis } from './window-scanner.js';

describe('streaming-processor', () => {
    describe('processCandidatesInChunks', () => {
        it('processes candidates in chunks', async () => {
            const processed: CandidateAnalysis[][] = [];
            await processCandidatesInChunks(
                { startMs: 0, endMs: 2000 },
                500,
                async (chunk) => {
                    processed.push(chunk);
                }
            );
            // 0, 500, 1000, 1500, 2000 = 5 candidates
            expect(processed.length).toBeGreaterThanOrEqual(1);
            const total = processed.reduce((sum, c) => sum + c.length, 0);
            expect(total).toBe(5);
        });

        it('each chunk contains valid candidate objects', async () => {
            await processCandidatesInChunks(
                { startMs: 0, endMs: 500 },
                500,
                async (chunk) => {
                    expect(chunk.length).toBeGreaterThan(0);
                    for (const c of chunk) {
                        expect(c.time).toBeInstanceOf(Date);
                        expect(typeof c.timeString).toBe('string');
                        expect(c.timeString).toMatch(/^\d{2}:\d{2}:\d{2}$/);
                    }
                }
            );
        });
    });

    describe('maintainTopCandidates', () => {
        it('keeps top candidates by score', () => {
            const existing: CandidateAnalysis[] = [
                { time: new Date(), timeString: '00:00:00', ephemeris: null, dasha: [], vargas: {}, kpData: {}, boundarySafety: { lagnaSignBoundary: 0, moonNakshatraBoundary: 0, isDangerous: false }, _scored: { overallScore: 50 } } as CandidateAnalysis,
            ];
            const chunk: CandidateAnalysis[] = [
                { time: new Date(), timeString: '00:00:01', ephemeris: null, dasha: [], vargas: {}, kpData: {}, boundarySafety: { lagnaSignBoundary: 0, moonNakshatraBoundary: 0, isDangerous: false }, _scored: { overallScore: 80 } } as CandidateAnalysis,
                { time: new Date(), timeString: '00:00:02', ephemeris: null, dasha: [], vargas: {}, kpData: {}, boundarySafety: { lagnaSignBoundary: 0, moonNakshatraBoundary: 0, isDangerous: false }, _scored: { overallScore: 30 } } as CandidateAnalysis,
            ];
            const result = maintainTopCandidates(existing, chunk, 2);
            expect(result.length).toBe(2);
            expect((result[0] as any)._scored.overallScore).toBe(80);
            expect((result[1] as any)._scored.overallScore).toBe(50);
        });

        it('returns at least one candidate even when maxKeep is 0', () => {
            const existing: CandidateAnalysis[] = [];
            const chunk: CandidateAnalysis[] = [
                { time: new Date(), timeString: '00:00:00', ephemeris: null, dasha: [], vargas: {}, kpData: {}, boundarySafety: { lagnaSignBoundary: 0, moonNakshatraBoundary: 0, isDangerous: false } } as CandidateAnalysis,
            ];
            const result = maintainTopCandidates(existing, chunk, 0);
            expect(result.length).toBe(1);
        });

        it('handles empty existing and chunk', () => {
            const result = maintainTopCandidates([], [], 5);
            expect(result.length).toBe(0);
        });
    });
});
