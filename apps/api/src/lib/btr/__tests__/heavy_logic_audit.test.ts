import { describe, it, expect } from 'vitest';
import { calculateRankFusionScore, METHOD_WEIGHTS, RRF_K } from '../precision-weights.js';
import { EventScorer } from '../event-scorer.js';
import { BtrEvent } from '@ai-pandit/shared';

describe('⚖️ HEAVY AUDIT: Scoring Math & Bias Verification', () => {

    it('should correctly calculate Rank Fusion without favoring small fluctuations (RRF)', () => {
        // Scenario A: Candidate strongly supported by High-Weight methods (Nadi, KP)
        const scoresA = {
            nadi: 95,
            kp: 92,
            varga: 80,
            shabala: 50,  // Weak in lower weight method
            ai: 10
        };

        // Scenario B: Candidate strongly supported by Low-Weight methods (AI, Boundary)
        const scoresB = {
            nadi: 10,
            kp: 20,
            varga: 50,
            boundary: 95, // Strong in low weight
            ai: 98
        };

        const resultA = calculateRankFusionScore(scoresA, METHOD_WEIGHTS as any);
        const resultB = calculateRankFusionScore(scoresB, METHOD_WEIGHTS as any);

        console.log(`[RRF AUDIT] Candidate A (Nadi/KP strong): ${resultA.toFixed(2)}%`);
        console.log(`[RRF AUDIT] Candidate B (AI/Boundary strong): ${resultB.toFixed(2)}%`);

        // The math should naturally bias towards precision layers (Candidate A)
        expect(resultA).toBeGreaterThan(resultB);
    });

    it('should calculate Event Scoring accurately based on multi-dimensional confidence', () => {
        const mockEvents: BtrEvent[] = [
            {
                id: 'e1',
                type: 'marriage',
                category: 'marriage',
                eventDate: new Date('2020-01-01'),
                datePrecision: 'exact_date',
                description: 'Marriage (Document)',
                impact: 'major',
                eventHouse: 7,
                significators: [],
                confidence: {
                    level: 'high',
                    source: 'document',
                    datePrecision: 'exact_date',
                    weight: 3.0,
                    reliabilityScore: 0.95
                }
            },
            {
                id: 'e2',
                type: 'travel',
                category: 'travel',
                eventDate: new Date('2015-06-01'),
                datePrecision: 'month_year',
                description: 'Travel (Memory)',
                impact: 'minor',
                eventHouse: 9,
                significators: [],
                confidence: {
                    level: 'low',
                    source: 'memory',
                    datePrecision: 'month_year',
                    weight: 0.5,
                    reliabilityScore: 0.3
                }
            }
        ];

        const scoredEvents = EventScorer.scoreEvents(mockEvents);

        const marriageScore = scoredEvents.find(e => e.category === 'marriage')!.calculatedWeight;
        const travelScore = scoredEvents.find(e => e.category === 'travel')!.calculatedWeight;

        console.log(`[EVENT AUDIT] Marriage Weight: ${marriageScore}`);
        console.log(`[EVENT AUDIT] Travel Weight: ${travelScore}`);

        // Marriage (Document + Exact + Major) should vastly outweigh Travel (Memory + Month + Minor)
        expect(marriageScore).toBeGreaterThan(travelScore * 3);
    });
});
