/**
 * 🔱 GOD-TIER UNIFIED WEIGHTING SYSTEM
 * =====================================
 *
 * Single source of truth for all BTR weighting calculations.
 * Based on Vedic Astrology principles for seconds-level precision.
 *
 * HIERARCHY:
 * 1. Precision Layer (D150, KP, Prana) - Highest impact on seconds accuracy
 * 2. Core Timing Layer (Vimshottari, Varga, Kalachakra)
 * 3. Verification Layer (Forensic, Spouse, Transit, Gandanta)
 * 4. Supporting Layer (Shadbala, Ashtakavarga, Yogini, Chara, Pakshi)
 * 5. Quality Control Layer (Tatwa, Boundary, AI)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// METHOD WEIGHTS - For overall candidate scoring
// ═══════════════════════════════════════════════════════════════════════════════

export const METHOD_WEIGHTS = {
  // TIER 1: PRECISION LAYER (Seconds-Level Accuracy)
  nadi: 2.0,           // D150 Nadi Amsha - 48-second precision DNA
  kp: 2.0,             // KP 4-level Sub-Lord hierarchy
  pranaDasha: 1.8,     // Vimshottari Prana level (hours precision)

  // TIER 2: CORE TIMING LAYER
  vimshottari: 1.8,    // Primary MD-AD-PD sequence
  varga: 1.7,          // D9/D10/D60/D12/D150 divisional charts
  kalachakra: 1.5,     // Savya/Apasavya verification

  // TIER 3: VERIFICATION LAYER
  forensic: 1.5,       // Physical/psychological DNA matching
  spouseD9: 1.4,       // Spouse D9 synastry verification
  transit: 1.3,        // Double transit (Jupiter-Saturn)
  gandanta: 1.3,       // Karmic knot detection

  // TIER 4: SUPPORTING LAYER
  shadbala: 1.0,       // 6-source planetary strength
  ashtakavarga: 1.0,   // Bindu-based strength
  yogini: 0.9,         // 8-year cycle verification
  chara: 0.9,          // Jaimini Rashi Dasha
  pakshi: 0.8,         // Pancha-Pakshi Shastra

  // TIER 5: QUALITY CONTROL LAYER
  tatwa: 0.7,          // Five element alignment
  boundary: 0.6,       // Sandhi zone warning
  ai: 0.5,             // AI reasoning (supportive only)
} as const;

export type MethodName = keyof typeof METHOD_WEIGHTS;

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT IMPORTANCE WEIGHTS - User-selected importance levels
// ═══════════════════════════════════════════════════════════════════════════════

export const EVENT_IMPORTANCE_WEIGHTS = {
  critical: 5.0,       // Moksha-Karma events (parent death, child birth, near-death)
  high: 3.0,           // Dharma/Artha events (marriage, career, property)
  medium: 2.0,         // Kama events (relationships, minor relocation)
  low: 1.0,            // Routine events (small purchases, casual travel)
} as const;

export type EventImportance = keyof typeof EVENT_IMPORTANCE_WEIGHTS;

// Legacy impact weights (for backwards compatibility)
export const EVENT_IMPACT_WEIGHTS = {
  critical: 5.0,
  major: 3.0,
  moderate: 2.0,
  minor: 1.0,
} as const;

export type EventImpact = keyof typeof EVENT_IMPACT_WEIGHTS;

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORTANCE TO IMPACT MAPPING - Converts user selection to internal weight
// ═══════════════════════════════════════════════════════════════════════════════

export const IMPORTANCE_TO_IMPACT: Record<EventImportance, EventImpact> = {
  critical: 'critical',
  high: 'major',
  medium: 'moderate',
  low: 'minor',
};

export const IMPORTANCE_TO_WEIGHT: Record<EventImportance, number> = {
  critical: 5.0,
  high: 3.0,
  medium: 2.0,
  low: 1.0,
};

// ═══════════════════════════════════════════════════════════════════════════════
// DASHA DEPTH WEIGHTS - For seconds-level precision
// ═══════════════════════════════════════════════════════════════════════════════

export const DASHA_DEPTH_WEIGHTS = {
  mahadasha: {
    weight: 0.15,
    timeSpan: '6-20 years',
    precision: 'Year-level',
  },
  antardasha: {
    weight: 0.25,
    timeSpan: '1-3 years',
    precision: 'Month-level',
  },
  pratyantardasha: {
    weight: 0.25,
    timeSpan: '1-6 months',
    precision: 'Week-level',
  },
  sukshma: {
    weight: 0.20,
    timeSpan: '1-30 days',
    precision: 'Day-level',
  },
  prana: {
    weight: 0.15,
    timeSpan: '1-24 hours',
    precision: 'Hour-level (SECONDS possible)',
  },
} as const;

// Dasha match scoring
export const DASHA_MATCH_SCORES = {
  mahadashaSignificator: 70,      // MD lord is event significator
  mahadashaHouseMatch: 20,        // MD lord in event house
  antardashaSignificator: 50,     // AD lord is event significator
  antardashaHouseMatch: 15,       // AD lord in event house
  pratyantardashaMatch: 40,       // PD lord matches
  sukshmaMatch: 30,               // SD lord matches
  pranaMatch: 25,                 // Prana lord matches (SECONDS precision)
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// KP SUB-LORD WEIGHTS - For precision timing
// ═══════════════════════════════════════════════════════════════════════════════

export const KP_SCORES = {
  subLordMatch: 95,               // Primary significator match
  starLordMatch: 80,              // Source of event
  subSubLordMatch: 70,            // Mode of delivery
  subSubSubLordMatch: 60,         // Fine detail (SECONDS precision)
  cuspalMatch: 50,                // House cusp alignment
  significatorMatch: 40,          // A/B/C planet match
  noMatch: 10,                    // No direct match
  contraMatch: 0,                 // Negative significator
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// VEDIC EVENT CATEGORIES - Default importance by event type
// ═══════════════════════════════════════════════════════════════════════════════

export const VEDIC_EVENT_IMPORTANCE: Record<string, EventImportance> = {
  // MOKSHA-KARMA (Weight 5.0)
  parent_death: 'critical',
  child_birth: 'critical',
  near_death: 'critical',
  spiritual_initiation: 'critical',
  guru_diksha: 'critical',

  // DHARMA EVENTS (Weight 3.0)
  marriage: 'high',
  divorce: 'high',
  career_major: 'high',
  foreign_relocation: 'high',
  property_inheritance: 'high',
  first_job: 'high',
  business_start: 'high',
  graduation: 'high',

  // ARTHA EVENTS (Weight 2.0)
  job_promotion: 'medium',
  job_change: 'medium',
  major_purchase: 'medium',
  education_completion: 'medium',
  property_purchase: 'medium',
  awards: 'medium',

  // KAMA EVENTS (Weight 1.0-2.0)
  relationship_change: 'medium',
  minor_relocation: 'medium',
  travel_major: 'medium',
  casual_travel: 'low',
  minor_purchase: 'low',
};

// ═══════════════════════════════════════════════════════════════════════════════
// HOUSE SIGNIFICANCE WEIGHTS - Based on Vedic principles
// ═══════════════════════════════════════════════════════════════════════════════

export const HOUSE_TYPE_MULTIPLIERS = {
  kendra: 1.5,        // Houses 1, 4, 7, 10 - Foundation
  trikona: 1.8,       // Houses 1, 5, 9 - Dharma (MOST IMPORTANT)
  moksha_trikona: 1.3, // Houses 4, 8, 12 - Liberation
  kama_trikona: 1.0,   // Houses 3, 7, 11 - Desires
  artha_trikona: 1.2,  // Houses 2, 6, 10 - Wealth
  dusthana: 0.8,       // Houses 6, 8, 12 - Challenge
  maraka: 1.5,         // Houses 2, 7 - Death-inflicting
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// SOURCE & PRECISION MULTIPLIERS
// ═══════════════════════════════════════════════════════════════════════════════

export const SOURCE_MULTIPLIERS = {
  document: 1.3,      // Certificate, legal document
  memory: 1.0,        // Personal recollection
  calculated: 1.1,    // Derived from other data
  approximate: 0.7,   // Estimated or uncertain
} as const;

export const DATE_PRECISION_MULTIPLIERS = {
  exact_date_time: 1.0,   // Exact date and time
  exact_date: 0.9,        // Exact date
  month_year: 0.7,        // Month-level
  year_range: 0.5,        // Year-level
  approximate: 0.4,       // Approximate
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIDENCE THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════════

export const CONFIDENCE_THRESHOLDS = {
  god_tier: {
    minScore: 95,
    allMethodsAbove: 90,
    description: 'All methods converge, seconds-level precision achieved',
  },
  very_high: {
    minScore: 85,
    allMethodsAbove: 80,
    description: 'High convergence, minute-level precision',
  },
  high: {
    minScore: 75,
    allMethodsAbove: 60,
    description: 'Good convergence, 5-minute precision',
  },
  medium: {
    minScore: 60,
    allMethodsAbove: 40,
    description: 'Moderate convergence, 15-minute precision',
  },
  low: {
    minScore: 0,
    allMethodsAbove: 0,
    description: 'Low convergence, requires more data',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get the weight for an event based on user-selected importance
 */
export function getEventWeightFromImportance(importance: string): number {
  return EVENT_IMPORTANCE_WEIGHTS[importance as EventImportance] || 2.0;
}

/**
 * Convert user importance to internal impact
 */
export function importanceToImpact(importance: string): EventImpact {
  return IMPORTANCE_TO_IMPACT[importance as EventImportance] || 'moderate';
}

/**
 * Calculate total weight for weighted average
 */
export function calculateWeightedAverage(
  scores: Record<string, number>,
  weights: Record<string, number>
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [method, score] of Object.entries(scores)) {
    const weight = weights[method] || 1;
    weightedSum += score * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Calculate method weight total for normalization
 */
export function getTotalMethodWeight(): number {
  return Object.values(METHOD_WEIGHTS).reduce((a, b) => a + b, 0);
}

/**
 * Get default importance for an event category
 */
export function getDefaultImportance(category: string): EventImportance {
  return VEDIC_EVENT_IMPORTANCE[category] || 'medium';
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT DEFAULT
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  METHOD_WEIGHTS,
  EVENT_IMPORTANCE_WEIGHTS,
  EVENT_IMPACT_WEIGHTS,
  IMPORTANCE_TO_IMPACT,
  IMPORTANCE_TO_WEIGHT,
  DASHA_DEPTH_WEIGHTS,
  DASHA_MATCH_SCORES,
  KP_SCORES,
  VEDIC_EVENT_IMPORTANCE,
  HOUSE_TYPE_MULTIPLIERS,
  SOURCE_MULTIPLIERS,
  DATE_PRECISION_MULTIPLIERS,
  CONFIDENCE_THRESHOLDS,
  getEventWeightFromImportance,
  importanceToImpact,
  calculateWeightedAverage,
  getTotalMethodWeight,
  getDefaultImportance,
};
