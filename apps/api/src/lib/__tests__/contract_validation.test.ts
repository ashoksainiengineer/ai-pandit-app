import { describe, it, expect } from 'vitest';
import { CandidateDataPackageSchema, TransitDataEntrySchema } from '@ai-pandit/shared';

describe('Phase E: Industrial Contract Validation', () => {
    it('should validate a typical BTR Candidate Data Package', () => {
        const mockData = {
            time: '08:30:00',
            offsetMinutes: 0,
            ascendant: {
                sign: 'Leo',
                degree: '15.5',
                nakshatra: 'Purva Phalguni'
            },
            planets: {
                'Sun': { sign: 'Aquarius', degree: 10.2, nakshatra: 'Shatabhisha', house: 7 },
                'Moon': { sign: 'Gemini', degree: 5.5, nakshatra: 'Mrigashira', house: 11 }
            },
            houseLords: {
                '1': 'Sun',
                '2': 'Mercury'
            },
            vimshottariDasha: [
                {
                    maha: 'Rahu',
                    antar: 'Jupiter',
                    pratyantar: 'Saturn',
                    startEnd: '2024-01-01 to 2024-06-01'
                }
            ],
            transitData: {
                '2024-02-15': {
                    dasha: 'Rahu-Jupiter-Saturn',
                    signatures: ['Sun in 7th'],
                    planets: {
                        'Jupiter': 'Aquarius | H 7'
                    }
                }
            }
        };

        const result = CandidateDataPackageSchema.safeParse(mockData);
        if (!result.success) {
            console.error('Contract Violation Details:', result.error.errors);
        }
        expect(result.success).toBe(true);
    });

    it('should fail on invalid dasha sequence (Zero-Trust Validation)', () => {
        const invalidDasha = {
            maha: 'Rahu',
            antar: 'Unknown', // This should fail based on TransitDataEntrySchema refinement if used there, or similar logic
            pratyantar: 'Saturn',
            start: '2024-01-01',
            end: '2024-06-01'
        };

        // Actually TransitDataEntrySchema has the 'Unknown' restriction
        const invalidTransit = {
            dasha: 'Unknown',
            signatures: [],
            planets: { 'Jupiter': 'Aries | H 1' }
        };

        const result = TransitDataEntrySchema.safeParse(invalidTransit);
        expect(result.success).toBe(false);
        expect(result.error?.errors[0].message).toContain('Dasha sequence must not be Unknown');
    });
});
