import { EphemerisData } from './types';
export interface ShuddhiScore {
    passed: boolean;
    score: number;
    details: string;
}
/**
 * Approximate Sunrise (Simple Vedic method)
 * Can be replaced with exact Swiss Eph rise/set later
 */
export declare function getApproxSunrise(jd: number, timezone: string): number;
/**
 * Tatwa Shuddhi Calculation
 * Checks if the birth time falls within the correct Tatwa according to sex and weekday.
 */
export declare function calculateTatwaShuddhi(birthJd: number, sunriseJd: number, gender?: 'male' | 'female'): ShuddhiScore;
/**
 * Kunda Shuddhi Calculation
 * Lagna Longitude * 81 / 360 -> Remainder should align with Moon's Nakshatra
 */
export declare function calculateKundaShuddhi(lagnaLongitude: number, moonLongitude: number): ShuddhiScore;
/**
 * Varnada Lagna Calculation
 * Used for social status / professional inclination filtering
 */
export declare function calculateVarnadaLagna(ephemeris: EphemerisData): string;
//# sourceMappingURL=shuddhi-engine.d.ts.map