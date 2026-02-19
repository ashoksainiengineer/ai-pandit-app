/**
 * Event Scorer Module
 *
 * Calculates confidence scores for life events based on:
 * - Source reliability (document, memory, approximate)
 * - Date precision (exact, month, year, approximate)
 * - User-selected importance (critical, high, medium, low) - NOW RESPECTED!
 * - Category-specific weighting
 *
 * Higher confidence events have more influence on rectification.
 */

import {
  BtrEvent,
  EventConfidence,
  DATE_PRECISION_MULTIPLIERS,
  SOURCE_MULTIPLIERS,
  EVENT_HOUSE_MAP,
  EVENT_SIGNIFICATORS
} from './types.js';
import {
  EVENT_IMPORTANCE_WEIGHTS,
  IMPORTANCE_TO_IMPACT,
  VEDIC_EVENT_IMPORTANCE,
  EventImportance,
  getEventWeightFromImportance,
  getDefaultImportance,
} from './god-tier-weights.js';

export interface EventScoringOptions {
  defaultSource?: 'document' | 'memory' | 'approximate';
  defaultPrecision?: 'exact' | 'month' | 'year' | 'approximate';
  minReliabilityThreshold?: number;
}

export interface ScoredEvent extends BtrEvent {
  calculatedWeight: number;
  reliabilityScore: number;
  categoryWeight: number;
  sourceMultiplier: number;
  precisionMultiplier: number;
}

export interface EventScoreSummary {
  totalEvents: number;
  totalWeight: number;
  averageReliability: number;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  lowConfidenceCount: number;
  categoryDistribution: Record<string, number>;
  recommendations: string[];
}

const CATEGORY_IMPACT_MAP: Record<string, 'critical' | 'major' | 'moderate' | 'minor'> = {
  marriage: 'critical',
  divorce: 'critical',
  children: 'critical',
  career: 'major',
  education: 'major',
  health: 'major',
  accident: 'major',
  surgery: 'major',
  property: 'major',
  finance: 'moderate',
  travel: 'minor',
  relocation: 'moderate',
  spiritual: 'minor',
  legal: 'major',
  family: 'moderate',
  business: 'major',
  inheritance: 'moderate',
  awards: 'minor',
  death_relative: 'major',
  promotion: 'moderate'
};

const LEGACY_IMPACT_WEIGHTS = {
  critical: 5.0,
  major: 3.0,
  moderate: 2.0,
  minor: 1.0
};

const MINIMUM_RELIABLE_SCORE = 0.3;
const OPTIMAL_EVENT_COUNT = 10;
const MINIMUM_EVENT_COUNT = 5;

/**
 * Calculate confidence for a single event
 */
export function calculateEventConfidence(
  event: Partial<BtrEvent>,
  options: EventScoringOptions = {}
): EventConfidence {
  const {
    defaultSource = 'memory',
    defaultPrecision = 'exact'
  } = options;
  
  const source = event.confidence?.source || 
                 (event as any).source || 
                 defaultSource;
  
  const datePrecision = event.datePrecision || 
                        (event as any).datePrecision || 
                        defaultPrecision;
  
  const sourceMultiplier = SOURCE_MULTIPLIERS[source] || 1.0;
  const precisionMultiplier = DATE_PRECISION_MULTIPLIERS[datePrecision] || 0.5;
  
  const baseReliability = determineBaseReliability(source);
  const reliabilityScore = baseReliability * sourceMultiplier * precisionMultiplier;
  
  const level = determineConfidenceLevel(reliabilityScore);
  const weight = calculateWeight(level, reliabilityScore);
  
  return {
    level,
    source,
    datePrecision,
    weight,
    reliabilityScore: Math.min(1.0, reliabilityScore)
  };
}

/**
 * Score a batch of events
 * 
 * 🔱 CRITICAL: User's 'importance' selection is NOW RESPECTED!
 * Priority: User's importance > Event's impact > Category default
 */
export function scoreEvents(
  events: Array<Partial<BtrEvent>>,
  options: EventScoringOptions = {}
): ScoredEvent[] {
  return events.map(event => {
    const confidence = calculateEventConfidence(event, options);
    const category = event.category || 'general';
    
    // 🔱 PRIORITY 1: User's selected importance (FRONTEND)
    // This is the PRIMARY weight factor - user knows best!
    const userImportance = (event as any).importance as EventImportance | undefined;
    
    // 🔱 PRIORITY 2: Event's impact (if explicitly set)
    const explicitImpact = event.impact;
    
    // 🔱 PRIORITY 3: Category-based default
    const categoryDefault = CATEGORY_IMPACT_MAP[category] || 'moderate';
    
    // Calculate final weight
    let impactWeight: number;
    let finalImpact: 'critical' | 'major' | 'moderate' | 'minor';
    
    if (userImportance) {
      // User's selection takes HIGHEST priority
      impactWeight = getEventWeightFromImportance(userImportance);
      finalImpact = IMPORTANCE_TO_IMPACT[userImportance];
    } else if (explicitImpact) {
      // Use explicit impact if set
      impactWeight = LEGACY_IMPACT_WEIGHTS[explicitImpact] || 2.0;
      finalImpact = explicitImpact;
    } else {
      // Fall back to category default
      impactWeight = LEGACY_IMPACT_WEIGHTS[categoryDefault] || 2.0;
      finalImpact = categoryDefault;
    }
    
    const eventHouse = EVENT_HOUSE_MAP[category] || event.eventHouse || 1;
    const significators = EVENT_SIGNIFICATORS[category] || event.significators || [];
    
    const calculatedWeight = confidence.weight * impactWeight;
    
    return {
      id: event.id || generateEventId(),
      type: event.type || category,
      category,
      eventDate: event.eventDate || new Date(),
      datePrecision: confidence.datePrecision,
      description: event.description || `${category} event`,
      impact: finalImpact,
      confidence,
      eventHouse,
      significators,
      calculatedWeight,
      reliabilityScore: confidence.reliabilityScore,
      categoryWeight: impactWeight,
      sourceMultiplier: SOURCE_MULTIPLIERS[confidence.source],
      precisionMultiplier: DATE_PRECISION_MULTIPLIERS[confidence.datePrecision]
    };
  });
}

/**
 * Generate summary of scored events
 */
export function generateScoreSummary(scoredEvents: ScoredEvent[]): EventScoreSummary {
  const totalWeight = scoredEvents.reduce((sum, e) => sum + e.calculatedWeight, 0);
  const averageReliability = scoredEvents.reduce((sum, e) => sum + e.reliabilityScore, 0) / 
                             Math.max(1, scoredEvents.length);
  
  const highConfidenceCount = scoredEvents.filter(e => e.confidence.level === 'high').length;
  const mediumConfidenceCount = scoredEvents.filter(e => e.confidence.level === 'medium').length;
  const lowConfidenceCount = scoredEvents.filter(e => e.confidence.level === 'low').length;
  
  const categoryDistribution: Record<string, number> = {};
  for (const event of scoredEvents) {
    categoryDistribution[event.category] = (categoryDistribution[event.category] || 0) + 1;
  }
  
  const recommendations = generateRecommendations(scoredEvents);
  
  return {
    totalEvents: scoredEvents.length,
    totalWeight,
    averageReliability,
    highConfidenceCount,
    mediumConfidenceCount,
    lowConfidenceCount,
    categoryDistribution,
    recommendations
  };
}

/**
 * Filter events by minimum reliability threshold
 */
export function filterReliableEvents(
  scoredEvents: ScoredEvent[],
  minThreshold: number = MINIMUM_RELIABLE_SCORE
): ScoredEvent[] {
  return scoredEvents.filter(event => 
    event.reliabilityScore >= minThreshold
  );
}

/**
 * Rank events by weight (highest first)
 */
export function rankEventsByWeight(scoredEvents: ScoredEvent[]): ScoredEvent[] {
  return [...scoredEvents].sort((a, b) => b.calculatedWeight - a.calculatedWeight);
}

/**
 * Get top N most reliable events
 */
export function getTopEvents(scoredEvents: ScoredEvent[], n: number = 5): ScoredEvent[] {
  return rankEventsByWeight(scoredEvents).slice(0, n);
}

/**
 * Validate event collection for rectification
 */
export function validateEventCollection(scoredEvents: ScoredEvent[]): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  if (scoredEvents.length < MINIMUM_EVENT_COUNT) {
    issues.push(`Only ${scoredEvents.length} events provided. Minimum ${MINIMUM_EVENT_COUNT} required.`);
    suggestions.push('Add more documented life events for better accuracy.');
  }
  
  if (scoredEvents.length < OPTIMAL_EVENT_COUNT) {
    suggestions.push(`For best results, provide ${OPTIMAL_EVENT_COUNT}+ events.`);
  }
  
  const highConfidenceEvents = scoredEvents.filter(e => e.confidence.level === 'high');
  if (highConfidenceEvents.length < 2) {
    issues.push('Insufficient high-confidence events.');
    suggestions.push('Add events with documented dates (marriage, graduation, job joining).');
  }
  
  const categories = new Set(scoredEvents.map(e => e.category));
  if (categories.size < 3) {
    issues.push('Limited event category diversity.');
    suggestions.push('Include events from different life areas (career, family, health).');
  }
  
  const hasCareerEvent = scoredEvents.some(e => 
    ['career', 'promotion', 'business', 'education'].includes(e.category)
  );
  const hasFamilyEvent = scoredEvents.some(e => 
    ['marriage', 'children', 'family'].includes(e.category)
  );
  
  if (!hasCareerEvent) {
    suggestions.push('Add career or education events for better timing precision.');
  }
  if (!hasFamilyEvent) {
    suggestions.push('Add family events (marriage, children) for relationship timing.');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
}

/**
 * Calculate weighted event score for rectification
 */
export function calculateWeightedEventScore(
  eventMatches: Array<{
    eventId: string;
    score: number;
    details?: string;
  }>,
  scoredEvents: ScoredEvent[]
): number {
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const match of eventMatches) {
    const event = scoredEvents.find(e => e.id === match.eventId);
    if (!event) continue;
    
    totalScore += match.score * event.calculatedWeight;
    totalWeight += event.calculatedWeight;
  }
  
  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function determineBaseReliability(source: string): number {
  const reliabilityMap: Record<string, number> = {
    document: 0.95,
    memory: 0.70,
    calculated: 0.85,
    approximate: 0.40
  };
  return reliabilityMap[source] || 0.50;
}

function determineConfidenceLevel(reliability: number): 'high' | 'medium' | 'low' {
  if (reliability >= 0.80) return 'high';
  if (reliability >= 0.50) return 'medium';
  return 'low';
}

function calculateWeight(level: 'high' | 'medium' | 'low', reliability: number): number {
  const levelWeights = { high: 3.0, medium: 1.5, low: 0.5 };
  const baseWeight = levelWeights[level];
  const reliabilityAdjustment = 0.5 + (reliability * 0.5);
  return baseWeight * reliabilityAdjustment;
}

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function generateRecommendations(scoredEvents: ScoredEvent[]): string[] {
  const recommendations: string[] = [];
  const summary = {
    high: scoredEvents.filter(e => e.confidence.level === 'high').length,
    medium: scoredEvents.filter(e => e.confidence.level === 'medium').length,
    low: scoredEvents.filter(e => e.confidence.level === 'low').length
  };
  
  if (summary.high < 3) {
    recommendations.push('Add more documented events (marriage certificate, job offer letter)');
  }
  
  if (summary.low > summary.high) {
    recommendations.push('Improve event date accuracy - too many approximate dates');
  }
  
  const categories = new Set(scoredEvents.map(e => e.category));
  if (!categories.has('career') && !categories.has('education')) {
    recommendations.push('Include career or education milestones');
  }
  if (!categories.has('marriage') && !categories.has('family')) {
    recommendations.push('Include family events if applicable');
  }
  
  const earliestEvent = scoredEvents.reduce((min, e) => 
    e.eventDate < min.eventDate ? e : min
  , scoredEvents[0]);
  const birthYear = earliestEvent ? new Date(earliestEvent.eventDate).getFullYear() - 25 : 0;
  
  if (scoredEvents.every(e => new Date(e.eventDate).getFullYear() > birthYear + 5)) {
    recommendations.push('Add childhood events if known (first school, childhood illness)');
  }
  
  return recommendations;
}

export const EventScorer = {
  calculateConfidence: calculateEventConfidence,
  scoreEvents,
  generateSummary: generateScoreSummary,
  filterReliable: filterReliableEvents,
  rankByWeight: rankEventsByWeight,
  getTopEvents,
  validateCollection: validateEventCollection,
  calculateWeightedScore: calculateWeightedEventScore
};
