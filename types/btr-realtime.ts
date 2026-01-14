/**
 * Real-time BTR Display System Types
 */

export interface BTRPhase {
  id: 'initialization' | 'phase1' | 'phase2' | 'phase3' | 'finalization' | 'complete';
  name: string;
  description: string;
  progressWeight: number; // Percentage of total progress
}

export interface SwissEphCalculation {
  id: string;
  timestamp: Date;
  candidateTime: string;
  calculations: {
    julianDay?: string;
    ascendant?: {
      sign: string;
      degree: number;
      nakshatra: string;
      pada: number;
    };
    moon?: {
      sign: string;
      degree: number;
      nakshatra: string;
      pada: number;
    };
    birthDasha?: {
      planet: string;
      yearsRemaining: number;
    };
    divisionalCharts?: {
      d9: string;
      d10: string;
    };
    yogas?: Array<{
      name: string;
      houses: string;
      strength: 'strong' | 'moderate' | 'weak';
    }>;
  };
}

export interface AIAnalysis {
  id: string;
  candidateTime: string;
  status: 'analyzing' | 'complete' | 'error';
  overallScore?: number;
  breakdown?: {
    ascendantMatch: number;
    dashaCorrelation: number;
    divisionalHarmony: number;
    yogaTiming: number;
  };
  insights?: Array<{
    type: 'success' | 'warning' | 'error';
    message: string;
    icon: '✓' | '⚠' | '✗';
  }>;
  processingTime?: number;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'calculation' | 'ai' | 'result' | 'error';
  message: string;
  details?: string;
  candidateNumber?: number;
  candidateTime?: string;
}

export interface BTRProgressUpdate {
  phase: BTRPhase;
  overallProgress: number; // 0-100
  timeElapsed: number; // seconds
  estimatedRemaining: number; // seconds
  currentCandidate?: {
    number: number;
    time: string;
    score?: number;
  };
  bestCandidate?: {
    time: string;
    score: number;
  };
  swissEphCalculations: SwissEphCalculation[];
  aiAnalyses: AIAnalysis[];
  activityLog: ActivityLogEntry[];
}

export interface FinalBTRReport {
  executiveSummary: {
    originalTime: string;
    rectifiedTime: string;
    adjustment: string;
    confidence: number;
    confidenceCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    candidatesTested: number;
    duration: string;
  };
  rectifiedChart: {
    ascendant: {
      sign: string;
      degree: number;
      nakshatra: string;
      pada: number;
    };
    moon: {
      sign: string;
      degree: number;
      nakshatra: string;
      pada: number;
    };
    birthDasha: {
      planet: string;
      yearsRemaining: number;
    };
    planetaryPositions: Array<{
      planet: string;
      sign: string;
      degree: number;
      nakshatra: string;
      retrograde: boolean;
    }>;
    divisionalCharts: {
      d9: string;
      d10: string;
      d7?: string;
      d12?: string;
      d30?: string;
    };
    yogas: Array<{
      name: string;
      description: string;
      strength: 'strong' | 'moderate' | 'weak';
    }>;
  };
  eventCorrelations: Array<{
    event: string;
    date: string;
    expected: string;
    actual: string;
    quality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    score: number;
    reasoning: string;
  }>;
  scoringBreakdown: {
    dashaEvent: { score: number; max: number; percentage: number };
    ascendant: { score: number; max: number; percentage: number };
    divisional: { score: number; max: number; percentage: number };
    yogas: { score: number; max: number; percentage: number };
    total: { score: number; max: number; percentage: number };
  };
  supportingEvidence: Array<{
    type: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  redFlags: Array<{
    issue: string;
    severity: 'low' | 'medium' | 'high';
    recommendation: string;
  }>;
  alternativeTimes: Array<{
    time: string;
    score: number;
    rank: number;
  }>;
  recommendations: {
    primary: string;
    secondary: string[];
    nextSteps: string[];
  };
  methodology: {
    ayanamsa: string;
    houseSystem: string;
    dashaSystem: string;
    divisionalCharts: string[];
    aiModel: string;
    precision: string;
    iterations: number;
    references: string[];
  };
}