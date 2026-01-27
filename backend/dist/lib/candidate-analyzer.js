// Server-side only
import { calculateEphemeris } from './ephemeris.js';
import { logger } from './logger.js';
import { calculateD60 } from './advanced-btr-methods.js';
// ═════════════════════════════════════════════════════════════════════════
// QUICK FILTERING RULES (Before AI K2 analysis)
// ═════════════════════════════════════════════════════════════════════════
export async function analyzeAndFilterCandidates(dateOfBirth, candidates, latitude, longitude, timezone, lifeEvents, tentativeTime // 🔱 SAFETY NET: Pass tentative time for protection
) {
    try {
        logger.info('Starting candidate analysis and filtering', {
            totalCandidates: candidates.length,
            dateOfBirth,
            tentativeTime,
        });
        const analyzedCandidates = [];
        // ─────────────────────────────────────────────────────────────────────
        // STEP 1: Quick analysis of all candidates
        // ─────────────────────────────────────────────────────────────────────
        for (const candidate of candidates) {
            try {
                // Convert timezone number to string for ephemeris calculation
                const timezoneString = getTimezoneString(timezone);
                const ephemerisData = await calculateEphemeris(dateOfBirth, candidate.time, latitude, longitude, timezoneString);
                // Quick scoring without full AI analysis
                const { quickScore, eventMatches, reason } = performQuickAnalysis(ephemerisData, lifeEvents);
                // 🔱 GOD-TIER: Calculate D60 stability (most sensitive to seconds)
                const d60Stability = await calculateD60Stability(dateOfBirth, candidate.time, latitude, longitude, timezoneString);
                // 🔱 SAFETY NET: Protect tentative time and its immediate neighbors
                const isTentativeOrNeighbor = tentativeTime && (candidate.time === tentativeTime ||
                    Math.abs(candidate.offsetMinutes) <= 5 // Within ±5 minutes
                );
                // 🔱 SAFETY NET: Always include tentative time + D60-unstable candidates
                const shouldAnalyzeWithAI = quickScore >= 40 || // Good score
                    isTentativeOrNeighbor || // Protected (tentative ±5min)
                    !d60Stability.isStable; // D60 changes = high precision needed
                analyzedCandidates.push({
                    time: candidate.time,
                    offsetMinutes: candidate.offsetMinutes,
                    offsetDescription: candidate.offsetDescription,
                    ephemerisData,
                    quickScore,
                    eventMatches,
                    shouldAnalyzeWithAI,
                    reason,
                    // 🔱 Metadata for downstream processing
                    metadata: {
                        isTentativeOrNeighbor: Boolean(isTentativeOrNeighbor),
                        d60Stability,
                        protected: Boolean(isTentativeOrNeighbor || !d60Stability.isStable),
                    },
                });
                logger.debug('Candidate quick analysis complete', {
                    time: candidate.time,
                    quickScore,
                    eventMatches,
                    isTentativeOrNeighbor,
                    d60Stable: d60Stability.isStable,
                    shouldAnalyzeWithAI,
                });
            }
            catch (error) {
                logger.error(`Quick analysis failed for ${candidate.time}`, error);
            }
        }
        // ─────────────────────────────────────────────────────────────────────
        // STEP 2: Sort by quick score (but protected candidates stay in pool)
        // ─────────────────────────────────────────────────────────────────────
        analyzedCandidates.sort((a, b) => {
            // 🔱 Protected candidates get priority boost
            const aProtected = a.metadata?.protected ? 1000 : 0;
            const bProtected = b.metadata?.protected ? 1000 : 0;
            return (b.quickScore + bProtected) - (a.quickScore + aProtected);
        });
        // ─────────────────────────────────────────────────────────────────────
        // STEP 3: Select top candidates for AI K2 analysis
        // 🔱 GOD-TIER: Increased from 5 to 10 to preserve more candidates
        // ─────────────────────────────────────────────────────────────────────
        const topCandidates = analyzedCandidates
            .filter((c) => c.shouldAnalyzeWithAI)
            .slice(0, 10); // 🔱 Increased from 5 to 10
        const protectedCount = topCandidates.filter(c => c.metadata?.protected).length;
        logger.info('Candidate filtering complete', {
            totalCandidates: analyzedCandidates.length,
            topCandidatesForAI: topCandidates.length,
            protectedCandidates: protectedCount,
            tentativeTimeProtected: tentativeTime ?
                topCandidates.some(c => c.time === tentativeTime) : false,
            topScores: topCandidates.map((c) => ({
                time: c.time,
                quickScore: c.quickScore,
                protected: c.metadata?.protected,
            })),
        });
        return {
            topCandidates,
            allCandidates: analyzedCandidates,
            totalAnalyzed: analyzedCandidates.length,
        };
    }
    catch (error) {
        logger.error('Candidate analysis failed', error);
        throw error;
    }
}
/**
 * Calculate D60 stability for a candidate time
 * D60 changes every ~2 minutes (120 seconds) - most sensitive varga
 * If D60 is near transition, this candidate needs high precision analysis
 */
async function calculateD60Stability(dateOfBirth, time, latitude, longitude, timezone) {
    try {
        // Calculate ephemeris for this time
        const ephemeris = await calculateEphemeris(dateOfBirth, time, latitude, longitude, timezone);
        const ascendantLongitude = ephemeris.ascendant.longitude;
        const d60Result = calculateD60(ascendantLongitude);
        // Calculate how far into the D60 segment we are
        // D60 = 0.5° segments, 60 segments per sign
        const degreeInSign = ascendantLongitude % 30;
        const d60SegmentSize = 0.5; // degrees
        const positionInSegment = degreeInSign % d60SegmentSize;
        // Distance to next D60 boundary
        const degreesToChange = d60SegmentSize - positionInSegment;
        // Approximate conversion: 1° = 240 seconds for Lagna
        const secondsToChange = degreesToChange * 240;
        // D60 is "unstable" if within 30 seconds of boundary (high precision needed)
        const isStable = secondsToChange > 30 && positionInSegment * 240 > 30;
        const warning = !isStable
            ? `⚠️ D60 transition in ${secondsToChange.toFixed(1)}s - HIGH PRECISION REQUIRED`
            : null;
        return {
            isStable,
            d60Lagna: d60Result.sign,
            secondsToChange: Math.round(secondsToChange),
            warning,
        };
    }
    catch (error) {
        logger.warn(`D60 stability check failed for ${time}`, error);
        return {
            isStable: true, // Assume stable if calculation fails
            d60Lagna: 'Unknown',
            secondsToChange: 60,
            warning: null,
        };
    }
}
// ═════════════════════════════════════════════════════════════════════════
// QUICK ANALYSIS: Fast filtering without AI
// ═════════════════════════════════════════════════════════════════════════
function performQuickAnalysis(ephemerisData, lifeEvents) {
    // Quick scoring based on:
    // 1. Number of life events that match dasha periods
    // 2. House placements alignment
    // 3. Nakshatra strength
    let score = 50; // Baseline
    let eventMatches = 0;
    // ─────────────────────────────────────────────────────────────────────
    // Check Moon placement (important for events)
    // ─────────────────────────────────────────────────────────────────────
    const moonNakshatra = ephemerisData.planets.moon.nakshatra;
    const moonInGoodNakshatra = checkMoonNakshatraQuality(moonNakshatra);
    if (moonInGoodNakshatra) {
        score += 10; // Moon in favorable nakshatra
    }
    // ─────────────────────────────────────────────────────────────────────
    // Check Ascendant strength
    // ─────────────────────────────────────────────────────────────────────
    const lagnaStrength = checkLagnaStrength(ephemerisData.ascendant);
    score += lagnaStrength;
    // ─────────────────────────────────────────────────────────────────────
    // Count matching life events (basic check)
    // ─────────────────────────────────────────────────────────────────────
    for (const event of lifeEvents) {
        // Simple check: does this birth time create reasonable house positions
        // for this type of event?
        if (checkEventTypeAlignment(event, ephemerisData)) {
            eventMatches++;
            score += 5;
        }
    }
    // Bonus for multiple event matches
    if (eventMatches >= lifeEvents.length * 0.7) {
        score += 15; // Good match with most events
    }
    // Cap score at 100
    score = Math.min(100, score);
    // Determine reason
    let reason = '';
    if (score >= 75) {
        reason = 'Excellent match - likely correct birth time';
    }
    else if (score >= 60) {
        reason = 'Good match - worth detailed analysis';
    }
    else if (score >= 40) {
        reason = 'Moderate match - possible correct time';
    }
    else {
        reason = 'Poor match - unlikely to be correct';
    }
    return {
        quickScore: Math.round(score),
        eventMatches,
        reason,
    };
}
// ═════════════════════════════════════════════════════════════════════════
// HELPER: Check Moon Nakshatra Quality
// ═════════════════════════════════════════════════════════════════════════
function checkMoonNakshatraQuality(nakshatra) {
    // Favorable nakshatras for birth
    const favorableNakshatras = [
        'Ashwini',
        'Bharani',
        'Pushya',
        'Magha',
        'Hasta',
        'Chitra',
        'Anuradha',
        'Jyeshtha',
        'Shravana',
        'Revati',
    ];
    return favorableNakshatras.includes(nakshatra);
}
// ═════════════════════════════════════════════════════════════════════════
// HELPER: Check Lagna Strength
// ═════════════════════════════════════════════════════════════════════════
function checkLagnaStrength(ascendant) {
    let strength = 0;
    // Strong lagna placements
    if (ascendant.degree > 0 && ascendant.degree < 5) {
        strength += 10; // Beginning of sign (strong)
    }
    // Check if lagna ruler is strong
    const rulerStrength = checkLagnaRulerStrength(ascendant.sign);
    strength += rulerStrength;
    return Math.min(strength, 20);
}
// ═════════════════════════════════════════════════════════════════════════
// HELPER: Check Lagna Ruler Strength
// ═════════════════════════════════════════════════════════════════════════
function checkLagnaRulerStrength(sign) {
    const rulers = {
        Aries: 10,
        Taurus: 8,
        Gemini: 8,
        Cancer: 10,
        Leo: 10,
        Virgo: 8,
        Libra: 8,
        Scorpio: 10,
        Sagittarius: 10,
        Capricorn: 10,
        Aquarius: 8,
        Pisces: 10,
    };
    return rulers[sign] || 5;
}
// ═════════════════════════════════════════════════════════════════════════
// HELPER: Check Event Type Alignment
// ═════════════════════════════════════════════════════════════════════════
function checkEventTypeAlignment(event, ephemeris) {
    // Check if natal positions support event type
    const eventType = event.category.toLowerCase();
    switch (eventType) {
        case 'education':
            // Education events: Mercury strong, 4th house support
            return (ephemeris.planets.mercury.degree > 0 &&
                ephemeris.planets.mercury.degree < 30);
        case 'career':
            // Career events: 10th house, Saturn, Sun
            return (ephemeris.planets.saturn.degree > 0 &&
                ephemeris.planets.saturn.degree < 30);
        case 'relationship':
        case 'marriage':
            // Marriage events: Venus strong, 7th house
            return (ephemeris.planets.venus.degree > 0 &&
                ephemeris.planets.venus.degree < 30);
        case 'health':
            // Health events: Mars, 6th house
            return (ephemeris.planets.mars.degree > 0 &&
                ephemeris.planets.mars.degree < 30);
        case 'finance':
            // Finance events: Jupiter, 2nd/11th house
            return (ephemeris.planets.jupiter.degree > 0 &&
                ephemeris.planets.jupiter.degree < 30);
        default:
            return true; // Unknown event type, pass through
    }
}
// ═════════════════════════════════════════════════════════════════════════
// HELPER: Convert timezone number to string
// ═════════════════════════════════════════════════════════════════════════
function getTimezoneString(timezone) {
    // Map timezone offset to string
    if (timezone === 5.5)
        return 'Asia/Kolkata';
    if (timezone === 0)
        return 'UTC';
    if (timezone === -5)
        return 'America/New_York';
    if (timezone === -8)
        return 'America/Los_Angeles';
    return 'UTC';
}
export default analyzeAndFilterCandidates;
//# sourceMappingURL=candidate-analyzer.js.map