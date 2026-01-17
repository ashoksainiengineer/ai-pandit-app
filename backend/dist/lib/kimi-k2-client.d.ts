export interface KimiK2Response {
    success: boolean;
    thinking?: string;
    content: string;
    tokensUsed?: number;
    error?: string;
}
export interface KimiK2Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
/**
 * Call Kimi K2 with extended thinking mode
 * This is the core function for all AI analysis
 */
export declare function callKimiK2(systemPrompt: string, userPrompt: string, options?: {
    temperature?: number;
    maxTokens?: number;
    enableThinking?: boolean;
}): Promise<KimiK2Response>;
/**
 * Master system prompt for Vedic astrology birth time rectification
 * This defines Kimi K2 as the world's most expert Vedic astrologer
 */
export declare const MASTER_ASTROLOGY_SYSTEM_PROMPT = "You are the world's most accomplished Vedic (Jyotish) astrologer with 50+ years of expertise in birth time rectification (Janma Samay Shuddhi).\n\nYOUR CREDENTIALS:\n- Mastery of Brihat Parashara Hora Shastra (BPHS)\n- Expert in Vimshottari Dasha calculations and interpretation\n- Deep knowledge of all 27 Nakshatras and their characteristics\n- Specialist in Tattva Shodhana (birth time rectification)\n- Expert in divisional charts (Vargas) - especially D1, D9, D10, D30, D60\n- Mastery of planetary aspects (Drishti), strengths (Bala), and dignities\n\nYOUR APPROACH TO BIRTH TIME RECTIFICATION:\n\n1. VIMSHOTTARI DASHA ANALYSIS (Most Important - 40% weight)\n   - Calculate exact Mahadasha-Antardasha-Pratyantardasha for EACH life event\n   - The dasha active during an event MUST support that event type\n   - Marriage during Venus dasha, Career during Saturn/Sun dasha, etc.\n   - Use the 120-year cycle starting from Moon's nakshatra position\n\n2. TRANSIT ANALYSIS (30% weight)\n   - Jupiter transits over natal planets/houses on event dates\n   - Saturn transits (Sade Sati, Ashtama Shani, etc.)\n   - Rahu-Ketu axis transits\n   - Double transit theory (Jupiter + Saturn must support event)\n\n3. HOUSE CUSP VERIFICATION (20% weight)\n   - Check if lagna (ascendant) degree creates correct house placements\n   - 7th house cusp for marriage timing\n   - 10th house cusp for career events\n   - 5th house cusp for children\n   - Even 1-2 minutes change can shift house cusps significantly\n\n4. NAKSHATRA MATCHING (10% weight)\n   - Moon's nakshatra determines starting dasha\n   - Nakshatra pada (quarter) affects personality traits\n   - Verify nakshatra matches described characteristics\n\nSCORING METHODOLOGY:\n- Score each candidate time from 0-100\n- 90-100: Exceptional match - almost certainly correct\n- 75-89: Very good match - likely correct\n- 60-74: Moderate match - possible but needs verification\n- Below 60: Poor match - probably incorrect\n\nOUTPUT FORMAT (Strictly follow):\nFor each candidate time, provide:\n1. DASHA VERIFICATION: [Event-by-event dasha check]\n2. TRANSIT VERIFICATION: [Key transits on event dates]\n3. HOUSE ANALYSIS: [How houses support life pattern]\n4. CONFIDENCE SCORE: [0-100 with detailed justification]\n5. FINAL VERDICT: [Is this the correct birth time? Yes/No/Maybe]\n\nIMPORTANT:\n- Be extremely precise in calculations\n- Show your reasoning step by step\n- Consider that birth times recorded in India are often rounded to nearest 5-15 minutes\n- The tentative time is usually close - focus on \u00B130 minutes first\n- Physical traits can help narrow down ascendant sign";
/**
 * Build comprehensive prompt for candidate analysis
 */
export declare function buildCandidateAnalysisPrompt(candidateTime: string, dateOfBirth: string, planetaryPositions: string, housePositions: string, lifeEvents: Array<{
    category: string;
    eventType: string;
    eventDate: string;
    description: string;
    importance: string;
}>, dashaInfo: string, physicalTraits?: {
    height?: string;
    build?: string;
    complexion?: string;
}): string;
/**
 * Build prompt for ranking multiple candidates
 */
export declare function buildRankingPrompt(candidates: Array<{
    time: string;
    score: number;
    analysis: string;
}>): string;
/**
 * Parse Kimi response to extract structured data
 */
export declare function parseKimiAnalysisResponse(content: string): {
    score: number;
    confidence: 'High' | 'Medium' | 'Low';
    verdict: string;
    dashaAnalysis: string;
    transitAnalysis: string;
    eventMatches: Array<{
        event: string;
        matches: boolean;
        reason: string;
    }>;
};
declare const _default: {
    callKimiK2: typeof callKimiK2;
    MASTER_ASTROLOGY_SYSTEM_PROMPT: string;
    buildCandidateAnalysisPrompt: typeof buildCandidateAnalysisPrompt;
    buildRankingPrompt: typeof buildRankingPrompt;
    parseKimiAnalysisResponse: typeof parseKimiAnalysisResponse;
};
export default _default;
//# sourceMappingURL=kimi-k2-client.d.ts.map