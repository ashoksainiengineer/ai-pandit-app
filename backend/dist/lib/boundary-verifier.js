"use strict";
// lib/boundary-verifier.ts
// Boundary Safety Verification for Seconds-Level BTR
// Checks nakshatra, lagna, dasha, and house boundaries
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyBoundarySafety = verifyBoundarySafety;
exports.isTimeSafeFromBoundaries = isTimeSafeFromBoundaries;
exports.getSuggestedAlternatives = getSuggestedAlternatives;
exports.formatBoundarySafetyResult = formatBoundarySafetyResult;
const vedic_astrology_engine_js_1 = require("./vedic-astrology-engine.js");
// ═════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═════════════════════════════════════════════════════════════════════════════
// Minimum safe distances from boundaries (in seconds of birth time)
const SAFETY_THRESHOLDS = {
    nakshatra: 10, // Moon moves ~0.55°/min = 0.0092°/sec, nakshatra = 13.33°
    lagna: 15, // Lagna moves ~1°/4min = 0.0042°/sec, sign = 30°
    house: 20, // House cusps move similar to lagna
};
// Movement rates per second of birth time
const RATES = {
    moon: 0.0092, // degrees per second
    lagna: 0.0042, // degrees per second (average)
    house: 0.0042, // degrees per second (average)
};
const NAKSHATRA_SPAN = 360 / 27; // 13.333...°
const SIGN_SPAN = 30; // degrees
// ═════════════════════════════════════════════════════════════════════════════
// MAIN VERIFICATION FUNCTION
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Comprehensive boundary safety verification
 * At seconds-level precision, tiny differences matter
 */
function verifyBoundarySafety(ephemeris, julianDay) {
    const warnings = [];
    const recommendations = [];
    // ─────────────────────────────────────────────────────────────────────────
    // 1. NAKSHATRA BOUNDARY CHECK
    // ─────────────────────────────────────────────────────────────────────────
    const moonSidereal = (0, vedic_astrology_engine_js_1.tropicalToSidereal)(ephemeris.planets.moon.longitude, julianDay);
    const positionInNakshatra = moonSidereal % NAKSHATRA_SPAN;
    const distanceToNextNakshatra = NAKSHATRA_SPAN - positionInNakshatra;
    const distanceToPrevNakshatra = positionInNakshatra;
    // Convert to seconds of birth time
    const secsToNextNakshatra = distanceToNextNakshatra / RATES.moon;
    const secsToPrevNakshatra = distanceToPrevNakshatra / RATES.moon;
    const nakshatraDistance = Math.min(secsToNextNakshatra, secsToPrevNakshatra);
    if (nakshatraDistance < SAFETY_THRESHOLDS.nakshatra) {
        const currentNakshatra = (0, vedic_astrology_engine_js_1.getNakshatraForLongitude)(moonSidereal);
        warnings.push({
            type: 'nakshatra',
            message: `Moon is ${nakshatraDistance.toFixed(1)} seconds from nakshatra boundary (current: ${currentNakshatra.name})`,
            distanceSeconds: nakshatraDistance,
            severity: nakshatraDistance < 5 ? 'high' : 'medium',
        });
        recommendations.push(`Consider verifying with adjacent nakshatra interpretation. Current: ${currentNakshatra.name}`);
    }
    // ─────────────────────────────────────────────────────────────────────────
    // 2. LAGNA (ASCENDANT) BOUNDARY CHECK
    // ─────────────────────────────────────────────────────────────────────────
    const lagnaInSign = ephemeris.ascendant.longitude % SIGN_SPAN;
    const distanceToNextSign = SIGN_SPAN - lagnaInSign;
    const distanceToPrevSign = lagnaInSign;
    const secsToNextLagnaSign = distanceToNextSign / RATES.lagna;
    const secsToPrevLagnaSign = distanceToPrevSign / RATES.lagna;
    const lagnaDistance = Math.min(secsToNextLagnaSign, secsToPrevLagnaSign);
    if (lagnaDistance < SAFETY_THRESHOLDS.lagna) {
        const nextSign = getNextSign(ephemeris.ascendant.sign);
        const isNearEnd = distanceToNextSign < distanceToPrevSign;
        warnings.push({
            type: 'lagna',
            message: `Lagna is ${lagnaDistance.toFixed(1)} seconds from sign change (${ephemeris.ascendant.sign} → ${isNearEnd ? nextSign : getPrevSign(ephemeris.ascendant.sign)})`,
            distanceSeconds: lagnaDistance,
            severity: lagnaDistance < 10 ? 'high' : 'medium',
        });
        recommendations.push(`Verify if ${isNearEnd ? nextSign : ephemeris.ascendant.sign} characteristics match the native`);
    }
    // ─────────────────────────────────────────────────────────────────────────
    // 3. HOUSE CUSP BOUNDARY CHECK (2nd, 7th, 10th houses are most critical)
    // ─────────────────────────────────────────────────────────────────────────
    const criticalHouses = [2, 7, 10];
    let minHouseDistance = Infinity;
    for (const houseNum of criticalHouses) {
        const house = ephemeris.houses[houseNum - 1];
        if (house) {
            const houseInSign = house.cusp % SIGN_SPAN;
            const distToNext = SIGN_SPAN - houseInSign;
            const distToPrev = houseInSign;
            const minDist = Math.min(distToNext, distToPrev);
            const secsToChange = minDist / RATES.house;
            if (secsToChange < minHouseDistance) {
                minHouseDistance = secsToChange;
            }
            if (secsToChange < SAFETY_THRESHOLDS.house) {
                warnings.push({
                    type: 'house',
                    message: `House ${houseNum} cusp is ${secsToChange.toFixed(1)} seconds from sign change`,
                    distanceSeconds: secsToChange,
                    severity: secsToChange < 10 ? 'medium' : 'low',
                });
            }
        }
    }
    // ─────────────────────────────────────────────────────────────────────────
    // 4. OVERALL RISK ASSESSMENT
    // ─────────────────────────────────────────────────────────────────────────
    const highWarnings = warnings.filter(w => w.severity === 'high').length;
    const mediumWarnings = warnings.filter(w => w.severity === 'medium').length;
    let overallRisk = 'low';
    if (highWarnings > 0) {
        overallRisk = 'high';
    }
    else if (mediumWarnings >= 2) {
        overallRisk = 'medium';
    }
    else if (mediumWarnings === 1) {
        overallRisk = 'low';
    }
    // Safe if no high-severity warnings
    const isSafe = highWarnings === 0;
    if (!isSafe) {
        recommendations.push('Consider analyzing adjacent 6-second candidates for comparison');
    }
    return {
        isSafe,
        warnings,
        nakshatraDistance,
        lagnaDistance,
        houseDistance: minHouseDistance === Infinity ? 1000 : minHouseDistance,
        overallRisk,
        recommendations,
    };
}
// ═════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════
const ZODIAC_SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];
function getNextSign(currentSign) {
    const index = ZODIAC_SIGNS.indexOf(currentSign);
    return ZODIAC_SIGNS[(index + 1) % 12];
}
function getPrevSign(currentSign) {
    const index = ZODIAC_SIGNS.indexOf(currentSign);
    return ZODIAC_SIGNS[(index + 11) % 12];
}
/**
 * Quick check if a time is near any boundary
 * Returns true if safe distance from all boundaries
 */
function isTimeSafeFromBoundaries(ephemeris, julianDay) {
    const result = verifyBoundarySafety(ephemeris, julianDay);
    return result.isSafe;
}
/**
 * Get suggested alternative times if current is near boundary
 */
function getSuggestedAlternatives(currentTime, warnings) {
    const suggestions = [];
    const [h, m, s] = currentTime.split(':').map(Number);
    const totalSeconds = h * 3600 + m * 60 + (s || 0);
    for (const warning of warnings) {
        if (warning.severity === 'high') {
            // Suggest moving away from boundary
            const offset = warning.distanceSeconds > 5 ? -6 : 6;
            const newTotal = totalSeconds + offset;
            const newH = Math.floor(newTotal / 3600);
            const newM = Math.floor((newTotal % 3600) / 60);
            const newS = newTotal % 60;
            suggestions.push(`${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}:${String(newS).padStart(2, '0')}`);
        }
    }
    return Array.from(new Set(suggestions)); // Remove duplicates
}
/**
 * Format boundary result for display
 */
function formatBoundarySafetyResult(result) {
    const lines = ['BOUNDARY SAFETY ANALYSIS:'];
    lines.push(`Overall Risk: ${result.overallRisk.toUpperCase()}`);
    lines.push(`Safe: ${result.isSafe ? 'YES' : 'NO'}`);
    lines.push('');
    lines.push('Distances from boundaries:');
    lines.push(`  Nakshatra: ${result.nakshatraDistance.toFixed(1)} seconds`);
    lines.push(`  Lagna Sign: ${result.lagnaDistance.toFixed(1)} seconds`);
    lines.push(`  House Cusp: ${result.houseDistance.toFixed(1)} seconds`);
    if (result.warnings.length > 0) {
        lines.push('');
        lines.push('Warnings:');
        for (const w of result.warnings) {
            lines.push(`  [${w.severity.toUpperCase()}] ${w.message}`);
        }
    }
    if (result.recommendations.length > 0) {
        lines.push('');
        lines.push('Recommendations:');
        for (const r of result.recommendations) {
            lines.push(`  • ${r}`);
        }
    }
    return lines.join('\n');
}
exports.default = verifyBoundarySafety;
//# sourceMappingURL=boundary-verifier.js.map