/**
 * 🔱 BTR SCORING ENGINE - God Tier Astrological Analysis
 * ======================================================
 *
 * Production-grade scoring system for Birth Time Rectification.
 * Implements multi-dimensional Vedic astrology scoring with
 * mathematical precision and astrological depth.
 *
 * Scoring Dimensions:
 * 1. Dasha-Event Correlation (25%)
 * 2. Transit Verification (20%)
 * 3. Divisional Chart Alignment (20%)
 * 4. Forensic DNA Matching (15%)
 * 5. Planetary Strength (10%)
 * 6. Special Configurations (10%)
 */
import { EphemerisData, LifeEvent } from './types.js';
export interface ScoringWeights {
    dashaEventCorrelation: number;
    transitVerification: number;
    divisionalChartAlignment: number;
    forensicMatching: number;
    planetaryStrength: number;
    specialConfigurations: number;
}
export interface EventSignificators {
    primary: string[];
    secondary: string[];
    supporting: string[];
    houses: number[];
}
export interface ScoringResult {
    totalScore: number;
    breakdown: {
        dashaScore: number;
        transitScore: number;
        vargaScore: number;
        forensicScore: number;
        strengthScore: number;
        specialScore: number;
    };
    details: ScoringDetails;
    confidence: 'GOD_TIER' | 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'WEAK';
}
export interface ScoringDetails {
    eventMatches: EventMatchDetail[];
    dashaAnalysis: DashaAnalysisDetail[];
    transitHits: TransitHitDetail[];
    vargaStrengths: VargaStrengthDetail[];
    forensicAlignments: ForensicAlignmentDetail[];
    redFlags: string[];
}
export interface EventMatchDetail {
    eventId: string;
    eventType: string;
    score: number;
    primaryMatch: boolean;
    secondaryMatch: boolean;
    dashaLord: string;
    antardashaLord: string;
    reason: string;
}
export interface DashaAnalysisDetail {
    period: string;
    lord: string;
    eventCorrelation: number;
    strength: number;
}
export interface TransitHitDetail {
    eventDate: string;
    planet: string;
    transitType: string;
    natalTarget: string;
    orb: number;
    score: number;
}
export interface VargaStrengthDetail {
    chart: string;
    ascendant: string;
    strengthScore: number;
    keyPlacements: string[];
}
export interface ForensicAlignmentDetail {
    trait: string;
    expected: string;
    actual: string;
    match: boolean;
    score: number;
}
export declare class BTRScoringEngine {
    private weights;
    private ephemeris;
    private events;
    private forensicProfile;
    constructor(ephemeris: EphemerisData, events: LifeEvent[], forensicProfile: any, weights?: Partial<ScoringWeights>);
    /**
     * Calculate comprehensive score for a candidate birth time
     */
    calculateScore(): ScoringResult;
    private calculateDashaEventCorrelation;
    private scoreDashaLord;
    private calculateTransitVerification;
    private scoreTransitHit;
    private calculateDivisionalChartAlignment;
    private calculateVargaStrength;
    private calculateForensicMatching;
    private matchPrakriti;
    private matchBuild;
    private matchTemperament;
    private calculatePlanetaryStrength;
    private calculateSpecialConfigurations;
    private getEventSignificators;
    private getDashaAtDate;
    private getTransitsForDate;
    private getPlanetaryStrength;
    private getSignLord;
    private getDignityInSign;
    private calculateHouseFromAscendant;
    private getPrakritiFromChart;
    private getBuildFromChart;
    private getTemperamentFromChart;
    private getVargottamaPlanets;
    private getPushkarNavamsaPlanets;
    private determineConfidenceLevel;
    private collectRedFlags;
}
export declare const BTRScoring: {
    create: (ephemeris: EphemerisData, events: LifeEvent[], forensicProfile: any, weights?: Partial<ScoringWeights>) => BTRScoringEngine;
    DEFAULT_WEIGHTS: ScoringWeights;
    EVENT_SIGNIFICATORS: Record<string, EventSignificators>;
    DASHA_SCORES: {
        EXACT_SIGNIFICATOR: number;
        SIGNIFICATOR_HOUSE: number;
        ASPECTING_SIGNIFICATOR: number;
        NATURAL_KARAKA: number;
        NEUTRAL: number;
        CONTRADICTORY: number;
    };
    TRANSIT_SCORES: {
        EXACT_CONJUNCTION: number;
        CLOSE_ASPECT: number;
        MODERATE_ASPECT: number;
        WIDE_ORB: number;
    };
};
export default BTRScoringEngine;
//# sourceMappingURL=btr-scoring-engine.d.ts.map