export type OffsetPreset = '30min' | '1hour' | '2hours' | '4hours' | 'seconds-30' | 'seconds-6' | 'custom';

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
  other: ['Custom event'],
};

export interface LifeEvent {
  id: string;
  category: EventCategory;
  eventType: string;
  // Flexible Date Fields - Supporting 5 precision modes
  datePrecision: 'exact_date_time' | 'exact_date' | 'month_year' | 'month_range' | 'year_range';
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
  specialFeatures?: string;
  overallDescription?: string;
}

export interface RectificationSession {
  id: string;
  userId: string;
  birthData: BirthData;
  physicalTraits?: PhysicalTraits;
  lifeEvents: LifeEvent[]; // Update usage to new interface
  rectifiedTime?: string;
  accuracy?: number;
  confidence?: 'high' | 'medium' | 'low';
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
  nakshatraPada?: number; // 1-4, for sub-nakshatra precision
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

export interface AIAnalysisResult {
  rectifiedTime: string;
  accuracy: number;
  confidence: 'high' | 'medium' | 'low';
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
  shouldAnalyzeWithKimi: boolean; // Is this worth analyzing with Kimi?
  reason: string; // Why is this ranked this way
}

export interface RankedCandidates {
  topCandidates: CandidateAnalysis[]; // Top 5 candidates for Kimi analysis
  allCandidates: CandidateAnalysis[]; // All candidates sorted by score
  totalAnalyzed: number;
}

export interface KimiAnalysisResult {
  time: string;
  offsetMinutes: number;
  offsetDescription: string;
  score: number; // 0-100 confidence
  confidence: 'High' | 'Medium' | 'Low'; // Confidence level
  analysis: string; // Detailed analysis from Kimi
  thinking: string; // Kimi's thinking process (truncated)
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
  candidates: KimiAnalysisResult[];
  topRecommendation: KimiAnalysisResult; // #1 choice
  alternativeOptions: KimiAnalysisResult[]; // Backup options
  processingTime: number;
}

export interface BTROutput {
  rectifiedTime: string;
  accuracy: number;
  confidence: 'high' | 'medium' | 'low';
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
  rectifiedTime: string;       // HH:MM:SS format
  accuracy: number;            // 0-100
  confidence: string;          // "High" | "Medium" | "Low"
  precisionLevel: 'seconds';
  marginOfError: number;       // ±X seconds (3-5)
  stagesCompleted: number;     // 1-10
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