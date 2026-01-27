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



export type EventCategory =
  | 'education'
  | 'career'
  | 'marriage'
  | 'children'
  | 'family'
  | 'health'
  | 'financial'
  | 'travel'
  | 'spiritual'
  | 'legal'
  | 'public_life'
  | 'karmic_events'
  | 'identity_shifts'
  | 'other';

export const EVENT_TYPES: Record<EventCategory, string[]> = {
  education: ['School admission', 'College admission', 'Graduation', 'Higher studies'],
  career: ['Job start', 'Job change', 'Promotion', 'Business start'],
  marriage: ['Engagement', 'Wedding', 'Divorce'],
  children: ['Pregnancy', 'Birth', 'Adoption'],
  family: ['Parent death', 'Sibling birth', 'Family event'],
  health: ['Major illness', 'Surgery', 'Recovery', 'Accident'],
  financial: ['Money gain', 'Property purchase', 'Business deal'],
  travel: ['Long journey', 'Relocation', 'International travel'],
  spiritual: ['Spiritual awakening', 'Meditation retreat', 'Religious event'],
  legal: ['Court case started', 'Legal win', 'Court verdict'],
  public_life: ['Award', 'Fame spike', 'Public recognition'],
  karmic_events: ['Sudden windfall', 'Natural disaster', 'Pet loss'],
  identity_shifts: ['Weight transform', 'Nickname change', 'Appearance shift'],
  other: ['Custom event'],
};

export interface LifeEvent {
  id: string;
  category: EventCategory;
  eventType: string;
  // Flexible Date Fields - Supporting 5 precision modes
  datePrecision: 'exact_date_time' | 'exact_date' | 'date_range' | 'month_year' | 'month_range' | 'year_range';
  eventDate: string; // YYYY-MM-DD or YYYY-MM or YYYY
  endDate?: string; // For ranges
  eventTime?: string; // HH:MM for exact dates

  description: string;
  importance: 'low' | 'medium' | 'high' | 'critical';

  // UI helpers
  icon?: string;
  color?: string;
  ageAtEvent?: number;
}

export interface ForensicPhysicalTraits {
  // 🔱 Facial Forensic (Varga Markers)
  facialStructure: {
    forehead: 'broad' | 'narrow' | 'average' | 'sloping';
    eyeShape: 'deep_set' | 'prominent' | 'almond' | 'round' | 'small';
    noseType: 'sharp' | 'blunt' | 'aquiline' | 'long' | 'small';
    teethAlignment: 'perfect' | 'crooked' | 'gap' | 'large' | 'small';
    voicePitch: 'deep' | 'high' | 'medium' | 'soft' | 'raspy';
  };

  // 🔱 Skin & Hair (Saturn/Mercury/Venus signatures)
  skinHair: {
    texture: 'dry' | 'oily' | 'combination' | 'sensitive';
    hairType: 'straight' | 'curly' | 'wavy' | 'thin' | 'thick' | 'bald';
    complexion: 'very_fair' | 'fair' | 'medium' | 'dark' | 'very_dark';
    marks: string[]; // e.g., ["Mole on right cheek", "Birthmark on back"]
  };

  // 🔱 Core Build
  build: 'slim' | 'medium' | 'athletic' | 'heavy' | 'very_heavy';
  height: { cm: number; feet: number; inches: number };
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
  recurringHealthIssues: string[]; // e.g., ["Sinus", "Acidity", "Back pain"]
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
  latitude: number;   // Ecliptic Latitude
  nakshatra: string;
  nakshatraPada?: number; // 1-4, for sub-nakshatra precision
  lord: string;
  retro: boolean;
  speed: number;       // degrees per day
  longitudeSpeed?: number; // Raw speed from Swiss Eph
  distance: number;    // distance from Earth/Sun
  isCombust: boolean;
  dignity: string;     // Exalted, Own, Friend, etc.
  house: number;       // Whole sign house
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
  ashtakavarga?: any; // To be defined
  shadbala?: Record<string, ShadbalaBreakdown>;
  kpCusps?: number[];
}

export interface DivisionalChart {
  id: string; // D1, D9, D60, etc.
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
  sun: string;       // e.g. "Aries 12.42"
  moon: string;
  ascendant: string;
}

export interface SimpleAIAnalysisResult {
  rectifiedTime: string;
  accuracy: number;
  confidence: 'High' | 'Medium' | 'Low';
  reasoning: string;
  alternativeTimes: Array<{ time: string; score: number }>;
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
  time: string; // HH:MM:SS format
  offsetMinutes: number; // Positive or negative from tentative time
  offsetDescription: string; // e.g., "+15 minutes", "-45 minutes"
  priority: number; // Higher = analyze first
}

export interface CandidateAnalysis {
  time: string;
  offsetMinutes: number;
  offsetDescription: string;
  ephemerisData: EphemerisData;
  quickScore: number; // Quick pre-analysis score
  eventMatches: number; // How many events match
  shouldAnalyzeWithAI: boolean; // Is this worth analyzing with AI?
  reason: string; // Why is this ranked this way
}

export interface RankedCandidates {
  topCandidates: CandidateAnalysis[]; // Top 5 candidates for deep analysis
  allCandidates: CandidateAnalysis[]; // All candidates sorted by score
  totalAnalyzed: number;
}

export interface AIAnalysisResult {
  time: string;
  offsetMinutes: number;
  offsetDescription: string;
  score: number; // 0-100 confidence
  confidence: 'High' | 'Medium' | 'Low'; // Confidence level
  analysis: string; // Detailed analysis from AI
  thinking: string; // AI's thinking process (truncated)
  eventMatches: {
    eventType: string;
    matches: boolean;
    reason: string;
  }[];
  recommendation: string; // Should this be the rectified time?
  dashaAnalysis: string; // Which dasha during events
  transitAnalysis: string; // Transit verification
}

export interface TopCandidatesAnalysis {
  candidates: AIAnalysisResult[];
  topRecommendation: AIAnalysisResult; // #1 choice
  alternativeOptions: AIAnalysisResult[]; // Backup options
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
    alternativeTimes: Array<{ time: string; score: number }>;
    weakPoints: string[];
    recommendations: string[];
  };
  thinking?: string;
  ephemeris?: EphemerisData;
}

// ═════════════════════════════════════════════════════════════════════════════
// SECONDS-PRECISION BTR TYPES
// ═════════════════════════════════════════════════════════════════════════════

export interface SecondsPrecisionInput {
  sessionId: string;
  dateOfBirth: string;
  tentativeTime: string;
  latitude: number;
  longitude: number;
  timezone: string | number;
  lifeEvents: LifeEvent[];
  offsetConfig: TimeOffsetConfig;
  physicalTraits?: PhysicalTraits; // Legacy/Basic
  forensicTraits: ForensicTraits;   // 🔱 MANDATORY: God-Tier Matrix
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
  rectifiedTime: string;       // HH:MM:SS format
  accuracy: number;            // 0-100
  confidence: string;          // "High" | "Medium" | "Low"
  precisionLevel: 'seconds';
  marginOfError: number;       // ±X seconds
  stagesCompleted: number;
  boundaryWarnings: string[];
  methodsUsed: string[];
  processingTimeMs: number;
  analysisResult: any;        // Enriched JSON for dashboard
  narrativeManifest?: any;    // 🔱 God-Tier Narrative Context
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
  version: string;       // e.g., "1.0.0"
  sessionId: string;
  generatedAt: string;

  // 1. Input Context (Minimal)
  birthContext: {
    name: string;
    originalTime: string;
    location: string;
    offsetScan: string;
  };

  // 2. Final Rectification Result
  finalResult: {
    time: string;
    accuracy: number;
    confidence: string;
    marginOfError: number;
    methodsUsed: string[];
  };

  // 3. The "Brain" (Consolidated Reasoning)
  // We store the pure cleaned text here.
  reasoning: {
    discovery: string;    // Stage 2 (Coarse narrowing)
    refinement: string;   // Stage 5 (Method-by-method depth)
    precision: string;    // Stage 7 (Final second validation)
    summary: string;      // Final verdict
  };

  // 4. Technical Proof (The "God-Data")
  technicalProof: {
    ephemeris: EphemerisData;
    boundarySafety: {
      nakshatra: { distance: number; warning?: string };
      lagna: { distance: number; warning?: string };
      dasha: { distance: number; warning?: string };
    };
    methodologyBreakdown: {
      [key: string]: { score: number; verdict: string; details?: string };
    };
    contextualCorrelation?: number; // 🔱 Global narrative match score
  };

  // 5. Alternate Paths (Top 3 runners up)
  alternatives: Array<{
    time: string;
    score: number;
    reason: string;
  }>;
}