// Frontend-shared types

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

export interface LifeEvent {
  id: string;  // Required to match backend schema
  category: string;
  eventType: string;
  eventDate: string;
  description: string;
  importance: 'high' | 'medium' | 'low' | 'critical';  // Required to match backend
  eventTime?: string;
  datePrecision?: 'exact_date_time' | 'exact_date' | 'date_range' | 'month_year' | 'month_range' | 'year_range';
  endDate?: string;
  icon?: string;
  isCustom?: boolean;
}

export interface PhysicalTraits {
  height?: { cm: number; feet: number; inches: number } | string | number;
  build?: string;
  complexion?: string;
  hairColor?: string;
  eyeColor?: string;
  distinguishingMarks?: string;
  // Additional fields used by Step2PhysicalTraits
  eyeShape?: string;
  foreheadHeight?: string;
  jawLine?: string;
  prakriti?: string;
  shoulderWidth?: string;
  hairType?: string;
  specialFeatures?: string;
  [key: string]: any;
}

export interface ForensicTraits {
  physical?: {
    facialStructure?: {
      forehead?: string;
      eyeShape?: string;
      noseType?: string;
      noseShape?: string;
      jawLine?: string;
      teethAlignment?: string;
      voicePitch?: string;
      ears?: string;
      lips?: string;
    };
    skinHair?: {
      texture?: string;
      hairType?: string;
      complexion?: string;
      marks?: string[];
    };
    build?: string;
    height?: { cm: number; feet: number; inches: number };
    voicePitch?: string;
  };
  psychographic?: {
    speechStyle?: string;
    decisionMaking?: string;
    stressResponse?: string;
    sleepCycle?: string;
    temperament?: string;
  };
  biological?: {
    prakriti?: string;
    sensitivity?: { heat?: string; cold?: string };
    recurringHealthIssues?: string[];
  };
  family?: {
    siblingPosition?: string;
    brotherCount?: number;
    sisterCount?: number;
    fatherStatusAtBirth?: string;
    motherHealthAtBirth?: string;
  };
  // Legacy fields for backward compatibility
  faceShape?: string;
  foreheadType?: string;
  eyebrowShape?: string;
  eyeShape?: string;
  noseShape?: string;
  lipShape?: string;
  chinType?: string;
  [key: string]: any;
}

export interface SpouseData {
  name?: string;
  dateOfBirth?: string;
  birthTime?: string;
  birthPlace?: string;
  latitude?: number;
  longitude?: number;
  timezone?: number | string;
}

export type OffsetPreset = '30min' | '1hour' | '2hours' | '4hours' | '6hours' | '12hours' | 'custom';

export interface TimeOffsetConfig {
  preset?: OffsetPreset;
  customMinutes?: number;
  description?: string;
}

export interface Session {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  fullName: string;
  dateOfBirth: string;
  tentativeTime: string;
  birthPlace: string;
  latitude: number;
  longitude: number;
  rectifiedTime?: string;
  accuracy?: number;
  confidence?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisResult {
  rectifiedTime: string;
  accuracy: number;
  confidence: string;
  candidates: Array<Record<string, unknown>>;
  analysis: Record<string, unknown>;
}
