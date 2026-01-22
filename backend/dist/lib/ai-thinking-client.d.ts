import { CandidateAnalysis } from './types.js';
import { LifeEvent } from './types.js';
export interface AIAnalysisResult {
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
    candidates: AIAnalysisResult[];
    topRecommendation: AIAnalysisResult;
    alternativeOptions: AIAnalysisResult[];
    processingTime: number;
}
export declare function analyzeTopCandidatesWithAI(topCandidates: CandidateAnalysis[], lifeEvents: LifeEvent[]): Promise<TopCandidatesAnalysis>;
export default analyzeTopCandidatesWithAI;
//# sourceMappingURL=ai-thinking-client.d.ts.map