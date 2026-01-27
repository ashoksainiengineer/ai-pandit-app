// Server-side only
// lib/btr-processor.ts
// Main Birth Time Rectification processor
// Optimized for high-performance AI integration
import { calculateEphemeris, calculateJulianDay, convertToUTC } from './ephemeris.js';
import { calculateVimshottariDasha, getDashaForDate, dashaSupportsEvent, formatDashaSequence, tropicalToSidereal, getNakshatraForLongitude, } from './vedic-astrology-engine.js';
import { callAI, MASTER_ASTROLOGY_SYSTEM_PROMPT, buildCandidateAnalysisPrompt, parseAIAnalysisResponse, } from './ai-client.js';
import { generateCandidateTimes } from './time-offset-manager.js';
import { logger } from './logger.js';
// ═════════════════════════════════════════════════════════════════════════════
// MAIN PROCESSING FUNCTION
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Main processing function - called by queue manager
 * Optimized for high-performance scale
 */
export async function processAnalysis(input) {
    const startTime = Date.now();
    try {
        logger.info('Starting BTR analysis', {
            sessionId: input.sessionId,
            dateOfBirth: input.dateOfBirth,
            tentativeTime: input.tentativeTime,
            eventCount: input.lifeEvents.length,
        });
        // ═══════════════════════════════════════════════════════════════════════
        // PHASE 1: Generate Candidate Times
        // ═══════════════════════════════════════════════════════════════════════
        const candidates = generateCandidateTimes(input.tentativeTime, input.offsetConfig);
        logger.info('Generated candidates', { count: candidates.length });
        // ═══════════════════════════════════════════════════════════════════════
        // PHASE 2: Quick Local Filtering (Memory-Efficient)
        // ═══════════════════════════════════════════════════════════════════════
        const scoredCandidates = await quickFilterCandidates(candidates, input.dateOfBirth, input.latitude, input.longitude, input.timezone, input.lifeEvents);
        // Take top 5 for deep analysis (save AI tokens)
        const topCandidates = scoredCandidates.slice(0, 5);
        logger.info('Quick filter complete', {
            total: candidates.length,
            filtered: scoredCandidates.length,
            forDeepAnalysis: topCandidates.length,
        });
        // ═══════════════════════════════════════════════════════════════════════
        // PHASE 3: Deep Analysis with AI (The Heavy Lifting)
        // ═══════════════════════════════════════════════════════════════════════
        const analysisResults = await analyzeWithAI(topCandidates, input.dateOfBirth, input.latitude, input.longitude, input.timezone, input.lifeEvents, input.physicalTraits);
        // ═══════════════════════════════════════════════════════════════════════
        // PHASE 4: Final Ranking and Selection
        // ═══════════════════════════════════════════════════════════════════════
        const bestResult = selectBestCandidate(analysisResults);
        const processingTime = Date.now() - startTime;
        logger.info('BTR analysis complete', {
            sessionId: input.sessionId,
            rectifiedTime: bestResult.time,
            accuracy: bestResult.score,
            processingTimeMs: processingTime,
        });
        return {
            rectifiedTime: bestResult.time,
            accuracy: bestResult.score,
            confidence: bestResult.confidence,
            analysisResult: JSON.stringify({
                topRecommendation: bestResult,
                alternatives: analysisResults.filter(r => r.time !== bestResult.time).slice(0, 4),
                quickScores: scoredCandidates.slice(0, 20),
                processingTimeMs: processingTime,
            }),
        };
    }
    catch (error) {
        logger.error('BTR processing failed', error);
        throw error;
    }
}
// ═════════════════════════════════════════════════════════════════════════════
// PHASE 2: QUICK LOCAL FILTERING
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Quick filter using local Dasha calculations
 * This reduces candidates before expensive AI calls
 */
async function quickFilterCandidates(candidates, dateOfBirth, latitude, longitude, timezone, lifeEvents) {
    const scores = [];
    const birthDate = new Date(dateOfBirth);
    for (const candidate of candidates) {
        try {
            // Calculate ephemeris for this time
            const ephemeris = await calculateEphemeris(dateOfBirth, candidate.time, latitude, longitude, timezone);
            // Get sidereal Moon position
            const jd = calculateJulianDay(convertToUTC(dateOfBirth, candidate.time, timezone));
            const moonSidereal = tropicalToSidereal(ephemeris.planets.moon.longitude, jd);
            // Calculate Vimshottari Dasha
            const dashaPeriods = calculateVimshottariDasha(moonSidereal, birthDate);
            // Score based on event-dasha correlation
            let dashaScore = 0;
            let eventMatches = 0;
            for (const event of lifeEvents) {
                const eventDate = new Date(event.eventDate);
                const dasha = getDashaForDate(dashaPeriods, eventDate);
                if (dasha) {
                    const correlation = dashaSupportsEvent(dasha, event.category, event.eventType);
                    if (correlation.supports) {
                        eventMatches++;
                        dashaScore += correlation.strength;
                    }
                }
            }
            // Normalize score
            const normalizedDashaScore = lifeEvents.length > 0
                ? Math.round(dashaScore / lifeEvents.length)
                : 50;
            // Quick score = dasha alignment (primary factor)
            const quickScore = normalizedDashaScore;
            scores.push({
                time: candidate.time,
                quickScore,
                dashaScore: normalizedDashaScore,
                eventMatches,
                shouldAnalyze: quickScore >= 30 || eventMatches >= 2,
            });
        }
        catch (error) {
            logger.error(`Quick filter failed for ${candidate.time}`, error);
        }
    }
    // Sort by quick score
    scores.sort((a, b) => b.quickScore - a.quickScore);
    return scores;
}
/**
 * Deep analysis using AI with extended thinking
 * This is where the magic happens - expert-level analysis
 */
async function analyzeWithAI(candidates, dateOfBirth, latitude, longitude, timezone, lifeEvents, physicalTraits) {
    const results = [];
    const birthDate = new Date(dateOfBirth);
    for (const candidate of candidates) {
        try {
            logger.info('Deep analysis starting', { time: candidate.time });
            // Get ephemeris
            const ephemeris = await calculateEphemeris(dateOfBirth, candidate.time, latitude, longitude, timezone);
            // Get Julian Day
            const jd = calculateJulianDay(convertToUTC(dateOfBirth, candidate.time, timezone));
            // Get sidereal positions for all planets
            const planets = {};
            for (const [name, data] of Object.entries(ephemeris.planets)) {
                const sidereal = tropicalToSidereal(data.longitude, jd);
                const nakshatra = getNakshatraForLongitude(sidereal);
                planets[name] = `${data.sign} ${(sidereal % 30).toFixed(2)}° (${nakshatra.name} pada ${nakshatra.pada})`;
            }
            // Calculate Dasha
            const moonSidereal = tropicalToSidereal(ephemeris.planets.moon.longitude, jd);
            const dashaPeriods = calculateVimshottariDasha(moonSidereal, birthDate);
            const dashaInfo = formatDashaSequence(dashaPeriods);
            // Format planetary positions for prompt
            const planetaryPositions = Object.entries(planets)
                .map(([name, pos]) => `${name.toUpperCase()}: ${pos}`)
                .join('\n');
            // Format house positions
            const housePositions = ephemeris.houses
                .map(h => `House ${h.houseNumber}: ${h.sign} ${h.degree.toFixed(2)}°`)
                .join('\n');
            // Format life events with dasha info
            const eventsWithDasha = lifeEvents.map(event => {
                const eventDate = new Date(event.eventDate);
                const dasha = getDashaForDate(dashaPeriods, eventDate);
                return {
                    ...event,
                    dasha: dasha ? `${dasha.mahadasha}/${dasha.antardasha}` : 'Unknown',
                };
            });
            // Build comprehensive prompt for AI
            const prompt = buildCandidateAnalysisPrompt(candidate.time, dateOfBirth, planetaryPositions, housePositions, eventsWithDasha.map(e => ({
                category: e.category,
                eventType: e.eventType,
                eventDate: e.eventDate,
                description: `${e.description} [Dasha: ${e.dasha}]`,
                importance: e.importance,
            })), dashaInfo, physicalTraits);
            // Call AI with extended thinking
            const response = await callAI(MASTER_ASTROLOGY_SYSTEM_PROMPT, prompt, {
                temperature: 0.1,
                maxTokens: 8000,
                enableThinking: true,
            });
            if (!response.success) {
                logger.error('AI call failed', { error: response.error });
                continue;
            }
            // Parse response
            const parsed = parseAIAnalysisResponse(response.content);
            results.push({
                time: candidate.time,
                score: parsed.score,
                confidence: parsed.confidence,
                analysis: response.content,
                thinking: response.thinking || '',
                dashaAnalysis: parsed.dashaAnalysis,
                transitAnalysis: parsed.transitAnalysis,
                verdict: parsed.verdict,
            });
            logger.info('Deep analysis complete', {
                time: candidate.time,
                score: parsed.score,
                confidence: parsed.confidence,
            });
        }
        catch (error) {
            logger.error(`Deep analysis failed for ${candidate.time}`, error);
        }
    }
    // Sort by score
    results.sort((a, b) => b.score - a.score);
    return results;
}
// ═════════════════════════════════════════════════════════════════════════════
// PHASE 4: FINAL SELECTION
// ═════════════════════════════════════════════════════════════════════════════
function selectBestCandidate(results) {
    if (results.length === 0) {
        throw new Error('No analysis results available');
    }
    // Already sorted by score, return best
    const best = results[0];
    logger.info('Best candidate selected', {
        time: best.time,
        score: best.score,
        confidence: best.confidence,
    });
    return best;
}
// ═════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════
export default processAnalysis;
//# sourceMappingURL=btr-processor.js.map