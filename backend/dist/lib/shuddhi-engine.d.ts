import { EphemerisData } from './types.js';
export interface ShuddhiScore {
    passed: boolean;
    score: number;
    details: string;
}
/**
 * Scientific Sunrise Approximation (Vedic Standard)
 * Accounts for Latitude and Longitude to refine Tatwa Shuddhi.
 */
export declare function getApproxSunrise(jd: number, latitude: number, longitude: number, timezone: number | string): number;
/**
 * Scientific Sunset Approximation
 */
export declare function getApproxSunset(jd: number, latitude: number, longitude: number, timezone: number | string): number;
/**
 * Tatwa Shuddhi Calculation (God-Tier Dinamaana Scale)
 * Checks if the birth time falls within the correct Tatwa.
 */
export declare function calculateTatwaShuddhi(birthJd: number, sunriseJd: number, sunsetJd: number, gender?: 'male' | 'female'): ShuddhiScore;
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