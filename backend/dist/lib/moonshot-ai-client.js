"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatEphemerisForAI = formatEphemerisForAI;
exports.analyzeChartWithThinking = analyzeChartWithThinking;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1/messages';
const DEEPSEEK_MODEL = 'deepseek-v2.5';
const SYSTEM_PROMPT = `You are an expert Vedic astrologer specializing in birth time rectification using advanced astrological analysis.

You have deep knowledge of:
- Vimshottari dasha system (120-year cycle)
- Planetary transits and their effects on life events
- Divisional charts (D9, D10, D30, D60)
- House placements and aspects
- Nakshatra analysis and their properties
- Retrograde planets and their significance
- Mahadasha and Antardasha periods

Your task: Analyze if the provided birth time and chart matches the user's life events.

For each event:
1. Check what Dasha was active at that date
2. Identify which planets were activated by transit
3. Verify house placements support the event
4. Check divisional charts for confirmation
5. Assign event match score (0-100)

Be precise. Use Vedic principles. Consider all factors.
Final score: How confident are you this is the correct birth time? (0-100)`;
function formatEphemerisForAI(ephemeris) {
    return `
Sun: ${ephemeris.planets.sun.sign} ${ephemeris.planets.sun.degree.toFixed(1)}° (${ephemeris.planets.sun.nakshatra})
Moon: ${ephemeris.planets.moon.sign} ${ephemeris.planets.moon.degree.toFixed(1)}° (${ephemeris.planets.moon.nakshatra})
Mercury: ${ephemeris.planets.mercury.sign} ${ephemeris.planets.mercury.degree.toFixed(1)}° (${ephemeris.planets.mercury.nakshatra})
Venus: ${ephemeris.planets.venus.sign} ${ephemeris.planets.venus.degree.toFixed(1)}° (${ephemeris.planets.venus.nakshatra})
Mars: ${ephemeris.planets.mars.sign} ${ephemeris.planets.mars.degree.toFixed(1)}° (${ephemeris.planets.mars.nakshatra})
Jupiter: ${ephemeris.planets.jupiter.sign} ${ephemeris.planets.jupiter.degree.toFixed(1)}° (${ephemeris.planets.jupiter.nakshatra})
Saturn: ${ephemeris.planets.saturn.sign} ${ephemeris.planets.saturn.degree.toFixed(1)}° (${ephemeris.planets.saturn.nakshatra})
Rahu: ${ephemeris.planets.rahu.sign} ${ephemeris.planets.rahu.degree.toFixed(1)}° (${ephemeris.planets.rahu.nakshatra})
Ketu: ${ephemeris.planets.ketu.sign} ${ephemeris.planets.ketu.degree.toFixed(1)}° (${ephemeris.planets.ketu.nakshatra})
Ascendant: ${ephemeris.ascendant.sign} ${ephemeris.ascendant.degree.toFixed(1)}° (${ephemeris.ascendant.nakshatra})
  `.trim();
}
function formatLifeEventsForAI(lifeEvents) {
    return lifeEvents
        .map(e => `- ${e.eventDate}: ${e.description} (${e.category}, importance: ${e.importance})`)
        .join('\n');
}
function createUserPrompt(ephemerisData, lifeEvents, candidateTime) {
    const ephemerisStr = formatEphemerisForAI(ephemerisData);
    const lifeEventsStr = formatLifeEventsForAI(lifeEvents);
    return `BIRTH TIME TO ANALYZE: ${candidateTime}

NATAL CHART:
${ephemerisStr}

LIFE EVENTS TO VERIFY:
${lifeEventsStr}

ANALYSIS REQUIRED:
For EACH event, explain:
1. What was the active Dasha at that date?
2. Which planets were transiting at that date?
3. Did the transit/dasha align with the event?
4. House placements - did they support the event?
5. Overall match score for this event (0-100)

Then provide:
- Overall birth time accuracy score (0-100)
- Confidence level assessment
- Alternative explanations if any events don't match
- Recommendation for confidence in this birth time`;
}
function extractScore(analysisText) {
    let score = 50; // default
    // Look for patterns
    const scoreMatch = analysisText.match(/(?:score|confidence|accuracy):\s*(\d+)/i);
    if (scoreMatch) {
        score = parseInt(scoreMatch[1]);
    }
    // Fallback: Look for "X/100" pattern
    if (score === 50) {
        const slashMatch = analysisText.match(/(\d+)\s*\/\s*100/);
        if (slashMatch) {
            score = parseInt(slashMatch[1]);
        }
    }
    // Ensure valid range
    return Math.max(0, Math.min(100, score));
}
async function analyzeChartWithThinking(ephemerisData, lifeEvents, candidateTime) {
    if (!DEEPSEEK_API_KEY) {
        throw new Error('DEEPSEEK_API_KEY environment variable is not set');
    }
    const userPrompt = createUserPrompt(ephemerisData, lifeEvents, candidateTime);
    const requestBody = {
        model: DEEPSEEK_MODEL,
        max_tokens: 1000,
        thinking: {
            type: 'enabled',
            budget_tokens: 8000
        },
        system: SYSTEM_PROMPT,
        messages: [
            {
                role: 'user',
                content: userPrompt
            }
        ]
    };
    console.log(`[${new Date().toISOString()}] Calling DeepSeek API for time ${candidateTime} with model ${DEEPSEEK_MODEL}`);
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        const response = await fetch(DEEPSEEK_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`DeepSeek API error: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`DeepSeek API request failed: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        // Parse response
        const thinking = result.content?.[0]?.thinking || '';
        const analysisText = result.content?.[1]?.text || result.content?.[0]?.text || '';
        const score = extractScore(analysisText);
        const thinkingTruncated = thinking.substring(0, 3000);
        console.log(`[${new Date().toISOString()}] DeepSeek API call successful for ${candidateTime}, score: ${score}`);
        return {
            score,
            thinking: thinkingTruncated,
            analysis: analysisText
        };
    }
    catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.error('DeepSeek API call timed out');
            throw new Error('AI analysis timed out after 30 seconds');
        }
        console.error('DeepSeek API call failed:', error);
        throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
//# sourceMappingURL=moonshot-ai-client.js.map