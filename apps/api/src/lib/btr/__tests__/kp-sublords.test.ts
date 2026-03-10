import { describe, it, expect } from 'vitest';
import { calculateKPSubLords, correlateEventWithKP } from '../../kp-sublords.js';

describe('God-Tier BTR - KP Sublords', () => {

    it('should correctly calculate Star Lord and Sub Lord for Ashwini (Ketu star)', () => {
        // Ashwini is the first Nakshatra (0 - 13°20')
        // Lord is Ketu.
        // First Sub-Lord is Ketu (span proportional to 7 years in 120)

        // 0.5 degrees is early in Ashwini, should still be Ketu sub-lord
        const kpEarly = calculateKPSubLords(0.5);
        expect(kpEarly.starLord).toBe('Ketu');
        expect(kpEarly.subLord).toBe('Ketu');

        // Let's test a bit further into Ashwini
        // Sub-periods: Ketu(7), Venus(20), Sun(6), Moon(10)...
        // Total span 13.333 deg
        // Ketu span = (7/120) * 13.333 = ~0.77 deg
        // Venus span = (20/120) * 13.333 = ~2.22 deg
        // So at 1.5 degrees, we should be in Venus sub-lord
        const kpMid = calculateKPSubLords(1.5);
        expect(kpMid.starLord).toBe('Ketu');
        expect(kpMid.subLord).toBe('Venus');
    });

    it('should correctly calculate Star Lord for Rohini (Moon star)', () => {
        // Rohini is from 40° to 53°20' (Taurus 10° to 23°20')
        // Star lord is Moon. Find sublord.
        // Moon sequence: Moon, Mars, Rahu, Jupiter, Saturn, Mercury, Ketu, Venus, Sun

        // At 41°, we are 1° into Rohini. Total 13.333 span.
        // Moon(10). 10/120 * 13.333 = 1.11 degrees.
        // So 41° is within Moon sublord.
        const kpMoonFirst = calculateKPSubLords(41.0);
        expect(kpMoonFirst.starLord).toBe('Moon');
        expect(kpMoonFirst.subLord).toBe('Moon');

        // At 42.5°, we are 2.5 degrees in.
        // Moon span = 1.11°
        // Mars span = 7/120 * 13.333 = 0.77° (up to 1.88)
        // Rahu span = 18/120 * 13.333 = 2.0° (up to 3.88)
        // So 2.5 degrees is in Rahu sublord.
        const kpMoonRahu = calculateKPSubLords(42.5);
        expect(kpMoonRahu.starLord).toBe('Moon');
        expect(kpMoonRahu.subLord).toBe('Rahu');
    });

    it('should handle nakshatra boundary values without fallback misclassification', () => {
        // Exactly at the 2nd nakshatra boundary (13°20')
        const kpBoundary = calculateKPSubLords(13.333333333333334 + 1e-9);
        expect(kpBoundary.starLord).toBe('Venus');
        expect(kpBoundary.subLord).toBe('Venus');
    });

    it('should calculate deep Sub-Sub and Sub-Sub-Sub Lords', () => {
        // Just checking that they exist and map to valid lords
        const kp = calculateKPSubLords(123.4567);
        const validLords = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];

        expect(validLords).toContain(kp.starLord);
        expect(validLords).toContain(kp.subLord);
        expect(validLords).toContain(kp.subSubLord);
        expect(validLords).toContain(kp.subSubSubLord);
    });

    it('should correctly score event correlations', () => {
        const dummyEvent = { id: 'evt_1', date: new Date('2020-01-01'), category: 'marriage' };
        // Target house for marriage = 7

        // Dummy cusps
        const cuspalSubLords = [
            { house: 1, cusp: 0, sign: 'Aries', starLord: 'Ketu', subLord: 'Ketu', subSubLord: 'Ketu' },
            { house: 7, cusp: 180, sign: 'Libra', starLord: 'Rahu', subLord: 'Jupiter', subSubLord: 'Venus' }
        ];

        // Significators
        const significators = {
            venus: 42.5 // In Moon star
        };

        // If dasha lord is Jupiter, it matches 7th cusp sublord
        // -> Should be 85 score
        const corr1 = correlateEventWithKP(dummyEvent, 'Jupiter', cuspalSubLords, significators);
        expect(corr1.correlationScore).toBe(85);
        expect(corr1.dashaLordAsCuspalSubLord).toBe(true);

        // If dasha lord is Moon, it matches significator's star lord
        // -> Should be 75 score
        const corr2 = correlateEventWithKP(dummyEvent, 'Moon', cuspalSubLords, significators);
        expect(corr2.correlationScore).toBe(75);
        expect(corr2.dashaLordAsStarLord).toBe(true);

        // If dasha lord is neither
        const corr3 = correlateEventWithKP(dummyEvent, 'Mars', cuspalSubLords, significators);
        expect(corr3.correlationScore).toBe(40);
    });
});
