import { EphemerisData, LifeEvent } from './types';
export declare function formatEphemerisForAI(ephemeris: EphemerisData): string;
export declare function analyzeChartWithThinking(ephemerisData: EphemerisData, lifeEvents: LifeEvent[], candidateTime: string): Promise<{
    score: number;
    thinking: string;
    analysis: string;
}>;
//# sourceMappingURL=moonshot-ai-client.d.ts.map