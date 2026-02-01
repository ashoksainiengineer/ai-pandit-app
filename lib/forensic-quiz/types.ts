/**
 * Forensic Quiz System Types
 * Quiz-based identification for birth time rectification
 * God Tier BTR Implementation
 */

export type Dosha = 'vata' | 'pitta' | 'kapha';
export type ForeheadType = 'broad_high' | 'narrow' | 'sloping' | 'prominent' | 'low_receding';
export type EyeType = 'deep_set' | 'prominent' | 'almond' | 'round' | 'small_intense' | 'large_luminous';
export type VoiceType = 'deep' | 'high_pitch' | 'soft' | 'raspy' | 'resonant' | 'nasal';
export type SpeechType = 'fast_loud' | 'measured' | 'logical' | 'concise' | 'talkative';
export type DecisionType = 'impulsive' | 'deliberate' | 'over_analytical' | 'emotionally_swayed' | 'intuitive' | 'fear_based';
export type TemperamentType = 'calm_stable' | 'quick_anger' | 'anxious_worried' | 'enthusiastic' | 'melancholic' | 'adaptive';
export type BirthOrder = 'eldest' | 'middle' | 'youngest' | 'only_child';
export type FatherStatus = 'struggling' | 'working_class' | 'professional' | 'business_owner' | 'prosperous' | 'distinguished';

export interface QuizOption {
  id: string;
  label: string;
  emoji: string;
  description?: string;
  planetarySignature: string[];
  doshaScore?: { vata?: number; pitta?: number; kapha?: number };
  weight: number;
}

export interface QuizQuestion {
  id: string;
  category: 'prakriti' | 'forehead' | 'eyes' | 'voice' | 'speech' | 'decision' | 'temperament' | 'family' | 'marks';
  question: string;
  context?: string;
  allowMultiple: boolean;
  options: QuizOption[];
  hasNotSureOption: boolean;
  allowCustomAnswer?: boolean; // Allow user to type their own answer
  customAnswerPlaceholder?: string; // Placeholder text for custom answer input
  confidenceImpact: number; // How much "not sure" reduces confidence
}

export interface QuizAnswer {
  questionId: string;
  selectedOptions: string[];
  isNotSure: boolean;
  customAnswer?: string; // For user-provided custom text answers
  timestamp: number;
}

export interface PrakritiResult {
  primary: Dosha;
  secondary?: Dosha;
  scores: { vata: number; pitta: number; kapha: number };
  confidence: number;
}

export interface TraitResult {
  type: string;
  confidence: number;
  planetaryIndicators: string[];
}

export interface FamilyResult {
  birthOrder: BirthOrder;
  fatherStatus: FatherStatus;
  confidence: number;
}

export interface QuizResults {
  prakriti: PrakritiResult;
  forehead: TraitResult;
  eyes: TraitResult;
  voice: TraitResult;
  speech: TraitResult;
  decision: TraitResult;
  temperament: TraitResult;
  family: FamilyResult;
  overallConfidence: number;
  answers: QuizAnswer[];
  completedAt: number;
}

export interface QuizState {
  currentQuestionIndex: number;
  answers: QuizAnswer[];
  isComplete: boolean;
  startedAt: number;
}

export interface QuizProgress {
  current: number;
  total: number;
  percentage: number;
  categoryProgress: Record<string, { answered: number; total: number }>;
}

export interface ForensicTraitMapping {
  trait: string;
  planetaryRulers: string[];
  houseAssociations: number[];
  btrWeight: number; // How much this trait affects birth time calculation
  verificationMethod: string;
}

// For compatibility with existing ForensicTraits interface
export interface LegacyForensicTraits {
  physical?: {
    facialStructure?: {
      forehead?: ForeheadType;
      eyeShape?: EyeType;
      voicePitch?: VoiceType;
    };
    skinHair?: {
      marks?: string[];
    };
  };
  biological?: {
    prakriti?: Dosha | `${Dosha}-${Dosha}`;
  };
  psychographic?: {
    speechStyle?: SpeechType;
    decisionMaking?: DecisionType;
    temperament?: TemperamentType;
    stressResponse?: string;
    sleepCycle?: string;
  };
  family?: {
    siblingPosition?: BirthOrder;
    fatherStatusAtBirth?: FatherStatus;
  };
}
