// Server-side only

// lib/ai-client.ts
// Production AI Thinking API Client
// Optimized for maximum accuracy in birth time rectification

import { logger } from './logger.js';
import { config } from '../config/index.js';
import type { AIResponse, AIMessage } from '../types/index.js';

// Re-export types for backwards compatibility
export type { AIResponse, AIMessage };

// ═════════════════════════════════════════════════════════════════════════════
// AI CONFIGURATION
// ═════════════════════════════════════════════════════════════════════════════

const AI_CONFIG = {
    // OpenRouter AI Configuration
    baseUrl: config.ai.baseUrl,
    apiKey: config.ai.apiKey,
    model: config.ai.model,
    maxTokens: config.ai.maxTokens,
    thinkingBudget: config.ai.thinkingBudget,
    temperature: config.ai.temperature,
    retryAttempts: config.ai.retryAttempts,
    retryDelayMs: config.ai.retryDelayMs,
    timeoutMs: config.ai.timeoutMs,
};

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
    const configLocal = {
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
                model: configLocal.model,
                enableThinking: configLocal.enableThinking,
            });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.timeoutMs);

            const isReasonerModel = configLocal.model.includes('reasoner') || configLocal.model.includes('r1');

            const requestBody: any = {
                model: configLocal.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                max_tokens: configLocal.maxTokens,
                stream: false,

                // 🚀 OPENROUTER OPTIMIZATION - Driven by HF env vars
                provider: {
                    order: config.ai.providerOrder,
                    allow_fallbacks: config.ai.allowFallbacks
                }
            };

            // DeepSeek Reasoner/R1 doesn't support temperature - only add for non-reasoner models
            if (!isReasonerModel) {
                requestBody.temperature = configLocal.temperature;
            }

            // Add thinking mode if enabled
            if (configLocal.enableThinking) {
                requestBody.use_search = false; // Disable search for faster response
            }

            // Detect models that require reasoning protocol (OpenRouter specifically)
            const isOpenRouter = AI_CONFIG.baseUrl.includes('openrouter');
            const isKimi = configLocal.model.includes('kimi');
            const isDeepSeekR1 = isReasonerModel;
            const isV3Model = configLocal.model.includes('v3') || configLocal.model.includes('terminus');
            const isGrok = configLocal.model.includes('grok');

            // Add reasoning parameter for OpenRouter models that support it
            if (isOpenRouter && (isKimi || isDeepSeekR1 || isV3Model || isGrok)) {
                requestBody.include_reasoning = true;
            }

            const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
                    ...(isOpenRouter && {
                        'HTTP-Referer': 'https://aipandit.com',
                        'X-Title': 'AI Pandit BTR',
                    }),
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
            // OpenRouter standardizes on 'reasoning', DeepSeek native uses 'reasoning_content'
            if (message.reasoning) {
                thinking = message.reasoning;
            } else if (message.reasoning_content) {
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
    const configLocal = {
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
                model: configLocal.model,
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

            const isReasonerModel = configLocal.model.includes('reasoner') || configLocal.model.includes('r1');

            const requestBody: any = {
                model: configLocal.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                max_tokens: configLocal.maxTokens,
                stream: true, // Enable streaming

                // 🚀 OPENROUTER OPTIMIZATION: Max Speed & Quality
                provider: {
                    order: config.ai.providerOrder,
                    allow_fallbacks: config.ai.allowFallbacks,
                    data_collection: config.ai.dataCollection
                }
            };

            if (!isReasonerModel) {
                requestBody.temperature = configLocal.temperature;
            }

            // Detect models that require reasoning protocol (OpenRouter specifically)
            const isOpenRouter = AI_CONFIG.baseUrl.includes('openrouter');
            const isKimi = configLocal.model.includes('kimi');
            const isDeepSeekR1 = isReasonerModel;
            const isV3Model = configLocal.model.includes('v3') || configLocal.model.includes('terminus');
            const isGrok = configLocal.model.includes('grok');

            // Add reasoning parameter for OpenRouter models that support it
            if (isOpenRouter && (isKimi || isDeepSeekR1 || isV3Model || isGrok)) {
                requestBody.include_reasoning = true;
            }

            const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
                    'Content-Type': 'application/json',
                    ...(isOpenRouter && {
                        'HTTP-Referer': 'https://aipandit.com',
                        'X-Title': 'AI Pandit BTR',
                    }),
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

            let emitBuffer = '';
            let lastEmitTime = Date.now();

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

                        const reasoningChunk = delta?.reasoning || delta?.reasoning_content;
                        let chunkToProcess = '';
                        let isReasoning = false;

                        if (reasoningChunk) {
                            fullThinking += reasoningChunk;
                            chunkToProcess = reasoningChunk;
                            isReasoning = true;
                        } else if (delta?.content) {
                            fullContent += delta.content;
                            chunkToProcess = delta.content;
                        }

                        if (chunkToProcess) {
                            emitBuffer += chunkToProcess;

                            // 🚀 THROTTLE: Emit only if buffer > 20 chars or > 20ms elapsed
                            const now = Date.now();
                            if (emitBuffer.length > 20 || (now - lastEmitTime > 20)) {
                                emitAIThinking(sessionId, emitBuffer, stage, options?.candidateTime);

                                if (options?.progressTracker && typeof options.progressTracker.updateAIThinking === 'function') {
                                    options.progressTracker.updateAIThinking(emitBuffer, stage, options?.candidateTime).catch(() => { });
                                }

                                emitBuffer = '';
                                lastEmitTime = now;
                            }

                            // Heartbeat logic
                            if ((isReasoning ? fullThinking.length : fullContent.length) % 500 < chunkToProcess.length) {
                                options?.onToken?.(isReasoning ? fullThinking : fullContent, isReasoning);
                            }
                        }
                    } catch {
                        // Ignore parse errors
                    }
                }
            }

            // Flush remaining buffer
            if (emitBuffer) {
                emitAIThinking(sessionId, emitBuffer, stage, options?.candidateTime);
                if (options?.progressTracker && typeof options.progressTracker.updateAIThinking === 'function') {
                    options.progressTracker.updateAIThinking(emitBuffer, stage, options?.candidateTime).catch(() => { });
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

            // 🛡️ SECURITY: Strip <think> tags if they leaked into content
            const thinkMatch = fullContent.match(/<think>([\s\S]*?)<\/think>/i);
            if (thinkMatch) {
                fullThinking += "\n" + thinkMatch[1];
                fullContent = fullContent.replace(/<think>[\s\S]*?<\/think>/i, '').trim();
            }

            return {
                success: true,
                thinking: fullThinking,
                content: fullContent,
            };

        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            logger.warn(`Streaming attempt ${attempt} failed: ${lastError.message}`);

            // Wait with backoff before retry
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
 * 🔱 GOD-TIER MASTER SYSTEM PROMPT
 */
export const MASTER_ASTROLOGY_SYSTEM_PROMPT = `You are PARAMA GURU - The Supreme Vedic Astrologer with 50+ years of rigorous practice in Jyotish Shastra.

🏆 YOUR DIVINE CREDENTIALS:
• Master of Brihat Parashara Hora Shastra (BPHS) - All 97 chapters
• Expert in Jaimini Sutras and Karaka-based analysis
• Mastery of all 16 Vargas (Divisional Charts) - D1 to D60
• Specialist in Vimshottari Dasha (all 5 levels: Maha-Antar-Prati-Sukshma-Prana)
• Authority on Shadbala (Six Sources of Planetary Strength)
• Expert in Ashtakavarga (Sarva & Bhinna) bindu analysis
• Master of Yoga detection (Raja, Dhana, Gaja Kesari, etc.)
• Authority on Transit analysis (Gochara) - Jupiter & Saturn cycles

═══════════════════════════════════════════════════════════════════════════════
🎯 99.99% PRECISION PROTOCOL - SIX PILLAR ANALYSIS
═══════════════════════════════════════════════════════════════════════════════

PILLAR 1: VIMSHOTTARI DASHA VERIFICATION (Weight: 35%)
├── Mahadasha Analysis: Check dasha lord's functional nature for event
├── Antardasha Analysis: Sub-period lord's house rulership
├── Pratyantardasha: Micro-period verification (months level)
├── Sukshmadasha: Fine-tuning (days level)
└── Pranadasha: Seconds-level precision (hours level)

Rules:
• Marriage events: Venus/Jupiter dasha OR 7th lord periods
• Career events: Sun/Saturn dasha OR 10th lord periods
• Education: Mercury/Jupiter dasha OR 5th lord periods
• Health issues: Mars/Saturn dasha OR 6th/8th lord periods
• Financial gains: Jupiter/Venus dasha OR 2nd/11th lord periods

PILLAR 2: DIVISIONAL CHART SYNTHESIS (Weight: 25%)
├── D1 (Rashi): Lagna and planetary positions - Foundation
├── D9 (Navamsa): Marriage/spouse verification - Soul chart
├── D10 (Dasamsa): Career and status - Professional life
└── D60 (Shashtyamsa): FINAL SECONDS-LEVEL PRECISION - Past life karma

CRITICAL: D60 Lagna change = 2 minutes time difference. Use D60 deity and planetary positions for final verification.

PILLAR 3: TRANSIT VERIFICATION (Weight: 20%)
├── Jupiter Transit: Must aspect event-sensitive house OR be in trine
├── Saturn Transit: Sade Sati (12th, 1st, 2nd from Moon) for major events
├── Double Transit: Jupiter + Saturn simultaneously activating event house
└── Rahu-Ketu: Nodal axis transits for sudden/transformative events

PILLAR 4: PLANETARY STRENGTH ANALYSIS (Weight: 10%)
├── Shadbala: Check total strength (Rupa) of key planets
│   ├── Sthana Bala: Positional strength (Exaltation, Moolatrikona, Own)
│   ├── Dig Bala: Directional strength
│   ├── Kala Bala: Temporal strength
│   ├── Cheshta Bala: Motional strength
│   ├── Naisargika Bala: Natural strength
│   └── Drik Bala: Aspectual strength
└── Ashtakavarga: Bindu count in event-related houses
    ├── 30+ bindus = Excellent results
    ├── 25-30 bindus = Good results
    └── Below 25 = Weak manifestation

PILLAR 5: YOGA VERIFICATION (Weight: 5%)
├── Raja Yogas: Confer power/status (1st/4th/5th/7th/9th/10th lords)
├── Dhana Yogas: Wealth combinations (2nd/5th/9th/11th lords)
├── Gaja Kesari: Moon-Jupiter angle (success/intelligence)
└── Specific Yogas: Check presence in candidate's chart

PILLAR 6: NAKSHATRA PRECISION (Weight: 5%)
├── Moon's Nakshatra: Determines starting dasha
├── Ascendant Nakshatra: Physical appearance correlation
├── Pada (Quarter): 4 quarters = 3.33 degrees each
└── Nakshatra Deity: Indicates soul's purpose

═══════════════════════════════════════════════════════════════════════════════
📊 SCORING METHODOLOGY (0-100 Scale)
═══════════════════════════════════════════════════════════════════════════════

90-100: DIVINE MATCH
• All 6 pillars align perfectly
• D60 verification confirms seconds-level precision
• Multiple yoga activations on event dates
• Transit double-confirmation

80-89: EXCELLENT MATCH
• 5/6 pillars align strongly
• Minor discrepancies in D60
• Strong dasha-transit correlation

70-79: GOOD MATCH
• 4/6 pillars align
• Some timing discrepancies (±2-3 minutes)
• Overall pattern matches but not precise

60-69: MODERATE MATCH
• 3/6 pillars align
• Significant timing gaps
• Possible but needs verification

Below 60: POOR MATCH
• Less than 3 pillars align
• Major contradictions present
• Likely incorrect birth time

═══════════════════════════════════════════════════════════════════════════════
📝 OUTPUT FORMAT (Mandatory Structure)
═══════════════════════════════════════════════════════════════════════════════

For EACH candidate, provide:

CANDIDATE #N: [HH:MM:SS]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ DASHA ANALYSIS (35% weight)
• Event 1 ([Date]): [Lord] Maha - [Lord] Antara - [SCORE]/100
  └─ Reason: [Specific astrological reasoning]
• Event 2 ([Date]): [Lord] Maha - [Lord] Antara - [SCORE]/100
  └─ Reason: [Specific astrological reasoning]
[Continue for all events]
→ DASHA SUBTOTAL: [XX]/100

2️⃣ DIVISIONAL CHARTS (25% weight)
• D1 Lagna: [Sign] [Degree]° - [Verification result]
• D9 Lagna: [Sign] - [Marriage verification]
• D10 Lagna: [Sign] - [Career verification]
• D60 Lagna: [Sign] - [Seconds precision check]
  └─ D60 Deity: [Deity name] - [Significance]
→ VARGA SUBTOTAL: [XX]/100

3️⃣ TRANSIT VERIFICATION (20% weight)
• Event 1: Jupiter in [Sign] aspecting [House] - [✓/✗]
• Event 1: Saturn in [Sign] - [Position description] - [✓/✗]
• Double Transit: [Active/Inactive] - [Explanation]
[Continue for all events]
→ TRANSIT SUBTOTAL: [XX]/100

4️⃣ SHADBALA & ASHTAKAVARGA (10% weight)
• Key Planet ([Planet]): [X.XX] Rupa - [Strength assessment]
• Event House ([House]): [XX] bindus - [Favorability]
→ STRENGTH SUBTOTAL: [XX]/100

5️⃣ YOGA DETECTION (5% weight)
• [Yoga Name]: [Present/Absent] - [Effect on events]
→ YOGA SUBTOTAL: [XX]/100

6️⃣ NAKSHATRA ANALYSIS (5% weight)
• Moon Nakshatra: [Name] [Pada] - [Dasha correlation]
• Asc Nakshatra: [Name] [Pada] - [Physical correlation]
→ NAKSHATRA SUBTOTAL: [XX]/100

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 FINAL CALCULATION:
Weighted Score = (D×0.35) + (V×0.25) + (T×0.20) + (S×0.10) + (Y×0.05) + (N×0.05)

📊 FINAL SCORE: [XX]/100
🎖️ CONFIDENCE LEVEL: [DIVINE/EXCELLENT/GOOD/MODERATE/POOR]
⚖️ VERDICT: [This IS / IS LIKELY / IS POSSIBLY / IS NOT the correct birth time]

📝 DETAILED REASONING:
[3-5 sentences explaining the key factors that led to this score.]

🔍 MISSING DATA AUDIT:
[List any data gaps that prevented 99.99% precision]

═══════════════════════════════════════════════════════════════════════════════

After analyzing ALL candidates:

🏆 FINAL RECOMMENDATION:
• Best Candidate: [HH:MM:SS]
• Confidence: [XX]%
• Key Evidence: [Top 3 supporting factors]
• Alternative: [If close second exists]

⚠️ IMPORTANT NOTES:
• Always prioritize D60 verification for seconds precision
• choice with better D9/D60 alignment
• Document ALL missing data that limited precision`;

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

PLANETARY POSITIONS (Vedic/Sidereal):
${planetaryPositions}

══════════════════════════════════════════════════════════════════════════════

HOUSE CUSPS:
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
1. Cross-verify dasha and transits for each event.
2. Check divisional charts (D1, D9, D10, D60).
3. Provide weighted score and confidence verdict.`;
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
1. Rank them from MOST LIKELY to LEAST LIKELY.
2. State confidence and missing data for 99.9% precision.

OUTPUT FORMAT:
RANK 1: [Time] - Score: [X]/100
RANK 2: [Time] - Score: [X]/100

TOP RECOMMENDATION: [Time]
CONFIDENCE: [HIGH/MEDIUM/LOW]
🚨 MISSING DATA: [List gaps]`;
}

// ═════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute AI calls in parallel batches
 */
/**
 * Execute tasks in parallel with controlled concurrency
 */
export async function executeAIInParallel<T>(
    tasks: Array<() => Promise<T>>,
    concurrency: number = 3,
    staggerMs: number = 500
): Promise<T[]> {
    const results: T[] = new Array(tasks.length);
    const queue = tasks.map((task, index) => ({ task, index }));
    let activeCount = 0;
    let nextIndex = 0;

    return new Promise((resolve) => {
        const runNext = () => {
            if (nextIndex >= tasks.length && activeCount === 0) {
                resolve(results);
                return;
            }

            while (activeCount < concurrency && nextIndex < tasks.length) {
                const { task, index } = queue[nextIndex++];
                activeCount++;

                if (staggerMs > 0 && activeCount > 1) {
                    // Stagger logic is simplified here to avoid blocking loop
                    setTimeout(() => {
                        processTask(task, index);
                    }, staggerMs * (activeCount - 1));
                } else {
                    processTask(task, index);
                }
            }
        };

        const processTask = async (task: () => Promise<T>, index: number) => {
            try {
                results[index] = await task();
            } catch (error) {
                // For now, if a task fails and T is not AIResponse, we might have issues.
                // But in our case, we handle errors inside the task wrapper in stage2/4.
                logger.error(`Parallel task failed at index ${index}`, error);
            } finally {
                activeCount--;
                runNext();
            }
        };

        runNext();
    });
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
    const scoreMatch = content.match(/(?:FINAL SCORE|CONFIDENCE SCORE|SCORE)[:\s]*(\d+)/i);
    const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : 50;

    const confMatch = content.match(/CONFIDENCE[:\s]*(HIGH|MEDIUM|LOW)/i);
    const confidence = (confMatch ? confMatch[1].toUpperCase() :
        score >= 80 ? 'HIGH' : score >= 60 ? 'MEDIUM' : 'LOW') as 'High' | 'Medium' | 'Low';

    const verdictMatch = content.match(/(?:VERDICT|RECOMMENDATION|FINAL)[:\s]*([^\n]+)/i);
    const verdict = verdictMatch ? verdictMatch[1].trim() : 'Inconclusive';

    const dashaMatch = content.match(/DASHA(?:\s+VERIFICATION)?[:\s]*([\s\S]*?)(?=\n\n|\nTRANSIT|\nHOUSE|$)/i);
    const dashaAnalysis = dashaMatch ? dashaMatch[1].trim().substring(0, 1000) : '';

    const transitMatch = content.match(/TRANSIT(?:\s+VERIFICATION)?[:\s]*([\s\S]*?)(?=\n\n|\nHOUSE|\nCONFIDENCE|$)/i);
    const transitAnalysis = transitMatch ? transitMatch[1].trim().substring(0, 1000) : '';

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
