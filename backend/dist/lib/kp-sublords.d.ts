/**
 * 🔱 KP SUB-LORD CALCULATION SYSTEM (Krishnamurti Paddhati)
 * =========================================================
 *
 * The precision layer of Vedic astrology. Sub-lords divide each nakshatra
 * into 9 parts proportional to Vimshottari dasha years, enabling timing
 * accuracy to seconds level.
 *
 * KP HIERARCHY:
 * - Level 1: Star Lord (Nakshatra Lord) - 13°20' span
 * - Level 2: Sub Lord - Variable span based on dasha years
 * - Level 3: Sub-Sub Lord - Further subdivision
 * - Level 4: Sub-Sub-Sub Lord - Seconds-level precision
 *
 * REFERENCE: Vimshottari Dasha Years
 * Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
 * Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17
 * Total: 120 years
 */
export interface KPSubLordData {
    /** Level 1: Nakshatra lord (13°20' span) */
    readonly starLord: string;
    /** Level 2: Sub-lord (proportional to dasha years) */
    readonly subLord: string;
    /** Level 3: Sub-sub-lord (deeper precision) */
    readonly subSubLord: string;
    /** Level 4: Sub-sub-sub-lord (seconds-level precision) */
    readonly subSubSubLord: string;
    /** Exact span of sub-lord in degrees */
    readonly subSpan: number;
    /** Position within sub-lord (0-1) for next level calculation */
    readonly positionInSub: number;
}
export interface KPCuspalData {
    /** House number (1-12) */
    readonly house: number;
    /** Cusp longitude */
    readonly cusp: number;
    /** Sign on cusp */
    readonly sign: string;
    /** Level 1: Star lord of cusp */
    readonly starLord: string;
    /** Level 2: Sub-lord of cusp (critical for timing) */
    readonly subLord: string;
    /** Level 3: Sub-sub-lord */
    readonly subSubLord: string;
}
export interface KPEventCorrelation {
    readonly eventId: string;
    readonly eventDate: Date;
    /** Dasha lord at event time */
    readonly dashaLord: string;
    /** Is dasha lord the sub-lord of event house cusp? */
    readonly dashaLordAsCuspalSubLord: boolean;
    /** Is dasha lord the star lord of event significator? */
    readonly dashaLordAsStarLord: boolean;
    /** Correlation score (0-100) */
    readonly correlationScore: number;
    /** Timing precision indicator */
    readonly timingPrecision: 'exact' | 'close' | 'approximate';
}
/**
 * Calculate complete KP sub-lord hierarchy for a planetary longitude.
 * This is the heart of KP precision - divides each nakshatra into 9 sub-parts
 * proportional to Vimshottari dasha years.
 */
export declare function calculateKPSubLords(longitude: number): KPSubLordData;
/**
 * Calculate KP cuspal sub-lords for all 12 houses.
 * Critical for timing events to specific houses.
 */
export declare function calculateKPCuspalSubLords(cuspLongitudes: number[]): KPCuspalData[];
/**
 * Correlate event with KP sub-lord timing.
 * Returns how precisely the event timing matches KP principles.
 */
export declare function correlateEventWithKP(event: {
    id: string;
    date: Date;
    category: string;
}, dashaLord: string, cuspalSubLords: KPCuspalData[], significatorLongitudes: Record<string, number>): KPEventCorrelation;
/**
 * Calculate KP sub-lords for multiple longitudes efficiently.
 * Uses caching for repeated calculations.
 */
export declare function calculateKPSubLordsBatch(longitudes: number[]): Map<number, KPSubLordData>;
/**
 * Find time window where KP sub-lord matches target.
 * Used to narrow down birth time to specific windows.
 */
export declare function findKPSubLordWindow(baseTime: Date, targetSubLord: string, searchWindowHours: number, ephemerisCalculator: (time: Date) => number): {
    start: Date;
    end: Date;
    confidence: number;
} | null;
export declare const KP: {
    calculateSubLords: typeof calculateKPSubLords;
    calculateCuspalSubLords: typeof calculateKPCuspalSubLords;
    correlateEvent: typeof correlateEventWithKP;
    calculateBatch: typeof calculateKPSubLordsBatch;
    findSubLordWindow: typeof findKPSubLordWindow;
};
//# sourceMappingURL=kp-sublords.d.ts.map