export type OffsetPreset = '30min' | '1hour' | '2hours' | '4hours';

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

export interface PhysicalTraits {
  height: 'very short' | 'short' | 'medium' | 'tall' | 'very tall';
  build: 'thin' | 'lean' | 'medium' | 'heavy' | 'obese';
  complexion: 'very fair' | 'fair' | 'medium' | 'dark' | 'very dark';
  appearance?: string;
  marks?: string;
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
  eventDate: string;
  eventTime?: string;
  dateAccuracy: 'exact' | 'approximate' | 'rough';
  description: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

export interface RectificationSession {
  id: string;
  userId: string;
  birthData: BirthData;
  physicalTraits?: PhysicalTraits;
  lifeEvents: LifeEvent[];
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