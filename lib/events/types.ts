/**
 * Enhanced Event System Types
 * Production-grade type definitions for comprehensive life event tracking
 */

export type EventImportance = 'critical' | 'high' | 'medium' | 'low';
export type EventGender = 'male' | 'female' | 'all';

export interface AgeRange {
  min: number;
  max: number;
}

export interface EventTemplate {
  id: string;
  label: string;
  description?: string;
  importance: EventImportance;
  ageRange?: AgeRange | 'all';
  gender?: EventGender;
  isCustom?: boolean;
}

export interface EventCategory {
  id: string;
  icon: string;
  label: string;
  color: string;
  description: string;
  events: EventTemplate[];
  isSensitive?: boolean;
  isCustom?: boolean;
}

export interface UserCustomCategory extends EventCategory {
  createdAt: string;
  userId: string;
}

export interface UserCustomEvent extends EventTemplate {
  categoryId: string;
  createdAt: string;
  userId: string;
}

export interface FilterCriteria {
  age?: number;
  gender?: 'male' | 'female';
  importance?: EventImportance[];
  searchQuery?: string;
}

export interface SuggestionConfig {
  ageWeight: number;
  genderWeight: number;
  importanceWeight: number;
  recencyWeight: number;
}

export const DEFAULT_SUGGESTION_CONFIG: SuggestionConfig = {
  ageWeight: 0.4,
  genderWeight: 0.2,
  importanceWeight: 0.2,
  recencyWeight: 0.2,
};
