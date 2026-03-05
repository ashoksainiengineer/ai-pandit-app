export interface Candidate {
    time: string;
    score: number;
    confidence: 'High' | 'Medium' | 'Low';
    offsetDescription: string;
    recommendation?: string;
    analysis?: string;
    dashaAnalysis?: string;
}

export interface Statistics {
    totalCandidatesGenerated: number;
    topCandidatesAnalyzed: number;
    deepAnalysisCount: number;
    allCandidateScores: Array<{
        time: string;
        quickScore: number;
        offsetDescription: string;
    }>;
    processingTime: {
        totalSeconds: number;
    };
}

export interface AnalysisData {
    rectifiedTime: string;
    accuracy: number;
    confidence: 'High' | 'Medium' | 'Low';
    topRecommendation: Candidate;
    alternativeOptions: Candidate[];
    statistics: Statistics;
}

export interface ResultsPageProps {
    analysisData: AnalysisData;
    onNewAnalysis: () => void;
}

export type TabType = 'top' | 'alternatives' | 'all';
