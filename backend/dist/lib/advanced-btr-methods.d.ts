import { EphemerisData } from './types.js';
export interface YoginiDashaPeriod {
    name: string;
    planet: string;
    startDate: Date;
    endDate: Date;
    durationYears: number;
}
export interface DivisionalChart {
    chartType: string;
    planets: Record<string, {
        sign: string;
        degree: number;
        house: number;
    }>;
    ascendant: {
        sign: string;
        degree: number;
    };
}
export interface PhysicalTraitsScore {
    score: number;
    matches: string[];
    mismatches: string[];
    recommendation: string;
}
export interface AspectData {
    planet1: string;
    planet2: string;
    aspectType: string;
    exactDegrees: number;
    orb: number;
    strength: 'exact' | 'strong' | 'moderate' | 'weak';
}
export interface ArudhaLagna {
    sign: string;
    degree: number;
    lord: string;
    strength: 'strong' | 'moderate' | 'weak';
}
export interface SecondaryProgression {
    eventAge: number;
    progressedDate: Date;
    progressedPlanets: Record<string, {
        longitude: number;
        sign: string;
    }>;
    progressedAspects: AspectData[];
}
/**
 * Calculate Yogini Dasha sequence from birth
 * Complements Vimshottari Dasha for cross-verification
 */
export declare function calculateYoginiDasha(moonLongitude: number, birthDate: Date): YoginiDashaPeriod[];
/**
 * Get Yogini Dasha active on a specific date
 */
export declare function getYoginiDashaForDate(periods: YoginiDashaPeriod[], eventDate: Date): YoginiDashaPeriod | null;
/**
 * Check if Yogini Dasha supports an event type
 */
export declare function yoginiSupportsEvent(yogini: YoginiDashaPeriod, eventCategory: string, eventType: string): {
    supports: boolean;
    reason: string;
};
/**
 * Calculate D2 (Hora) Chart - Wealth/Health
 * Each sign divided into 2 parts (15° each)
 */
export declare function calculateD2(longitude: number): {
    sign: string;
    degree: number;
};
/**
 * Calculate D7 (Saptamsha) Chart - Children/Education
 * Each sign divided into 7 parts (~4.286° each)
 */
export declare function calculateD7(longitude: number): {
    sign: string;
    degree: number;
};
/**
 * Calculate D9 (Navamsha) Chart - Marriage/Dharma
 * Each sign divided into 9 parts (3.333° each)
 */
export declare function calculateD9(longitude: number): {
    sign: string;
    degree: number;
};
/**
 * Calculate D10 (Dasamsha) Chart - Career/Authority
 * Each sign divided into 10 parts (3° each)
 */
export declare function calculateD10(longitude: number): {
    sign: string;
    degree: number;
};
/**
 * Calculate D30 (Trimshamsha) Chart - Acute Events/Misfortune
 * Each sign has specific planet rulerships for 5° spans
 */
export declare function calculateD30(longitude: number): {
    sign: string;
    degree: number;
    ruler: string;
};
/**
 * Generate complete divisional chart for all planets
 */
export declare function generateDivisionalCharts(ephemeris: EphemerisData): Record<string, DivisionalChart>;
interface PhysicalTraits {
    height?: 'short' | 'medium' | 'tall';
    build?: 'slim' | 'medium' | 'heavy';
    complexion?: 'fair' | 'medium' | 'dark';
    appearance?: string;
}
/**
 * Score physical traits match with chart
 * High-impact method: Can eliminate 20-30% of candidates early
 */
export declare function scorePhysicalTraits(ephemeris: EphemerisData, traits: PhysicalTraits): PhysicalTraitsScore;
/**
 * Calculate all aspects between planets (including minor aspects)
 */
export declare function calculateAdvancedAspects(ephemeris: EphemerisData): AspectData[];
/**
 * Calculate Arudha Lagna (AL) - Shows public image and career success
 */
export declare function calculateArudhaLagna(ephemeris: EphemerisData): ArudhaLagna;
/**
 * Calculate secondary progressions for a life event
 * 1 day after birth = 1 year of life
 */
export declare function calculateSecondaryProgression(birthDate: Date, eventDate: Date, ephemerisCalculator: (date: string, time: string) => Promise<EphemerisData>): SecondaryProgression;
/**
 * Get progressed date for an event age
 */
export declare function getProgressedDate(birthDate: Date, eventAge: number): Date;
export declare function formatYoginiDashaSequence(periods: YoginiDashaPeriod[]): string;
export declare function formatDivisionalCharts(charts: Record<string, DivisionalChart>): string;
export declare function formatAdvancedAspects(aspects: AspectData[]): string;
export declare function formatPhysicalTraitsAnalysis(analysis: PhysicalTraitsScore): string;
export declare function formatArudhaLagna(al: ArudhaLagna): string;
export {};
//# sourceMappingURL=advanced-btr-methods.d.ts.map