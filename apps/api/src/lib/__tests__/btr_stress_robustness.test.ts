import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProgressTracker } from '../progress-tracker.js';
import { calculateConsensus } from '../consensus-engine.js';
import { db } from '@ai-pandit/db';

vi.mock('@ai-pandit/db', () => ({
    db: {
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
    },
}));

vi.mock('../session-events.js', () => ({
    emitProgress: vi.fn(),
    emitAIThinking: vi.fn(),
    emitCandidateScore: vi.fn(),
    emitAIContext: vi.fn(),
    emitEstimatedTime: vi.fn(),
}));

describe('Chapter 2.1: BTR Pipeline - Stress & Robustness', () => {

    describe('ProgressTracker Industrial Stress', () => {
        let tracker: ProgressTracker;
        const sessionId = 'stress-test-session';

        beforeEach(() => {
            tracker = new ProgressTracker(sessionId);
        });

        afterEach(() => {
            ProgressTracker.clearInstance(sessionId);
            vi.clearAllMocks();
        });

        it('should handle rapid-fire thinking updates without memory bloat', async () => {
            const smallChunk = 'Reasoning text chunk for memory testing. ';
            const iterations = 5000;

            for (let i = 0; i < iterations; i++) {
                tracker.updateAIThinking(smallChunk, 2);
            }

            const history = tracker.getStageHistory();
            const totalLength = history![2]?.length || 0;

            expect(totalLength).toBeLessThanOrEqual(100000);
            expect(totalLength).toBeGreaterThan(99000);
        });

        it('should handle massive candidate score arrays by truncating for DB', async () => {
            for (let i = 0; i < 1000; i++) {
                await tracker.addCandidateScore({
                    time: `12:00:${i}`,
                    score: Math.random() * 100,
                    stage: 1,
                    rank: i
                } as any);
            }

            await tracker.completeStep('init');

            const updateCall = vi.mocked(db.set).mock.calls.find(call =>
                typeof call[0] === 'object' && 'progressData' in call[0]
            );

            expect(updateCall).toBeDefined();
            const savedData = JSON.parse((updateCall![0] as any).progressData);
            expect(savedData.candidateScores.length).toBeLessThanOrEqual(500);
        });

        it('should respect DB write throttling (10s) for minor updates', async () => {
            await tracker.updateMessage('Update 1');
            const initialCalls = vi.mocked(db.update).mock.calls.length;
            await tracker.updateMessage('Update 2');
            expect(vi.mocked(db.update).mock.calls.length).toBe(initialCalls);
        });
    });

    describe('Consensus Engine Mathematical Robustness', () => {
        it('should handle extreme conflicting methods without crashing', () => {
            const input = {
                candidate: {
                    ephemeris: { ascendant: { degree: 15 }, planets: { moon: { longitude: 100 } } },
                    dasha: { vimshottari: { mahadasha: { lord: 'Sun' } } },
                    aiScore: 100
                },
                events: [
                    { category: 'marriage', impact: 'major', type: 'Marriage' }
                ],
                forensicProfile: { biological: { prakriti: 'kapha' } }
            };

            const result = calculateConsensus(input as any);
            expect(result.overallConsensus).toBeGreaterThan(0);
            expect(result.overallConsensus).toBeLessThan(100);
            expect(result.redFlags.forensicMismatch).toBe(true);
        });

        it('should handle extreme precision requirements (STANDARD_PRECISION check)', () => {
            const input = {
                candidate: {
                    ephemeris: {
                        ascendant: { degree: 15 },
                        planets: { sun: { sign: 'Leo' }, moon: { longitude: 100 } },
                        ashtakavarga: { SAV: Array(12).fill(30) },
                        d60Sign: 'Leo',
                        d60Planets: { Sun: { deity: 'Surya' } },
                        vargaDegrees: { D60: { Ascendant: 'Leo 15°00\'00"' } }
                    },
                    dasha: {
                        vimshottari: {
                            mahadasha: { lord: 'Sun' },
                            prana: { lord: 'Sun' }
                        },
                        yogini: [{ lord: 'Sun', startEnd: '1990-01-01 to 2000-01-01' }],
                        chara: { currentSign: 'Leo' }
                    },
                    kpData: { cuspalSubLords: { 10: { subLord: 'Sun' } } },
                    nadiData: { amsha: 'Aries', matches: true },
                    vargas: { d9: true, d10: true, d60: true },
                    aiScore: 95
                },
                events: [
                    { category: 'career', impact: 'critical', eventDate: '1995-01-01', transitData: { doubleTransit: { isTriggered: true } } }
                ],
                forensicProfile: { biological: { prakriti: 'pitta' } }
            };

            const result = calculateConsensus(input as any);

            expect(['MEDIUM', 'HIGH', 'VERY_HIGH', 'STANDARD_PRECISION']).toContain(result.confidenceLevel);
        });
    });
});
