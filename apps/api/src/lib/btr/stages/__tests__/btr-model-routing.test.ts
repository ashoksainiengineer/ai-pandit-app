process.env.SKIP_EPHEMERIS_INIT = 'true';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stage2BatchTournament } from '../stage2-batch-tournament.js';
import { stage4DeepAnalysis } from '../stage4-deep-analysis.js';
import { stage6FinalPrecision } from '../stage6-final-precision.js';
import * as aiClient from '../../../ai-client.js';
import * as extractors from '../../extractors/index.js';
import * as sessionEvents from '../../../session-events.js';
import * as vedicAstrologyEngine from '../../../vedic-astrology-engine.js';
import { config } from '../../../../config/index.js';

// Mock the AI client
vi.mock('../../../ai-client.js', () => ({
    _callAIWithStream: vi.fn(),
    _executeAIInParallel: vi.fn(async (tasks: Array<() => Promise<unknown>>) => Promise.all(tasks.map((task) => task())))
}));

// Mock validation to bypass zero-trust gates in tests
vi.mock('@ai-pandit/shared/schemas', () => ({
    validateCandidateDataForAI: vi.fn()
}));

// Mock the data builder
vi.mock('../../data-package-builder.js', () => ({
    buildCandidateDataPackage: vi.fn().mockImplementation(async (time: string) => ({
        time,
        d60Sign: 'Scorpio',
        ascendant: { sign: 'Aries', degree: '10:00:00' },
        planets: {
            moon: { sign: 'Taurus', degree: '15:00:00' },
            sun: { sign: 'Aries', degree: '10:00:00' }
        },
        rawVimshottari: [{ marker: time }],
        vimshottariDasha: [
            {
                maha: 'Jupiter',
                antar: 'Saturn',
                pratyantar: 'Mercury',
                startEnd: '2000-01-01 to 2100-01-01'
            }
        ]
    }))
}));

vi.mock('../../../time-offset-manager.js', async () => {
    const actual = await vi.importActual('../../../time-offset-manager.js');
    return {
        ...actual,
        getDynamicBatchSize: vi.fn().mockReturnValue(10),
        getDynamicSurvivors: vi.fn().mockReturnValue(2),
        splitIntoBatches: vi.fn().mockImplementation((candidates: unknown[]) => [candidates])
    };
});

// Mock stage utilities
vi.mock('../_utils.js', () => ({
    getMinifiedEphemerisInline: vi.fn().mockReturnValue({ sun: 'Ar 10', moon: 'Ta 15', ascendant: 'Ar 10' }),
    getFullEphemerisPayload: vi.fn().mockReturnValue({ Sun: 'Ar 10', Moon: 'Ta 15', Lagna: 'Ar 10' })
}));

// Mock ephemeris
vi.mock('../../../ephemeris.js', () => ({
    calculateEphemeris: vi.fn().mockResolvedValue({
        planets: {
            jupiter: { sign: 'Aries', degree: 10 },
            saturn: { sign: 'Aquarius', degree: 15 },
            rahu: { sign: 'Pisces', degree: 20 }
        }
    }),
    cleanup: vi.fn()
}));

// Mock astrology engine
vi.mock('../../../vedic-astrology-engine.js', () => ({
    getDashaForDate: vi.fn().mockReturnValue({
        mahadasha: 'Jupiter',
        antardasha: 'Saturn',
        pratyantardasha: 'Mercury'
    })
}));

// Mock session events
vi.mock('../../../session-events.js', () => ({
    emitCandidateScore: vi.fn(),
    emitAIContext: vi.fn(),
    emitDecision: vi.fn(),
    emitAIThinking: vi.fn()
}));

// Mock precision integrator
vi.mock('../../../btr-precision-integrator.js', () => ({
    enhanceCandidateWithPrecisionData: vi.fn((c) => ({
        ...c,
        precision: {
            isPrecisionStandard: true,
            consensus: { overallConsensus: 90, confidenceLevel: 'HIGH' }
        }
    })),
    generatePrecisionAIPrompt: vi.fn((...args: unknown[]) => args[1])
}));

// Mock extractors
vi.mock('../../extractors/index.js', () => ({
    extractBatchSurvivors: vi.fn().mockReturnValue([{ time: '12:00:00', score: 95, reason: 'Good' }]),
    extractFinalVerdict: vi.fn().mockReturnValue({ time: '12:00:00', accuracy: 95, confidence: 'HIGH', margin: 5 })
}));

// Mock progress tracker
const mockProgress = {
    startStep: vi.fn(),
    updateMessage: vi.fn(),
    updateSubProgress: vi.fn(),
    addCandidateScore: vi.fn(),
    completeStep: vi.fn(),
    updateAIThinking: vi.fn()
};

describe('BTR Stage Model Routing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Stage 2 should use the base AI model from config', async () => {
        const input = {
            sessionId: 'test-session',
            lifeEvents: [{ eventType: 'Birth', eventDate: '2000-01-01' }],
            offsetConfig: { preset: '1hour' },
            tentativeTime: '12:00:00'
        };
        const candidates = [{ time: '12:00:00', offsetMinutes: 0, offsetDescription: '' }];

        (aiClient as any)._callAIWithStream.mockResolvedValue({
            success: true,
            content: '<FINAL_SCORES>[{"time": "12:00:00", "score": 90}]</FINAL_SCORES>'
        });

        await stage2BatchTournament(input as any, candidates, mockProgress as any, {} as any);

        expect((aiClient as any)._callAIWithStream).toHaveBeenCalledWith(
            expect.any(String),
            2,
            expect.any(String),
            expect.any(String),
            expect.objectContaining({
                model: config.ai.model
            })
        );
    });

    it('Stage 4 should use the reasoner AI model from config', async () => {
        const input = {
            sessionId: 'test-session',
            lifeEvents: [{ eventType: 'Birth', eventDate: '2000-01-01' }],
            offsetConfig: { preset: '1hour' }
        };
        const candidates = [{ time: '12:00:00', offsetMinutes: 0, offsetDescription: 'Exact' }];

        (aiClient as any)._callAIWithStream.mockResolvedValue({
            success: true,
            content: 'MATCH'
        });

        await stage4DeepAnalysis(input as any, candidates, mockProgress as any, {} as any);

        expect((aiClient as any)._callAIWithStream).toHaveBeenCalledWith(
            expect.any(String),
            4,
            expect.any(String),
            expect.any(String),
            expect.objectContaining({
                model: config.ai.reasonerModel
            })
        );
    });

    it('Stage 6 should use the reasoner AI model from config', async () => {
        const input = {
            sessionId: 'test-session',
            lifeEvents: [{ eventType: 'Birth', eventDate: '2000-01-01' }],
            offsetConfig: { preset: '1hour' },
            latitude: 0,
            longitude: 0,
            timezone: 'UTC'
        };
        const candidates = [{ time: '12:00:00', offsetMinutes: 0, offsetDescription: 'Exact' }];

        (aiClient as any)._callAIWithStream.mockResolvedValue({
            success: true,
            content: '<FINAL_VERDICT>{"time": "12:00:00"}</FINAL_VERDICT>'
        });

        await stage6FinalPrecision(input as any, candidates, mockProgress as any, {} as any);

        expect((aiClient as any)._callAIWithStream).toHaveBeenCalledWith(
            expect.any(String),
            6,
            expect.any(String),
            expect.any(String),
            expect.objectContaining({
                model: config.ai.reasonerModel
            })
        );
    });

    it('Stage 6 should map hallucinated final verdict time to nearest finalist candidate', async () => {
        const input = {
            sessionId: 'test-session',
            lifeEvents: [{ eventType: 'Birth', eventDate: '2000-01-01' }],
            offsetConfig: { preset: '1hour' },
            latitude: 0,
            longitude: 0,
            timezone: 'UTC',
            tentativeTime: '12:00:00'
        };
        const candidates = [
            { time: '12:00:00', offsetMinutes: 0, offsetDescription: 'Exact' },
            { time: '12:00:10', offsetMinutes: 0.1667, offsetDescription: '+10s' }
        ];

        (extractors.extractFinalVerdict as any).mockReturnValue({
            time: '12:00:07',
            accuracy: 96,
            confidence: 'HIGH',
            margin: 4
        });
        (aiClient as any)._callAIWithStream.mockResolvedValue({
            success: true,
            content: '<FINAL_VERDICT>{"time": "12:00:07"}</FINAL_VERDICT>'
        });

        const result = await stage6FinalPrecision(input as any, candidates as any, mockProgress as any, {} as any);
        expect(result.finalTime).toBe('12:00:10');
    });

    it('Stage 6 should use deterministic fallback winner when verdict is missing', async () => {
        const input = {
            sessionId: 'test-session',
            lifeEvents: [{ eventType: 'Birth', eventDate: '2000-01-01' }],
            offsetConfig: { preset: '1hour' },
            latitude: 0,
            longitude: 0,
            timezone: 'UTC',
            tentativeTime: '12:00:00'
        };
        const candidates = [
            { time: '12:00:00', offsetMinutes: 0, offsetDescription: 'Exact' },
            { time: '11:59:40', offsetMinutes: -0.3333, offsetDescription: '-20s' }
        ];

        (extractors.extractFinalVerdict as any).mockReturnValue(null);
        (aiClient as any)._callAIWithStream.mockResolvedValue({
            success: true,
            content: 'No final verdict returned'
        });

        const result = await stage6FinalPrecision(input as any, candidates as any, mockProgress as any, {} as any);
        expect(result.finalTime).toBe('12:00:00');
        expect(result.confidence).toBe('LOW');
    });

    it('Stage 2 fallback should not auto-promote first batch-order candidates when stronger provenance exists', async () => {
        const input: Parameters<typeof stage2BatchTournament>[0] = {
            sessionId: 'stage2-fallback-order-bias',
            lifeEvents: [{ eventType: 'Birth', eventDate: '2000-01-01' }],
            offsetConfig: { preset: '1hour' },
            tentativeTime: '12:00:00'
        } as Parameters<typeof stage2BatchTournament>[0];

        const candidates: Parameters<typeof stage2BatchTournament>[1] = [
            { time: '12:00:00', offsetMinutes: 0, offsetDescription: 'batch-first low provenance', priority: 90 },
            { time: '12:00:30', offsetMinutes: 0.5, offsetDescription: 'batch-second low provenance', priority: 85 },
            { time: '11:58:00', offsetMinutes: -2, offsetDescription: 'far but stronger provenance', priority: 1 },
            { time: '12:03:00', offsetMinutes: 3, offsetDescription: 'far but strong provenance', priority: 2 },
        ];

        vi.mocked(extractors.extractBatchSurvivors).mockReturnValue([]);
        vi.mocked((aiClient as any)._callAIWithStream).mockResolvedValue({ success: false, content: '' } as never);

        await stage2BatchTournament(
            input,
            candidates,
            mockProgress as unknown as Parameters<typeof stage2BatchTournament>[2],
            {} as Parameters<typeof stage2BatchTournament>[3]
        );

        const promotedStage2Times = vi.mocked(sessionEvents.emitDecision).mock.calls
            .map(([, payload]) => payload as { stage?: number; verdict?: string; time?: string })
            .filter((payload) => payload.stage === 2 && payload.verdict === 'promoted' && Boolean(payload.time))
            .map((payload) => payload.time as string);

        expect(promotedStage2Times).toContain('11:58:00');
        expect(promotedStage2Times).toContain('12:03:00');
        expect(promotedStage2Times).not.toContain('12:00:00');
        expect(promotedStage2Times).not.toContain('12:00:30');
    });

    it('Stage 4 fallback should preserve deterministic merit/provenance, not first shuffled candidates', async () => {
        const input: Parameters<typeof stage4DeepAnalysis>[0] = {
            sessionId: 'stage4-fallback-order-bias',
            lifeEvents: [{ eventType: 'Birth', eventDate: '2000-01-01' }],
            offsetConfig: { preset: '1hour' },
            tentativeTime: '12:00:00'
        } as Parameters<typeof stage4DeepAnalysis>[0];

        const candidates: Parameters<typeof stage4DeepAnalysis>[1] = [
            { time: '12:00:00', offsetMinutes: 0, offsetDescription: 'batch-first low provenance', priority: 90 },
            { time: '12:00:30', offsetMinutes: 0.5, offsetDescription: 'batch-second low provenance', priority: 85 },
            { time: '11:58:00', offsetMinutes: -2, offsetDescription: 'far but stronger provenance', priority: 1 },
            { time: '12:03:00', offsetMinutes: 3, offsetDescription: 'far but strong provenance', priority: 2 },
            { time: '11:57:00', offsetMinutes: -3, offsetDescription: 'far but strong provenance', priority: 3 },
            { time: '12:04:00', offsetMinutes: 4, offsetDescription: 'far but strong provenance', priority: 4 },
            { time: '11:56:00', offsetMinutes: -4, offsetDescription: 'far but strong provenance', priority: 5 },
            { time: '12:05:00', offsetMinutes: 5, offsetDescription: 'far but strong provenance', priority: 6 },
            { time: '11:55:00', offsetMinutes: -5, offsetDescription: 'far but strong provenance', priority: 7 },
            { time: '12:06:00', offsetMinutes: 6, offsetDescription: 'far but strong provenance', priority: 8 },
            { time: '11:54:00', offsetMinutes: -6, offsetDescription: 'far but strong provenance', priority: 9 },
        ];

        vi.mocked(extractors.extractBatchSurvivors).mockReturnValue([]);
        vi.mocked((aiClient as any)._callAIWithStream).mockResolvedValue({ success: false, content: '' } as never);

        await stage4DeepAnalysis(
            input,
            candidates,
            mockProgress as unknown as Parameters<typeof stage4DeepAnalysis>[2],
            {} as Parameters<typeof stage4DeepAnalysis>[3]
        );

        const promotedStage4Times = vi.mocked(sessionEvents.emitDecision).mock.calls
            .map(([, payload]) => payload as { stage?: number; verdict?: string; time?: string; batch?: number })
            .filter((payload) => payload.stage === 4 && payload.verdict === 'promoted' && payload.batch === 1 && Boolean(payload.time))
            .map((payload) => payload.time as string);

        expect(promotedStage4Times).toContain('11:58:00');
        expect(promotedStage4Times).toContain('12:03:00');
        expect(promotedStage4Times).not.toContain('12:00:00');
        expect(promotedStage4Times).not.toContain('12:00:30');
    });

    it('Stage 6 should derive present-day dasha anchors per finalist candidate, not from only first finalist', async () => {
        const input: Parameters<typeof stage6FinalPrecision>[0] = {
            sessionId: 'stage6-candidate-scoped-anchor',
            lifeEvents: [{ eventType: 'Birth', eventDate: '2000-01-01' }],
            offsetConfig: { preset: '1hour' },
            latitude: 0,
            longitude: 0,
            timezone: 'UTC',
            tentativeTime: '12:00:00'
        } as Parameters<typeof stage6FinalPrecision>[0];

        const candidates: Parameters<typeof stage6FinalPrecision>[1] = [
            { time: '12:00:00', offsetMinutes: 0, offsetDescription: 'Exact' },
            { time: '12:00:30', offsetMinutes: 0.5, offsetDescription: '+30s' }
        ];

        vi.mocked(extractors.extractFinalVerdict).mockReturnValue({
            time: '12:00:00',
            accuracy: 95,
            confidence: 'HIGH',
            margin: 5
        });
        vi.mocked((aiClient as any)._callAIWithStream).mockResolvedValue({
            success: true,
            content: '<FINAL_VERDICT>{"time": "12:00:00", "accuracy": 95, "confidence": "HIGH", "margin": 5}</FINAL_VERDICT>'
        } as never);

        await stage6FinalPrecision(
            input,
            candidates,
            mockProgress as unknown as Parameters<typeof stage6FinalPrecision>[2],
            {} as Parameters<typeof stage6FinalPrecision>[3]
        );

        const dashaMarkers = vi.mocked(vedicAstrologyEngine.getDashaForDate).mock.calls
            .map(([raw]) => raw as Array<{ marker?: string }>)
            .map((raw) => raw[0]?.marker)
            .filter((marker): marker is string => Boolean(marker));

        expect(dashaMarkers).toEqual(expect.arrayContaining(['12:00:00', '12:00:30']));
    });
});
