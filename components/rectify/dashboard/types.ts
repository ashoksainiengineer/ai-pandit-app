/**
 * types.ts
 * Centralized type definitions for the Results Dashboard architecture.
 */

export interface BirthData {
    fullName: string;
    dateOfBirth?: string;
    tentativeTime?: string;
    birthPlace?: string;
}

export interface StageHistory {
    stage1Count?: number;
    stage2Count?: number;
    stage3Count?: number;
    stage4Count?: number;
    stage5Count?: number;
}

export interface MethodScores {
    [key: string]: number;
}

export interface FinalCandidate {
    thinking?: string;
    methodScores?: MethodScores;
}

export interface GodTierData {
    ephemeris?: {
        planets?: {
            sun?: { sign?: string; longitude?: number };
            moon?: { sign?: string; longitude?: number };
            [key: string]: any;
        };
        ascendant?: { sign?: string; longitude?: number };
    };
    divCharts?: any;
    dasha?: string;
    shuddhi?: any;
}

export interface BoundarySafety {
    lagnaSignBoundary: number;
    moonNakshatraBoundary: number;
}

export interface EventMatch {
    event?: string;
    name?: string;
    match?: boolean;
    dasha?: string;
}

export interface AnalysisDetails {
    summary?: string;
    finalCandidate?: FinalCandidate;
    alternatives?: Array<{
        time: string;
        score?: number;
        ephemeris?: any;
        [key: string]: any;
    }>;
    stageHistory?: StageHistory;
    eventMatches?: EventMatch[];
    boundarySafety?: BoundarySafety;
    godTierData?: GodTierData;
    aiAnalysis?: string;
    [key: string]: any;
}

export interface FinalResult {
    rectifiedTime: string;
    accuracy: number;
    confidence: string;
    marginOfError: number;
    analysisResult: string | AnalysisDetails;
    stagesCompleted: number;
}

export interface ResultsDashboardProps {
    sessionId: string;
    data: FinalResult;
    birthData: BirthData;
    reasoningLogs?: string | AnalysisDetails;
}

export interface Stage {
    id: number;
    name: string;
    candidates: number;
    color: string;
}
