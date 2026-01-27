/**
 * 🔱 CONSENSUS VALIDATION ENGINE (Multi-Method Verification)
 * ==========================================================
 *
 * The divine judgment system that verifies birth time candidates across
 * multiple Vedic astrology methods. Only when ALL methods converge
 * do we achieve God-Tier (>99%) confidence.
 *
 * VALIDATION METHODS:
 * 1. Vimshottari Dasha - Primary timing system
 * 2. Yogini Dasha - 8-yogini cycle verification
 * 3. Chara Dasha - Rashi-based periods
 * 4. Kalachakra Dasha - Advanced lunar cycle timing
 * 5. KP Sub-Lords - Cuspal precision timing
 * 6. Ashtakavarga - Bindu-based strength verification
 * 7. Divisional Charts - Varga-specific event correlation
 * 8. Transit Analysis - Double transit verification
 * 9. Forensic Correlation - Physical/psychological matching
 * 10. AI Reasoning - Deep pattern analysis
 *
 * CONSENSUS RULES:
 * - GOD_TIER: All 10 methods > 90% agreement
 * - VERY_HIGH: All 10 methods > 80% agreement
 * - HIGH: Overall average > 75%, no method < 60%
 * - MEDIUM: Overall average > 60%
 * - LOW: Any method < 40% or overall < 60%
 */
import { logger } from './logger.js';
// ═══════════════════════════════════════════════════════════════════════════════
// WEIGHTS (Method Importance in Final Score)
// ═══════════════════════════════════════════════════════════════════════════════
const METHOD_WEIGHTS = {
    vimshottari: 1.5, // Primary dasha system - highest weight
    yogini: 1.0, // Secondary dasha
    chara: 1.0, // Rashi dasha
    kalachakra: 1.2, // Advanced lunar timing
    kp: 1.5, // Precision timing (matches Vimshottari)
    ashtakavarga: 1.0, // Strength verification
    varga: 1.2, // Divisional charts (D9, D10, D60)
    transit: 1.0, // Double transit
    forensic: 1.3, // Physical/psychological match
    ai: 0.8 // AI reasoning (supportive, not primary)
};
const TOTAL_WEIGHT = Object.values(METHOD_WEIGHTS).reduce((a, b) => a + b, 0);
// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Calculate complete consensus across all validation methods.
 * This is the main entry point for the validation engine.
 */
export function calculateConsensus(input) {
    const startTime = Date.now();
    const scores = {};
    const details = [];
    // Method 1: Vimshottari Dasha Validation
    const vimshottari = validateVimshottari(input);
    scores.vimshottari = vimshottari.score;
    details.push(vimshottari);
    // Method 2: Yogini Dasha Validation
    const yogini = validateYogini(input);
    scores.yogini = yogini.score;
    details.push(yogini);
    // Method 3: Chara Dasha Validation
    const chara = validateChara(input);
    scores.chara = chara.score;
    details.push(chara);
    // Method 4: Kalachakra Dasha Validation
    const kalachakra = validateKalachakra(input);
    scores.kalachakra = kalachakra.score;
    details.push(kalachakra);
    // Method 5: KP Sub-Lord Validation
    const kp = validateKP(input);
    scores.kp = kp.score;
    details.push(kp);
    // Method 6: Ashtakavarga Validation
    const ashtakavarga = validateAshtakavarga(input);
    scores.ashtakavarga = ashtakavarga.score;
    details.push(ashtakavarga);
    // Method 7: Divisional Charts Validation
    const varga = validateVargas(input);
    scores.varga = varga.score;
    details.push(varga);
    // Method 8: Transit Validation
    const transit = validateTransit(input);
    scores.transit = transit.score;
    details.push(transit);
    // Method 9: Forensic Validation
    const forensic = validateForensic(input);
    scores.forensic = forensic.score;
    details.push(forensic);
    // Method 10: AI Reasoning Validation
    const ai = validateAI(input);
    scores.ai = ai.score;
    details.push(ai);
    // Calculate weighted overall consensus
    const fullScores = scores;
    const overallConsensus = calculateWeightedConsensus(fullScores);
    // Detect red flags
    const redFlags = detectRedFlags(input, fullScores, details);
    // Determine confidence level
    const confidenceLevel = determineConfidenceLevel(fullScores, overallConsensus, redFlags);
    // Calculate margin of error
    const marginOfError = calculateMarginOfError(fullScores, redFlags);
    // Generate evidence and recommendations
    const keyEvidence = generateKeyEvidence(details);
    const recommendations = generateRecommendations(fullScores, redFlags);
    const duration = Date.now() - startTime;
    logger.debug(`Consensus calculated in ${duration}ms`, { overallConsensus, confidenceLevel });
    return {
        scores: fullScores,
        overallConsensus,
        confidenceLevel,
        marginOfError,
        validationDetails: details,
        redFlags,
        keyEvidence,
        recommendations,
        validatedAt: new Date()
    };
}
// ═══════════════════════════════════════════════════════════════════════════════
// INDIVIDUAL VALIDATION METHODS
// ═══════════════════════════════════════════════════════════════════════════════
function validateVimshottari(input) {
    const { candidate, events } = input;
    let score = 0;
    const findings = [];
    if (!candidate.dasha?.vimshottari) {
        return {
            method: 'Vimshottari Dasha',
            score: 0,
            maxScore: 100,
            status: 'fail',
            details: 'Dasha data unavailable',
            criticalFindings: ['Missing dasha calculation']
        };
    }
    const vim = candidate.dasha.vimshottari;
    let matchCount = 0;
    let totalWeight = 0;
    for (const event of events) {
        const weight = getEventWeight(event.impact || 'moderate');
        totalWeight += weight;
        // Check if event significator matches dasha lord
        const significators = getEventSignificators(event.category);
        const dashaLord = vim.mahadasha?.lord;
        if (significators.includes(dashaLord)) {
            matchCount += weight;
            findings.push(`${event.type}: Dasha lord ${dashaLord} matches significator`);
        }
        // Check antardasha
        if (vim.antardasha && significators.includes(vim.antardasha.lord)) {
            matchCount += weight * 0.7;
            findings.push(`${event.type}: Antardasha lord ${vim.antardasha.lord} matches`);
        }
    }
    score = totalWeight > 0 ? (matchCount / totalWeight) * 100 : 50;
    score = Math.min(100, Math.max(0, score));
    return {
        method: 'Vimshottari Dasha',
        score,
        maxScore: 100,
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        details: `Matched ${matchCount.toFixed(1)} of ${totalWeight} weighted events`,
        criticalFindings: findings.slice(0, 3)
    };
}
function validateYogini(input) {
    const { candidate, events } = input;
    if (!candidate.dasha?.yogini) {
        return {
            method: 'Yogini Dasha',
            score: 50,
            maxScore: 100,
            status: 'warning',
            details: 'Yogini dasha data unavailable - using default',
            criticalFindings: []
        };
    }
    // Yogini validation logic
    const yoginiLord = candidate.dasha.yogini.current;
    const eventCorrelations = events.filter(e => correlateYoginiWithEvent(yoginiLord, e.category));
    const score = Math.min(100, (eventCorrelations.length / events.length) * 100 + 40);
    return {
        method: 'Yogini Dasha',
        score,
        maxScore: 100,
        status: score >= 70 ? 'pass' : 'warning',
        details: `Yogini ${yoginiLord} correlates with ${eventCorrelations.length} events`,
        criticalFindings: eventCorrelations.slice(0, 2).map(e => e.type)
    };
}
function validateChara(input) {
    const { candidate, events } = input;
    if (!candidate.dasha?.chara) {
        return {
            method: 'Chara Dasha',
            score: 50,
            maxScore: 100,
            status: 'warning',
            details: 'Chara dasha data unavailable',
            criticalFindings: []
        };
    }
    const charaSign = candidate.dasha.chara.currentSign;
    const matchingEvents = events.filter(e => correlateCharaWithEvent(charaSign, e.category));
    const score = Math.min(100, (matchingEvents.length / Math.max(1, events.length)) * 100 + 30);
    return {
        method: 'Chara Dasha',
        score,
        maxScore: 100,
        status: score >= 65 ? 'pass' : 'warning',
        details: `Chara ${charaSign} dasha active`,
        criticalFindings: []
    };
}
function validateKalachakra(input) {
    // Kalachakra is advanced - if unavailable, use medium score
    const score = 60; // Placeholder
    return {
        method: 'Kalachakra Dasha',
        score,
        maxScore: 100,
        status: 'warning',
        details: 'Kalachakra validation not fully implemented',
        criticalFindings: []
    };
}
function validateKP(input) {
    const { candidate, events } = input;
    if (!candidate.kpData) {
        return {
            method: 'KP Sub-Lords',
            score: 40,
            maxScore: 100,
            status: 'fail',
            details: 'KP data unavailable',
            criticalFindings: ['Missing KP sub-lord calculation']
        };
    }
    // Validate KP sub-lord correlations
    let score = 0;
    let matches = 0;
    for (const event of events) {
        const targetHouse = getTargetHouse(event.category);
        const cuspalSubLord = candidate.kpData.cuspalSubLords?.[targetHouse];
        if (cuspalSubLord) {
            // Check if event dasha lord matches cuspal sub-lord
            const dashaLord = candidate.dasha?.vimshottari?.mahadasha?.lord;
            if (dashaLord === cuspalSubLord.subLord) {
                matches++;
            }
        }
    }
    score = events.length > 0 ? (matches / events.length) * 100 : 50;
    return {
        method: 'KP Sub-Lords',
        score,
        maxScore: 100,
        status: score >= 75 ? 'pass' : score >= 50 ? 'warning' : 'fail',
        details: `${matches} events match KP cuspal sub-lords`,
        criticalFindings: matches > 0 ? [`KP match for ${matches} events`] : []
    };
}
function validateAshtakavarga(input) {
    const { candidate, events } = input;
    if (!candidate.ephemeris?.ashtakavarga) {
        return {
            method: 'Ashtakavarga',
            score: 50,
            maxScore: 100,
            status: 'warning',
            details: 'Ashtakavarga data unavailable',
            criticalFindings: []
        };
    }
    const sav = candidate.ephemeris.ashtakavarga.SAV || [];
    const averageSAV = sav.length > 0 ? sav.reduce((a, b) => a + b, 0) / sav.length : 25;
    // Score based on average SAV (higher is better, max ~40)
    const score = Math.min(100, (averageSAV / 30) * 100);
    return {
        method: 'Ashtakavarga',
        score,
        maxScore: 100,
        status: score >= 70 ? 'pass' : 'warning',
        details: `Average SAV: ${averageSAV.toFixed(1)}`,
        criticalFindings: averageSAV > 28 ? ['Strong Ashtakavarga'] : []
    };
}
function validateVargas(input) {
    const { candidate, events } = input;
    if (!candidate.vargas) {
        return {
            method: 'Divisional Charts',
            score: 40,
            maxScore: 100,
            status: 'fail',
            details: 'Varga data unavailable',
            criticalFindings: ['Missing D9, D10, D60 analysis']
        };
    }
    // Check key varga correlations
    let score = 60; // Base score
    const findings = [];
    // D9 for marriage
    const marriageEvents = events.filter(e => e.category === 'marriage');
    if (marriageEvents.length > 0 && candidate.vargas.d9) {
        score += 10;
        findings.push('D9 available for marriage analysis');
    }
    // D10 for career
    const careerEvents = events.filter(e => e.category === 'career');
    if (careerEvents.length > 0 && candidate.vargas.d10) {
        score += 10;
        findings.push('D10 available for career analysis');
    }
    // D60 for overall karma
    if (candidate.vargas.d60) {
        score += 10;
        findings.push('D60 available for karmic analysis');
    }
    return {
        method: 'Divisional Charts',
        score: Math.min(100, score),
        maxScore: 100,
        status: score >= 70 ? 'pass' : 'warning',
        details: `D9: ${candidate.vargas.d9 ? '✓' : '✗'}, D10: ${candidate.vargas.d10 ? '✓' : '✗'}, D60: ${candidate.vargas.d60 ? '✓' : '✗'}`,
        criticalFindings: findings
    };
}
function validateTransit(input) {
    const { candidate, events } = input;
    // Transit validation - check if Saturn-Jupiter double transit matches events
    let score = 50;
    let transitMatches = 0;
    for (const event of events) {
        if (event.transitData?.doubleTransit?.isTriggered) {
            transitMatches++;
        }
    }
    if (events.length > 0) {
        score = 40 + (transitMatches / events.length) * 60;
    }
    return {
        method: 'Transit Analysis',
        score: Math.min(100, score),
        maxScore: 100,
        status: score >= 60 ? 'pass' : 'warning',
        details: `${transitMatches} events show double transit activation`,
        criticalFindings: transitMatches > 0 ? [`Double transit for ${transitMatches} events`] : []
    };
}
function validateForensic(input) {
    const { candidate, forensicProfile } = input;
    if (!forensicProfile || !candidate.ephemeris) {
        return {
            method: 'Forensic Correlation',
            score: 50,
            maxScore: 100,
            status: 'warning',
            details: 'Forensic data incomplete',
            criticalFindings: []
        };
    }
    // Calculate forensic match score
    let score = 60; // Base score
    const findings = [];
    // Lagna element vs prakriti
    const lagna = candidate.ephemeris.ascendant?.sign;
    const prakriti = forensicProfile.biological?.prakriti;
    if (lagna && prakriti) {
        const elementMatch = checkPrakritiLagnaMatch(prakriti, lagna);
        if (elementMatch) {
            score += 20;
            findings.push(`Prakriti ${prakriti} matches Lagna ${lagna}`);
        }
    }
    // Physical build vs planet influences
    const build = forensicProfile.physical?.build;
    if (build && candidate.ephemeris.planets) {
        const buildScore = checkBuildPlanetaryMatch(build, candidate.ephemeris.planets);
        score += buildScore;
        if (buildScore > 10)
            findings.push('Physical build matches planetary signatures');
    }
    return {
        method: 'Forensic Correlation',
        score: Math.min(100, score),
        maxScore: 100,
        status: score >= 70 ? 'pass' : 'warning',
        details: `Forensic match: ${score.toFixed(0)}%`,
        criticalFindings: findings
    };
}
function validateAI(input) {
    // AI score comes from previous AI analysis
    // This is a placeholder - actual AI score passed from AI service
    const score = input.candidate.aiScore || 70;
    return {
        method: 'AI Reasoning',
        score,
        maxScore: 100,
        status: score >= 75 ? 'pass' : score >= 50 ? 'warning' : 'fail',
        details: `AI confidence: ${score}%`,
        criticalFindings: score > 85 ? ['High AI confidence'] : []
    };
}
// ═══════════════════════════════════════════════════════════════════════════════
// CONSENSUS CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════
function calculateWeightedConsensus(scores) {
    let weightedSum = 0;
    let totalWeight = 0;
    for (const [method, score] of Object.entries(scores)) {
        const weight = METHOD_WEIGHTS[method];
        weightedSum += score * weight;
        totalWeight += weight;
    }
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
}
function determineConfidenceLevel(scores, overall, redFlags) {
    const scoreValues = Object.values(scores);
    // Check for critical red flags
    if (redFlags.gandanta || redFlags.d60Instability) {
        return 'LOW';
    }
    // GOD_TIER: All methods >= 90, no red flags
    if (scoreValues.every(s => s >= 90) && overall >= 95 && !redFlags.conflictingMethods) {
        return 'GOD_TIER';
    }
    // VERY_HIGH: All methods >= 80
    if (scoreValues.every(s => s >= 80) && overall >= 85) {
        return 'VERY_HIGH';
    }
    // HIGH: Overall >= 75, no method < 60
    if (overall >= 75 && scoreValues.every(s => s >= 60)) {
        return 'HIGH';
    }
    // MEDIUM: Overall >= 60
    if (overall >= 60) {
        return 'MEDIUM';
    }
    return 'LOW';
}
function calculateMarginOfError(scores, redFlags) {
    let baseError = 60; // Base 60 seconds
    // Reduce error with higher scores
    if (scores.kp >= 80)
        baseError -= 20;
    if (scores.vimshottari >= 80)
        baseError -= 15;
    if (scores.varga >= 80)
        baseError -= 10;
    if (scores.transit >= 80)
        baseError -= 10;
    // Increase error with red flags
    if (redFlags.sandhiBirth)
        baseError += 30;
    if (redFlags.dashaSandhi)
        baseError += 20;
    if (redFlags.d60Instability)
        baseError += 25;
    return Math.max(3, baseError); // Minimum 3 seconds
}
function detectRedFlags(input, scores, details) {
    const { candidate } = input;
    return {
        sandhiBirth: detectSandhi(candidate),
        gandanta: detectGandanta(candidate),
        dashaSandhi: detectDashaSandhi(candidate),
        conflictingMethods: detectConflicts(scores),
        weakSignificators: detectWeakSignificators(candidate),
        d60Instability: false, // Would need time window analysis
        forensicMismatch: scores.forensic < 50
    };
}
function generateKeyEvidence(details) {
    return details
        .filter(d => d.status === 'pass' && d.score >= 80)
        .map(d => `${d.method}: ${d.details}`)
        .slice(0, 5);
}
function generateRecommendations(scores, redFlags) {
    const recs = [];
    if (scores.kp < 70)
        recs.push('Add more precise event timings for KP analysis');
    if (scores.varga < 70)
        recs.push('Include spouse data for D9 verification');
    if (scores.transit < 60)
        recs.push('Verify event dates for transit correlation');
    if (scores.forensic < 70)
        recs.push('Complete forensic profile for better matching');
    if (redFlags.sandhiBirth)
        recs.push('Birth near cusp - additional verification needed');
    if (redFlags.d60Instability)
        recs.push('D60 changes in window - micro-grid analysis recommended');
    return recs;
}
// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════
function getEventWeight(impact) {
    const weights = {
        critical: 3,
        major: 2,
        moderate: 1,
        minor: 0.5
    };
    return weights[impact] || 1;
}
function getEventSignificators(category) {
    const map = {
        marriage: ['Venus', 'Jupiter', 'Moon'],
        career: ['Saturn', 'Sun', 'Jupiter'],
        education: ['Mercury', 'Jupiter', 'Moon'],
        children: ['Jupiter', 'Venus', 'Moon'],
        health: ['Sun', 'Moon', 'Mars'],
        finance: ['Jupiter', 'Venus', 'Mercury'],
        travel: ['Moon', 'Rahu', 'Ketu'],
        property: ['Mars', 'Saturn', 'Venus'],
        spiritual: ['Jupiter', 'Ketu', 'Saturn']
    };
    return map[category] || ['Jupiter'];
}
function getTargetHouse(category) {
    const map = {
        marriage: 7, career: 10, education: 4, children: 5,
        health: 6, finance: 2, travel: 9, property: 4,
        spiritual: 9, family: 2, legal: 6
    };
    return map[category] || 1;
}
function correlateYoginiWithEvent(yogini, category) {
    const correlations = {
        'Moon': ['marriage', 'family', 'travel'],
        'Sun': ['career', 'health', 'education'],
        'Jupiter': ['career', 'children', 'spiritual'],
        'Mars': ['health', 'property', 'legal'],
        'Mercury': ['education', 'finance', 'career'],
        'Saturn': ['career', 'health', 'property'],
        'Venus': ['marriage', 'finance', 'children'],
        'Rahu': ['travel', 'spiritual', 'career']
    };
    return correlations[yogini]?.includes(category) || false;
}
function correlateCharaWithEvent(sign, category) {
    // Simplified correlation
    const elementMap = {
        'fire': ['career', 'education', 'spiritual'],
        'earth': ['property', 'finance', 'career'],
        'air': ['education', 'travel', 'marriage'],
        'water': ['family', 'children', 'health']
    };
    const element = getSignElement(sign);
    return elementMap[element]?.includes(category) || false;
}
function getSignElement(sign) {
    const elements = {
        'Aries': 'fire', 'Leo': 'fire', 'Sagittarius': 'fire',
        'Taurus': 'earth', 'Virgo': 'earth', 'Capricorn': 'earth',
        'Gemini': 'air', 'Libra': 'air', 'Aquarius': 'air',
        'Cancer': 'water', 'Scorpio': 'water', 'Pisces': 'water'
    };
    return elements[sign] || 'fire';
}
function checkPrakritiLagnaMatch(prakriti, lagna) {
    const element = getSignElement(lagna);
    const prakritiElement = prakriti.includes('pitta') ? 'fire' :
        prakriti.includes('vata') ? 'air' :
            prakriti.includes('kapha') ? 'water' : 'earth';
    return element === prakritiElement ||
        (element === 'fire' && prakritiElement === 'fire') ||
        (element === 'water' && prakritiElement === 'water');
}
function checkBuildPlanetaryMatch(build, planets) {
    let score = 0;
    const jupiterStrong = planets.jupiter?.dignity === 'exalted' || planets.jupiter?.dignity === 'own';
    const saturnStrong = planets.saturn?.dignity === 'exalted' || planets.saturn?.dignity === 'own';
    if (build === 'heavy' && jupiterStrong)
        score += 15;
    if (build === 'slim' && saturnStrong)
        score += 15;
    if (build === 'athletic' && planets.mars?.dignity === 'exalted')
        score += 15;
    return score;
}
function detectSandhi(candidate) {
    const ascDegree = candidate.ephemeris?.ascendant?.degree;
    return ascDegree !== undefined && (ascDegree < 1 || ascDegree > 29);
}
function detectGandanta(candidate) {
    const moonLong = candidate.ephemeris?.planets?.moon?.longitude;
    if (!moonLong)
        return false;
    // Gandanta zones: 0-1° (Ashwini), 120-121° (Magha), 240-241° (Mula)
    const inZone = (moonLong % 120) < 1;
    return inZone;
}
function detectDashaSandhi(candidate) {
    // Check if birth is near dasha transition
    const dashaStart = candidate.dasha?.vimshottari?.mahadasha?.startDate;
    const dashaEnd = candidate.dasha?.vimshottari?.mahadasha?.endDate;
    if (!dashaStart || !dashaEnd)
        return false;
    const birthDate = new Date(candidate.birthDate || Date.now());
    const daysFromStart = Math.abs(birthDate.getTime() - dashaStart.getTime()) / (1000 * 60 * 60 * 24);
    const daysToEnd = Math.abs(dashaEnd.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysFromStart < 30 || daysToEnd < 30; // Within 30 days of transition
}
function detectConflicts(scores) {
    const values = Object.values(scores);
    const max = Math.max(...values);
    const min = Math.min(...values);
    return (max - min) > 40; // More than 40 point difference indicates conflict
}
function detectWeakSignificators(candidate) {
    const planets = candidate.ephemeris?.planets || {};
    return Object.values(planets).some((p) => p.shadbala && p.shadbala.total < 1.0);
}
// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export const ConsensusEngine = {
    calculate: calculateConsensus,
    calculateWeighted: calculateWeightedConsensus,
    determineLevel: determineConfidenceLevel,
    detectRedFlags
};
//# sourceMappingURL=consensus-engine.js.map