export declare const DASHA_YEARS: Record<string, number>;
export interface DashaPeriod {
    lord: string;
    startDate: Date;
    endDate: Date;
    durationYears: number;
    subPeriods: DashaPeriod[];
}
export interface DashaAtDate {
    mahadasha: string;
    antardasha: string;
    pratyantardasha: string;
    sukshmadasha: string;
    pranadasha: string;
    mahadashaStart: Date;
    mahadashaEnd: Date;
    antardashaStart: Date;
    antardashaEnd: Date;
    pratyantarStart: Date;
    pratyantarEnd: Date;
    sukshmaStart: Date;
    sukshmaEnd: Date;
    pranaStart: Date;
    pranaEnd: Date;
    sandhiInfo?: {
        isNearTransition: boolean;
        level: number;
        distanceMinutes: number;
        transitionType: 'start' | 'end';
    };
}
/**
 * Calculate Lahiri Ayanamsa for a given Julian Day
 * Synchronized with Swiss Ephemeris for God-Tier Precision.
 */
export declare function calculateLahiriAyanamsa(julianDay: number): number;
/**
 * Convert tropical longitude to sidereal (Vedic)
 */
export declare function tropicalToSidereal(tropicalLongitude: number, julianDay: number): number;
/**
 * Calculate complete Vimshottari Dasha sequence from birth
 * This is THE most important calculation for birth time rectification
 */
export declare function calculateVimshottariDasha(moonLongitude: number, // Sidereal longitude of Moon
birthDate: Date): DashaPeriod[];
/**
 * Get Dasha active on a specific date
 * Used to verify life events
 */
/**
 * Get Dasha active on a specific date (5 levels deep)
 * Used to verify life events with GOD-TIER precision
 */
export declare function getDashaForDate(periods: DashaPeriod[], eventDate: Date): DashaAtDate | null;
/**
 * Check if a dasha supports a particular event type
 */
export declare function dashaSupportsEvent(dasha: DashaAtDate, eventCategory: string, eventType: string): {
    supports: boolean;
    strength: number;
    reason: string;
};
/**
 * Format dasha sequence for AI K2 analysis
 */
export declare function formatDashaSequence(periods: DashaPeriod[]): string;
/**
 * Format dasha for a specific date
 */
export declare function formatDashaForDate(periods: DashaPeriod[], date: Date, eventDescription: string): string;
export declare const NAKSHATRAS: {
    name: string;
    lord: string;
    deity: string;
    startDegree: number;
}[];
/**
 * Get nakshatra for a longitude
 */
export declare function getNakshatraForLongitude(siderealLongitude: number): {
    name: string;
    lord: string;
    pada: number;
    number: number;
};
/**
 * Calculate Vedic House System (Whole Sign)
 * @param ascSign Ascendant Sign Name
 * @param planetSign Planet Sign Name
 * @returns House Number (1-12)
 */
export declare function calculateHouse(ascSign: string, planetSign: string): number;
/**
 * Get the Lord of a specific house number for a given Ascendant
 */
export declare function getHouseLord(ascSign: string, houseNum: number): string;
/**
 * Calculate Planetary Dignity
 */
export declare function getDignity(planet: string, sign: string): 'Exalted' | 'Debilitated' | 'Own Sign' | 'Friendly' | 'Enemy' | 'Neutral';
/**
 * Get map of all house lords for a chart
 */
export declare function getAllHouseLords(ascSign: string): Record<number, string>;
import { DivisionalChart, EphemerisData } from './types.js';
export declare function calculateAllVargas(ephemeris: EphemerisData): Record<string, DivisionalChart>;
export interface AspectHit {
    targetPlanet?: string;
    targetHouse?: number;
    type: string;
    orb: number;
    isHit: boolean;
}
export declare function calculateFunctionalNature(ascSign: string, planet: string): {
    role: 'Benefic' | 'Malefic' | 'Neutral';
    reason: string;
};
export declare function calculateAspects(sourcePlanet: string, sourceLong: number, targetMap: Record<string, number>, // planet -> longitude
ascendantLong: number): AspectHit[];
export declare function calculateAshtakavarga(ephemeris: EphemerisData): Record<string, number[]>;
export declare function calculateShadbala(ephemeris: EphemerisData): Record<string, number>;
export interface YogaMatch {
    name: string;
    description: string;
    level: 'Mahayoga' | 'Dhanayoga' | 'Rajayoga' | 'Aristhayoga';
}
export declare function detectYogas(ephemeris: EphemerisData): YogaMatch[];
export interface DoubleTransitResult {
    isTriggered: boolean;
    saturnConnection: string;
    jupiterConnection: string;
    targetHouse: number;
}
/**
 * Double Transit Verification: Jupiter AND Saturn both influencing a house.
 * Powerful Vedic rule for event manifestation.
 */
export declare function verifyDoubleTransit(transitEphemeris: EphemerisData, birthAscSign: string, targetHouse: number): DoubleTransitResult;
//# sourceMappingURL=vedic-astrology-engine.d.ts.map