// ==========================================
// BIRTH DATA TYPES
// ==========================================

export interface BirthData {
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  tentativeTime: string; // HH:MM
  timeUncertainty: 'exact' | '5min' | '15min' | '30min' | '1hour' | '2hour' | '4hour' | 'unknown' | 'custom';
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone: string;
  gender: 'male' | 'female';
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  currentAge: number;
}

export interface PhysicalDescription {
  bodyStructure: 'slim' | 'average' | 'heavy' | 'athletic';
  height: 'short' | 'average' | 'tall';
  faceShape: 'round' | 'oval' | 'square' | 'angular' | 'heart';
  complexion: 'fair' | 'wheatish' | 'dark';
  distinctiveFeatures?: string;
}

// ==========================================
// LIFE EVENTS TYPES
// ==========================================

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

export interface LifeEvent {
  id: string;
  category: EventCategory;
  eventType: string;
  eventDate: string; // YYYY-MM-DD or YYYY-MM or YYYY or "YYYY-MM-DD to YYYY-MM-DD"
  dateAccuracy: 'exact' | 'month' | 'year' | 'approximate' | 'range' | 'month-range' | 'year-range';
  description: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  eventTime?: string; // HH:MM format for exact dates
  metadata?: Record<string, any>;
}

// Event type definitions by category
export const EVENT_TYPES: Record<EventCategory, string[]> = {
  education: [
    'School Completion (10th)',
    'Higher Secondary (12th)',
    'Bachelor\'s Degree Start',
    'Bachelor\'s Degree Completion',
    'Master\'s Degree Start',
    'Master\'s Degree Completion',
    'PhD Start',
    'PhD Completion',
    'Professional Certification',
    'Competitive Exam Success',
    'Education Gap',
    'Other Education Event'
  ],
  career: [
    'First Job',
    'Job Change',
    'Promotion',
    'Business Start',
    'Business Closure',
    'Major Project Success',
    'Job Loss/Termination',
    'Retirement',
    'Career Break',
    'Government Job Selection',
    'Transfer/Relocation',
    'Other Career Event'
  ],
  marriage: [
    'Marriage',
    'Engagement',
    'Meeting Future Spouse',
    'Divorce',
    'Separation',
    'Remarriage',
    'Relationship Start',
    'Relationship End',
    'Other Marriage Event'
  ],
  children: [
    'First Child Birth',
    'Second Child Birth',
    'Third Child Birth',
    'Miscarriage',
    'Stillbirth',
    'Adoption',
    'Child\'s Marriage',
    'Other Children Event'
  ],
  family: [
    'Father\'s Death',
    'Mother\'s Death',
    'Sibling\'s Death',
    'Spouse\'s Death',
    'Child\'s Death',
    'Other Family Member Death',
    'Family Property Division',
    'Family Dispute Resolution',
    'Other Family Event'
  ],
  health: [
    'Major Illness',
    'Surgery',
    'Accident/Injury',
    'Hospitalization',
    'Chronic Condition Onset',
    'Recovery from Major Illness',
    'Mental Health Issue',
    'Other Health Event'
  ],
  financial: [
    'First Property Purchase',
    'Vehicle Purchase',
    'Major Investment',
    'Business Profit/Success',
    'Financial Loss',
    'Inheritance',
    'Loan/Debt',
    'Bankruptcy',
    'Lottery/Windfall',
    'Other Financial Event'
  ],
  travel: [
    'First Foreign Trip',
    'Settlement Abroad',
    'Return from Abroad',
    'Permanent Relocation',
    'Pilgrimage',
    'Long Journey',
    'Other Travel Event'
  ],
  spiritual: [
    'Spiritual Initiation/Diksha',
    'Meeting Guru',
    'Religious Conversion',
    'Major Spiritual Experience',
    'Temple/Religious Place Visit',
    'Other Spiritual Event'
  ],
  other: [
    'Legal Issue',
    'Award/Recognition',
    'Other Significant Event'
  ]
};

// ==========================================
// ASTROLOGICAL CALCULATION TYPES
// ==========================================

export interface PlanetaryPosition {
  planet: string;
  longitude: number;
  latitude: number;
  sign: string;
  signIndex: number;
  degree: number;
  minute: number;
  second: number;
  nakshatra: string;
  nakshatraIndex: number;
  pada: number;
  retrograde: boolean;
  housePosition?: number;
}

export interface Lagna {
  sign: string;
  signIndex: number;
  degree: number;
  minute: number;
  second: number;
  nakshatra: string;
  pada: number;
  longitude: number;
}

export interface DivisionalChart {
  chartType: string;
  division: number;
  lagna: {
    sign: string;
    degree: number;
  };
  planets: {
    planet: string;
    sign: string;
    degree: number;
    house: number;
  }[];
}

export interface DashaPeriod {
  planet: string;
  startDate: Date;
  endDate: Date;
  years: number;
  balance?: number;
}

export interface VimshottariDasha {
  birthDasha: string;
  balanceYears: number;
  balanceMonths: number;
  balanceDays: number;
  sequence: DashaPeriod[];
  currentDasha: string;
  currentAntardasha: string;
}

export interface ChartCalculation {
  birthData: BirthData;
  rashi: {
    lagna: Lagna;
    planets: PlanetaryPosition[];
  };
  divisionalCharts: DivisionalChart[];
  vimshottariDasha: VimshottariDasha;
  ashtakavarga?: any;
  yogas?: string[];
}

// ==========================================
// RECTIFICATION ANALYSIS TYPES
// ==========================================

export interface EventAnalysis {
  event: LifeEvent;
  dashaBhukti: string;
  relevantCharts: string[];
  matchQuality: 'strong' | 'moderate' | 'weak' | 'mismatch';
  explanation: string;
  supportingFactors: string[];
  concerningFactors: string[];
}

export interface RectificationResult {
  originalTime: string;
  rectifiedTime: string;
  adjustmentMinutes: number;
  confidenceScore: number;
  confidenceLevel: 'very_high' | 'high' | 'moderate' | 'low';
  primaryMethod: string;
  methodsUsed: string[];
  eventAnalyses: EventAnalysis[];
  physicalVerification: {
    matches: string[];
    mismatches: string[];
    overallMatch: 'strong' | 'moderate' | 'weak';
  };
  rectifiedChart: ChartCalculation;
  recommendations: string[];
  executiveSummary: string;
}

// ==========================================
// FORM STATE TYPES
// ==========================================

export interface BTRFormState {
  step: number;
  birthData: Partial<BirthData>;
  physicalDescription: Partial<PhysicalDescription>;
  lifeEvents: LifeEvent[];
  isProcessing: boolean;
  result: RectificationResult | null;
  error: string | null;
}

// ==========================================
// API TYPES
// ==========================================

export interface CalculateRequest {
  birthData: BirthData;
  physicalDescription: PhysicalDescription;
  lifeEvents: LifeEvent[];
}

export interface CalculateResponse {
  success: boolean;
  result?: RectificationResult;
  error?: string;
}
