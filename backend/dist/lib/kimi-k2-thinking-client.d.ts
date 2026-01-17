import { CandidateAnalysis } from './types.js';
import { LifeEvent } from './types.js';
export interface KimiAnalysisResult {
    time: string;
    offsetMinutes: number;
    offsetDescription: string;
    score: number;
    confidence: 'High' | 'Medium' | 'Low';
    analysis: string;
    thinking: string;
    eventMatches: {
        eventType: string;
        matches: boolean;
        reason: string;
    }[];
    recommendation: string;
    dashaAnalysis: string;
    transitAnalysis: string;
}
export interface TopCandidatesAnalysis {
    candidates: KimiAnalysisResult[];
    topRecommendation: KimiAnalysisResult;
    alternativeOptions: KimiAnalysisResult[];
    processingTime: number;
}
export declare function analyzeTopCandidatesWithKimi(topCandidates: CandidateAnalysis[], lifeEvents: LifeEvent[]): Promise<TopCandidatesAnalysis>;
export default analyzeTopCandidatesWithKimi;
//# sourceMappingURL=kimi-k2-thinking-client.d.ts.map