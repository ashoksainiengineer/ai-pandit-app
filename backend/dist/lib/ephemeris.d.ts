import { EphemerisData } from './types';
/**
 * Initializes the Swiss Ephemeris WASM module (Prolaxu version)
 * This must be called (and awaited) at server start.
 */
export declare function initSwissEph(): Promise<boolean>;
export declare function getZodiacSign(longitude: number): string;
export declare function getNakshatra(longitude: number): string;
export declare function getNakshatraPada(longitude: number): number;
export declare function convertToUTC(date: string, time: string, timezone: number): Date;
export declare function calculateJulianDay(date: Date): number;
export declare function calculateEphemeris(birthDate: string, birthTime: string, latitude: number, longitude: number, timezone: number | string): Promise<EphemerisData>;
export declare function isHighPrecisionMode(): boolean;
export declare function getAyanamsa(jd: number): number;
export declare function cleanup(): void;
//# sourceMappingURL=ephemeris.d.ts.map