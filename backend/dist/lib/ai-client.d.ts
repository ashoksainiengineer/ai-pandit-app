export interface AIResponse {
    success: boolean;
    thinking?: string;
    content: string;
    tokensUsed?: number;
    error?: string;
}
export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
/**
 * Call AI with extended thinking mode
 * This is the core function for all AI analysis
 */
export declare function callAI(systemPrompt: string, userPrompt: string, options?: {
    temperature?: number;
    maxTokens?: number;
    enableThinking?: boolean;
    model?: string;
}): Promise<AIResponse>;
/**
 * Call AI with streaming enabled
 * Emits AI thinking tokens in real-time via SSE
 *
 * @param sessionId - Session ID for SSE emission
 * @param stage - BTR stage number (2, 5, or 7)
 * @param candidateTime - Optional candidate time being analyzed
 */
export declare function callAIWithStream(sessionId: string, stage: number, systemPrompt: string, userPrompt: string, options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    candidateTime?: string;
    abortSignal?: AbortSignal;
    onToken?: (content: string, isThinking: boolean) => void;
    timeoutMs?: number;
    progressTracker?: any;
}): Promise<AIResponse>;
/**
 * Master system prompt for Vedic astrology birth time rectification
 * This defines the AI as the world's most expert Vedic astrologer
 */
export declare const MASTER_ASTROLOGY_SYSTEM_PROMPT = "You are the world's most accomplished Vedic (Jyotish) astrologer with 50+ years of expertise in birth time rectification (Janma Samay Shuddhi).\n\nYOUR CREDENTIALS:\n- Mastery of Brihat Parashara Hora Shastra (BPHS)\n- Expert in Vimshottari Dasha calculations and interpretation\n- Deep knowledge of all 27 Nakshatras and their characteristics\n- Specialist in Tattva Shodhana (birth time rectification)\n- Expert in divisional charts (Vargas) - especially D1, D9, D10, D30, D60\n- Mastery of planetary aspects (Drishti), strengths (Bala), and dignities\n\nYOUR APPROACH TO BIRTH TIME RECTIFICATION:\n\n1. VIMSHOTTARI DASHA ANALYSIS (Most Important - 40% weight)\n   - Analyze the PROVIDED Mahadasha-Antardasha-Pratyantardasha sequence for EACH life event\n   - Verify if the dasha active during an event supports that event type (using provided data)\n   - IMPORTANT: Use the provided dasha data. Do not recalculate.\n   - Use the 120-year cycle starting from Moon's nakshatra position\n\n2. TRANSIT ANALYSIS (30% weight)\n   - Analyze provided Jupiter transits over natal planets/houses on event dates\n   - Saturn transits (Sade Sati, Ashtama Shani, etc.)\n   - Rahu-Ketu axis transits\n   - Double transit theory (Jupiter + Saturn must support event)\n\n3. HOUSE CUSP VERIFICATION (20% weight)\n   - Check if lagna (ascendant) degree creates correct house placements\n   - 7th house cusp for marriage timing\n   - 10th house cusp for career events\n   - 5th house cusp for children\n   - Even 1-2 minutes change can shift house cusps significantly\n\n4. NAKSHATRA MATCHING (10% weight)\n   - Moon's nakshatra determines starting dasha\n   - Nakshatra pada (quarter) affects personality traits\n   - Verify nakshatra matches described characteristics\n\n\uD83D\uDD31 NARRATIVE PRIMACY: The user's story and event descriptions are the ULTIMATE SOURCE OF TRUTH. If a mathematical candidate aligns with the user's narrative (e.g., descriptions of 'job loss' or 'health issues'), it must be prioritized over raw planetary scores. Align the specific planetary themes (e.g., Mars for surgery, Jupiter for wealth) with the user's qualitative descriptions.\n\nSCORING METHODOLOGY:\n- Score each candidate time from 0-100\n- 90-100: Exceptional match - almost certainly correct\n- 75-89: Very good match - likely correct\n- 60-74: Moderate match - possible but needs verification\n- Below 60: Poor match - probably incorrect\n\nOUTPUT FORMAT (Strictly follow):\nFor each candidate time, provide:\n1. DASHA VERIFICATION: [Event-by-event dasha check]\n2. TRANSIT VERIFICATION: [Key transits on event dates]\n3. HOUSE ANALYSIS: [How houses support life pattern]\n4. CONFIDENCE SCORE: [0-100 with detailed justification]\n5. FINAL VERDICT: [Is this the correct birth time? Yes/No/Maybe]\n\n\n5. INPUT DATA SCHEMA (Raw Vedic Data):\n   - \"LAGNA\": Ascendant Sign and Degree.\n   - \"PLANETARY POSITIONS\": Sidereal/Lahiri longitudes.\n   - \"DIVISIONAL CHARTS\": D9/D10/D60 raw sign placements.\n   - \"VIMSHOTTARI\": Dates of Dasha/Antardasha.\n\nIMPORTANT:\n- YOU MUST CALCULATE FUNCTIONAL NATURE (Benefic/Malefic) yourself based on Lagna.\n- YOU MUST DETERMINE ASPECTS (Drishti) yourself from Longitudes.\n- FOCUS on D60 (Shashtyamsa) for the final seconds-level precision.\n- Do not expect pre-calculated \"hits\" or \"scores\". Use your specific knowledge.";
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
 * Execute AI calls in parallel batches with rate-limit awareness
 * This allows high-throughput analysis while staying within API limits
 */
export declare function executeAIInParallel(tasks: Array<() => Promise<AIResponse>>, concurrency?: number, staggerMs?: number): Promise<AIResponse[]>;
/**
 * Parse AI response to extract structured data
 */
export declare function parseAIAnalysisResponse(content: string): {
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
    callAI: typeof callAI;
    MASTER_ASTROLOGY_SYSTEM_PROMPT: string;
    buildCandidateAnalysisPrompt: typeof buildCandidateAnalysisPrompt;
    buildRankingPrompt: typeof buildRankingPrompt;
    parseAIAnalysisResponse: typeof parseAIAnalysisResponse;
};
export default _default;
//# sourceMappingURL=ai-client.d.ts.map