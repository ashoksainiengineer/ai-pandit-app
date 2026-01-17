export declare const DASHA_YEARS: Record<string, number>;
export interface DashaPeriod {
    lord: string;
    startDate: Date;
    endDate: Date;
    durationYears: number;
    antardashas: AntardashaPeriod[];
}
export interface AntardashaPeriod {
    lord: string;
    startDate: Date;
    endDate: Date;
    durationDays: number;
}
export interface DashaAtDate {
    mahadasha: string;
    antardasha: string;
    pratyantardasha: string;
    mahadashaStart: Date;
    mahadashaEnd: Date;
    antardashaStart: Date;
    antardashaEnd: Date;
}
/**
 * Calculate Lahiri Ayanamsa for a given Julian Day
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
 * Format dasha sequence for Kimi K2 analysis
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
};
//# sourceMappingURL=vedic-astrology-engine.d.ts.map