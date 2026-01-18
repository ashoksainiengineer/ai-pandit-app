import { EphemerisData } from './types';
export interface CharaKaraka {
    planet: string;
    karakaName: string;
    degree: number;
    sign: string;
}
/**
 * Calculate Chara Karakas - Variable significators based on planetary degrees
 * This is THE foundation of Jaimini astrology
 */
export declare function calculateCharaKarakas(ephemeris: EphemerisData): CharaKaraka[];
export interface CharaDashaPeriod {
    sign: string;
    startDate: Date;
    endDate: Date;
    durationYears: number;
    signNumber: number;
}
/**
 * Calculate Chara Dasha sequence
 * Sign-based dasha system unique to Jaimini
 *
 * Duration calculation:
 * - Count from sign to its lord (including both)
 * - If lord is in same sign, duration = 12 years
 * - Exception adjustments for certain signs
 */
export declare function calculateCharaDasha(ephemeris: EphemerisData, birthDate: Date): CharaDashaPeriod[];
/**
 * Get Chara Dasha active on a date
 */
export declare function getCharaDashaForDate(periods: CharaDashaPeriod[], eventDate: Date): CharaDashaPeriod | null;
export interface JaiminiAspect {
    fromSign: string;
    toSign: string;
    aspectingPlanets: string[];
    affectedPlanets: string[];
    aspectType: 'full' | 'special';
}
/**
 * Calculate Jaimini aspects (different from Parashari)
 *
 * Jaimini Rules:
 * - Movable signs (Aries, Cancer, Libra, Cap) aspect Fixed signs except adjacent
 * - Fixed signs aspect Movable signs except adjacent
 * - Dual signs aspect each other
 */
export declare function calculateJaiminiAspects(ephemeris: EphemerisData): JaiminiAspect[];
export interface RasiDashaPeriod {
    sign: string;
    startDate: Date;
    endDate: Date;
    durationYears: number;
}
/**
 * Calculate Rasi Dasha (simple sign-based progression)
 * Each sign gets a fixed 9-year period
 * Starting from Lagna
 */
export declare function calculateRasiDasha(ephemeris: EphemerisData, birthDate: Date): RasiDashaPeriod[];
export interface TatwaDashaPeriod {
    tatwa: string;
    element: string;
    planet: string;
    startDate: Date;
    endDate: Date;
    durationYears: number;
}
/**
 * Calculate Tatwa Dasha (Element-based periods)
 * 60-year cycle based on 5 elements
 * Useful for health and body-related events
 */
export declare function calculateTatwaDasha(moonLongitude: number, birthDate: Date): TatwaDashaPeriod[];
/**
 * Get Tatwa Dasha for a date
 */
export declare function getTatwaForDate(periods: TatwaDashaPeriod[], eventDate: Date): TatwaDashaPeriod | null;
export interface TithiPraveshaData {
    year: number;
    solarReturnDate: Date;
    age: number;
    themes: string[];
}
/**
 * Calculate Solar Return dates for each year of life
 * Shows annual themes and important periods
 */
export declare function calculateTithiPravesha(sunLongitude: number, birthDate: Date, yearsToCalculate?: number): TithiPraveshaData[];
/**
 * Get Tithi Pravesha for a specific year
 */
export declare function getTithiPraveshaForYear(returns: TithiPraveshaData[], year: number): TithiPraveshaData | null;
export declare function formatCharaKarakas(karakas: CharaKaraka[]): string;
export declare function formatCharaDasha(periods: CharaDashaPeriod[]): string;
export declare function formatRasiDasha(periods: RasiDashaPeriod[]): string;
export declare function formatTatwaDasha(periods: TatwaDashaPeriod[]): string;
export declare function formatJaiminiAspects(aspects: JaiminiAspect[]): string;
/**
 * Check if Chara Dasha sign supports an event
 */
export declare function charaDashaSupportsEvent(dasha: CharaDashaPeriod, eventCategory: string, ephemeris: EphemerisData): {
    supports: boolean;
    reason: string;
    strength: number;
};
//# sourceMappingURL=jaimini-astrology.d.ts.map