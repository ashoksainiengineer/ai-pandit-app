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
    priority: number;
}
/**
 * Calculate adaptive interval to maintain ~60 candidates for any offset range.
 * This ensures consistent processing time regardless of offset size.
 *
 * @param offsetMinutes - Total offset range in minutes
 * @returns Interval in minutes
 */
export declare function getAdaptiveInterval(offsetMinutes: number): number;
export declare function generateCandidateTimes(tentativeTime: string, // HH:MM:SS
offsetConfig: TimeOffsetConfig): CandidateTime[];
export declare function getOffsetConfigDescription(config: TimeOffsetConfig): string;
export declare function validateOffsetConfig(config: TimeOffsetConfig): {
    valid: boolean;
    error?: string;
};
export default generateCandidateTimes;
//# sourceMappingURL=time-offset-manager.d.ts.map