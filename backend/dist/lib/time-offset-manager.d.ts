export type OffsetPreset = '30min' | '1hour' | '2hours' | '4hours' | '6hours' | '12hours' | 'seconds-30' | 'seconds-6';
export interface TimeOffsetConfig {
    preset?: OffsetPreset;
    customMinutes?: number;
    description: string;
}
export interface CandidateTime {
    time: string;
    offsetMinutes: number;
    offsetDescription: string;
    batchIndex?: number;
}
export declare const MAX_BATCH_SIZE = 15;
export declare const SURVIVORS_PER_BATCH = 5;
/**
 * 🔱 DYNAMIC BATCH SIZE - Based on offset range
 * Smaller offsets → Smaller batches (more focused AI attention)
 * Larger offsets → Max batch size (efficiency)
 *
 * @param totalCandidates Total candidates in the pool
 * @param offsetMinutes The offset range in minutes
 * @returns Optimal batch size (5-10)
 */
export declare function getDynamicBatchSize(totalCandidates: number, offsetMinutes: number): number;
/**
 * Get dynamic survivors count based on batch size
 * 🔱 GOD-TIER SAFETY: More survivors to prevent actual birth time elimination
 * Research shows: With DeepSeek R1's reasoning, we can safely analyze more candidates
 *
 * @param batchSize Current batch size
 * @param isFirstRound If true, preserves more candidates (safety net for tentative time)
 * @returns Number of survivors to select
 */
export declare function getDynamicSurvivors(batchSize: number, isFirstRound?: boolean): number;
export declare function getAdaptiveInterval(offsetMinutes: number): number;
/**
 * 🔱 Get expected candidate count for a given offset
 * Useful for UI and progress estimation
 */
export declare function getExpectedCandidateCount(offsetMinutes: number): number;
export declare function generateCandidateTimes(tentativeTime: string, // HH:MM:SS
offsetConfig: TimeOffsetConfig): CandidateTime[];
export declare function splitIntoBatches<T>(candidates: T[], batchSize?: number): T[][];
/**
 * Creates a "safety net" of candidates around the tentative time
 * This ensures the actual birth time (which is often close to tentative)
 * NEVER gets eliminated in early stages
 *
 * @param tentativeTime The original tentative birth time (HH:MM:SS)
 * @param allCandidates All generated candidates
 * @returns Candidates with safety net times guaranteed to be included
 */
export declare function injectSafetyNetCandidates(tentativeTime: string, allCandidates: CandidateTime[]): CandidateTime[];
export declare function generateRefinementGrid(centerTime: string, rangeMinutes: number, intervalSeconds: number): CandidateTime[];
export declare function getOffsetConfigDescription(config: TimeOffsetConfig): string;
export declare function validateOffsetConfig(config: TimeOffsetConfig): {
    valid: boolean;
    error?: string;
};
export declare function calculateTournamentStructure(totalCandidates: number): {
    rounds: number;
    batchesPerRound: number[];
    survivorsPerRound: number[];
};
export default generateCandidateTimes;
//# sourceMappingURL=time-offset-manager.d.ts.map