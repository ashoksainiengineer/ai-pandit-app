import { describe, it, expect } from 'vitest';
import { buildCandidateDataPackage } from '../data-package-builder.js';
import { EventScorer } from '../event-scorer.js';

describe('🌍 REAL-WORLD AUDIT: Virat Kohli Life Events', () => {

    // Known Accurate Birth Info: Virat Kohli - Nov 5, 1988, 10:28 AM, Delhi
    const kohliInput = {
        sessionId: 'test-real-world-kohli',
        fullName: 'Virat Kohli',
        dateOfBirth: '1988-11-05',
        tentativeTime: '10:28:00',
        latitude: 28.6139,
        longitude: 77.2090,
        timezone: 5.5,
        offsetConfig: { preset: '30min' as const, description: '' },
        lifeEvents: [
            { id: '1', category: 'family', eventType: 'death', eventDate: '2006-12-18', datePrecision: 'exact_date', description: 'Father passed away', importance: 'critical', impact: 'major', source: 'document' },
            { id: '2', category: 'career', eventType: 'debut', eventDate: '2008-08-18', datePrecision: 'exact_date', description: 'ODI Debut', importance: 'high', impact: 'major', source: 'document' },
            { id: '3', category: 'career', eventType: 'achievement', eventDate: '2011-04-02', datePrecision: 'exact_date', description: 'World Cup Win', importance: 'high', impact: 'high', source: 'document' },
            { id: '4', category: 'career', eventType: 'debut', eventDate: '2011-06-20', datePrecision: 'exact_date', description: 'Test Debut', importance: 'medium', impact: 'high', source: 'document' },
            { id: '5', category: 'career', eventType: 'promotion', eventDate: '2015-01-01', datePrecision: 'month_year', description: 'Test Captaincy (Approx Month)', importance: 'high', impact: 'major', source: 'memory' },
            { id: '6', category: 'marriage', eventType: 'marriage', eventDate: '2017-12-11', datePrecision: 'exact_date', description: 'Marriage to Anushka', importance: 'critical', impact: 'major', source: 'document' },
            { id: '7', category: 'children', eventType: 'birth', eventDate: '2021-01-11', datePrecision: 'exact_date', description: 'Daughter Vamika born', importance: 'high', impact: 'major', source: 'document' },
            { id: '8', category: 'career', eventType: 'resignation', eventDate: '2021-09-16', datePrecision: 'exact_date', description: 'Steps down T20 captaincy', importance: 'medium', impact: 'major', source: 'document' },
            { id: '9', category: 'career', eventType: 'achievement', eventDate: '2022-09-08', datePrecision: 'exact_date', description: '71st Century (Asia Cup)', importance: 'medium', impact: 'high', source: 'document' },
            { id: '10', category: 'children', eventType: 'birth', eventDate: '2024-02-15', datePrecision: 'exact_date', description: 'Son Akaay born', importance: 'high', impact: 'major', source: 'document' }
        ] as any[],
        abortSignal: new AbortController().signal
    };

    it('should correctly score real-world events based on precision and impact', () => {
        const scoredEvents = EventScorer.scoreEvents(kohliInput.lifeEvents);

        expect(scoredEvents.length).toBe(10);

        const fatherDeath = scoredEvents.find(e => e.id === '1');
        const testCaptaincyMonth = scoredEvents.find(e => e.id === '5');
        const marriage = scoredEvents.find(e => e.id === '6');

        // Exact date + document should score significantly higher than month_year + memory
        expect(fatherDeath!.calculatedWeight).toBeGreaterThan(testCaptaincyMonth!.calculatedWeight * 2);
    });

    it('should successfully build a complete AI payload for Virat Kohli without timeline crashing', async () => {
        // Build candidate package for the EXACT birth time
        const payload = await buildCandidateDataPackage(
            kohliInput.tentativeTime,
            0,
            kohliInput,
            { includeFullData: true, dashaDepth: 5, pranaWindowDays: 10 }
        );

        expect(payload).toBeDefined();
        expect(payload.ascendant.sign).toBeDefined();
        expect(payload.vimshottariDasha.length).toBeGreaterThan(0);

        // Ensure that imprecise dates (month_year) did not panic the Transit Builder
        expect(payload.transitData).toBeDefined();
        const transitKeys = Object.keys(payload.transitData || {});
        expect(transitKeys.length).toBeGreaterThan(0);

        // Check structural integrity of transit payload, e.g. Marriage transit
    });
});
