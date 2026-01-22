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
//# sourceMappingURL=vedic-astrology-engine.d.ts.map