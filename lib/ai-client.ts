// Server-side only

// lib/ai-client.ts
// Production AI Thinking API Client
// Optimized for maximum accuracy in birth time rectification

import { logger } from './logger.js';


// ═════════════════════════════════════════════════════════════════════════════
// AI CONFIGURATION
// ═════════════════════════════════════════════════════════════════════════════

const AI_CONFIG = {
    // AI Model and connection settings
    baseUrl: process.env.AI_BASE_URL || process.env.DEEPSEEK_BASE_URL || process.env.ANTHROPIC_BASE_URL || process.env.AI_BASE_URL || 'https://api.deepseek.com',
    apiKey: process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || process.env.DEEPSEEK_MODEL || process.env.AI_MODEL || process.env.AI_MODEL || 'deepseek-reasoner', // V3 with CoT reasoning
    maxTokens: 32000,      // DeepSeek reasoner supports up to 64K
    thinkingBudget: 32000, // Extended thinking for highest accuracy
    temperature: 0.1,      // Note: ignored by deepseek-reasoner
    retryAttempts: 3,
    retryDelayMs: 2000,
    timeoutMs: 300000,     // 5 minutes timeout (DeepSeek Reasoner can be slow)
};

// ═════════════════════════════════════════════════════════════════════════════
// RESPONSE TYPES
// ═════════════════════════════════════════════════════════════════════════════

export interface AIResponse {
    success: boolean;
    thinking?: string;       // Internal reasoning (if thinking mode)
    content: string;         // Final analysis
    tokensUsed?: number;
    error?: string;
}

export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN API CALL FUNCTION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Call AI with extended thinking mode
 * This is the core function for all AI analysis
 */
export async function callAI(
    systemPrompt: string,
    userPrompt: string,
    options?: {
        temperature?: number;
        maxTokens?: number;
        enableThinking?: boolean;
        model?: string;
    }
): Promise<AIResponse> {
    const config = {
        temperature: options?.temperature ?? AI_CONFIG.temperature,
        maxTokens: options?.maxTokens ?? AI_CONFIG.maxTokens,
        enableThinking: options?.enableThinking ?? true,
        model: options?.model ?? AI_CONFIG.model,
    };

    if (!AI_CONFIG.apiKey) {
        logger.error('AI API_KEY not configured');
        return {
            success: false,
            content: '',
            error: 'AI API key not configured',
        };
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= AI_CONFIG.retryAttempts; attempt++) {
        try {
            logger.info('Calling AI Engine', {
                attempt,
                model: config.model,
                enableThinking: config.enableThinking,
            });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.timeoutMs);

            const isReasonerModel = config.model.includes('reasoner');

            const requestBody: any = {
                model: config.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                max_tokens: config.maxTokens,
                stream: false,
            };

            // DeepSeek Reasoner doesn't support temperature - only add for non-reasoner models
            if (!isReasonerModel) {
                requestBody.temperature = config.temperature;
            }

            // Add thinking mode if enabled
            if (config.enableThinking) {
                requestBody.use_search = false; // Disable search for faster response
            }

            const response = await fetch(`${AI_CONFIG.baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 429) {
                    logger.warn(`AI Rate Limit Hit (429). Waiting 30s before retry ${attempt}/${AI_CONFIG.retryAttempts}...`);
                    await sleep(30000); // Wait 30 seconds
                    continue; // Retry loop
                }
                const errorText = await response.text();
                throw new Error(`AI API error ${response.status}: ${errorText}`);
            }

            const data = await response.json() as any;

            // Parse response
            const message = data.choices?.[0]?.message;
            if (!message) {
                throw new Error('Invalid response format from AI');
            }

            // Extract thinking (if present) and content
            let thinking = '';
            let content = message.content || '';

            // Some models return thinking in a special format
            if (message.reasoning_content) {
                thinking = message.reasoning_content;
            }

            // Check for thinking markers in content
            const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/i);
            if (thinkingMatch) {
                thinking = thinkingMatch[1].trim();
                content = content.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
            }

            logger.info('AI response received', {
                contentLength: content.length,
                thinkingLength: thinking.length,
                tokensUsed: data.usage?.total_tokens,
            });

            return {
                success: true,
                thinking,
                content,
                tokensUsed: data.usage?.total_tokens,
            };

        } catch (error) {
            lastError = error as Error;
            logger.error(`AI attempt ${attempt} failed`, error);

            if (attempt < AI_CONFIG.retryAttempts) {
                await sleep(AI_CONFIG.retryDelayMs * attempt);
            }
        }
    }

    return {
        success: false,
        content: '',
        error: lastError?.message || 'All retry attempts failed',
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// STREAMING API CALL FUNCTION (for real-time AI thinking)
// ═════════════════════════════════════════════════════════════════════════════

import { emitAIThinking } from './session-events.js';

/**
 * Call AI with streaming enabled
 * Emits AI thinking tokens in real-time via SSE
 * 
 * @param sessionId - Session ID for SSE emission
 * @param stage - BTR stage number (2, 5, or 7)
 * @param candidateTime - Optional candidate time being analyzed
 */
export async function callAIWithStream(
    sessionId: string,
    stage: number,
    systemPrompt: string,
    userPrompt: string,
    options?: {
        temperature?: number;
        maxTokens?: number;
        model?: string;
        candidateTime?: string;
        abortSignal?: AbortSignal; // Support external cancellation
        onToken?: (content: string, isThinking: boolean) => void; // For heartbeats
        timeoutMs?: number; // Custom timeout
        progressTracker?: any; // Avoiding circular import by using any, or import type if possible
    }
): Promise<AIResponse> {
    const config = {
        temperature: options?.temperature ?? AI_CONFIG.temperature,
        maxTokens: options?.maxTokens ?? AI_CONFIG.maxTokens,
        model: options?.model ?? AI_CONFIG.model,
    };

    if (!AI_CONFIG.apiKey) {
        return {
            success: false,
            content: '',
            error: 'AI API key not configured',
        };
    }

    let lastError: Error | null = null;

    // Retry Loop for Streaming resilience
    for (let attempt = 1; attempt <= AI_CONFIG.retryAttempts; attempt++) {
        try {
            // 🚀 Debug: Log function entry
            const entryMsg = `🚀 callAIWithStream ATTEMPT ${attempt}/${AI_CONFIG.retryAttempts}: sessionId=${sessionId?.slice(0, 8)}, stage=${stage}\n`;
            console.log(entryMsg);

            logger.info('Calling AI with streaming', {
                sessionId,
                stage,
                attempt,
                model: config.model,
            });

            // Combine internal timeout with external abort signal
            const controller = new AbortController();
            const timeoutMs = options?.timeoutMs ?? AI_CONFIG.timeoutMs;
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            if (options?.abortSignal) {
                options.abortSignal.addEventListener('abort', () => {
                    logger.info('AI call cancelled by user');
                    controller.abort();
                });
            }

            const isReasoningModel = config.model.includes('reasoner');

            const requestBody: any = {
                model: config.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                max_tokens: config.maxTokens,
                stream: true, // Enable streaming
            };

            if (!isReasoningModel) {
                requestBody.temperature = config.temperature;
            }

            const response = await fetch(`${AI_CONFIG.baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                // 429 = Rate Limit -> Retry
                // 5xx = Server Error -> Retry
                throw new Error(`API error ${response.status}: ${errorText}`);
            }

            // Process SSE stream
            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body');
            }

            const decoder = new TextDecoder();
            let fullContent = '';
            let fullThinking = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        const delta = parsed.choices?.[0]?.delta;

                        if (delta?.reasoning_content) {
                            // DeepSeek Reasoner's thinking tokens
                            fullThinking += delta.reasoning_content;
                            emitAIThinking(sessionId, delta.reasoning_content, stage, options?.candidateTime);

                            // 💾 Persist for Polling Fallback
                            if (options?.progressTracker && typeof options.progressTracker.updateAIThinking === 'function') {
                                options.progressTracker.updateAIThinking(delta.reasoning_content, stage, options?.candidateTime).catch(() => { });
                            }

                            // 💓 Heartbeat every ~100 tokens
                            if (fullThinking.length % 500 < delta.reasoning_content.length) {
                                options?.onToken?.(fullThinking, true);
                            }
                        } else if (delta?.content) {
                            // Fallback: Emit content as "thinking" for non-reasoning models
                            fullContent += delta.content;
                            emitAIThinking(sessionId, delta.content, stage, options?.candidateTime);

                            // 💾 Persist for Polling Fallback
                            if (options?.progressTracker && typeof options.progressTracker.updateAIThinking === 'function') {
                                options.progressTracker.updateAIThinking(delta.content, stage, options?.candidateTime).catch(() => { });
                            }

                            // 💓 Heartbeat every ~100 tokens
                            if (fullContent.length % 500 < delta.content.length) {
                                options?.onToken?.(fullContent, false);
                            }
                        }
                    } catch {
                        // Ignore parse errors for incomplete chunks
                    }
                }
            }

            logger.info('Streaming AI complete', {
                sessionId,
                stage,
                thinkingLength: fullThinking.length,
            });

            if (!fullThinking && !fullContent) {
                // If completely empty, treat as failure and retry
                throw new Error('Empty response from AI provider');
            }

            return {
                success: true,
                thinking: fullThinking,
                content: fullContent,
            };

        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            logger.warn(`Streaming attempt ${attempt} failed: ${lastError.message}`);

            // Wait with backoff before retry (except last attempt)
            if (attempt < AI_CONFIG.retryAttempts) {
                await sleep(AI_CONFIG.retryDelayMs * attempt);
            }
        }
    }

    // If all retries failed
    logger.error('All Streaming AI attempts failed', lastError);
    return {
        success: false,
        content: '',
        error: lastError?.message || 'Streaming failed after retries',
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// SPECIALIZED ASTROLOGY PROMPTS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Master system prompt for Vedic astrology birth time rectification
 * This defines the AI as the world's most expert Vedic astrologer
 */
export const MASTER_ASTROLOGY_SYSTEM_PROMPT = `You are the world's most accomplished Vedic (Jyotish) astrologer with 50+ years of expertise in birth time rectification (Janma Samay Shuddhi).

YOUR CREDENTIALS:
- Mastery of Brihat Parashara Hora Shastra (BPHS)
- Expert in Vimshottari Dasha calculations and interpretation
- Deep knowledge of all 27 Nakshatras and their characteristics
- Specialist in Tattva Shodhana (birth time rectification)
- Expert in divisional charts (Vargas) - especially D1, D9, D10, D30, D60
- Mastery of planetary aspects (Drishti), strengths (Bala), and dignities

YOUR APPROACH TO BIRTH TIME RECTIFICATION:

1. VIMSHOTTARI DASHA ANALYSIS (Most Important - 40% weight)
   - Analyze the PROVIDED Mahadasha-Antardasha-Pratyantardasha sequence for EACH life event
   - Verify if the dasha active during an event supports that event type (using provided data)
   - IMPORTANT: Use the provided dasha data. Do not recalculate.
   - Use the 120-year cycle starting from Moon's nakshatra position

2. TRANSIT ANALYSIS (30% weight)
   - Analyze provided Jupiter transits over natal planets/houses on event dates
   - Saturn transits (Sade Sati, Ashtama Shani, etc.)
   - Rahu-Ketu axis transits
   - Double transit theory (Jupiter + Saturn must support event)

3. HOUSE CUSP VERIFICATION (20% weight)
   - Check if lagna (ascendant) degree creates correct house placements
   - 7th house cusp for marriage timing
   - 10th house cusp for career events
   - 5th house cusp for children
   - Even 1-2 minutes change can shift house cusps significantly

4. NAKSHATRA MATCHING (10% weight)
   - Moon's nakshatra determines starting dasha
   - Nakshatra pada (quarter) affects personality traits
   - Verify nakshatra matches described characteristics

SCORING METHODOLOGY:
- Score each candidate time from 0-100
- 90-100: Exceptional match - almost certainly correct
- 75-89: Very good match - likely correct
- 60-74: Moderate match - possible but needs verification
- Below 60: Poor match - probably incorrect

OUTPUT FORMAT (Strictly follow):
For each candidate time, provide:
1. DASHA VERIFICATION: [Event-by-event dasha check]
2. TRANSIT VERIFICATION: [Key transits on event dates]
3. HOUSE ANALYSIS: [How houses support life pattern]
4. CONFIDENCE SCORE: [0-100 with detailed justification]
5. FINAL VERDICT: [Is this the correct birth time? Yes/No/Maybe]

IMPORTANT:
- Be extremely precise in calculations
- Show your reasoning step by step
- Consider that birth times recorded in India are often rounded to nearest 5-15 minutes
- The tentative time is usually close - focus on ±30 minutes first
- Physical traits can help narrow down ascendant sign`;

/**
 * Build comprehensive prompt for candidate analysis
 */
export function buildCandidateAnalysisPrompt(
    candidateTime: string,
    dateOfBirth: string,
    planetaryPositions: string,
    housePositions: string,
    lifeEvents: Array<{
        category: string;
        eventType: string;
        eventDate: string;
        description: string;
        importance: string;
    }>,
    dashaInfo: string,
    physicalTraits?: {
        height?: string;
        build?: string;
        complexion?: string;
    }
): string {
    const eventsText = lifeEvents.map((event, i) =>
        `${i + 1}. ${event.eventType.toUpperCase()} (${event.category})
   Date: ${event.eventDate}
   Importance: ${event.importance}
   Description: ${event.description}`
    ).join('\n\n');

    const traitsText = physicalTraits
        ? `HEIGHT: ${physicalTraits.height || 'Not specified'}
BUILD: ${physicalTraits.build || 'Not specified'}
COMPLEXION: ${physicalTraits.complexion || 'Not specified'}`
        : 'No physical traits provided';

    return `BIRTH TIME RECTIFICATION ANALYSIS

══════════════════════════════════════════════════════════════════════════════
CANDIDATE BIRTH TIME: ${candidateTime}
DATE OF BIRTH: ${dateOfBirth}
══════════════════════════════════════════════════════════════════════════════

PLANETARY POSITIONS (Vedic/Sidereal - Lahiri Ayanamsa):
${planetaryPositions}

══════════════════════════════════════════════════════════════════════════════

HOUSE CUSPS (Placidus):
${housePositions}

══════════════════════════════════════════════════════════════════════════════

VIMSHOTTARI DASHA SEQUENCE:
${dashaInfo}

══════════════════════════════════════════════════════════════════════════════

LIFE EVENTS TO VERIFY (${lifeEvents.length} events):

${eventsText}

══════════════════════════════════════════════════════════════════════════════

PHYSICAL CHARACTERISTICS:
${traitsText}

══════════════════════════════════════════════════════════════════════════════

YOUR TASK:

1. For EACH life event above:
   a) Calculate which Mahadasha-Antardasha was active on that date
   b) Check if that dasha supports the event type
   c) Check major transits on that date
   d) Rate match quality (0-100)

2. Verify house placements support life pattern:
   - Check 7th house for marriage/relationships
   - Check 10th house for career
   - Check 4th house for education
   - Check 5th house for children
   - Check 6th/8th/12th for health issues

3. Cross-verify with physical traits if provided

4. Provide FINAL SCORE (0-100) with detailed justification

5. Give clear verdict: Is this the CORRECT birth time?

Be thorough. The person's entire life predictions depend on accurate birth time.`;
}

/**
 * Build prompt for ranking multiple candidates
 */
export function buildRankingPrompt(
    candidates: Array<{
        time: string;
        score: number;
        analysis: string;
    }>
): string {
    const candidatesText = candidates.map((c, i) =>
        `CANDIDATE #${i + 1}: ${c.time}
Initial Score: ${c.score}/100
Analysis Summary: ${c.analysis.substring(0, 500)}...`
    ).join('\n\n---\n\n');

    return `FINAL RANKING OF CANDIDATE BIRTH TIMES

You have analyzed the following ${candidates.length} candidates:

${candidatesText}

══════════════════════════════════════════════════════════════════════════════

FINAL TASK:

1. Compare all candidates based on:
   - Dasha correlation accuracy
   - Transit verification strength
   - House placement support
   - Overall consistency

2. Rank them from MOST LIKELY to LEAST LIKELY correct

3. For the TOP CHOICE:
   - Explain why it's the best match
   - List the strongest supporting evidence
   - Note any minor concerns

4. State your CONFIDENCE LEVEL:
   - HIGH (90%+): You are very confident this is correct
   - MEDIUM (70-89%): This is likely correct but some uncertainty
   - LOW (Below 70%): More information needed

OUTPUT FORMAT:
RANK 1: [Time] - Score: [X]/100 - [Reason]
RANK 2: [Time] - Score: [X]/100 - [Reason]
...

TOP RECOMMENDATION: [Time]
CONFIDENCE: [HIGH/MEDIUM/LOW]
KEY EVIDENCE: [List top 3 reasons]`;
}

// ═════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse AI response to extract structured data
 */
export function parseAIAnalysisResponse(content: string): {
    score: number;
    confidence: 'High' | 'Medium' | 'Low';
    verdict: string;
    dashaAnalysis: string;
    transitAnalysis: string;
    eventMatches: Array<{ event: string; matches: boolean; reason: string }>;
} {
    // Extract score
    const scoreMatch = content.match(/(?:FINAL SCORE|CONFIDENCE SCORE|SCORE)[:\s]*(\d+)/i);
    const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : 50;

    // Extract confidence
    const confMatch = content.match(/CONFIDENCE[:\s]*(HIGH|MEDIUM|LOW)/i);
    const confidence = (confMatch ? confMatch[1].toUpperCase() :
        score >= 80 ? 'HIGH' : score >= 60 ? 'MEDIUM' : 'LOW') as 'High' | 'Medium' | 'Low';

    // Extract verdict
    const verdictMatch = content.match(/(?:VERDICT|RECOMMENDATION|FINAL)[:\s]*([^\n]+)/i);
    const verdict = verdictMatch ? verdictMatch[1].trim() : 'Inconclusive';

    // Extract dasha analysis
    const dashaMatch = content.match(/DASHA(?:\s+VERIFICATION)?[:\s]*([\s\S]*?)(?=\n\n|\nTRANSIT|\nHOUSE|$)/i);
    const dashaAnalysis = dashaMatch ? dashaMatch[1].trim().substring(0, 1000) : '';

    // Extract transit analysis
    const transitMatch = content.match(/TRANSIT(?:\s+VERIFICATION)?[:\s]*([\s\S]*?)(?=\n\n|\nHOUSE|\nCONFIDENCE|$)/i);
    const transitAnalysis = transitMatch ? transitMatch[1].trim().substring(0, 1000) : '';

    // Parse event matches (basic extraction)
    const eventMatches: Array<{ event: string; matches: boolean; reason: string }> = [];
    const eventRegex = /(\d+)\.\s*([^:]+)[:\s]*(✓|✗|Yes|No|Match|No Match)[:\s]*([^\n]*)/gi;
    let match;
    while ((match = eventRegex.exec(content)) !== null) {
        eventMatches.push({
            event: match[2].trim(),
            matches: /✓|Yes|Match/i.test(match[3]),
            reason: match[4].trim(),
        });
    }

    return {
        score,
        confidence,
        verdict,
        dashaAnalysis,
        transitAnalysis,
        eventMatches,
    };
}

export default {
    callAI,
    MASTER_ASTROLOGY_SYSTEM_PROMPT,
    buildCandidateAnalysisPrompt,
    buildRankingPrompt,
    parseAIAnalysisResponse,
};
