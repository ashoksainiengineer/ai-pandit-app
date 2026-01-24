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
export declare const MAX_BATCH_SIZE = 10;
export declare const SURVIVORS_PER_BATCH = 2;
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
 * More survivors for smaller batches to maintain tournament quality
 */
export declare function getDynamicSurvivors(batchSize: number): number;
export declare function getAdaptiveInterval(offsetMinutes: number): number;
/**
 * 🔱 Get expected candidate count for a given offset
 * Useful for UI and progress estimation
 */
export declare function getExpectedCandidateCount(offsetMinutes: number): number;
export declare function generateCandidateTimes(tentativeTime: string, // HH:MM:SS
offsetConfig: TimeOffsetConfig): CandidateTime[];
export declare function splitIntoBatches<T>(candidates: T[], batchSize?: number): T[][];
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