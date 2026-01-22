import { LifeEvent, PhysicalTraits, BTRInput, BTROutput } from './types.js';
type TimeUncertainty = '±15 minutes' | '±30 minutes' | '±1 hour' | '±2 hours' | '±3 hours' | '±4 hours';
export declare function generateCandidates(timeEstimate: string, timeUncertainty: TimeUncertainty): string[];
export declare function quickFilterCandidates(candidates: string[], birthDate: string, latitude: number, longitude: number, timezone: string, lifeEvents: LifeEvent[], physicalTraits?: PhysicalTraits): Promise<Array<{
    time: string;
    score: number;
}>>;
export declare function analyzeWithAI(filteredCandidates: Array<{
    time: string;
    score: number;
}>, birthDate: string, lifeEvents: LifeEvent[], latitude: number, longitude: number, timezone: string): Promise<Array<{
    time: string;
    aiScore: number;
    thinking: string;
}>>;
export declare function selectBestCandidate(candidates: Array<{
    time: string;
    aiScore: number;
    thinking: string;
}>): BTROutput;
export declare function processBirthTimeRectification(input: BTRInput): Promise<BTROutput>;
export {};
//# sourceMappingURL=btr-engine.d.ts.map