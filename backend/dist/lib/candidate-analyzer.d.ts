import { LifeEvent, RankedCandidates } from './types.js';
export declare function analyzeAndFilterCandidates(dateOfBirth: string, candidates: Array<{
    time: string;
    offsetMinutes: number;
    offsetDescription: string;
}>, latitude: number, longitude: number, timezone: number, lifeEvents: LifeEvent[]): Promise<RankedCandidates>;
export default analyzeAndFilterCandidates;
//# sourceMappingURL=candidate-analyzer.d.ts.map