/**
 * 🔱 BTR SCORING ENGINE - God Tier Astrological Analysis
 * ======================================================
 *
 * Production-grade scoring system for Birth Time Rectification.
 * Implements multi-dimensional Vedic astrology scoring with
 * mathematical precision and astrological depth.
 *
 * Scoring Dimensions:
 * 1. Dasha-Event Correlation (25%)
 * 2. Transit Verification (20%)
 * 3. Divisional Chart Alignment (20%)
 * 4. Forensic DNA Matching (15%)
 * 5. Planetary Strength (10%)
 * 6. Special Configurations (10%)
 */
import { logger } from './logger.js';
// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS - GOD TIER SCORING CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════
const DEFAULT_WEIGHTS = {
    dashaEventCorrelation: 0.25, // 25% - Vimshottari timing accuracy
    transitVerification: 0.20, // 20% - Jupiter/Saturn/Rahu transits
    divisionalChartAlignment: 0.20, // 20% - D9, D10, D60 precision
    forensicMatching: 0.15, // 15% - Physical/psychological traits
    planetaryStrength: 0.10, // 10% - Shadbala, dignity, avastha
    specialConfigurations: 0.10, // 10% - Yogas, Vargottama, etc.
};
// Event-specific planetary significators (BPHS-based)
const EVENT_SIGNIFICATORS = {
    marriage: {
        primary: ['Venus', 'Jupiter'],
        secondary: ['Moon', '7th Lord'],
        supporting: ['2nd Lord', '11th Lord'],
        houses: [7, 2, 11]
    },
    career: {
        primary: ['Saturn', 'Sun', 'Jupiter'],
        secondary: ['10th Lord', 'Mercury'],
        supporting: ['6th Lord', '2nd Lord'],
        houses: [10, 6, 2]
    },
    education: {
        primary: ['Mercury', 'Jupiter', 'Moon'],
        secondary: ['4th Lord', '5th Lord'],
        supporting: ['2nd Lord', '9th Lord'],
        houses: [4, 5, 9]
    },
    children: {
        primary: ['Jupiter', 'Venus'],
        secondary: ['5th Lord', 'Moon'],
        supporting: ['1st Lord', '9th Lord'],
        houses: [5, 9, 1]
    },
    health: {
        primary: ['Sun', 'Moon', 'Mars'],
        secondary: ['6th Lord', '8th Lord'],
        supporting: ['1st Lord', '12th Lord'],
        houses: [1, 6, 8, 12]
    },
    finance: {
        primary: ['Jupiter', 'Venus', 'Mercury'],
        secondary: ['2nd Lord', '11th Lord'],
        supporting: ['5th Lord', '9th Lord'],
        houses: [2, 5, 9, 11]
    },
    property: {
        primary: ['Mars', 'Saturn', 'Venus'],
        secondary: ['4th Lord', '2nd Lord'],
        supporting: ['11th Lord', '9th Lord'],
        houses: [4, 2, 11]
    },
    travel: {
        primary: ['Moon', 'Rahu', 'Ketu'],
        secondary: ['3rd Lord', '9th Lord', '12th Lord'],
        supporting: ['Mercury', 'Jupiter'],
        houses: [3, 9, 12]
    },
    spiritual: {
        primary: ['Jupiter', 'Ketu', 'Saturn'],
        secondary: ['9th Lord', '12th Lord'],
        supporting: ['5th Lord', '1st Lord'],
        houses: [9, 12, 5]
    }
};
// Dasha scoring rubric
const DASHA_SCORES = {
    EXACT_SIGNIFICATOR: 30, // Dasha lord IS the significator
    SIGNIFICATOR_HOUSE: 20, // Dasha lord IN significator house
    ASPECTING_SIGNIFICATOR: 15, // Dasha lord aspects significator
    NATURAL_KARAKA: 10, // Natural significator active
    NEUTRAL: 5, // No direct correlation
    CONTRADICTORY: -25 // Dasha of 6/8/12 lord for positive event
};
// Transit scoring rubric
const TRANSIT_SCORES = {
    EXACT_CONJUNCTION: 25, // Within 1°
    CLOSE_ASPECT: 15, // Within 3°
    MODERATE_ASPECT: 8, // Within 5°
    WIDE_ORB: 3 // Within 8°
};
// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCORING ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
export class BTRScoringEngine {
    weights;
    ephemeris;
    events;
    forensicProfile;
    constructor(ephemeris, events, forensicProfile, weights = {}) {
        this.ephemeris = ephemeris;
        this.events = events;
        this.forensicProfile = forensicProfile;
        this.weights = { ...DEFAULT_WEIGHTS, ...weights };
    }
    /**
     * Calculate comprehensive score for a candidate birth time
     */
    calculateScore() {
        const startTime = Date.now();
        const dashaScore = this.calculateDashaEventCorrelation();
        const transitScore = this.calculateTransitVerification();
        const vargaScore = this.calculateDivisionalChartAlignment();
        const forensicScore = this.calculateForensicMatching();
        const strengthScore = this.calculatePlanetaryStrength();
        const specialScore = this.calculateSpecialConfigurations();
        const weightedTotal = dashaScore.score * this.weights.dashaEventCorrelation +
            transitScore.score * this.weights.transitVerification +
            vargaScore.score * this.weights.divisionalChartAlignment +
            forensicScore.score * this.weights.forensicMatching +
            strengthScore.score * this.weights.planetaryStrength +
            specialScore.score * this.weights.specialConfigurations;
        const finalScore = Math.round(weightedTotal);
        const confidenceLevel = this.determineConfidenceLevel(finalScore, [
            dashaScore.score,
            transitScore.score,
            vargaScore.score,
            forensicScore.score,
            strengthScore.score,
            specialScore.score
        ]);
        logger.debug('BTR Scoring complete', {
            totalScore: finalScore,
            confidence: confidenceLevel,
            duration: Date.now() - startTime,
            breakdown: {
                dasha: dashaScore.score,
                transit: transitScore.score,
                varga: vargaScore.score,
                forensic: forensicScore.score,
                strength: strengthScore.score,
                special: specialScore.score
            }
        });
        return {
            totalScore: finalScore,
            breakdown: {
                dashaScore: Math.round(dashaScore.score),
                transitScore: Math.round(transitScore.score),
                vargaScore: Math.round(vargaScore.score),
                forensicScore: Math.round(forensicScore.score),
                strengthScore: Math.round(strengthScore.score),
                specialScore: Math.round(specialScore.score)
            },
            details: {
                eventMatches: dashaScore.details,
                dashaAnalysis: dashaScore.dashaDetails,
                transitHits: transitScore.details,
                vargaStrengths: vargaScore.details,
                forensicAlignments: forensicScore.details,
                redFlags: this.collectRedFlags(dashaScore, transitScore, vargaScore)
            },
            confidence: confidenceLevel
        };
    }
    // ═════════════════════════════════════════════════════════════════════════════
    // 1. DASHA-EVENT CORRELATION (25%)
    // ═════════════════════════════════════════════════════════════════════════════
    calculateDashaEventCorrelation() {
        const details = [];
        const dashaDetails = [];
        let totalScore = 0;
        for (const event of this.events) {
            const eventDate = new Date(event.eventDate);
            const significators = this.getEventSignificators(event.category);
            // Get dasha at event date
            const dashaAtEvent = this.getDashaAtDate(eventDate);
            if (!dashaAtEvent)
                continue;
            let eventScore = 0;
            let primaryMatch = false;
            let secondaryMatch = false;
            let matchReason = '';
            // Check Mahadasha
            const mahaScore = this.scoreDashaLord(dashaAtEvent.mahadasha, significators, event.category);
            // Check Antardasha
            const antarScore = this.scoreDashaLord(dashaAtEvent.antardasha, significators, event.category);
            // Calculate combined score
            const combinedScore = (mahaScore * 0.6) + (antarScore * 0.4);
            if (combinedScore >= DASHA_SCORES.EXACT_SIGNIFICATOR) {
                primaryMatch = true;
                matchReason = `${dashaAtEvent.mahadasha}/${dashaAtEvent.antardasha} directly rule event houses`;
            }
            else if (combinedScore >= DASHA_SCORES.SIGNIFICATOR_HOUSE) {
                secondaryMatch = true;
                matchReason = `Dasha lords in significator houses`;
            }
            eventScore = Math.min(100, combinedScore + 50); // Normalize to 0-100
            totalScore += eventScore;
            details.push({
                eventId: event.id || 'unknown',
                eventType: event.eventType,
                score: Math.round(eventScore),
                primaryMatch,
                secondaryMatch,
                dashaLord: dashaAtEvent.mahadasha,
                antardashaLord: dashaAtEvent.antardasha,
                reason: matchReason
            });
            dashaDetails.push({
                period: `${dashaAtEvent.mahadasha}/${dashaAtEvent.antardasha}`,
                lord: dashaAtEvent.mahadasha,
                eventCorrelation: combinedScore,
                strength: this.getPlanetaryStrength(dashaAtEvent.mahadasha)
            });
        }
        const averageScore = this.events.length > 0
            ? totalScore / this.events.length
            : 50;
        return {
            score: Math.min(100, averageScore),
            details,
            dashaDetails
        };
    }
    scoreDashaLord(lord, significators, eventCategory) {
        let score = DASHA_SCORES.NEUTRAL;
        // Primary significator match
        if (significators.primary.includes(lord)) {
            score = DASHA_SCORES.EXACT_SIGNIFICATOR;
        }
        // Secondary significator match
        else if (significators.secondary.includes(lord)) {
            score = DASHA_SCORES.SIGNIFICATOR_HOUSE;
        }
        // Natural karaka match
        else if (significators.supporting.includes(lord)) {
            score = DASHA_SCORES.NATURAL_KARAKA;
        }
        // Check if malefic for positive events
        const isMaleficHouse = ['6', '8', '12'].some(h => significators.secondary.some(s => s.includes(h)));
        if (isMaleficHouse && score < DASHA_SCORES.NEUTRAL) {
            score = DASHA_SCORES.CONTRADICTORY;
        }
        return score;
    }
    // ═════════════════════════════════════════════════════════════════════════════
    // 2. TRANSIT VERIFICATION (20%)
    // ═════════════════════════════════════════════════════════════════════════════
    calculateTransitVerification() {
        const details = [];
        let totalScore = 0;
        for (const event of this.events) {
            const eventTransits = this.getTransitsForDate(new Date(event.eventDate));
            const significators = this.getEventSignificators(event.category);
            for (const transit of eventTransits) {
                const hitScore = this.scoreTransitHit(transit, significators);
                if (hitScore > 0) {
                    details.push({
                        eventDate: event.eventDate,
                        planet: transit.planet,
                        transitType: transit.aspectType,
                        natalTarget: transit.natalTarget,
                        orb: transit.orb,
                        score: hitScore
                    });
                    totalScore += hitScore;
                }
            }
        }
        // Normalize to 0-100
        const normalizedScore = Math.min(100, totalScore / Math.max(1, this.events.length));
        return { score: normalizedScore, details };
    }
    scoreTransitHit(transit, significators) {
        // Check if transit planet is a significator
        const isSignificator = significators.primary.includes(transit.planet) ||
            significators.secondary.includes(transit.planet);
        if (!isSignificator)
            return 0;
        // Score based on orb
        if (transit.orb <= 1)
            return TRANSIT_SCORES.EXACT_CONJUNCTION;
        if (transit.orb <= 3)
            return TRANSIT_SCORES.CLOSE_ASPECT;
        if (transit.orb <= 5)
            return TRANSIT_SCORES.MODERATE_ASPECT;
        if (transit.orb <= 8)
            return TRANSIT_SCORES.WIDE_ORB;
        return 0;
    }
    // ═════════════════════════════════════════════════════════════════════════════
    // 3. DIVISIONAL CHART ALIGNMENT (20%)
    // ═════════════════════════════════════════════════════════════════════════════
    calculateDivisionalChartAlignment() {
        const details = [];
        // D9 - Navamsa (Marriage/Dharma)
        const d9Strength = this.calculateVargaStrength('D9', ['Venus', 'Jupiter', 'Moon']);
        details.push({
            chart: 'D9 (Navamsa)',
            ascendant: d9Strength.ascendant,
            strengthScore: d9Strength.score,
            keyPlacements: d9Strength.keyPlacements
        });
        // D10 - Dasamsa (Career)
        const d10Strength = this.calculateVargaStrength('D10', ['Saturn', 'Sun', 'Mercury']);
        details.push({
            chart: 'D10 (Dasamsa)',
            ascendant: d10Strength.ascendant,
            strengthScore: d10Strength.score,
            keyPlacements: d10Strength.keyPlacements
        });
        // D60 - Shashtyamsa (Past Life/Karma)
        const d60Strength = this.calculateVargaStrength('D60', ['Sun', 'Moon', 'Ascendant Lord']);
        details.push({
            chart: 'D60 (Shashtyamsa)',
            ascendant: d60Strength.ascendant,
            strengthScore: d60Strength.score,
            keyPlacements: d60Strength.keyPlacements
        });
        // Average score
        const totalScore = (d9Strength.score + d10Strength.score + d60Strength.score) / 3;
        return { score: totalScore, details };
    }
    calculateVargaStrength(varga, keyPlanets) {
        const chart = this.ephemeris.divisionalCharts?.[varga];
        if (!chart)
            return { score: 50, ascendant: 'Unknown', keyPlacements: [] };
        let score = 50; // Base score
        const keyPlacements = [];
        // Check ascendant strength
        const ascendantSign = chart.ascendant.sign;
        const ascendantLord = this.getSignLord(ascendantSign);
        // Check if key planets are strong in this varga
        for (const planet of keyPlanets) {
            const planetData = chart.planets[planet.toLowerCase()];
            if (planetData) {
                const dignity = this.getDignityInSign(planet, planetData.sign);
                if (dignity === 'exalted' || dignity === 'moolatrikona') {
                    score += 15;
                    keyPlacements.push(`${planet} exalted in ${planetData.sign}`);
                }
                else if (dignity === 'own') {
                    score += 10;
                    keyPlacements.push(`${planet} in own sign ${planetData.sign}`);
                }
                // Check kendra/trikona placement
                const house = this.calculateHouseFromAscendant(ascendantSign, planetData.sign);
                if ([1, 4, 7, 10].includes(house)) {
                    score += 8;
                    keyPlacements.push(`${planet} in kendra H${house}`);
                }
                else if ([5, 9].includes(house)) {
                    score += 6;
                    keyPlacements.push(`${planet} in trikona H${house}`);
                }
            }
        }
        return {
            score: Math.min(100, score),
            ascendant: ascendantSign,
            keyPlacements
        };
    }
    // ═════════════════════════════════════════════════════════════════════════════
    // 4. FORENSIC MATCHING (15%)
    // ═════════════════════════════════════════════════════════════════════════════
    calculateForensicMatching() {
        const details = [];
        let totalScore = 0;
        if (!this.forensicProfile)
            return { score: 50, details };
        // Prakriti matching
        const prakritiScore = this.matchPrakriti();
        details.push({
            trait: 'Prakriti (Constitution)',
            expected: this.forensicProfile.biological?.prakriti || 'unknown',
            actual: this.getPrakritiFromChart(),
            match: prakritiScore > 70,
            score: prakritiScore
        });
        totalScore += prakritiScore;
        // Build matching
        const buildScore = this.matchBuild();
        details.push({
            trait: 'Physical Build',
            expected: this.forensicProfile.physical?.build || 'unknown',
            actual: this.getBuildFromChart(),
            match: buildScore > 70,
            score: buildScore
        });
        totalScore += buildScore;
        // Temperament matching
        const temperamentScore = this.matchTemperament();
        details.push({
            trait: 'Temperament',
            expected: this.forensicProfile.psychographic?.temperament || 'unknown',
            actual: this.getTemperamentFromChart(),
            match: temperamentScore > 70,
            score: temperamentScore
        });
        totalScore += temperamentScore;
        const averageScore = totalScore / 3;
        return { score: averageScore, details };
    }
    matchPrakriti() {
        const lagnaSign = this.ephemeris.ascendant.sign;
        const prakriti = this.forensicProfile.biological?.prakriti;
        if (!prakriti)
            return 50;
        const signElements = {
            Aries: 'fire', Leo: 'fire', Sagittarius: 'fire',
            Taurus: 'earth', Virgo: 'earth', Capricorn: 'earth',
            Gemini: 'air', Libra: 'air', Aquarius: 'air',
            Cancer: 'water', Scorpio: 'water', Pisces: 'water'
        };
        const element = signElements[lagnaSign];
        if (prakriti.includes('pitta') && element === 'fire')
            return 90;
        if (prakriti.includes('vata') && element === 'air')
            return 90;
        if (prakriti.includes('kapha') && element === 'water')
            return 90;
        return 50;
    }
    matchBuild() {
        const jupiterRaw = this.ephemeris.shadbala?.['Jupiter'];
        const saturnRaw = this.ephemeris.shadbala?.['Saturn'];
        const marsRaw = this.ephemeris.shadbala?.['Mars'];
        const jupiterStrength = typeof jupiterRaw === 'number' ? jupiterRaw : 0;
        const saturnStrength = typeof saturnRaw === 'number' ? saturnRaw : 0;
        const marsStrength = typeof marsRaw === 'number' ? marsRaw : 0;
        const build = this.forensicProfile.physical?.build;
        if (!build)
            return 50;
        if (build === 'heavy' && jupiterStrength > 100)
            return 85;
        if (build === 'slim' && saturnStrength > 100)
            return 85;
        if (build === 'athletic' && marsStrength > 100)
            return 85;
        return 60;
    }
    matchTemperament() {
        const moonSign = this.ephemeris.planets.moon.sign;
        const temperament = this.forensicProfile.psychographic?.temperament;
        if (!temperament)
            return 50;
        const fierySigns = ['Aries', 'Leo', 'Sagittarius'];
        const earthySigns = ['Taurus', 'Virgo', 'Capricorn'];
        if (temperament === 'choleric' && fierySigns.includes(moonSign))
            return 90;
        if (temperament === 'melancholic' && earthySigns.includes(moonSign))
            return 90;
        return 60;
    }
    // ═════════════════════════════════════════════════════════════════════════════
    // 5. PLANETARY STRENGTH (10%)
    // ═════════════════════════════════════════════════════════════════════════════
    calculatePlanetaryStrength() {
        const shadbala = this.ephemeris.shadbala;
        if (!shadbala)
            return { score: 50 };
        let totalStrength = 0;
        let planetCount = 0;
        for (const [planet, strength] of Object.entries(shadbala)) {
            if (typeof strength === 'number') {
                // Normalize to 0-100 (assuming 200+ is very strong)
                const normalizedStrength = Math.min(100, (strength / 200) * 100);
                totalStrength += normalizedStrength;
                planetCount++;
            }
        }
        const averageStrength = planetCount > 0
            ? totalStrength / planetCount
            : 50;
        return { score: averageStrength };
    }
    // ═════════════════════════════════════════════════════════════════════════════
    // 6. SPECIAL CONFIGURATIONS (10%)
    // ═════════════════════════════════════════════════════════════════════════════
    calculateSpecialConfigurations() {
        let score = 50;
        // Check for yogas (from divisional charts or separate property)
        const yogas = this.ephemeris.yogas || [];
        for (const yoga of yogas) {
            if (yoga?.level === 'major')
                score += 10;
            else if (yoga?.level === 'minor')
                score += 5;
        }
        // Check for Vargottama planets
        const vargottama = this.getVargottamaPlanets();
        score += vargottama.length * 5;
        // Check for Pushkar Navamsa
        const pushkar = this.getPushkarNavamsaPlanets();
        score += pushkar.length * 3;
        return { score: Math.min(100, score) };
    }
    // ═════════════════════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═════════════════════════════════════════════════════════════════════════════
    getEventSignificators(category) {
        return EVENT_SIGNIFICATORS[category.toLowerCase()] || {
            primary: ['Jupiter'],
            secondary: ['Jupiter'],
            supporting: ['Jupiter'],
            houses: [1]
        };
    }
    getDashaAtDate(date) {
        // Implementation depends on your dasha calculation system
        // This is a placeholder - use your actual dasha calculation
        return {
            mahadasha: 'Jupiter',
            antardasha: 'Saturn'
        };
    }
    getTransitsForDate(date) {
        // Placeholder - implement actual transit calculation
        return [];
    }
    getPlanetaryStrength(planet) {
        const strength = this.ephemeris.shadbala?.[planet];
        return typeof strength === 'number' ? strength : 100;
    }
    getSignLord(sign) {
        const lords = {
            Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury',
            Cancer: 'Moon', Leo: 'Sun', Virgo: 'Mercury',
            Libra: 'Venus', Scorpio: 'Mars', Sagittarius: 'Jupiter',
            Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter'
        };
        return lords[sign] || 'Unknown';
    }
    getDignityInSign(planet, sign) {
        const exaltations = {
            Sun: 'Aries', Moon: 'Taurus', Mars: 'Capricorn',
            Mercury: 'Virgo', Jupiter: 'Cancer', Venus: 'Pisces', Saturn: 'Libra'
        };
        if (exaltations[planet] === sign)
            return 'exalted';
        if (this.getSignLord(sign) === planet)
            return 'own';
        return 'neutral';
    }
    calculateHouseFromAscendant(ascendant, planetSign) {
        const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
            'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
        const ascIndex = signs.indexOf(ascendant);
        const planetIndex = signs.indexOf(planetSign);
        return ((planetIndex - ascIndex + 12) % 12) + 1;
    }
    getPrakritiFromChart() {
        const lagnaSign = this.ephemeris.ascendant.sign;
        const fireSigns = ['Aries', 'Leo', 'Sagittarius'];
        const airSigns = ['Gemini', 'Libra', 'Aquarius'];
        const waterSigns = ['Cancer', 'Scorpio', 'Pisces'];
        if (fireSigns.includes(lagnaSign))
            return 'pitta';
        if (airSigns.includes(lagnaSign))
            return 'vata';
        if (waterSigns.includes(lagnaSign))
            return 'kapha';
        return 'mixed';
    }
    getBuildFromChart() {
        const jupiterRaw = this.ephemeris.shadbala?.['Jupiter'];
        const saturnRaw = this.ephemeris.shadbala?.['Saturn'];
        const jupiter = typeof jupiterRaw === 'number' ? jupiterRaw : 0;
        const saturn = typeof saturnRaw === 'number' ? saturnRaw : 0;
        if (jupiter > 120)
            return 'heavy';
        if (saturn > 120)
            return 'slim';
        return 'medium';
    }
    getTemperamentFromChart() {
        const moonSign = this.ephemeris.planets.moon.sign;
        const fireSigns = ['Aries', 'Leo', 'Sagittarius'];
        if (fireSigns.includes(moonSign))
            return 'choleric';
        return 'balanced';
    }
    getVargottamaPlanets() {
        const vargottama = [];
        const d1 = this.ephemeris.planets;
        const d9 = this.ephemeris.divisionalCharts?.D9?.planets;
        if (!d9)
            return vargottama;
        for (const [planet, d1Data] of Object.entries(d1)) {
            const d9Data = d9[planet];
            if (d9Data && d1Data.sign === d9Data.sign) {
                vargottama.push(planet);
            }
        }
        return vargottama;
    }
    getPushkarNavamsaPlanets() {
        const pushkar = [];
        const d9 = this.ephemeris.divisionalCharts?.D9?.planets;
        if (!d9)
            return pushkar;
        const pushkarSigns = ['Taurus', 'Cancer', 'Virgo', 'Libra', 'Sagittarius', 'Pisces'];
        for (const [planet, d9Data] of Object.entries(d9)) {
            if (pushkarSigns.includes(d9Data.sign)) {
                pushkar.push(planet);
            }
        }
        return pushkar;
    }
    determineConfidenceLevel(totalScore, breakdownScores) {
        const minScore = Math.min(...breakdownScores);
        if (totalScore >= 90 && minScore >= 80)
            return 'GOD_TIER';
        if (totalScore >= 80 && minScore >= 70)
            return 'EXCELLENT';
        if (totalScore >= 70 && minScore >= 60)
            return 'GOOD';
        if (totalScore >= 60)
            return 'MODERATE';
        return 'WEAK';
    }
    collectRedFlags(dasha, transit, varga) {
        const redFlags = [];
        if (dasha.score < 40)
            redFlags.push('Weak Dasha-Event correlation');
        if (transit.score < 40)
            redFlags.push('Poor transit verification');
        if (varga.score < 40)
            redFlags.push('Divisional chart concerns');
        // Check for sandhi
        const ascDegree = this.ephemeris.ascendant.degree;
        if (ascDegree < 1 || ascDegree > 29) {
            redFlags.push(`Ascendant in critical sandhi zone (${ascDegree.toFixed(2)}°)`);
        }
        return redFlags;
    }
}
// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export const BTRScoring = {
    create: (ephemeris, events, forensicProfile, weights) => new BTRScoringEngine(ephemeris, events, forensicProfile, weights),
    DEFAULT_WEIGHTS,
    EVENT_SIGNIFICATORS,
    DASHA_SCORES,
    TRANSIT_SCORES
};
export default BTRScoringEngine;
//# sourceMappingURL=btr-scoring-engine.js.map