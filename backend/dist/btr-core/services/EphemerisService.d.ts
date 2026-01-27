/**
 * 🔱 EPHEMERIS SERVICE - The Cosmic Calculator
 * =============================================
 *
 * "Grahanaam param jyotir, jyotir aditya anuttamam"
 * Among the planets, the supreme light is the Sun.
 *
 * This service calculates the exact positions of all celestial bodies
 * with NASA JPL DE431 precision. It is the foundation upon which
 * all Vedic astrology calculations rest.
 *
 * RESPONSIBILITIES:
 * - Swiss Ephemeris integration with WASM
 * - High-precision planetary calculations (0.001° accuracy)
 * - Ayanamsa calculation (Lahiri)
 * - Julian Day conversions
 * - House system calculations (Placidus, Whole Sign, KP)
 */
import { CalculationService, EphemerisSnapshot } from '../architecture/BTRSystem.js';
interface EphemerisInput {
    date: string;
    time: string;
    latitude: number;
    longitude: number;
    timezone: number;
}
interface CalculationOptions {
    includeHouses?: boolean;
    houseSystem?: 'W' | 'P' | 'K';
    includeSpeed?: boolean;
    ayanamsa?: number;
}
export declare class EphemerisService extends CalculationService {
    private swe;
    private cache;
    private isHighPrecision;
    constructor(cacheSize?: number);
    protected onInitialize(): Promise<void>;
    protected onShutdown(): Promise<void>;
    calculate(input: EphemerisInput, options?: CalculationOptions): Promise<EphemerisSnapshot>;
    private calculateWithSwissEph;
    private calculateAlgorithmic;
    private createPlanetPosition;
    private createAscendantPosition;
    private getZodiacSign;
    private getNakshatra;
    private getNakshatraPada;
    private calculateDignity;
    private getFriendlySigns;
    private getEnemySigns;
    private calculateHouse;
    private convertToUTC;
    private calculateJulianDay;
    private calculateLahiriAyanamsa;
    private calculateAlgorithmicPlanets;
    private calculateAlgorithmicAscendant;
    getCacheStats(): {
        size: number;
        maxSize: number;
    };
    clearCache(): void;
    isHighPrecisionMode(): boolean;
}
export declare const ephemerisService: EphemerisService;
export {};
//# sourceMappingURL=EphemerisService.d.ts.map