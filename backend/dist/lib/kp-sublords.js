/**
 * 🔱 KP SUB-LORD CALCULATION SYSTEM (Krishnamurti Paddhati)
 * =========================================================
 *
 * The precision layer of Vedic astrology. Sub-lords divide each nakshatra
 * into 9 parts proportional to Vimshottari dasha years, enabling timing
 * accuracy to seconds level.
 *
 * KP HIERARCHY:
 * - Level 1: Star Lord (Nakshatra Lord) - 13°20' span
 * - Level 2: Sub Lord - Variable span based on dasha years
 * - Level 3: Sub-Sub Lord - Further subdivision
 * - Level 4: Sub-Sub-Sub Lord - Seconds-level precision
 *
 * REFERENCE: Vimshottari Dasha Years
 * Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
 * Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17
 * Total: 120 years
 */
import { logger } from './logger.js';
// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════
const NAKSHATRA_SPAN = 360 / 27; // 13.333... degrees
const NAKSHATRA_LORDS = [
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'
];
const DASHA_SEQUENCE = [
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'
];
const DASHA_YEARS = {
    Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
    Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17
};
const TOTAL_DASHA_YEARS = 120;
// ═══════════════════════════════════════════════════════════════════════════════
// CORE CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Calculate complete KP sub-lord hierarchy for a planetary longitude.
 * This is the heart of KP precision - divides each nakshatra into 9 sub-parts
 * proportional to Vimshottari dasha years.
 */
export function calculateKPSubLords(longitude) {
    // Normalize longitude to 0-360
    const normalizedLong = ((longitude % 360) + 360) % 360;
    // Calculate nakshatra position
    const nakshatraIndex = Math.floor(normalizedLong / NAKSHATRA_SPAN);
    const positionInNakshatra = normalizedLong % NAKSHATRA_SPAN;
    // Level 1: Star Lord
    const starLord = NAKSHATRA_LORDS[nakshatraIndex];
    // Level 2: Sub-Lord
    const subLordResult = calculateSubDivision(positionInNakshatra, starLord, NAKSHATRA_SPAN);
    // Level 3: Sub-Sub-Lord
    const subSubLordResult = calculateSubDivision(subLordResult.positionInDivision, subLordResult.lord, subLordResult.span);
    // Level 4: Sub-Sub-Sub-Lord (seconds-level)
    const subSubSubLordResult = calculateSubDivision(subSubLordResult.positionInDivision, subSubLordResult.lord, subSubLordResult.span);
    return {
        starLord,
        subLord: subLordResult.lord,
        subSubLord: subSubLordResult.lord,
        subSubSubLord: subSubSubLordResult.lord,
        subSpan: subLordResult.span,
        positionInSub: subLordResult.positionInDivision
    };
}
/**
 * Calculate sub-division for KP hierarchy.
 * Uses Vimshottari year proportions to divide space.
 */
function calculateSubDivision(position, startLord, totalSpan) {
    const startIndex = DASHA_SEQUENCE.indexOf(startLord);
    let currentPosition = 0;
    for (let i = 0; i < 9; i++) {
        const lordIndex = (startIndex + i) % 9;
        const lord = DASHA_SEQUENCE[lordIndex];
        const years = DASHA_YEARS[lord];
        // Span proportional to dasha years
        const span = (years / TOTAL_DASHA_YEARS) * totalSpan;
        if (position < currentPosition + span) {
            return {
                lord,
                span,
                positionInDivision: position - currentPosition
            };
        }
        currentPosition += span;
    }
    // Fallback (should not reach here)
    return {
        lord: startLord,
        span: totalSpan / 9,
        positionInDivision: position
    };
}
/**
 * Calculate KP cuspal sub-lords for all 12 houses.
 * Critical for timing events to specific houses.
 */
export function calculateKPCuspalSubLords(cuspLongitudes) {
    return cuspLongitudes.map((cusp, index) => {
        const house = index + 1;
        const kpData = calculateKPSubLords(cusp);
        return {
            house,
            cusp,
            sign: getZodiacSign(cusp),
            starLord: kpData.starLord,
            subLord: kpData.subLord,
            subSubLord: kpData.subSubLord
        };
    });
}
/**
 * Correlate event with KP sub-lord timing.
 * Returns how precisely the event timing matches KP principles.
 */
export function correlateEventWithKP(event, dashaLord, cuspalSubLords, significatorLongitudes) {
    // Get target house based on event category
    const targetHouse = getTargetHouseForEvent(event.category);
    const targetCusp = cuspalSubLords.find(c => c.house === targetHouse);
    if (!targetCusp) {
        return createEmptyCorrelation(event);
    }
    // Check if dasha lord is cuspal sub-lord (strongest indication)
    const dashaAsCuspalSubLord = targetCusp.subLord === dashaLord;
    // Check if dasha lord is star lord of significators
    let dashaAsStarLord = false;
    for (const [planet, longitude] of Object.entries(significatorLongitudes)) {
        const planetKP = calculateKPSubLords(longitude);
        if (planetKP.starLord === dashaLord) {
            dashaAsStarLord = true;
            break;
        }
    }
    // Calculate correlation score
    let score = 0;
    let precision = 'approximate';
    if (dashaAsCuspalSubLord && dashaAsStarLord) {
        score = 95;
        precision = 'exact';
    }
    else if (dashaAsCuspalSubLord) {
        score = 85;
        precision = 'close';
    }
    else if (dashaAsStarLord) {
        score = 75;
        precision = 'close';
    }
    else {
        score = 40;
    }
    return {
        eventId: event.id,
        eventDate: event.date,
        dashaLord,
        dashaLordAsCuspalSubLord: dashaAsCuspalSubLord,
        dashaLordAsStarLord: dashaAsStarLord,
        correlationScore: score,
        timingPrecision: precision
    };
}
// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════
function getZodiacSign(longitude) {
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
        'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    return signs[Math.floor(((longitude % 360) + 360) % 360 / 30)];
}
function getTargetHouseForEvent(category) {
    const houseMap = {
        marriage: 7,
        career: 10,
        education: 4,
        children: 5,
        health: 6,
        finance: 2,
        travel: 9,
        property: 4,
        spiritual: 9,
        legal: 6,
        family: 2
    };
    return houseMap[category] || 1;
}
function createEmptyCorrelation(event) {
    return {
        eventId: event.id,
        eventDate: event.date,
        dashaLord: 'Unknown',
        dashaLordAsCuspalSubLord: false,
        dashaLordAsStarLord: false,
        correlationScore: 0,
        timingPrecision: 'approximate'
    };
}
// ═══════════════════════════════════════════════════════════════════════════════
// BATCH PROCESSING (Performance Optimized)
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Calculate KP sub-lords for multiple longitudes efficiently.
 * Uses caching for repeated calculations.
 */
export function calculateKPSubLordsBatch(longitudes) {
    const results = new Map();
    const cache = new Map();
    for (const longitude of longitudes) {
        const cacheKey = longitude.toFixed(6);
        if (cache.has(cacheKey)) {
            results.set(longitude, cache.get(cacheKey));
        }
        else {
            const kpData = calculateKPSubLords(longitude);
            cache.set(cacheKey, kpData);
            results.set(longitude, kpData);
        }
    }
    logger.debug(`KP Sub-lords calculated: ${longitudes.length} positions, ${cache.size} unique`);
    return results;
}
/**
 * Find time window where KP sub-lord matches target.
 * Used to narrow down birth time to specific windows.
 */
export function findKPSubLordWindow(baseTime, targetSubLord, searchWindowHours, ephemerisCalculator // Returns Moon longitude or other significator
) {
    const window = {
        start: new Date(baseTime.getTime() - searchWindowHours * 3600000),
        end: new Date(baseTime.getTime() + searchWindowHours * 3600000),
        confidence: 0
    };
    // Check every 5 minutes in window
    const checks = [];
    const checkInterval = 5 * 60 * 1000; // 5 minutes
    for (let t = window.start.getTime(); t <= window.end.getTime(); t += checkInterval) {
        const time = new Date(t);
        const longitude = ephemerisCalculator(time);
        const kp = calculateKPSubLords(longitude);
        checks.push({ time, longitude, subLord: kp.subLord });
    }
    // Find contiguous periods where sub-lord matches
    const matchingPeriods = [];
    let currentPeriod = null;
    for (const check of checks) {
        if (check.subLord === targetSubLord) {
            if (!currentPeriod) {
                currentPeriod = { start: check.time, end: check.time };
            }
            else {
                currentPeriod.end = check.time;
            }
        }
        else {
            if (currentPeriod) {
                matchingPeriods.push(currentPeriod);
                currentPeriod = null;
            }
        }
    }
    if (currentPeriod) {
        matchingPeriods.push(currentPeriod);
    }
    // Return the longest matching period
    if (matchingPeriods.length === 0) {
        return null;
    }
    const bestPeriod = matchingPeriods.reduce((a, b) => (b.end.getTime() - b.start.getTime()) > (a.end.getTime() - a.start.getTime()) ? b : a);
    return {
        start: bestPeriod.start,
        end: bestPeriod.end,
        confidence: Math.min(100, 50 + matchingPeriods.length * 10)
    };
}
// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export const KP = {
    calculateSubLords: calculateKPSubLords,
    calculateCuspalSubLords: calculateKPCuspalSubLords,
    correlateEvent: correlateEventWithKP,
    calculateBatch: calculateKPSubLordsBatch,
    findSubLordWindow: findKPSubLordWindow
};
//# sourceMappingURL=kp-sublords.js.map