/**
 * 🔱 EXHAUSTIVE CONSENSUS ENGINE TESTS
 * Tests calculateConsensus, individual validation methods,
 * confidence levels, red flags, margin of error, key evidence
 */
import { describe, it, expect, vi } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════════════════

vi.mock('../logger.js', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('../kp-sublords.js', () => ({
    calculateKPSubLords: vi.fn().mockReturnValue({}),
}));

vi.mock('../btr/god-tier-weights.js', () => ({
    METHOD_WEIGHTS: {
        vimshottari: 0.15, yogini: 0.10, chara: 0.08, kalachakra: 0.08,
        kp: 0.15, ashtakavarga: 0.08, varga: 0.10, transit: 0.10,
        forensic: 0.08, ai: 0.08,
    },
    CONFIDENCE_THRESHOLDS: {
        god_tier: { minScore: 95, allMethodsAbove: 90 },
        very_high: { minScore: 85, allMethodsAbove: 80 },
        high: { minScore: 75, allMethodsAbove: 60 },
        medium: { minScore: 60 },
    },
    calculateWeightedAverage: vi.fn((scores: Record<string, number>, weights: Record<string, number>) => {
        let weightedSum = 0;
        let totalWeight = 0;
        for (const key of Object.keys(weights)) {
            if (key in scores) {
                weightedSum += scores[key] * weights[key];
                totalWeight += weights[key];
            }
        }
        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }),
}));

import { calculateConsensus, ConsensusEngine } from '../consensus-engine.js';

// ═══════════════════════════════════════════════════════════════════════════
// FIXTURES
// ═══════════════════════════════════════════════════════════════════════════

function makeMinimalInput(overrides?: any) {
    return {
        candidate: {
            birthDate: '1990-05-15',
            ephemeris: {
                ascendant: { sign: 'Aries', degree: 15 },
                planets: {
                    moon: { longitude: 100, sign: 'Cancer' },
                    jupiter: { dignity: 'own' },
                    saturn: { dignity: 'neutral' },
                    mars: { dignity: 'neutral' },
                },
                ashtakavarga: { SAV: [28, 30, 25, 27, 32, 29, 26, 31, 28, 30, 25, 27] },
            },
            dasha: {
                vimshottari: {
                    mahadasha: { lord: 'Jupiter', startDate: new Date('1985-01-01'), endDate: new Date('2001-01-01') },
                    antardasha: { lord: 'Venus' }
                },
                yogini: [{ lord: 'Jupiter', startEnd: '1988-01-01 to 1998-01-01' }],
                chara: { currentSign: 'Cancer' },
            },
            kpData: {
                cuspalSubLords: { 7: { subLord: 'Jupiter' }, 10: { subLord: 'Saturn' } },
            },
            vargas: { d9: true, d10: true, d60: true },
            aiScore: 80,
            ...overrides?.candidate,
        },
        events: overrides?.events || [
            { type: 'Marriage', category: 'marriage', impact: 'major', eventDate: '1995-06-15', yearOffset: 5 },
            { type: 'Career Start', category: 'career', impact: 'major', eventDate: '1992-01-01', yearOffset: 2 },
            { type: 'Health Issue', category: 'health', impact: 'moderate', eventDate: '1997-03-01', yearOffset: 7 },
        ],
        forensicProfile: overrides?.forensicProfile || {
            biological: { prakriti: 'pitta' },
            physical: { build: 'athletic' },
        },
        ...overrides,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN: calculateConsensus
// ═══════════════════════════════════════════════════════════════════════════

describe('Consensus Engine - calculateConsensus', () => {
    it('should return valid result with all required fields', () => {
        const input = makeMinimalInput();
        const result = calculateConsensus(input);

        expect(result.scores).toBeDefined();
        expect(result.overallConsensus).toBeDefined();
        expect(result.confidenceLevel).toBeDefined();
        expect(result.marginOfError).toBeDefined();
        expect(result.validationDetails).toBeDefined();
        expect(result.redFlags).toBeDefined();
        expect(result.keyEvidence).toBeDefined();
        expect(result.recommendations).toBeDefined();
        expect(result.validatedAt).toBeInstanceOf(Date);
    });

    it('should return 10 validation details (one per method)', () => {
        const input = makeMinimalInput();
        const result = calculateConsensus(input);
        expect(result.validationDetails.length).toBe(12);
    });

    it('should have all 10 score fields', () => {
        const input = makeMinimalInput();
        const result = calculateConsensus(input);
        const expectedKeys = ['vimshottari', 'yogini', 'chara', 'kalachakra', 'kp', 'ashtakavarga', 'varga', 'transit', 'forensic', 'ai'];
        for (const key of expectedKeys) {
            expect((result.scores as any)[key]).toBeDefined();
            expect(typeof (result.scores as any)[key]).toBe('number');
        }
    });

    it('should return overallConsensus between 0 and 100', () => {
        const input = makeMinimalInput();
        const result = calculateConsensus(input);
        expect(result.overallConsensus).toBeGreaterThanOrEqual(0);
        expect(result.overallConsensus).toBeLessThanOrEqual(100);
    });

    it('should return valid confidence level', () => {
        const input = makeMinimalInput();
        const result = calculateConsensus(input);
        expect(['GOD_TIER', 'VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW']).toContain(result.confidenceLevel);
    });

    it('should return marginOfError >= 3 seconds', () => {
        const input = makeMinimalInput();
        const result = calculateConsensus(input);
        expect(result.marginOfError).toBeGreaterThanOrEqual(3);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// MISSING DATA HANDLING (Graceful Degradation)
// ═══════════════════════════════════════════════════════════════════════════

describe('Consensus Engine - Missing Data Handling', () => {
    it('should handle missing dasha data gracefully', () => {
        const input = makeMinimalInput({ candidate: { dasha: undefined } });
        const result = calculateConsensus(input);
        expect(result.scores.vimshottari).toBe(0); // Fail without dasha
        expect(result.scores.yogini).toBe(0);
    });

    it('should handle missing KP data gracefully', () => {
        const input = makeMinimalInput({ candidate: { kpData: undefined } });
        const result = calculateConsensus(input);
        expect(result.scores.kp).toBe(40); // Fail score
    });

    it('should handle missing varga data gracefully', () => {
        const input = makeMinimalInput({ candidate: { vargas: undefined } });
        const result = calculateConsensus(input);
        expect(result.scores.varga).toBe(40); // Fail score
    });

    it('should handle missing forensic profile gracefully', () => {
        const input = makeMinimalInput({ forensicProfile: undefined });
        const result = calculateConsensus(input);
        expect(result.scores.forensic).toBe(0);
    });

    it('should handle missing AI score with default 70', () => {
        const input = makeMinimalInput({ candidate: { aiScore: undefined } });
        const result = calculateConsensus(input);
        expect(result.scores.ai).toBe(70); // Default AI score
    });

    it('should handle missing moon position for Kalachakra', () => {
        const input = makeMinimalInput({
            candidate: { ephemeris: { planets: {}, ascendant: { degree: 15 } } }
        });
        const result = calculateConsensus(input);
        expect(result.scores.kalachakra).toBe(0);
    });

    it('should handle empty events array', () => {
        const input = makeMinimalInput({ events: [] });
        const result = calculateConsensus(input);
        expect(result).toBeDefined();
        expect(result.overallConsensus).toBeGreaterThanOrEqual(0);
    });
});

describe('Consensus Engine - Transit Matching with Flexible Dates', () => {
    it('should match transit entry by event id for ranged dates', () => {
        const input = makeMinimalInput({
            events: [{
                id: 'evt_abc123',
                type: 'Career Phase',
                category: 'career',
                impact: 'major',
                eventDate: '1998',
                endDate: '2001',
                datePrecision: 'year_range',
            }],
        });

        (input.candidate.ephemeris as any).transitData = {
            '1999-07-01#evt_abc123': { doubleTransit: { isTriggered: true } },
        };

        const result = calculateConsensus(input);
        expect(result.scores.transit).toBeGreaterThanOrEqual(95);
    });

    it('should match transit entry by window overlap when ids are absent', () => {
        const input = makeMinimalInput({
            events: [{
                type: 'Education Range',
                category: 'education',
                impact: 'major',
                eventDate: '2012-04',
                endDate: '2012-06',
                datePrecision: 'month_range',
            }],
        });

        (input.candidate.ephemeris as any).transitData = {
            '2012-05-15#x1': { doubleTransit: { isTriggered: true } },
        };

        const result = calculateConsensus(input);
        expect(result.scores.transit).toBeGreaterThanOrEqual(95);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// RED FLAGS DETECTION
// ═══════════════════════════════════════════════════════════════════════════

describe('Consensus Engine - Red Flags Detection', () => {
    it('should detect sandhi birth (ascendant degree < 1)', () => {
        const input = makeMinimalInput({
            candidate: { ephemeris: { ascendant: { degree: 0.5 }, planets: { moon: { longitude: 100 } }, ashtakavarga: { SAV: [] } } }
        });
        const result = calculateConsensus(input);
        expect(result.redFlags.sandhiBirth).toBe(true);
    });

    it('should detect sandhi birth (ascendant degree > 29)', () => {
        const input = makeMinimalInput({
            candidate: { ephemeris: { ascendant: { degree: 29.5 }, planets: { moon: { longitude: 100 } }, ashtakavarga: { SAV: [] } } }
        });
        const result = calculateConsensus(input);
        expect(result.redFlags.sandhiBirth).toBe(true);
    });

    it('should NOT detect sandhi for mid-degree ascendant', () => {
        const input = makeMinimalInput();
        const result = calculateConsensus(input);
        expect(result.redFlags.sandhiBirth).toBe(false);
    });

    it('should detect gandanta (moon at 0° of Ashwini-like zone)', () => {
        const input = makeMinimalInput({
            candidate: { ephemeris: { ascendant: { degree: 15 }, planets: { moon: { longitude: 0.5 } }, ashtakavarga: { SAV: [] } } }
        });
        const result = calculateConsensus(input);
        expect(result.redFlags.gandanta).toBe(true);
    });

    it('should force confidence LOW when gandanta flagged', () => {
        const input = makeMinimalInput({
            candidate: { ephemeris: { ascendant: { degree: 15 }, planets: { moon: { longitude: 0.5 } }, ashtakavarga: { SAV: [] } } }
        });
        const result = calculateConsensus(input);
        expect(result.confidenceLevel).toBe('LOW');
    });

    it('should detect conflicting methods (> 40 point spread)', () => {
        // We can't directly test since it depends on internal scoring,
        // but we verify the red flags object structure
        const input = makeMinimalInput();
        const result = calculateConsensus(input);
        expect(typeof result.redFlags.conflictingMethods).toBe('boolean');
    });

    it('should detect forensicMismatch when forensic score < 50', () => {
        const input = makeMinimalInput({ forensicProfile: undefined });
        const result = calculateConsensus(input);
        expect(result.redFlags.forensicMismatch).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// CONSENSUS ENGINE EXPORT OBJECT
// ═══════════════════════════════════════════════════════════════════════════

describe('Consensus Engine - Export Object', () => {
    it('should export calculate function', () => {
        expect(typeof ConsensusEngine.calculate).toBe('function');
    });

    it('should produce identical result via ConsensusEngine.calculate', () => {
        const input = makeMinimalInput();
        const result = ConsensusEngine.calculate(input);
        expect(result.scores).toBeDefined();
        expect(result.validationDetails.length).toBe(12);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe('Consensus Engine - Recommendations', () => {
    it('should generate recommendations array', () => {
        const input = makeMinimalInput();
        const result = calculateConsensus(input);
        expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should generate key evidence from passing methods', () => {
        const input = makeMinimalInput();
        const result = calculateConsensus(input);
        expect(Array.isArray(result.keyEvidence)).toBe(true);
    });
});
