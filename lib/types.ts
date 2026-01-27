// Frontend-shared types

export interface BirthData {
  fullName: string;
  dateOfBirth: string;
  tentativeTime: string;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone: number;
  gender: string;
}

export interface LifeEvent {
  id?: string;
  category: string;
  eventType: string;
  eventDate: string;
  description: string;
  importance?: 'high' | 'medium' | 'low' | 'critical';
  eventTime?: string;
  datePrecision?: 'exact' | 'approximate' | 'range' | 'month_year' | 'exact_date' | 'exact_date_time' | 'exact_date_range' | 'year_range' | 'month_range';
  endDate?: string;
  icon?: string;
  isCustom?: boolean;
}

export interface PhysicalTraits {
  height?: string | { cm: number; feet: number; inches: number };
  build?: string;
  complexion?: string;
  hairColor?: string;
  eyeColor?: string;
  distinguishingMarks?: string;
  [key: string]: any;
}

export interface ForensicTraits {
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
  birthPlace?: string;
  latitude?: number;
  longitude?: number;
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
  candidates: any[];
  analysis: any;
}
