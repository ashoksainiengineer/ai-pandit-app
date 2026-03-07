process.env.SKIP_SWISSEPH_INIT = 'true';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stage2BatchTournament } from '../stage2-batch-tournament.js';
import { stage4DeepAnalysis } from '../stage4-deep-analysis.js';
import { stage6FinalPrecision } from '../stage6-final-precision.js';
import * as aiClient from '../../../ai-client.js';
import { config } from '../../../../config/index.js';

// Mock the AI client
vi.mock('../../../ai-client.js', () => ({
    callAIWithStream: vi.fn(),
    executeAIInParallel: vi.fn(async (tasks) => {
        const results = [];
        for (const task of tasks) {
            results.push(await task());
        }
        return results;
    })
}));

// Mock validation to bypass zero-trust gates in tests
vi.mock('@ai-pandit/shared/schemas', () => ({
    validateCandidateDataForAI: vi.fn()
}));

// Mock the data builder
vi.mock('../../data-package-builder.js', () => ({
    buildCandidateDataPackage: vi.fn().mockResolvedValue({
        time: '12:00:00',
        ascendant: { sign: 'Aries', degree: '10:00:00' },
        planets: { moon: { sign: 'Taurus', degree: '15:00:00' }, sun: { sign: 'Aries', degree: '10:00:00' } },
        rawVimshottari: []
    })
}));

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
    generatePrecisionAIPrompt: vi.fn((c, p) => p)
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

        (aiClient.callAIWithStream as any).mockResolvedValue({
            success: true,
            content: '<FINAL_SCORES>[{"time": "12:00:00", "score": 90}]</FINAL_SCORES>'
        });

        await stage2BatchTournament(input as any, candidates, mockProgress as any, {} as any);

        expect(aiClient.callAIWithStream).toHaveBeenCalledWith(
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

        (aiClient.callAIWithStream as any).mockResolvedValue({
            success: true,
            content: 'MATCH'
        });

        await stage4DeepAnalysis(input as any, candidates, mockProgress as any, {} as any);

        expect(aiClient.callAIWithStream).toHaveBeenCalledWith(
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

        (aiClient.callAIWithStream as any).mockResolvedValue({
            success: true,
            content: '<FINAL_VERDICT>{"time": "12:00:00"}</FINAL_VERDICT>'
        });

        await stage6FinalPrecision(input as any, candidates, mockProgress as any, {} as any);

        expect(aiClient.callAIWithStream).toHaveBeenCalledWith(
            expect.any(String),
            6,
            expect.any(String),
            expect.any(String),
            expect.objectContaining({
                model: config.ai.reasonerModel
            })
        );
    });
});
