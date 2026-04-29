import { describe, it, expect } from 'vitest';
import { EventScorer } from '../event-scorer.js';
import { BtrEvent } from '@ai-pandit/shared';

describe('God-Tier BTR - Orchestrator Modules', () => {

    describe('Event Scorer', () => {

        it('should assign highest weight to user-defined "critical" importance events', () => {
            const events: Partial<BtrEvent>[] = [
                {
                    id: 'evt_1',
                    category: 'travel', // Usually minor impact
                    description: 'Moved to a new country',
                    datePrecision: 'exact_date',
                    confidence: { source: 'document' },
                    // the front-end might inject user importance as a generic prop
                    importance: 'critical'
                } as any
            ];

            const scored = EventScorer.scoreEvents(events, { defaultSource: 'document', defaultPrecision: 'exact_date' });

            expect(scored.length).toBe(1);
            // Critical importance carries a 5.0 base weight. 
            // Exact + document gives highest reliability modifier.
            expect(scored[0].categoryWeight).toBeGreaterThan(4.0);
            expect(scored[0].impact).toBe('critical');
        });

        it('should properly penalize approximate dates and unreliable sources', () => {
            const events: Partial<BtrEvent>[] = [
                {
                    id: 'evt_2',
                    category: 'marriage', // Usually critical impact
                    datePrecision: 'year_range', // Penalizes score
                    confidence: { source: 'memory' } // Penalizes score
                } as any
            ];

            const scored = EventScorer.scoreEvents(events);
            expect(scored.length).toBe(1);

            // Reliability should be low
            expect(scored[0].reliabilityScore).toBeLessThan(0.5);
            // Although it's marriage, the final calculated weight is heavily reduced by the confidence multiplier
            expect(scored[0].calculatedWeight).toBeLessThan(scored[0].categoryWeight);
        });

        it('should correctly generate recommendations and summary metrics', () => {
            const events: Partial<BtrEvent>[] = [
                { id: '1', category: 'marriage', datePrecision: 'year_range', confidence: { source: 'memory' } } as any,
                { id: '2', category: 'career', datePrecision: 'year_range', confidence: { source: 'memory' } } as any
            ];

            const scored = EventScorer.scoreEvents(events);
            const summary = EventScorer.generateSummary(scored);

            expect(summary.totalEvents).toBe(2);
            expect(summary.highConfidenceCount).toBe(0);
            // Recommendations should flag the lack of high confidence events
            expect(summary.recommendations.some(r => r.includes('high') || r.includes('document'))).toBe(true);
        });

        it('should normalize ranged event dates to deterministic midpoint Date objects', () => {
            const events: Partial<BtrEvent>[] = [
                {
                    id: 'evt_3',
                    category: 'career',
                    datePrecision: 'year_range' as any,
                    eventDate: '1998',
                    endDate: '2001',
                    confidence: { source: 'document' } as any,
                } as any
            ];

            const scored = EventScorer.scoreEvents(events, { defaultSource: 'document', defaultPrecision: 'year_range' });
            expect(scored[0].eventDate).toBeInstanceOf(Date);
            expect((scored[0].eventDate as Date).toISOString().slice(0, 10)).toBe('2000-01-01');
        });

    });

});
