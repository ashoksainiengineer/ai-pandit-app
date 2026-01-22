import { TimeOffsetConfig } from './time-offset-manager.js';
import { LifeEvent } from './types.js';
export interface SecondsPrecisionInput {
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
        hairType?: 'straight' | 'curly' | 'wavy' | 'thin' | 'thick';
        prakriti?: 'vata' | 'pitta' | 'kapha' | 'vata-pitta' | 'pitta-kapha' | 'vata-kapha';
        noseType?: 'sharp' | 'blunt' | 'aquiline' | 'long' | 'small';
        appearance?: string;
    };
    spouseData?: {
        dateOfBirth: string;
        birthTime: string;
        latitude: number;
        longitude: number;
        timezone: string;
    };
    abortSignal?: AbortSignal;
}
export interface SecondsPrecisionResult {
    rectifiedTime: string;
    accuracy: number;
    confidence: string;
    precisionLevel: 'seconds';
    marginOfError: number;
    stagesCompleted: number;
    boundaryWarnings: string[];
    methodsUsed: string[];
    processingTimeMs: number;
    analysisResult: string;
}
export interface TransitSyncResult {
    score: number;
    hits: string[];
    details: Record<string, string>;
}
export declare function processSecondsPrecisionBTR(input: SecondsPrecisionInput): Promise<SecondsPrecisionResult>;
export default processSecondsPrecisionBTR;
//# sourceMappingURL=seconds-precision-btr.d.ts.map