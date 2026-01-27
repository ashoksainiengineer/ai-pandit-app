/**
 * 🔱 CONSENSUS VALIDATION ENGINE (Multi-Method Verification)
 * ==========================================================
 *
 * The divine judgment system that verifies birth time candidates across
 * multiple Vedic astrology methods. Only when ALL methods converge
 * do we achieve God-Tier (>99%) confidence.
 *
 * VALIDATION METHODS:
 * 1. Vimshottari Dasha - Primary timing system
 * 2. Yogini Dasha - 8-yogini cycle verification
 * 3. Chara Dasha - Rashi-based periods
 * 4. Kalachakra Dasha - Advanced lunar cycle timing
 * 5. KP Sub-Lords - Cuspal precision timing
 * 6. Ashtakavarga - Bindu-based strength verification
 * 7. Divisional Charts - Varga-specific event correlation
 * 8. Transit Analysis - Double transit verification
 * 9. Forensic Correlation - Physical/psychological matching
 * 10. AI Reasoning - Deep pattern analysis
 *
 * CONSENSUS RULES:
 * - GOD_TIER: All 10 methods > 90% agreement
 * - VERY_HIGH: All 10 methods > 80% agreement
 * - HIGH: Overall average > 75%, no method < 60%
 * - MEDIUM: Overall average > 60%
 * - LOW: Any method < 40% or overall < 60%
 */
export interface ConsensusScores {
    vimshottari: number;
    yogini: number;
    chara: number;
    kalachakra: number;
    kp: number;
    ashtakavarga: number;
    varga: number;
    transit: number;
    forensic: number;
    ai: number;
}
export interface ValidationDetail {
    method: string;
    score: number;
    maxScore: number;
    status: 'pass' | 'warning' | 'fail';
    details: string;
    criticalFindings: string[];
}
export interface RedFlags {
    /** Birth during sign/nakshatra transition */
    sandhiBirth: boolean;
    /** Birth at gandanta (water-fire junction) */
    gandanta: boolean;
    /** Birth during dasha transition */
    dashaSandhi: boolean;
    /** Methods disagree significantly */
    conflictingMethods: boolean;
    /** Key significators weak (Shadbala < 1.0) */
    weakSignificators: boolean;
    /** D60 changes in uncertainty window */
    d60Instability: boolean;
    /** Low confidence forensic match */
    forensicMismatch: boolean;
}
export interface ConsensusResult {
    /** Individual method scores (0-100) */
    scores: ConsensusScores;
    /** Overall consensus score (weighted average) */
    overallConsensus: number;
    /** Confidence classification */
    confidenceLevel: 'GOD_TIER' | 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
    /** Margin of error in seconds */
    marginOfError: number;
    /** Detailed validation breakdown */
    validationDetails: ValidationDetail[];
    /** Warning flags */
    redFlags: RedFlags;
    /** Primary evidence for rectified time */
    keyEvidence: string[];
    /** Recommended actions for improvement */
    recommendations: string[];
    /** Timestamp of validation */
    validatedAt: Date;
}
export interface ValidationInput {
    candidate: {
        time: string;
        ephemeris: any;
        dasha: any;
        vargas: any;
        kpData: any;
        aiScore?: number;
        birthDate?: string;
    };
    events: any[];
    forensicProfile: any;
    tentativeTime: string;
}
/**
 * Calculate complete consensus across all validation methods.
 * This is the main entry point for the validation engine.
 */
export declare function calculateConsensus(input: ValidationInput): ConsensusResult;
declare function calculateWeightedConsensus(scores: ConsensusScores): number;
declare function determineConfidenceLevel(scores: ConsensusScores, overall: number, redFlags: RedFlags): ConsensusResult['confidenceLevel'];
declare function detectRedFlags(input: ValidationInput, scores: ConsensusScores, details: ValidationDetail[]): RedFlags;
export declare const ConsensusEngine: {
    calculate: typeof calculateConsensus;
    calculateWeighted: typeof calculateWeightedConsensus;
    determineLevel: typeof determineConfidenceLevel;
    detectRedFlags: typeof detectRedFlags;
};
export {};
//# sourceMappingURL=consensus-engine.d.ts.map