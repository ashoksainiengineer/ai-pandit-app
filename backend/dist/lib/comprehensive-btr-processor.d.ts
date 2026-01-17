import { TimeOffsetConfig } from './time-offset-manager.js';
import { LifeEvent } from './types.js';
export interface ComprehensiveProcessInput {
    sessionId: string;
    dateOfBirth: string;
    tentativeTime: string;
    latitude: number;
    longitude: number;
    timezone: string;
    lifeEvents: LifeEvent[];
    offsetConfig: TimeOffsetConfig;
    physicalTraits?: {
        height?: 'short' | 'medium' | 'tall';
        build?: 'slim' | 'medium' | 'heavy';
        complexion?: 'fair' | 'medium' | 'dark';
        appearance?: string;
    };
}
export interface ComprehensiveProcessResult {
    rectifiedTime: string;
    accuracy: number;
    confidence: string;
    analysisResult: string;
    methodsUsed: string[];
    processingTimeMs: number;
}
export interface MultiMethodScore {
    time: string;
    vimshottariScore: number;
    yoginiScore: number;
    charaDashaScore: number;
    physicalTraitsScore: number;
    divisionalChartsScore: number;
    advancedAspectsScore: number;
    combinedScore: number;
    eventMatches: number;
    shouldAnalyze: boolean;
}
export declare function processComprehensiveAnalysis(input: ComprehensiveProcessInput): Promise<ComprehensiveProcessResult>;
export default processComprehensiveAnalysis;
//# sourceMappingURL=comprehensive-btr-processor.d.ts.map