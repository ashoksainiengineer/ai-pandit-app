/**
 * 🔱 BTR GOD-TIER INTEGRATOR
 * ==========================
 *
 * Bridges the existing BTR system with new God-Tier components:
 * - KP Sub-Lord calculations
 * - Multi-method Consensus Validation
 * - Enhanced validation pipeline
 *
 * This module integrates seamlessly with the existing seconds-precision-btr.ts
 * without breaking backward compatibility.
 */
import { ConsensusResult } from './consensus-engine.js';
export interface GodTierEnhancement {
    /** KP Sub-lord data for all planets */
    kpSubLords: Record<string, {
        starLord: string;
        subLord: string;
        subSubLord: string;
        subSubSubLord: string;
    }>;
    /** KP Cuspal sub-lords for all 12 houses */
    cuspalSubLords: Record<number, {
        house: number;
        cusp: number;
        sign: string;
        starLord: string;
        subLord: string;
        subSubLord: string;
    }>;
    /** Multi-method consensus scores */
    consensus: ConsensusResult;
    /** God-Tier confidence indicator */
    isGodTier: boolean;
    /** Recommended precision level */
    recommendedPrecision: 'seconds' | 'sub-seconds' | 'minutes';
}
export interface CandidateWithGodTierData {
    time: string;
    offsetMinutes: number;
    ephemeris: any;
    dasha: any;
    vargas: any;
    kpData: any;
    godTier?: GodTierEnhancement;
}
/**
 * Enhance a candidate with God-Tier KP and Consensus data.
 * This is the main integration point for existing BTR pipeline.
 */
export declare function enhanceCandidateWithGodTierData(candidate: CandidateWithGodTierData, events: any[], forensicProfile: any, tentativeTime: string): CandidateWithGodTierData;
/**
 * Batch enhance multiple candidates with God-Tier data.
 * Optimized for performance with parallel processing.
 */
export declare function enhanceCandidatesBatch(candidates: CandidateWithGodTierData[], events: any[], forensicProfile: any, tentativeTime: string, options?: {
    parallel?: boolean;
    maxConcurrency?: number;
}): CandidateWithGodTierData[];
/**
 * Rank candidates using God-Tier consensus scores.
 * Returns candidates sorted by consensus score (highest first).
 */
export declare function rankCandidatesByGodTierConsensus(candidates: CandidateWithGodTierData[]): CandidateWithGodTierData[];
/**
 * Filter candidates by minimum consensus threshold.
 * Removes candidates that don't meet the quality bar.
 */
export declare function filterByConsensusThreshold(candidates: CandidateWithGodTierData[], minConsensus?: number): CandidateWithGodTierData[];
/**
 * Get the best candidate based on God-Tier analysis.
 */
export declare function selectBestCandidate(candidates: CandidateWithGodTierData[]): CandidateWithGodTierData | null;
/**
 * Generate God-Tier validation report for a candidate.
 */
export declare function generateGodTierReport(candidate: CandidateWithGodTierData): {
    summary: string;
    methodScores: Record<string, number>;
    redFlags: string[];
    recommendations: string[];
    confidenceLevel: string;
    marginOfError: string;
};
/**
 * Generate enhanced AI prompt with God-Tier KP and Consensus data.
 */
export declare function generateGodTierAIPrompt(candidate: CandidateWithGodTierData, basePrompt: string): string;
export declare const GodTierIntegrator: {
    enhanceCandidate: typeof enhanceCandidateWithGodTierData;
    enhanceBatch: typeof enhanceCandidatesBatch;
    rankByConsensus: typeof rankCandidatesByGodTierConsensus;
    filterByThreshold: typeof filterByConsensusThreshold;
    selectBest: typeof selectBestCandidate;
    generateReport: typeof generateGodTierReport;
    generateAIPrompt: typeof generateGodTierAIPrompt;
};
//# sourceMappingURL=btr-god-tier-integrator.d.ts.map