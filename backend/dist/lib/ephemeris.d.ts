import { EphemerisData } from './types.js';
declare let swe: any;
/**
 * Calculate full ephemeris for a given UTC date/time and location
 */
export declare function calculateEphemeris(dateString: string, timeString: string, latitude: number, longitude: number, timezone?: string): Promise<EphemerisData>;
export declare function isHighPrecisionMode(): boolean;
export { swe };
//# sourceMappingURL=ephemeris.d.ts.map