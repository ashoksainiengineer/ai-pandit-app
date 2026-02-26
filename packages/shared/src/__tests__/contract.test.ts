import { describe, it, expect } from 'vitest';
import {
    PlanetDataSchema,
    VimshottariDashaEntrySchema,
    CandidateDataPackageSchema,
    TransitDataEntrySchema,
    validateCandidateDataForAI,
} from '../schemas.js';

// ═══════════════════════════════════════════════════════════════════════════
// CONTRACT TESTS — Validate shared types that API produces & Frontend consumes
// ═══════════════════════════════════════════════════════════════════════════

describe('Shared Schemas - Contract Tests', () => {

    // ═════ PlanetDataSchema ═════

    describe('PlanetDataSchema', () => {
        it('should accept valid planet data with number degree', () => {
            const result = PlanetDataSchema.safeParse({
                sign: 'Aries',
                degree: 15.5,
                nakshatra: 'Ashwini',
                house: 1,
            });
            expect(result.success).toBe(true);
        });

        it('should accept valid planet data with string degree', () => {
            const result = PlanetDataSchema.safeParse({
                sign: 'Taurus',
                degree: '20° 15\' 30"',
            });
            expect(result.success).toBe(true);
        });

        it('should reject missing sign', () => {
            const result = PlanetDataSchema.safeParse({
                degree: 10,
            });
            expect(result.success).toBe(false);
        });

        it('should allow extra fields via passthrough', () => {
            const result = PlanetDataSchema.safeParse({
                sign: 'Leo',
                degree: 5,
                retrograde: true,
                speed: 0.98,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveProperty('retrograde');
            }
        });
    });

    // ═════ VimshottariDashaEntrySchema ═════

    describe('VimshottariDashaEntrySchema', () => {
        it('should accept valid dasha entry', () => {
            const result = VimshottariDashaEntrySchema.safeParse({
                maha: 'Venus',
                antar: 'Saturn',
                pratyantar: 'Mercury',
                sukshma: 'Jupiter',
                prana: 'Mars',
                startEnd: '2020-01-01 to 2023-05-15',
            });
            expect(result.success).toBe(true);
        });

        it('should reject empty maha dasha', () => {
            const result = VimshottariDashaEntrySchema.safeParse({
                maha: '',
                antar: 'Saturn',
                pratyantar: 'Mercury',
                sukshma: 'Jupiter',
                prana: 'Mars',
                startEnd: '2020 to 2023',
            });
            expect(result.success).toBe(false);
        });
    });

    // ═════ TransitDataEntrySchema ═════

    describe('TransitDataEntrySchema', () => {
        it('should validate transit data with house position indicator', () => {
            const result = TransitDataEntrySchema.safeParse({
                dasha: 'Venus-Saturn',
                signatures: ['Marriage yogas active'],
                planets: {
                    Jupiter: 'Taurus 10° | H7',
                    Saturn: 'Capricorn 25° | H1',
                },
            });
            expect(result.success).toBe(true);
        });

        it('should reject transit planets without house indicator', () => {
            const result = TransitDataEntrySchema.safeParse({
                dasha: 'Venus-Saturn',
                signatures: [],
                planets: {
                    Jupiter: 'Taurus 10°', // Missing | H
                },
            });
            expect(result.success).toBe(false);
        });

        it('should reject Unknown dasha', () => {
            const result = TransitDataEntrySchema.safeParse({
                dasha: 'Unknown',
                signatures: [],
                planets: {},
            });
            expect(result.success).toBe(false);
        });
    });

    // ═════ CandidateDataPackageSchema (Full Pipeline) ═════

    describe('CandidateDataPackageSchema', () => {
        const validPackage = {
            time: '08:30:00',
            offsetMinutes: 0,
            ascendant: {
                sign: 'Leo',
                degree: '15° 30\' 00"',
                nakshatra: 'Purva Phalguni',
            },
            planets: {
                Sun: { sign: 'Aries', degree: 10.5 },
                Moon: { sign: 'Taurus', degree: '20° 15\' 30"' },
            },
            houseLords: {
                1: 'Sun',
                7: 'Saturn',
            },
            vimshottariDasha: [{
                maha: 'Venus',
                antar: 'Mercury',
                pratyantar: 'Jupiter',
                sukshma: 'Mars',
                prana: 'Saturn',
                startEnd: '1990-01-01 to 1993-06-15',
            }],
        };

        it('should validate a complete candidate data package', () => {
            const result = CandidateDataPackageSchema.safeParse(validPackage);
            expect(result.success).toBe(true);
        });

        it('should validate via the helper function', () => {
            expect(() => validateCandidateDataForAI(validPackage)).not.toThrow();
        });

        it('should reject package with missing ascendant', () => {
            const incomplete = { ...validPackage, ascendant: undefined };
            const result = CandidateDataPackageSchema.safeParse(incomplete);
            expect(result.success).toBe(false);
        });

        it('should reject package with empty vimshottariDasha', () => {
            const nodashas = { ...validPackage, vimshottariDasha: [] };
            const result = CandidateDataPackageSchema.safeParse(nodashas);
            expect(result.success).toBe(false);
        });

        it('should allow extra enrichments via passthrough', () => {
            const enriched = {
                ...validPackage,
                yoginiDasha: [{ name: 'Mangala', planet: 'Mars' }],
                nadiSignals: { vargottama: ['Sun'] },
            };
            const result = CandidateDataPackageSchema.safeParse(enriched);
            expect(result.success).toBe(true);
        });
    });
});
