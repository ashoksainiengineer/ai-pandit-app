import { TimeOffsetConfig } from './time-offset-manager';
import { LifeEvent } from './types';
export interface ProcessInput {
    sessionId: string;
    dateOfBirth: string;
    tentativeTime: string;
    latitude: number;
    longitude: number;
    timezone: string;
    lifeEvents: LifeEvent[];
    offsetConfig: TimeOffsetConfig;
    physicalTraits?: {
        height?: string;
        build?: string;
        complexion?: string;
    };
}
export interface ProcessResult {
    rectifiedTime: string;
    accuracy: number;
    confidence: string;
    analysisResult: string;
}
export interface CandidateScore {
    time: string;
    quickScore: number;
    dashaScore: number;
    eventMatches: number;
    shouldAnalyze: boolean;
}
/**
 * Main processing function - called by queue manager
 * Optimized for memory efficiency on 512MB RAM
 */
export declare function processAnalysis(input: ProcessInput): Promise<ProcessResult>;
export default processAnalysis;
//# sourceMappingURL=btr-processor.d.ts.map