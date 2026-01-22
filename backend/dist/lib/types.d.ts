export type OffsetPreset = '30min' | '1hour' | '2hours' | '4hours' | 'seconds-30' | 'seconds-6';
export interface TimeOffsetConfig {
    preset?: OffsetPreset;
    customMinutes?: number;
    description: string;
}
export interface BirthData {
    fullName: string;
    dateOfBirth: string;
    tentativeTime: string;
    birthPlace: string;
    latitude: number;
    longitude: number;
    timezone: number;
    gender: 'male' | 'female' | 'other';
}
export type EventCategory = 'education' | 'career' | 'marriage' | 'children' | 'family' | 'health' | 'financial' | 'travel' | 'spiritual' | 'legal' | 'public_life' | 'karmic_events' | 'identity_shifts' | 'other';
export declare const EVENT_TYPES: Record<EventCategory, string[]>;
export interface LifeEvent {
    id: string;
    category: EventCategory;
    eventType: string;
    datePrecision: 'exact_date_time' | 'exact_date' | 'date_range' | 'month_year' | 'month_range' | 'year_range';
    eventDate: string;
    endDate?: string;
    eventTime?: string;
    description: string;
    importance: 'low' | 'medium' | 'high' | 'critical';
    icon?: string;
    color?: string;
    ageAtEvent?: number;
}
export interface PhysicalTraits {
    height?: {
        cm: number;
        feet: number;
        inches: number;
    };
    build: 'slim' | 'medium' | 'athletic' | 'heavy' | 'very_heavy';
    complexion: 'very_fair' | 'fair' | 'medium' | 'dark' | 'very_dark';
    faceShape: 'round' | 'oval' | 'square' | 'long' | 'heart' | 'pear';
    eyeColor: string;
    hairColor: string;
    hairType?: 'straight' | 'curly' | 'wavy' | 'thin' | 'thick';
    prakriti?: 'vata' | 'pitta' | 'kapha' | 'vata-pitta' | 'pitta-kapha' | 'vata-kapha';
    noseType?: 'sharp' | 'blunt' | 'aquiline' | 'long' | 'small';
    specialFeatures?: string;
    overallDescription?: string;
}
export interface RectificationSession {
    id: string;
    userId: string;
    birthData: BirthData;
    physicalTraits?: PhysicalTraits;
    lifeEvents: LifeEvent[];
    rectifiedTime?: string;
    accuracy?: number;
    confidence?: 'High' | 'Medium' | 'Low';
    analysisResult?: any;
    createdAt: Date;
    updatedAt: Date;
    status: 'pending' | 'processing' | 'complete' | 'failed';
}
export interface PlanetPosition {
    sign: string;
    degree: number;
    longitude: number;
    nakshatra: string;
    nakshatraPada?: number;
    lord: string;
    retro: boolean;
}
export interface EphemerisData {
    planets: {
        sun: PlanetPosition;
        moon: PlanetPosition;
        mercury: PlanetPosition;
        venus: PlanetPosition;
        mars: PlanetPosition;
        jupiter: PlanetPosition;
        saturn: PlanetPosition;
        rahu: PlanetPosition;
        ketu: PlanetPosition;
    };
    ascendant: {
        sign: string;
        degree: number;
        nakshatra: string;
        longitude: number;
    };
    houses: HousePosition[];
}
export interface HousePosition {
    houseNumber: number;
    sign: string;
    degree: number;
    cusp: number;
}
export interface SimpleAIAnalysisResult {
    rectifiedTime: string;
    accuracy: number;
    confidence: 'High' | 'Medium' | 'Low';
    reasoning: string;
    alternativeTimes: Array<{
        time: string;
        score: number;
    }>;
    eventAnalysis: Array<{
        eventDate: string;
        expectedPlanets: string[];
        actualPlanets: string[];
        matchScore: number;
    }>;
}
export interface BTRInput {
    birthDate: string;
    timeEstimate: string;
    offsetConfig: TimeOffsetConfig;
    lifeEvents: LifeEvent[];
    latitude: number;
    longitude: number;
    timezone: number;
    physicalTraits?: PhysicalTraits;
}
export interface CandidateTime {
    time: string;
    offsetMinutes: number;
    offsetDescription: string;
    priority: number;
}
export interface CandidateAnalysis {
    time: string;
    offsetMinutes: number;
    offsetDescription: string;
    ephemerisData: EphemerisData;
    quickScore: number;
    eventMatches: number;
    shouldAnalyzeWithAI: boolean;
    reason: string;
}
export interface RankedCandidates {
    topCandidates: CandidateAnalysis[];
    allCandidates: CandidateAnalysis[];
    totalAnalyzed: number;
}
export interface AIAnalysisResult {
    time: string;
    offsetMinutes: number;
    offsetDescription: string;
    score: number;
    confidence: 'High' | 'Medium' | 'Low';
    analysis: string;
    thinking: string;
    eventMatches: {
        eventType: string;
        matches: boolean;
        reason: string;
    }[];
    recommendation: string;
    dashaAnalysis: string;
    transitAnalysis: string;
}
export interface TopCandidatesAnalysis {
    candidates: AIAnalysisResult[];
    topRecommendation: AIAnalysisResult;
    alternativeOptions: AIAnalysisResult[];
    processingTime: number;
}
export interface BTROutput {
    rectifiedTime: string;
    accuracy: number;
    confidence: 'High' | 'Medium' | 'Low';
    processingTime: number;
    analysis: {
        eventAnalysis: Array<{
            eventDate: string;
            expectedPlanets: string[];
            actualPlanets: string[];
            matchScore: number;
        }>;
        alternativeTimes: Array<{
            time: string;
            score: number;
        }>;
        weakPoints: string[];
        recommendations: string[];
    };
    thinking?: string;
    ephemeris?: EphemerisData;
}
export interface SecondsPrecisionInput {
    sessionId: string;
    dateOfBirth: string;
    tentativeTime: string;
    latitude: number;
    longitude: number;
    timezone: string | number;
    lifeEvents: LifeEvent[];
    offsetConfig: TimeOffsetConfig;
    physicalTraits?: PhysicalTraits;
    spouseData?: {
        dateOfBirth: string;
        birthTime: string;
        latitude: number;
        longitude: number;
        timezone: string | number;
    };
}
export interface SecondsPrecisionResult {
    rectifiedTime: string;
    accuracy: number;
    confidence: string;
    precisionLevel: 'seconds';
    marginOfError: number;
    stagesCompleted: number;
    boundaryWarnings: string[];
    methodsUsed: string[];
    processingTimeMs: number;
    analysisResult: string;
}
export interface BoundarySafetyResult {
    isSafe: boolean;
    warnings: BoundaryWarning[];
    nakshatraDistance: number;
    lagnaDistance: number;
    houseDistance: number;
    overallRisk: 'low' | 'medium' | 'high';
    recommendations: string[];
}
export interface BoundaryWarning {
    type: 'nakshatra' | 'lagna' | 'house' | 'dasha';
    message: string;
    distanceSeconds: number;
    severity: 'low' | 'medium' | 'high';
}
/**
 * 🏆 GOD-TIER ARCHIVE STRUCTURE
 *
 * This is the ultimate, compressed JSON record of the entire BTR journey.
 * Optimized for Turso storage while preserving 100% of the reasoning and technical proof.
 */
export interface MasterAnalysisArchive {
    version: string;
    sessionId: string;
    generatedAt: string;
    birthContext: {
        name: string;
        originalTime: string;
        location: string;
        offsetScan: string;
    };
    finalResult: {
        time: string;
        accuracy: number;
        confidence: string;
        marginOfError: number;
        methodsUsed: string[];
    };
    reasoning: {
        discovery: string;
        refinement: string;
        precision: string;
        summary: string;
    };
    technicalProof: {
        ephemeris: EphemerisData;
        boundarySafety: {
            nakshatra: {
                distance: number;
                warning?: string;
            };
            lagna: {
                distance: number;
                warning?: string;
            };
            dasha: {
                distance: number;
                warning?: string;
            };
        };
        methodologyBreakdown: {
            [key: string]: {
                score: number;
                verdict: string;
            };
        };
    };
    alternatives: Array<{
        time: string;
        score: number;
        reason: string;
    }>;
}
//# sourceMappingURL=types.d.ts.map