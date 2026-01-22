"use strict";
// Server-side only
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAnalysis = processAnalysis;
// lib/btr-processor.ts
// Main Birth Time Rectification processor
// Optimized for high-performance AI integration
const ephemeris_js_1 = require("./ephemeris.js");
const vedic_astrology_engine_js_1 = require("./vedic-astrology-engine.js");
const ai_client_js_1 = require("./ai-client.js");
const time_offset_manager_js_1 = require("./time-offset-manager.js");
const logger_js_1 = require("./logger.js");
// ═════════════════════════════════════════════════════════════════════════════
// MAIN PROCESSING FUNCTION
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Main processing function - called by queue manager
 * Optimized for high-performance scale
 */
async function processAnalysis(input) {
    const startTime = Date.now();
    try {
        logger_js_1.logger.info('Starting BTR analysis', {
            sessionId: input.sessionId,
            dateOfBirth: input.dateOfBirth,
            tentativeTime: input.tentativeTime,
            eventCount: input.lifeEvents.length,
        });
        // ═══════════════════════════════════════════════════════════════════════
        // PHASE 1: Generate Candidate Times
        // ═══════════════════════════════════════════════════════════════════════
        const candidates = (0, time_offset_manager_js_1.generateCandidateTimes)(input.tentativeTime, input.offsetConfig);
        logger_js_1.logger.info('Generated candidates', { count: candidates.length });
        // ═══════════════════════════════════════════════════════════════════════
        // PHASE 2: Quick Local Filtering (Memory-Efficient)
        // ═══════════════════════════════════════════════════════════════════════
        const scoredCandidates = await quickFilterCandidates(candidates, input.dateOfBirth, input.latitude, input.longitude, input.timezone, input.lifeEvents);
        // Take top 5 for deep analysis (save AI tokens)
        const topCandidates = scoredCandidates.slice(0, 5);
        logger_js_1.logger.info('Quick filter complete', {
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
        logger_js_1.logger.info('BTR analysis complete', {
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
        logger_js_1.logger.error('BTR processing failed', error);
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
            const ephemeris = await (0, ephemeris_js_1.calculateEphemeris)(dateOfBirth, candidate.time, latitude, longitude, timezone);
            // Get sidereal Moon position
            const jd = (0, ephemeris_js_1.calculateJulianDay)((0, ephemeris_js_1.convertToUTC)(dateOfBirth, candidate.time, timezone));
            const moonSidereal = (0, vedic_astrology_engine_js_1.tropicalToSidereal)(ephemeris.planets.moon.longitude, jd);
            // Calculate Vimshottari Dasha
            const dashaPeriods = (0, vedic_astrology_engine_js_1.calculateVimshottariDasha)(moonSidereal, birthDate);
            // Score based on event-dasha correlation
            let dashaScore = 0;
            let eventMatches = 0;
            for (const event of lifeEvents) {
                const eventDate = new Date(event.eventDate);
                const dasha = (0, vedic_astrology_engine_js_1.getDashaForDate)(dashaPeriods, eventDate);
                if (dasha) {
                    const correlation = (0, vedic_astrology_engine_js_1.dashaSupportsEvent)(dasha, event.category, event.eventType);
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
            logger_js_1.logger.error(`Quick filter failed for ${candidate.time}`, error);
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
            logger_js_1.logger.info('Deep analysis starting', { time: candidate.time });
            // Get ephemeris
            const ephemeris = await (0, ephemeris_js_1.calculateEphemeris)(dateOfBirth, candidate.time, latitude, longitude, timezone);
            // Get Julian Day
            const jd = (0, ephemeris_js_1.calculateJulianDay)((0, ephemeris_js_1.convertToUTC)(dateOfBirth, candidate.time, timezone));
            // Get sidereal positions for all planets
            const planets = {};
            for (const [name, data] of Object.entries(ephemeris.planets)) {
                const sidereal = (0, vedic_astrology_engine_js_1.tropicalToSidereal)(data.longitude, jd);
                const nakshatra = (0, vedic_astrology_engine_js_1.getNakshatraForLongitude)(sidereal);
                planets[name] = `${data.sign} ${(sidereal % 30).toFixed(2)}° (${nakshatra.name} pada ${nakshatra.pada})`;
            }
            // Calculate Dasha
            const moonSidereal = (0, vedic_astrology_engine_js_1.tropicalToSidereal)(ephemeris.planets.moon.longitude, jd);
            const dashaPeriods = (0, vedic_astrology_engine_js_1.calculateVimshottariDasha)(moonSidereal, birthDate);
            const dashaInfo = (0, vedic_astrology_engine_js_1.formatDashaSequence)(dashaPeriods);
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
                const dasha = (0, vedic_astrology_engine_js_1.getDashaForDate)(dashaPeriods, eventDate);
                return {
                    ...event,
                    dasha: dasha ? `${dasha.mahadasha}/${dasha.antardasha}` : 'Unknown',
                };
            });
            // Build comprehensive prompt for AI
            const prompt = (0, ai_client_js_1.buildCandidateAnalysisPrompt)(candidate.time, dateOfBirth, planetaryPositions, housePositions, eventsWithDasha.map(e => ({
                category: e.category,
                eventType: e.eventType,
                eventDate: e.eventDate,
                description: `${e.description} [Dasha: ${e.dasha}]`,
                importance: e.importance,
            })), dashaInfo, physicalTraits);
            // Call AI with extended thinking
            const response = await (0, ai_client_js_1.callAI)(ai_client_js_1.MASTER_ASTROLOGY_SYSTEM_PROMPT, prompt, {
                temperature: 0.1,
                maxTokens: 8000,
                enableThinking: true,
            });
            if (!response.success) {
                logger_js_1.logger.error('AI call failed', { error: response.error });
                continue;
            }
            // Parse response
            const parsed = (0, ai_client_js_1.parseAIAnalysisResponse)(response.content);
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
            logger_js_1.logger.info('Deep analysis complete', {
                time: candidate.time,
                score: parsed.score,
                confidence: parsed.confidence,
            });
        }
        catch (error) {
            logger_js_1.logger.error(`Deep analysis failed for ${candidate.time}`, error);
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
    logger_js_1.logger.info('Best candidate selected', {
        time: best.time,
        score: best.score,
        confidence: best.confidence,
    });
    return best;
}
// ═════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════
exports.default = processAnalysis;
//# sourceMappingURL=btr-processor.js.map