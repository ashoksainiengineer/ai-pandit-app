
/**
 * =================================================================
 * MASTER TYPES FILE
 * =================================================================
 * This file centralizes all shared TypeScript types for the entire
 * AI-Pandit application.
 *
 * By maintaining a single source of truth for our data structures,
 * we ensure consistency, reduce redundancy, and make refactoring
 * much easier.
 * =================================================================
 */

// --- Core Data Structures ---

export interface BirthData {
  date: string;
  time: string;
  place: string;
  latitude: number;
  longitude: number;
  timezone: string;
  gender: 'Male' | 'Female';
}

export interface PhysicalDescription {
  bodyStructure: string;
  height: string;
  faceShape: string;
  complexion: string;
  distinctiveFeatures: string;
}

export interface LifeEvent {
  id: string;
  category: 'education' | 'career' | 'marriage' | 'children' | 'family' | 'health' | 'financial' | 'travel' | 'other';
  eventType: string;
  eventDate: string;
  dateAccuracy: 'exact' | 'month' | 'year';
  description: string;
  importance: 'high' | 'medium' | 'low' | 'critical';
  ageAtEvent: number;
  eventTime?: string;
}


// --- BTR Iteration Engine Types ---

export interface BTREvent {
  eventType: 'marriage' | 'childbirth' | 'career' | 'education' | 'health' | 'travel' | 'property' | 'loss';
  date: Date;
  description: string;
  expectedPlanets: string[];
  expectedHouses: number[];
  expectedDasha: string[];
  weight: number;
}

export interface EventMatch {
  event: BTREvent;
  matchScore: number;
  matchingFactors: {
    planets: boolean;
    houses: boolean;
    dasha: boolean;
    divisional: boolean;
  };
  notes: string[];
}

export interface Discrepancy {
  event: BTREvent;
  expected: string;
  actual: string;
  severity: 'low' | 'medium' | 'high';
  suggestedAdjustment: number;
}

export interface AlternativeTime {
  time: Date;
  score: number;
  reason: string;
}

export interface BTRResult {
  originalTime: Date;
  rectifiedTime: Date;
  totalIterations: number;
  finalAlignmentScore: number;
  eventMatches: EventMatch[];
  convergenceReason: string;
  confidenceLevel: 'low' | 'medium' | 'high' | 'very_high';
  chartData: any;
  alternativeTimes: AlternativeTime[];
}


// --- BTR Workflow Types ---

export interface BTRWorkflowRequest {
  birthDetails: BirthData;
  physicalCharacteristics: PhysicalDescription;
  lifeEvents: LifeEvent[];
}

export interface BTRWorkflowResponse {
  originalBirthTime: string;
  rectifiedBirthTime: string;
  confidenceLevel: number;
  confidenceCategory: 'low' | 'medium' | 'high' | 'very_high';
  alignmentScore: number;
  totalIterations: number;
  aiAnalysis: {
    executiveSummary: string;
    keyFindings: string[];
    personalityInsights: string;
    futurePredictions: string;
  };
  eventMatches: Array<{
    event: string;
    date: string;
    matchScore: number;
    matchQuality: 'Strong' | 'Moderate' | 'Weak';
  }>;
  alternativeTimes: Array<{
    time: string;
    score: number;
    reason: string;
  }>;
  chartData: any;
  technicalDetails: {
    convergenceReason: string;
    iterationsPerformed: number;
    timeAdjustmentMinutes: number;
  };
}


// --- API Client Types ---

export interface EphemerisResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface BTRAnalysisResponse {
  success: boolean;
  data?: BTRResult;
  error?: string;
}


// --- Moonshoot AI Types ---

export interface MoonshootAIConfig {
  apiKey: string;
  baseURL?: string;
  maxRetries?: number;
  timeout?: number;
  temperature?: number;
  maxTokens?: number;
}

export interface AIAnalysisRequest {
  userData: any;
  ephemerisData: any;
  dashaData: any;
  timeSlots: any[];
}

export interface AIAnalysisResponse {
  recommendedBirthTime: string;
  confidenceLevel: number;
  analysis: {
    physicalTraitsMatch: string;
    lifeEventsCorrelation: string;
    planetaryValidation: string;
    dashasAccuracy: string;
  };
  alternativeTimes: Array<{
    time: string;
    confidence: number;
    reason: string;
  }>;
  keyFindings: string[];
  personalityInsights: string;
  futurePredictions: string;
  confidenceBreakdown: {
    physicalFeatures: number;
    eventCorrelation: number;
    dashaAlignment: number;
    advancedMethods: number;
    total: number;
  };
}

export interface TimeSlotAnalysis {
  time: string;
  score: number;
  reason: string;
}

export interface DashaData {
    vimshottariDasha: {
      currentMahadasha: string;
      currentAntardasha: string;
      currentPratyantardasha: string;
      mahadashaStartDate: string;
      mahadashaEndDate: string;
    };
    eventDashaCorrelations: Array<{
      eventId: string;
      mahadasha: string;
      antardasha: string;
      pratyantardasha: string;
      relevance: 'high' | 'medium' | 'low';
    }>;
}
  
export interface EphemerisData {
    timeSlots: Array<{
      timestamp: string;
      julianDay: number;
      planets: Record<string, { longitude: number; speed: number; house: number }>;
      houseCusps: number[];
      lunarPhase: string;
      retrogradePlanets: string[];
      nakshatras: Record<string, { name: string; pada: number; lord: string }>;
      divisionalCharts: Record<string, { lagna: number; planets: Record<string, number> }>;
    }>;
}

export interface MoonshootAIPromptData {
    userData: {
      birthData: BirthData;
      physicalDescription: PhysicalDescription;
      lifeEvents: LifeEvent[];
      relationship: 'single' | 'married' | 'in_relationship' | 'divorced' | 'widowed';
      occupation: string;
    };
    ephemerisData: EphemerisData;
    dashaData: DashaData;
    timeSlots: Array<{
      time: string;
      score: number;
      planetaryPositions: Record<string, { longitude: number; house: number }>;
    }>;
    dominantSign: string;
}
