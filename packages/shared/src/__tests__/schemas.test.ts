/**
 * 🔱 EXHAUSTIVE SHARED PACKAGE SCHEMA TESTS
 * Tests PlanetDataSchema, VimshottariDashaEntrySchema,
 * TransitPlanetSchema, TransitDataEntrySchema,
 * CandidateDataPackageSchema, validateCandidateDataForAI
 */
import { describe, it, expect } from 'vitest';
import {
    PlanetDataSchema,
    VimshottariDashaEntrySchema,
    TransitPlanetSchema,
    TransitDataEntrySchema,
    CandidateDataPackageSchema,
    validateCandidateDataForAI,
} from '../schemas.js';

// ═══════════════════════════════════════════════════════════════════════════
// PlanetDataSchema
// ═══════════════════════════════════════════════════════════════════════════

describe('PlanetDataSchema', () => {
    it('should accept valid planet data with number degree', () => {
        const result = PlanetDataSchema.safeParse({ sign: 'Aries', degree: 15.5 });
        expect(result.success).toBe(true);
    });

    it('should accept valid planet data with string degree', () => {
        const result = PlanetDataSchema.safeParse({ sign: 'Leo', degree: '22°30\'' });
        expect(result.success).toBe(true);
    });

    it('should accept optional nakshatra and house', () => {
        const result = PlanetDataSchema.safeParse({
            sign: 'Taurus', degree: 10, nakshatra: 'Rohini', house: 2,
        });
        expect(result.success).toBe(true);
    });

    it('should reject missing sign', () => {
        const result = PlanetDataSchema.safeParse({ degree: 10 });
        expect(result.success).toBe(false);
    });

    it('should reject missing degree', () => {
        const result = PlanetDataSchema.safeParse({ sign: 'Aries' });
        expect(result.success).toBe(false);
    });

    it('should passthrough extra fields', () => {
        const result = PlanetDataSchema.safeParse({
            sign: 'Gemini', degree: 5, dignity: 'exalted', shadbala: 1.5,
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect((result.data as any).dignity).toBe('exalted');
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// VimshottariDashaEntrySchema
// ═══════════════════════════════════════════════════════════════════════════

describe('VimshottariDashaEntrySchema', () => {
    it('should accept valid dasha entry', () => {
        const result = VimshottariDashaEntrySchema.safeParse({
            maha: 'Jupiter', antar: 'Venus', pratyantar: 'Mars',
            sukshma: 'Moon', prana: 'Sun', startEnd: '2020-01-01 to 2021-01-01',
        });
        expect(result.success).toBe(true);
    });

    it('should reject missing fields', () => {
        const result = VimshottariDashaEntrySchema.safeParse({
            maha: 'Jupiter', antar: 'Venus',
        });
        expect(result.success).toBe(false);
    });

    it('should reject empty strings', () => {
        const result = VimshottariDashaEntrySchema.safeParse({
            maha: '', antar: 'Venus', pratyantar: 'Mars',
            sukshma: 'Moon', prana: 'Sun', startEnd: '2020-01-01 to 2021-01-01',
        });
        // Fix from Bug 9: `.min(1)` now correctly rejects empty strings
        expect(result.success).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TransitPlanetSchema
// ═══════════════════════════════════════════════════════════════════════════

describe('TransitPlanetSchema', () => {
    it('should accept valid transit planet with house indicator', () => {
        const result = TransitPlanetSchema.safeParse('Jupiter 15°30\' Aries | H1');
        expect(result.success).toBe(true);
    });

    it('should reject planet without house indicator', () => {
        const result = TransitPlanetSchema.safeParse('Jupiter 15°30\' Aries');
        expect(result.success).toBe(false);
    });

    it('should reject empty string', () => {
        const result = TransitPlanetSchema.safeParse('');
        expect(result.success).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TransitDataEntrySchema
// ═══════════════════════════════════════════════════════════════════════════

describe('TransitDataEntrySchema', () => {
    it('should accept valid transit data', () => {
        const result = TransitDataEntrySchema.safeParse({
            dasha: 'Jupiter-Venus-Mars',
            signatures: ['benefic', 'exalted'],
            planets: { Jupiter: 'Jupiter 15° Aries | H1' },
            doubleTransit: { isTriggered: true, details: [] },
        });
        expect(result.success).toBe(true);
    });

    it('should reject Unknown dasha', () => {
        const result = TransitDataEntrySchema.safeParse({
            dasha: 'Unknown',
            signatures: [],
            planets: {},
        });
        expect(result.success).toBe(false);
    });

    it('should reject empty dasha string', () => {
        const result = TransitDataEntrySchema.safeParse({
            dasha: '',
            signatures: [],
            planets: {},
        });
        expect(result.success).toBe(false);
    });

    it('should reject planet without house indicator', () => {
        const result = TransitDataEntrySchema.safeParse({
            dasha: 'Jupiter-Venus',
            signatures: [],
            planets: { Jupiter: 'Jupiter 15° Aries' }, // Missing | H
        });
        expect(result.success).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// CandidateDataPackageSchema
// ═══════════════════════════════════════════════════════════════════════════

describe('CandidateDataPackageSchema', () => {
    const validPackage = {
        time: '14:30:00',
        offsetMinutes: 0,
        ascendant: { sign: 'Aries', degree: '15°30\'' },
        planets: {
            Sun: { sign: 'Leo', degree: '22°00\'' },
            Moon: { sign: 'Cancer', degree: '10°15\'' },
        },
        houseLords: { 1: 'Mars', 2: 'Venus', 7: 'Jupiter' },
        vimshottariDasha: [{
            maha: 'Jupiter', antar: 'Venus', pratyantar: 'Mars',
            sukshma: 'Moon', prana: 'Sun', startEnd: '2020 to 2021',
        }],
    };

    it('should accept valid candidate package', () => {
        const result = CandidateDataPackageSchema.safeParse(validPackage);
        expect(result.success).toBe(true);
    });

    it('should reject missing time', () => {
        const { time, ...noTime } = validPackage;
        const result = CandidateDataPackageSchema.safeParse(noTime);
        expect(result.success).toBe(false);
    });

    it('should reject missing ascendant', () => {
        const { ascendant, ...noAsc } = validPackage;
        const result = CandidateDataPackageSchema.safeParse(noAsc);
        expect(result.success).toBe(false);
    });

    it('should reject missing planets', () => {
        const { planets, ...noPlanets } = validPackage;
        const result = CandidateDataPackageSchema.safeParse(noPlanets);
        expect(result.success).toBe(false);
    });

    it('should reject empty vimshottariDasha array', () => {
        const result = CandidateDataPackageSchema.safeParse({
            ...validPackage, vimshottariDasha: [],
        });
        expect(result.success).toBe(false);
    });

    it('should passthrough extra fields', () => {
        const result = CandidateDataPackageSchema.safeParse({
            ...validPackage, yoginiDasha: [],
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect((result.data as any).yoginiDasha).toBeDefined();
        }
    });

    it('should accept optional transitData', () => {
        const result = CandidateDataPackageSchema.safeParse({
            ...validPackage,
            transitData: {
                'marriage-2020': {
                    dasha: 'Jupiter-Venus',
                    signatures: ['benefic'],
                    planets: { Jupiter: 'Jupiter 15° | H7' },
                    doubleTransit: { isTriggered: false, details: [] },
                },
            },
        });
        expect(result.success).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// validateCandidateDataForAI
// ═══════════════════════════════════════════════════════════════════════════

describe('validateCandidateDataForAI', () => {
    it('should return parsed data for valid input', () => {
        const valid = {
            time: '14:30:00',
            offsetMinutes: 0,
            ascendant: { sign: 'Aries', degree: '15°30\'' },
            planets: { Sun: { sign: 'Leo', degree: 22 } },
            houseLords: { 1: 'Mars' },
            vimshottariDasha: [{
                maha: 'Jupiter', antar: 'Venus', pratyantar: 'Mars',
                sukshma: 'Moon', prana: 'Sun', startEnd: '2020-2021',
            }],
        };
        const result = validateCandidateDataForAI(valid);
        expect(result.time).toBe('14:30:00');
    });

    it('should throw ZodError for invalid input', () => {
        expect(() => validateCandidateDataForAI({ time: '14:30' })).toThrow();
    });
});
