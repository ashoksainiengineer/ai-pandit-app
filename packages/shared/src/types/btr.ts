/**
 * 🔱 AI-Pandit BTR (Birth Time Rectification) Types
 * ==========================================
 * BTR input/output, candidate analysis, AI analysis results,
 * seconds-precision BTR pipeline types.
 */

import { LifeEvent, TimeOffsetConfig } from './core.js';
import { EphemerisData } from './ephemeris.js';

// ═════════════════════════════════════════════════════════════════════════════
// BTR INPUT/OUTPUT TYPES
// ═════════════════════════════════════════════════════════════════════════════

export interface BTRInput {
  birthDate: string;
  timeEstimate: string;
  offsetConfig: TimeOffsetConfig;
  lifeEvents: LifeEvent[];
  latitude: number;
  longitude: number;
  timezone: number;
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
    d60Stability?: Record<string, unknown>;
    protected?: boolean;
    [key: string]: unknown | boolean | undefined;
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
    alternativeTimes: Array<{ time: string; score: number }>;
    weakPoints: string[];
    recommendations: string[];
  };
  thinking?: string;
  ephemeris?: EphemerisData;
}

// ═════════════════════════════════════════════════════════════════════════════
// SECONDS PRECISION BTR TYPES
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
  analysisResult: {
    summary: string;
    finalCandidate: {
      time: string;
      score: number;
      thinking: string;
    };
    alternatives: Array<{ time: string; score: number }>;
    stageHistory: Record<number, { candidatesIn: number; candidatesOut: number }>;
  };
  narrativeManifest?: {
    birthContext: string;
    technicalHighlight: string;
    spiritualSummary: string;
  };
}
