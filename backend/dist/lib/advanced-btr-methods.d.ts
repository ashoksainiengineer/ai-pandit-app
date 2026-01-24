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
    aspectType: 'full' | 'special';
    houseDistance: number;
    strength: number;
}
export interface ArudhaLagna {
    sign: string;
    degree: number;
    lord: string;
    strength: 'strong' | 'moderate' | 'weak';
}
export interface SpecialLagna {
    name: string;
    longitude: number;
    sign: string;
    degree: number;
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
    strength: number;
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
 * Calculate D24 (Chaturvimshamsha) Chart - Education/Knowledge
 * Each sign divided into 24 parts (1.25° each)
 */
export declare function calculateD24(longitude: number): {
    sign: string;
    degree: number;
};
/**
 * Calculate D40 (Khavedamsha) Chart - General Auspiciousness
 * Each sign divided into 40 parts (0.75° each)
 */
export declare function calculateD40(longitude: number): {
    sign: string;
    degree: number;
};
/**
 * Calculate D45 (Akshavedamsha) Chart - Character/Luck
 * Each sign divided into 45 parts (0.666° / 40 minutes each)
 */
export declare function calculateD45(longitude: number): {
    sign: string;
    degree: number;
};
/**
 * Calculate D60 (Shashtiamsha) Chart - Cyclic/Sequential
 * Each sign divided into 60 parts (0.5° each)
 * Crucial for seconds-level rectification.
 */
export declare function calculateD60(longitude: number): {
    sign: string;
    degree: number;
};
/**
 * Generate complete divisional chart for all planets
 */
export declare function generateDivisionalCharts(ephemeris: EphemerisData): Record<string, DivisionalChart>;
/**
 * Positional Strength (Shadbala-Lite)
 * Identifies Exaltation, Debilitation, and Moolatrikona.
 */
export declare function calculateShadbalaLite(ephemeris: EphemerisData): Record<string, string>;
interface PhysicalTraits {
    height?: 'short' | 'medium' | 'tall';
    build?: 'slim' | 'medium' | 'heavy';
    complexion?: 'fair' | 'medium' | 'dark';
    hairType?: 'straight' | 'curly' | 'wavy' | 'thin' | 'thick';
    prakriti?: 'vata' | 'pitta' | 'kapha' | 'vata-pitta' | 'pitta-kapha' | 'vata-kapha';
    noseType?: 'sharp' | 'blunt' | 'aquiline' | 'long' | 'small';
    appearance?: string;
}
/**
 * Score physical traits match with chart
 * High-impact method: Can eliminate 20-30% of candidates early
 */
export declare function scorePhysicalTraits(ephemeris: EphemerisData, traits: PhysicalTraits): PhysicalTraitsScore;
/**
 * Calculate Vedic Parashari Drishti (Sign-based aspects)
 * Standard Vedic Rule: All planets aspect 7th house.
 * Special Aspects: Mars (4,8), Jupiter (5,9), Saturn (3,10).
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
export interface PanchangaData {
    tithi: {
        name: string;
        number: number;
        percentage: number;
    };
    yoga: {
        name: string;
        number: number;
        percentage: number;
    };
    karana: {
        name: string;
        number: number;
    };
    weekday: string;
}
/**
 * Calculate Panchanga elements from Sun and Moon positions
 */
export declare function calculatePanchanga(ephemeris: EphemerisData, birthDate: Date): PanchangaData;
export interface BoundarySafety {
    lagnaSignBoundary: number;
    moonNakshatraBoundary: number;
    isDangerous: boolean;
}
/**
 * Calculate how close we are to critical sign/nakshatra boundaries in SECONDS
 */
export declare function calculateBoundarySafety(ephemeris: EphemerisData): BoundarySafety;
export declare function formatPanchanga(p: PanchangaData): string;
export declare function formatBoundarySafety(b: BoundarySafety): string;
export declare function formatYoginiDashaSequence(periods: YoginiDashaPeriod[]): string;
export declare function formatDivisionalCharts(charts: Record<string, DivisionalChart>): string;
export declare function formatAdvancedAspects(aspects: AspectData[]): string;
export declare function formatPhysicalTraitsAnalysis(analysis: PhysicalTraitsScore): string;
export declare function formatArudhaLagna(al: ArudhaLagna): string;
/**
 * Calculate Hora Lagna (HL) - Wealth/Status verification
 */
export declare function calculateHoraLagna(sunriseJd: number, birthJd: number, ascendantLongitude: number): SpecialLagna;
/**
 * Calculate Ghati Lagna (GL) - Power/Authority verification
 */
export declare function calculateGhatiLagna(sunriseJd: number, birthJd: number, ascendantLongitude: number): SpecialLagna;
export declare function formatSpecialLagnas(hl: SpecialLagna, gl: SpecialLagna): string;
/**
 * Calculates the full Shadbala (Sixfold Strength) for all planets.
 * Returns score in 'Rupas' (converted to 0-100 for normalization).
 */
export declare function calculateFullShadbala(ephemeris: EphemerisData): Record<string, number>;
export declare function formatShadbala(strengths: Record<string, number>): string;
/**
 * Calculate the dates when planets mature in a person's life.
 * These are pivotal years where the planet's energy fully stabilizes.
 */
export declare function calculatePlanetaryMaturation(birthDate: Date): Array<{
    planet: string;
    age: number;
    date: Date;
}>;
export declare function formatPlanetaryMaturation(maturation: Array<{
    planet: string;
    age: number;
    date: Date;
}>): string;
/**
 * Calculates Ashtakavarga Bindus for all houses.
 * Returns both individual Bhinnashtakavarga (BAV) and total Sarvashtakavarga (SAV).
 */
export declare function calculateAshtakavarga(ephemeris: EphemerisData): {
    bav: Record<string, number[]>;
    sav: number[];
};
export {};
//# sourceMappingURL=advanced-btr-methods.d.ts.map