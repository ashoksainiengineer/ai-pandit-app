export type OffsetPreset = '30min' | '1hour' | '2hours' | '4hours' | '6hours' | '12hours' | 'seconds-30' | 'seconds-6';
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
export interface ForensicPhysicalTraits {
    facialStructure: {
        forehead: 'broad' | 'narrow' | 'average' | 'sloping';
        eyeShape: 'deep_set' | 'prominent' | 'almond' | 'round' | 'small';
        noseType: 'sharp' | 'blunt' | 'aquiline' | 'long' | 'small';
        teethAlignment: 'perfect' | 'crooked' | 'gap' | 'large' | 'small';
        voicePitch: 'deep' | 'high' | 'medium' | 'soft' | 'raspy';
    };
    skinHair: {
        texture: 'dry' | 'oily' | 'combination' | 'sensitive';
        hairType: 'straight' | 'curly' | 'wavy' | 'thin' | 'thick' | 'bald';
        complexion: 'very_fair' | 'fair' | 'medium' | 'dark' | 'very_dark';
        marks: string[];
    };
    build: 'slim' | 'medium' | 'athletic' | 'heavy' | 'very_heavy';
    height: {
        cm: number;
        feet: number;
        inches: number;
    };
}
export interface PsychographicDNA {
    speechStyle: 'fast_loud' | 'measured_soft' | 'argumentative' | 'concise' | 'talkative';
    decisionMaking: 'impulsive' | 'deliberate' | 'indecisive' | 'intuitive';
    stressResponse: 'aggressive' | 'withdrawn' | 'anxious' | 'calm';
    sleepCycle: 'night_owl' | 'early_bird' | 'irregular' | 'deep_sleeper';
    temperament: 'short_tempered' | 'patient' | 'jovial' | 'melancholic' | 'optimistic';
}
export interface BiologicalMarkers {
    prakriti: 'vata' | 'pitta' | 'kapha' | 'vata-pitta' | 'pitta-kapha' | 'vata-kapha';
    sensitivity: {
        heat: 'high' | 'medium' | 'low';
        cold: 'high' | 'medium' | 'low';
    };
    recurringHealthIssues: string[];
}
export interface FamilyNarrativeMatrix {
    siblingPosition: 'eldest' | 'middle' | 'youngest' | 'only_child';
    brotherCount: number;
    sisterCount: number;
    fatherStatusAtBirth: 'struggling' | 'stable' | 'prosperous' | 'highly_distinguished';
    motherHealthAtBirth: 'excellent' | 'normal' | 'weak' | 'complicated';
    firstChildInfo?: {
        gender: 'male' | 'female';
        yearOfBirth: number;
    };
}
export interface ForensicTraits {
    physical: ForensicPhysicalTraits;
    psychographic: PsychographicDNA;
    biological: BiologicalMarkers;
    family: FamilyNarrativeMatrix;
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
    clerkId: string;
    fullName: string;
    dateOfBirth: string;
    tentativeTime: string;
    birthPlace: string;
    latitude: number;
    longitude: number;
    timezone: string | number;
    gender?: string;
    physicalTraits?: any;
    lifeEvents: any;
    offsetConfig?: any;
    rectifiedTime?: string;
    accuracy?: number;
    confidence?: string;
    analysisResult?: any;
    progressData?: string;
    status: 'pending' | 'processing' | 'complete' | 'failed';
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
}
export interface ShadbalaBreakdown {
    sthana: number;
    dig: number;
    kaala: number;
    cheshta: number;
    naisargika: number;
    total: number;
}
export interface PlanetPosition {
    sign: string;
    degree: number;
    longitude: number;
    latitude: number;
    nakshatra: string;
    nakshatraPada?: number;
    lord: string;
    retro: boolean;
    speed: number;
    longitudeSpeed?: number;
    distance: number;
    isCombust: boolean;
    dignity: string;
    house: number;
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
        subLord?: string;
    };
    houses: HousePosition[];
    divisionalCharts?: Record<string, DivisionalChart>;
    ashtakavarga?: any;
    shadbala?: Record<string, ShadbalaBreakdown>;
    kpCusps?: number[];
}
export interface DivisionalChart {
    id: string;
    planets: Record<string, PlanetPosition>;
    ascendant: {
        sign: string;
        degree: number;
        longitude: number;
    };
}
export interface HousePosition {
    houseNumber: number;
    sign: string;
    degree: number;
    cusp: number;
    lord: string;
    subLord?: string;
}
/**
 * 🤏 Minified Ephemeris for HUD/Table display
 * Keeps RAM low while providing visibility.
 */
export interface MinifiedEphemeris {
    sun: string;
    moon: string;
    ascendant: string;
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
    metadata?: {
        isTentativeOrNeighbor?: boolean;
        d60Stability?: any;
        protected?: boolean;
        [key: string]: any;
    };
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
    forensicTraits: ForensicTraits;
    spouseData?: {
        dateOfBirth: string;
        birthTime: string;
        latitude: number;
        longitude: number;
        timezone: string | number;
    };
    abortSignal?: AbortSignal;
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
    analysisResult: any;
    narrativeManifest?: any;
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
                details?: string;
            };
        };
        contextualCorrelation?: number;
    };
    alternatives: Array<{
        time: string;
        score: number;
        reason: string;
    }>;
}
//# sourceMappingURL=types.d.ts.map