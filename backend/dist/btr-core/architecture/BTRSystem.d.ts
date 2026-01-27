/**
 * 🔱 BIRTH TIME RECTIFICATION - LORD VISHNU ARCHITECTURE
 * ======================================================
 *
 * "Yada yada hi dharmasya glanir bhavati bharata
 *  Abhyuthanam adharmasya tadatmanam srjamyaham"
 *
 * Whenever there is confusion about birth time, I manifest this system
 * to restore cosmic order and reveal the true moment of incarnation.
 *
 * ARCHITECTURAL PRINCIPLES (Sanatan Dharma of Code):
 * ---------------------------------------------------
 * 1. Dharma (Duty)       : Every module has a single, sacred purpose
 * 2. Artha (Wealth)      : Optimal resource utilization
 * 3. Kama (Desire)       : Satisfy the user's quest for truth
 * 4. Moksha (Liberation) : Free the soul from birth time uncertainty
 *
 * COSMIC STRUCTURE:
 * -----------------
 * - Brahma (Creator)    : CandidateGenerationService
 * - Vishnu (Preserver)  : ValidationConsensusEngine
 * - Shiva (Destroyer)   : CandidateEliminationService
 * - Shakti (Power)      : AIReasoningEngine
 * - Ganesha (Wisdom)    : EdgeCaseHandler
 *
 * THE FOUR YUGAS OF ANALYSIS:
 * ---------------------------
 * 1. Satya Yuga (Coarse)    : Wide sweep, many candidates
 * 2. Treta Yuga (Refined)   : Medium grid, reduced set
 * 3. Dvapara Yuga (Fine)    : Small grid, precise analysis
 * 4. Kali Yuga (Precise)    : Micro grid, seconds precision
 */
import { EventEmitter } from 'events';
export interface BirthData {
    readonly dateOfBirth: string;
    readonly tentativeTime: string;
    readonly latitude: number;
    readonly longitude: number;
    readonly timezone: number | string;
    readonly location: string;
}
export interface LifeEvent {
    readonly id: string;
    readonly category: EventCategory;
    readonly type: string;
    readonly date: string;
    readonly time?: string;
    readonly precision: DatePrecision;
    readonly description: string;
    readonly impact: EventImpact;
}
export type EventCategory = 'education' | 'career' | 'marriage' | 'children' | 'health' | 'finance' | 'travel' | 'spiritual' | 'legal' | 'property' | 'family' | 'other';
export type DatePrecision = 'exact_datetime' | 'exact_date' | 'date_range' | 'month_year' | 'year';
export type EventImpact = 'critical' | 'major' | 'moderate' | 'minor';
export interface ForensicProfile {
    physical: PhysicalTraits;
    psychological: PsychologicalTraits;
    biological: BiologicalTraits;
    familial: FamilialTraits;
}
export interface PhysicalTraits {
    height: {
        cm: number;
        feet: number;
        inches: number;
    };
    build: 'slim' | 'medium' | 'athletic' | 'heavy';
    complexion: 'fair' | 'medium' | 'dark';
    facialFeatures: {
        forehead: 'broad' | 'narrow' | 'average';
        eyes: 'large' | 'medium' | 'small' | 'deep_set';
        nose: 'straight' | 'aquiline' | 'flat';
    };
    specialMarks: string[];
}
export interface PsychologicalTraits {
    temperament: 'choleric' | 'sanguine' | 'phlegmatic' | 'melancholic';
    speechPattern: 'fast' | 'measured' | 'slow';
    decisionStyle: 'impulsive' | 'deliberate' | 'analytical';
    stressResponse: 'aggressive' | 'withdrawn' | 'adaptive';
}
export interface BiologicalTraits {
    prakriti: 'vata' | 'pitta' | 'kapha' | 'vata_pitta' | 'pitta_kapha' | 'vata_kapha';
    sleepPattern: 'early_bird' | 'night_owl' | 'irregular';
    digestion: 'strong' | 'moderate' | 'weak';
    chronicConditions: string[];
}
export interface FamilialTraits {
    birthOrder: 'first' | 'middle' | 'last' | 'only';
    siblings: {
        brothers: number;
        sisters: number;
    };
    parents: {
        fatherStatus: 'prosperous' | 'stable' | 'struggling';
        motherHealth: 'excellent' | 'good' | 'complicated';
    };
}
export interface BTRInput {
    readonly sessionId: string;
    readonly birthData: BirthData;
    readonly lifeEvents: LifeEvent[];
    readonly forensicProfile: ForensicProfile;
    readonly offsetConfig: OffsetConfig;
    readonly spouseData?: SpouseData;
    readonly options?: BTROptions;
}
export interface OffsetConfig {
    mode: 'auto' | 'manual';
    preset?: OffsetPreset;
    customMinutes?: number;
    customSeconds?: number;
}
export type OffsetPreset = 'micro_30sec' | 'small_5min' | 'medium_30min' | 'large_2hr' | 'xlarge_6hr' | 'massive_24hr';
export interface SpouseData {
    dateOfBirth: string;
    birthTime?: string;
    latitude?: number;
    longitude?: number;
}
export interface BTROptions {
    targetAccuracy: 'standard' | 'high' | 'god_tier';
    maxProcessingTimeMs: number;
    enableAIReasoning: boolean;
    enableDeepValidation: boolean;
    confidenceThreshold: number;
}
export interface BTRResult {
    readonly rectifiedTime: string;
    readonly confidence: number;
    readonly accuracy: 'seconds' | 'minutes' | 'degrees';
    readonly marginOfError: string;
    readonly validationScore: number;
    readonly methodConsensus: MethodConsensus;
    readonly cosmicSignature: CosmicSignature;
    readonly analysisReport: AnalysisReport;
    readonly processingMetadata: ProcessingMetadata;
}
export interface MethodConsensus {
    vimshottari: number;
    yogini: number;
    chara: number;
    kalachakra: number;
    ashtakavarga: number;
    varga: number;
    transit: number;
    forensic: number;
    ai: number;
    overall: number;
}
export interface CosmicSignature {
    lagna: string;
    moonSign: string;
    moonNakshatra: string;
    sunSign: string;
    dominantElement: 'fire' | 'earth' | 'air' | 'water';
    dominantGuna: 'sattva' | 'rajas' | 'tamas';
    keyYogas: string[];
    d60Deity: string;
}
export interface AnalysisReport {
    stages: StageReport[];
    eliminatedCandidates: number;
    finalCandidates: number;
    keyFindings: string[];
    warnings: string[];
    aiReasoning: string;
}
export interface StageReport {
    stage: number;
    name: string;
    candidatesIn: number;
    candidatesOut: number;
    processingTimeMs: number;
    keyMetrics: Record<string, number>;
}
export interface ProcessingMetadata {
    startTime: Date;
    endTime: Date;
    totalDurationMs: number;
    ephemerisCalls: number;
    aiCalls: number;
    memoryPeakMB: number;
}
export declare abstract class BTRSubsystem extends EventEmitter {
    protected readonly name: string;
    protected isInitialized: boolean;
    constructor(name: string);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    protected abstract onInitialize(): Promise<void>;
    protected abstract onShutdown(): Promise<void>;
}
export declare abstract class CalculationService extends BTRSubsystem {
    abstract calculate(input: unknown): Promise<unknown>;
    protected validateInput<T>(input: unknown, validator: (data: unknown) => data is T): T;
}
export declare abstract class ValidationService extends BTRSubsystem {
    abstract validate(candidate: CandidateTime): Promise<ValidationResult>;
}
export declare class CandidateTime {
    readonly time: string;
    readonly offsetSeconds: number;
    readonly priority: number;
    metadata: CandidateMetadata;
    constructor(time: string, // HH:MM:SS
    offsetSeconds: number, // From tentative time
    priority: number, // Analysis priority (higher = analyze first)
    metadata?: CandidateMetadata);
    get isHighPriority(): boolean;
    get timeValue(): number;
}
export interface CandidateMetadata {
    ephemeris?: EphemerisSnapshot;
    dasha?: DashaSnapshot;
    vargas?: VargaSnapshot;
    scores?: Partial<MethodConsensus>;
    forensicMatch?: number;
    transitCorrelation?: number;
}
export interface EphemerisSnapshot {
    planets: Record<string, PlanetPosition>;
    ascendant: AscendantPosition;
    houses: HousePosition[];
    ayanamsa: number;
    julianDay: number;
}
export interface PlanetPosition {
    name: string;
    longitude: number;
    latitude: number;
    distance: number;
    sign: string;
    degree: number;
    nakshatra: string;
    pada: number;
    isRetrograde: boolean;
    speed: number;
    dignity: Dignity;
    house: number;
}
export type Dignity = 'exalted' | 'moolatrikona' | 'own' | 'friendly' | 'neutral' | 'enemy' | 'debilitated';
export interface AscendantPosition {
    sign: string;
    degree: number;
    longitude: number;
    nakshatra: string;
}
export interface HousePosition {
    number: number;
    sign: string;
    cusp: number;
    lord: string;
}
export interface DashaSnapshot {
    vimshottari: VimshottariDasha;
    yogini?: YoginiDasha;
    chara?: CharaDasha;
    pranaLord?: string;
}
export interface VimshottariDasha {
    mahadasha: DashaPeriod;
    antardasha: DashaPeriod;
    pratyantardasha: DashaPeriod;
    sukshmadasha?: DashaPeriod;
    pranadasha?: DashaPeriod;
}
export interface DashaPeriod {
    lord: string;
    startDate: Date;
    endDate: Date;
    durationYears: number;
}
export interface YoginiDasha {
    current: string;
    startDate: Date;
    endDate: Date;
}
export interface CharaDasha {
    currentSign: string;
    years: number;
}
export interface VargaSnapshot {
    d1: VargaChart;
    d9: VargaChart;
    d10: VargaChart;
    d60: VargaChart;
    [key: string]: VargaChart;
}
export interface VargaChart {
    name: string;
    lagna: string;
    planets: Record<string, {
        sign: string;
        degree: number;
    }>;
}
export interface ValidationResult {
    isValid: boolean;
    score: number;
    confidence: number;
    details: ValidationDetail[];
    timestamp: Date;
}
export interface ValidationDetail {
    method: string;
    score: number;
    status: 'pass' | 'fail' | 'warning';
    message: string;
}
export declare class BTRError extends Error {
    readonly code: string;
    constructor(message: string, code: string);
}
export declare class BTRValidationError extends BTRError {
    constructor(message: string);
}
export declare class BTRCalculationError extends BTRError {
    readonly subsystem: string;
    constructor(message: string, subsystem: string);
}
export declare class BTRAIError extends BTRError {
    readonly model?: string | undefined;
    constructor(message: string, model?: string | undefined);
}
export declare class BTREphemerisError extends BTRError {
    constructor(message: string);
}
export interface IBTRSystem {
    rectifyBirthTime(input: BTRInput): Promise<BTRResult>;
    validateInput(input: unknown): input is BTRInput;
    getSystemStatus(): SystemStatus;
}
export interface SystemStatus {
    isReady: boolean;
    subsystems: Record<string, boolean>;
    queueDepth: number;
    activeSessions: number;
}
/**
 * The main entry point - Vishnu himself
 * Preserves cosmic order by finding the true birth time
 */
export declare abstract class AbstractBTRSystem implements IBTRSystem {
    protected subsystems: BTRSubsystem[];
    protected isRunning: boolean;
    rectifyBirthTime(input: BTRInput): Promise<BTRResult>;
    abstract validateInput(input: unknown): input is BTRInput;
    abstract getSystemStatus(): SystemStatus;
    protected abstract executeRectification(input: BTRInput): Promise<BTRResult>;
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
}
export declare function addSeconds(time: string, seconds: number): string;
export declare function calculateTimeDifference(time1: string, time2: string): number;
export declare function determineOffsetPreset(totalSeconds: number): OffsetPreset;
export declare function formatDuration(ms: number): string;
//# sourceMappingURL=BTRSystem.d.ts.map