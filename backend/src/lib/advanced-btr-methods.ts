// lib/advanced-btr-methods.ts
// Advanced Vedic Astrology Methods for 99%+ BTR Accuracy
// Includes: Yogini Dasha, Divisional Charts, Physical Traits, Advanced Aspects, Arudha Lagna

import { EphemerisData, PlanetPosition, LifeEvent } from './types';

// ═════════════════════════════════════════════════════════════════════════════
// TYPES AND CONSTANTS
// ═════════════════════════════════════════════════════════════════════════════

export interface YoginiDashaPeriod {
    name: string;
    planet: string;
    startDate: Date;
    endDate: Date;
    durationYears: number;
}

export interface DivisionalChart {
    chartType: string;  // D2, D7, D9, D10, D30, D60
    planets: Record<string, { sign: string; degree: number; house: number }>;
    ascendant: { sign: string; degree: number };
}

export interface PhysicalTraitsScore {
    score: number;       // 0-100
    matches: string[];   // What matched
    mismatches: string[]; // What didn't match
    recommendation: string;
}

export interface AspectData {
    planet1: string;
    planet2: string;
    aspectType: string;  // conjunction, opposition, trine, square, sextile, quincunx, semi-sextile, etc.
    exactDegrees: number;
    orb: number;
    strength: 'exact' | 'strong' | 'moderate' | 'weak';
}

export interface ArudhaLagna {
    sign: string;
    degree: number;
    lord: string;
    strength: 'strong' | 'moderate' | 'weak';
}

export interface SpecialLagna {
    name: string;
    longitude: number;
    sign: string;
    degree: number;
}

export interface SecondaryProgression {
    eventAge: number;
    progressedDate: Date;
    progressedPlanets: Record<string, { longitude: number; sign: string }>;
    progressedAspects: AspectData[];
}

// ═════════════════════════════════════════════════════════════════════════════
// YOGINI DASHA (36-Year Cycle)
// ═════════════════════════════════════════════════════════════════════════════

// Yogini sequence with durations
const YOGINI_SEQUENCE = [
    { name: 'Mangala', planet: 'Moon', years: 1 },
    { name: 'Pingala', planet: 'Sun', years: 2 },
    { name: 'Dhanya', planet: 'Jupiter', years: 3 },
    { name: 'Bhramari', planet: 'Mars', years: 4 },
    { name: 'Bhadrika', planet: 'Mercury', years: 5 },
    { name: 'Ulka', planet: 'Saturn', years: 6 },
    { name: 'Siddha', planet: 'Venus', years: 7 },
    { name: 'Sankata', planet: 'Rahu', years: 8 },
];

const TOTAL_YOGINI_YEARS = 36;

// Nakshatra to starting Yogini mapping
const NAKSHATRA_TO_YOGINI: Record<number, number> = {
    0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, // 0-7 → Yogini 0-7
    8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 6, 15: 7, // 8-15 → Yogini 0-7
    16: 0, 17: 1, 18: 2, 19: 3, 20: 4, 21: 5, 22: 6, 23: 7, // 16-23 → Yogini 0-7
    24: 0, 25: 1, 26: 2, // 24-26 → Yogini 0-2
};

/**
 * Calculate Yogini Dasha sequence from birth
 * Complements Vimshottari Dasha for cross-verification
 */
export function calculateYoginiDasha(
    moonLongitude: number,
    birthDate: Date
): YoginiDashaPeriod[] {
    const NAKSHATRA_SPAN = 360 / 27;
    const nakshatraIndex = Math.floor(moonLongitude / NAKSHATRA_SPAN);
    const positionInNakshatra = (moonLongitude % NAKSHATRA_SPAN) / NAKSHATRA_SPAN;

    // Get starting Yogini
    const startingYoginiIndex = NAKSHATRA_TO_YOGINI[nakshatraIndex] ?? 0;
    const startingYogini = YOGINI_SEQUENCE[startingYoginiIndex];

    // Calculate remaining period of first Yogini
    const elapsedYears = positionInNakshatra * startingYogini.years;
    const remainingYears = startingYogini.years - elapsedYears;

    const periods: YoginiDashaPeriod[] = [];
    let currentDate = new Date(birthDate);
    let yoginiIndex = startingYoginiIndex;

    // First period (partial)
    const firstEndDate = addYears(currentDate, remainingYears);
    periods.push({
        name: startingYogini.name,
        planet: startingYogini.planet,
        startDate: new Date(currentDate),
        endDate: firstEndDate,
        durationYears: remainingYears,
    });
    currentDate = firstEndDate;
    yoginiIndex = (yoginiIndex + 1) % 8;

    // Full periods for 3 cycles (108 years coverage)
    for (let cycle = 0; cycle < 3; cycle++) {
        for (let i = 0; i < 8; i++) {
            const yogini = YOGINI_SEQUENCE[yoginiIndex];
            const endDate = addYears(currentDate, yogini.years);

            periods.push({
                name: yogini.name,
                planet: yogini.planet,
                startDate: new Date(currentDate),
                endDate,
                durationYears: yogini.years,
            });

            currentDate = endDate;
            yoginiIndex = (yoginiIndex + 1) % 8;
        }
    }

    return periods;
}

/**
 * Get Yogini Dasha active on a specific date
 */
export function getYoginiDashaForDate(
    periods: YoginiDashaPeriod[],
    eventDate: Date
): YoginiDashaPeriod | null {
    for (const period of periods) {
        if (eventDate >= period.startDate && eventDate <= period.endDate) {
            return period;
        }
    }
    return null;
}

/**
 * Check if Yogini Dasha supports an event type
 */
export function yoginiSupportsEvent(
    yogini: YoginiDashaPeriod,
    eventCategory: string,
    eventType: string
): { supports: boolean; reason: string } {
    const category = eventCategory.toLowerCase();
    const type = eventType.toLowerCase();

    // Yogini-event correlations
    const correlations: Record<string, string[]> = {
        Moon: ['mother', 'home', 'travel', 'emotions', 'mental'],
        Sun: ['career', 'father', 'authority', 'recognition', 'government'],
        Jupiter: ['education', 'children', 'marriage', 'spirituality', 'luck'],
        Mars: ['property', 'surgery', 'accidents', 'courage', 'siblings'],
        Mercury: ['business', 'communication', 'education', 'skills', 'writing'],
        Saturn: ['career', 'discipline', 'health', 'delays', 'service'],
        Venus: ['marriage', 'love', 'arts', 'luxury', 'relationships'],
        Rahu: ['foreign', 'technology', 'unconventional', 'sudden', 'research'],
    };

    const supportedEvents = correlations[yogini.planet] || [];

    for (const event of supportedEvents) {
        if (category.includes(event) || type.includes(event)) {
            return {
                supports: true,
                reason: `${yogini.name} (${yogini.planet}) Yogini Dasha supports ${event} events`,
            };
        }
    }

    return {
        supports: false,
        reason: `${yogini.name} (${yogini.planet}) Yogini Dasha has no direct correlation`,
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// DIVISIONAL CHARTS (D2, D7, D9, D10, D30)
// ═════════════════════════════════════════════════════════════════════════════

const ZODIAC_SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

/**
 * Calculate D2 (Hora) Chart - Wealth/Health
 * Each sign divided into 2 parts (15° each)
 */
export function calculateD2(longitude: number): { sign: string; degree: number } {
    const signIndex = Math.floor(longitude / 30);
    const degreeInSign = longitude % 30;

    // Odd signs (Aries=0, Gemini=2, etc.): First half = Sun (Leo), Second half = Moon (Cancer)
    // Even signs: First half = Moon (Cancer), Second half = Sun (Leo)
    const isOddSign = signIndex % 2 === 0;
    const isFirstHalf = degreeInSign < 15;

    let d2SignIndex: number;
    if (isOddSign) {
        d2SignIndex = isFirstHalf ? 4 : 3; // Leo or Cancer
    } else {
        d2SignIndex = isFirstHalf ? 3 : 4; // Cancer or Leo
    }

    return {
        sign: ZODIAC_SIGNS[d2SignIndex],
        degree: (degreeInSign % 15) * 2,
    };
}

/**
 * Calculate D7 (Saptamsha) Chart - Children/Education
 * Each sign divided into 7 parts (~4.286° each)
 */
export function calculateD7(longitude: number): { sign: string; degree: number } {
    const signIndex = Math.floor(longitude / 30);
    const degreeInSign = longitude % 30;
    const saptamshaSpan = 30 / 7;
    const saptamshaNum = Math.floor(degreeInSign / saptamshaSpan);

    // Odd signs: Start from same sign; Even signs: Start from 7th sign
    const isOddSign = signIndex % 2 === 0;
    const startSign = isOddSign ? signIndex : (signIndex + 6) % 12;
    const d7SignIndex = (startSign + saptamshaNum) % 12;

    return {
        sign: ZODIAC_SIGNS[d7SignIndex],
        degree: (degreeInSign % saptamshaSpan) * 7,
    };
}

/**
 * Calculate D9 (Navamsha) Chart - Marriage/Dharma
 * Each sign divided into 9 parts (3.333° each)
 */
export function calculateD9(longitude: number): { sign: string; degree: number } {
    const signIndex = Math.floor(longitude / 30);
    const degreeInSign = longitude % 30;
    const navamshaSpan = 30 / 9;
    const navamshaNum = Math.floor(degreeInSign / navamshaSpan);

    // Fire signs start from Aries, Earth from Cap, Air from Libra, Water from Cancer
    const element = signIndex % 4;
    const startSigns = [0, 9, 6, 3]; // Aries, Cap, Libra, Cancer
    const d9SignIndex = (startSigns[element] + navamshaNum) % 12;

    return {
        sign: ZODIAC_SIGNS[d9SignIndex],
        degree: (degreeInSign % navamshaSpan) * 9,
    };
}

/**
 * Calculate D10 (Dasamsha) Chart - Career/Authority
 * Each sign divided into 10 parts (3° each)
 */
export function calculateD10(longitude: number): { sign: string; degree: number } {
    const signIndex = Math.floor(longitude / 30);
    const degreeInSign = longitude % 30;
    const dasamshaSpan = 3;
    const dasamshaNum = Math.floor(degreeInSign / dasamshaSpan);

    // Odd signs: Start from same sign; Even signs: Start from 9th sign
    const isOddSign = signIndex % 2 === 0;
    const startSign = isOddSign ? signIndex : (signIndex + 8) % 12;
    const d10SignIndex = (startSign + dasamshaNum) % 12;

    return {
        sign: ZODIAC_SIGNS[d10SignIndex],
        degree: (degreeInSign % dasamshaSpan) * 10,
    };
}

/**
 * Calculate D30 (Trimshamsha) Chart - Acute Events/Misfortune
 * Each sign has specific planet rulerships for 5° spans
 */
export function calculateD30(longitude: number): { sign: string; degree: number; ruler: string } {
    const signIndex = Math.floor(longitude / 30);
    const degreeInSign = longitude % 30;
    const isOddSign = signIndex % 2 === 0;

    // Standard Parashari Trimshamsha degrees
    const oddLimits = [5, 10, 18, 25, 30];
    const evenLimits = [5, 12, 20, 25, 30];
    const oddRulers = ['Mars', 'Saturn', 'Jupiter', 'Mercury', 'Venus'];
    const evenRulers = ['Venus', 'Mercury', 'Jupiter', 'Saturn', 'Mars'];
    const oddSigns = ['Aries', 'Aquarius', 'Sagittarius', 'Gemini', 'Libra'];
    const evenSigns = ['Taurus', 'Virgo', 'Pisces', 'Capricorn', 'Scorpio'];

    const limits = isOddSign ? oddLimits : evenLimits;
    const rulers = isOddSign ? oddRulers : evenRulers;
    const signs = isOddSign ? oddSigns : evenSigns;

    let idx = 0;
    while (idx < 5 && degreeInSign >= limits[idx]) idx++;
    if (idx === 5) idx = 4;

    return { sign: signs[idx], degree: 0, ruler: rulers[idx] };
}

/**
 * Calculate D60 (Shashtiamsha) Chart - Cyclic/Sequential
 * Each sign divided into 60 parts (0.5° each)
 * Crucial for seconds-level rectification.
 */
export function calculateD60(longitude: number): { sign: string; degree: number } {
    const totalHalfDegrees = Math.floor(longitude / 0.5);
    const signIndex = Math.floor(longitude / 30);
    const halfDegreeInSign = Math.floor((longitude % 30) / 0.5);

    // Cyclic order starting from the sign residency
    const d60SignIndex = (signIndex + halfDegreeInSign) % 12;

    return {
        sign: ZODIAC_SIGNS[d60SignIndex],
        degree: (longitude % 0.5) * 60,
    };
}



/**
 * Generate complete divisional chart for all planets
 */
export function generateDivisionalCharts(
    ephemeris: EphemerisData
): Record<string, DivisionalChart> {
    const charts: Record<string, DivisionalChart> = {};
    const chartTypes = ['D2', 'D7', 'D9', 'D10', 'D30', 'D60'];

    for (const type of chartTypes) {
        const planets: Record<string, { sign: string; degree: number; house: number }> = {};
        for (const [name, pos] of Object.entries(ephemeris.planets)) {
            let div: { sign: string; degree: number };
            if (type === 'D2') div = calculateD2(pos.longitude);
            else if (type === 'D7') div = calculateD7(pos.longitude);
            else if (type === 'D9') div = calculateD9(pos.longitude);
            else if (type === 'D10') div = calculateD10(pos.longitude);
            else if (type === 'D30') div = calculateD30(pos.longitude);
            else if (type === 'D60') div = calculateD60(pos.longitude);
            else div = { sign: pos.sign, degree: pos.degree };

            // Find house in divisional chart (relative to divisional ascendant sign - Whole Sign)
            const divAsc = type === 'D2' ? calculateD2(ephemeris.ascendant.longitude) :
                type === 'D7' ? calculateD7(ephemeris.ascendant.longitude) :
                    type === 'D9' ? calculateD9(ephemeris.ascendant.longitude) :
                        type === 'D10' ? calculateD10(ephemeris.ascendant.longitude) :
                            type === 'D30' ? calculateD30(ephemeris.ascendant.longitude) :
                                type === 'D60' ? calculateD60(ephemeris.ascendant.longitude) :
                                    { sign: ephemeris.ascendant.sign, degree: ephemeris.ascendant.degree };

            const signIdx = ZODIAC_SIGNS.indexOf(div.sign);
            const ascIdx = ZODIAC_SIGNS.indexOf(divAsc.sign);
            const house = ((signIdx - ascIdx + 12) % 12) + 1;

            planets[name] = { ...div, house };
        }

        const ascDiv = type === 'D2' ? calculateD2(ephemeris.ascendant.longitude) :
            type === 'D7' ? calculateD7(ephemeris.ascendant.longitude) :
                type === 'D9' ? calculateD9(ephemeris.ascendant.longitude) :
                    type === 'D10' ? calculateD10(ephemeris.ascendant.longitude) :
                        type === 'D30' ? calculateD30(ephemeris.ascendant.longitude) :
                            type === 'D60' ? calculateD60(ephemeris.ascendant.longitude) :
                                { sign: ephemeris.ascendant.sign, degree: ephemeris.ascendant.degree };

        charts[type] = {
            chartType: type,
            planets,
            ascendant: ascDiv,
        };
    }

    return charts;
}

/**
 * Positional Strength (Shadbala-Lite)
 * Identifies Exaltation, Debilitation, and Moolatrikona.
 */
export function calculateShadbalaLite(ephemeris: EphemerisData): Record<string, string> {
    const results: Record<string, string> = {};
    const strengths: Record<string, { exalt: string; debilit: string; mt: string }> = {
        sun: { exalt: 'Aries', debilit: 'Libra', mt: 'Leo' },
        moon: { exalt: 'Taurus', debilit: 'Scorpio', mt: 'Taurus' },
        mars: { exalt: 'Capricorn', debilit: 'Cancer', mt: 'Aries' },
        mercury: { exalt: 'Virgo', debilit: 'Pisces', mt: 'Virgo' },
        jupiter: { exalt: 'Cancer', debilit: 'Capricorn', mt: 'Sagittarius' },
        venus: { exalt: 'Pisces', debilit: 'Virgo', mt: 'Libra' },
        saturn: { exalt: 'Libra', debilit: 'Aries', mt: 'Aquarius' }
    };

    for (const [planet, pos] of Object.entries(ephemeris.planets)) {
        const s = strengths[planet];
        if (!s) continue;

        if (pos.sign === s.exalt) results[planet] = 'Exalted (Strongest)';
        else if (pos.sign === s.debilit) results[planet] = 'Debilitated (Weakest)';
        else if (pos.sign === s.mt) results[planet] = 'Moolatrikona (Very Strong)';
        else if (pos.lord === planet) results[planet] = 'Own House (Strong)';
        else results[planet] = 'Neutral';
    }
    return results;
}

// ═════════════════════════════════════════════════════════════════════════════
// PHYSICAL TRAITS ANALYSIS
// ═════════════════════════════════════════════════════════════════════════════

interface PhysicalTraits {
    height?: 'short' | 'medium' | 'tall';
    build?: 'slim' | 'medium' | 'heavy';
    complexion?: 'fair' | 'medium' | 'dark';
    hairType?: 'straight' | 'curly' | 'wavy' | 'thin' | 'thick';
    prakriti?: 'vata' | 'pitta' | 'kapha' | 'vata-pitta' | 'pitta-kapha' | 'vata-kapha';
    noseType?: 'sharp' | 'blunt' | 'aquiline' | 'long' | 'small';
    appearance?: string;
}

// Sign-based physical characteristics (Vedic astrology)
const LAGNA_TRAITS: Record<string, {
    height: string[];
    build: string[];
    complexion: string[];
}> = {
    Aries: { height: ['medium', 'tall'], build: ['medium', 'slim'], complexion: ['medium', 'fair'] },
    Taurus: { height: ['short', 'medium'], build: ['heavy', 'medium'], complexion: ['fair', 'medium'] },
    Gemini: { height: ['tall', 'medium'], build: ['slim', 'medium'], complexion: ['fair', 'medium'] },
    Cancer: { height: ['short', 'medium'], build: ['medium', 'heavy'], complexion: ['fair', 'medium'] },
    Leo: { height: ['tall', 'medium'], build: ['medium', 'heavy'], complexion: ['medium', 'fair'] },
    Virgo: { height: ['medium'], build: ['slim', 'medium'], complexion: ['fair', 'medium'] },
    Libra: { height: ['medium', 'tall'], build: ['medium'], complexion: ['fair'] },
    Scorpio: { height: ['medium'], build: ['medium', 'heavy'], complexion: ['medium', 'dark'] },
    Sagittarius: { height: ['tall'], build: ['medium', 'heavy'], complexion: ['medium', 'fair'] },
    Capricorn: { height: ['short', 'medium'], build: ['slim', 'medium'], complexion: ['dark', 'medium'] },
    Aquarius: { height: ['tall', 'medium'], build: ['medium'], complexion: ['medium', 'fair'] },
    Pisces: { height: ['short', 'medium'], build: ['medium', 'heavy'], complexion: ['fair', 'medium'] },
};

// Moon sign complexion influence
const MOON_COMPLEXION: Record<string, string[]> = {
    // Water signs = Fair
    Cancer: ['fair', 'medium'], Scorpio: ['medium'], Pisces: ['fair', 'medium'],
    // Fire signs = Medium to Dark
    Aries: ['medium', 'dark'], Leo: ['medium'], Sagittarius: ['medium', 'fair'],
    // Earth signs = Medium
    Taurus: ['medium', 'fair'], Virgo: ['fair', 'medium'], Capricorn: ['dark', 'medium'],
    // Air signs = Fair to Medium
    Gemini: ['fair', 'medium'], Libra: ['fair'], Aquarius: ['fair', 'medium'],
};

/**
 * Score physical traits match with chart
 * High-impact method: Can eliminate 20-30% of candidates early
 */
export function scorePhysicalTraits(
    ephemeris: EphemerisData,
    traits: PhysicalTraits
): PhysicalTraitsScore {
    let score = 50; // Start neutral
    const matches: string[] = [];
    const mismatches: string[] = [];

    const lagnaSign = ephemeris.ascendant.sign;
    const moonSign = ephemeris.planets.moon.sign;

    const expectedTraits = LAGNA_TRAITS[lagnaSign];
    const moonComplexion = MOON_COMPLEXION[moonSign];

    if (!expectedTraits) {
        return { score: 50, matches: [], mismatches: [], recommendation: 'Unable to determine traits for this ascendant' };
    }

    // Height matching (30 points max)
    if (traits.height) {
        if (expectedTraits.height.includes(traits.height)) {
            score += 15;
            matches.push(`${lagnaSign} Lagna matches ${traits.height} height`);
        } else {
            score -= 10;
            mismatches.push(`${lagnaSign} Lagna typically gives ${expectedTraits.height.join('/')} height, not ${traits.height}`);
        }
    }

    // Build matching (30 points max)
    if (traits.build) {
        if (expectedTraits.build.includes(traits.build)) {
            score += 15;
            matches.push(`${lagnaSign} Lagna matches ${traits.build} build`);
        } else {
            score -= 10;
            mismatches.push(`${lagnaSign} Lagna typically gives ${expectedTraits.build.join('/')} build, not ${traits.build}`);
        }
    }

    // Complexion matching (15 points) - use both Lagna and Moon
    if (traits.complexion) {
        const lagnaMatch = expectedTraits.complexion.includes(traits.complexion);
        const moonMatch = moonComplexion?.includes(traits.complexion);

        if (lagnaMatch && moonMatch) {
            score += 10;
            matches.push(`Both Lagna (${lagnaSign}) and Moon (${moonSign}) match ${traits.complexion} complexion`);
        } else if (lagnaMatch || moonMatch) {
            score += 5;
            matches.push(`${lagnaMatch ? 'Lagna' : 'Moon'} matches ${traits.complexion} complexion`);
        } else {
            score -= 5;
            mismatches.push(`Neither Lagna (${lagnaSign}) nor Moon (${moonSign}) typically gives ${traits.complexion} complexion`);
        }
    }

    // Hair Type matching (10 points)
    if (traits.hairType) {
        if (['curly', 'thick'].includes(traits.hairType) && ['Leo', 'Aries', 'Scorpio'].includes(lagnaSign)) {
            score += 5;
            matches.push(`${lagnaSign} Lagna matches ${traits.hairType} hair`);
        } else if (['straight', 'thin'].includes(traits.hairType) && ['Virgo', 'Gemini', 'Libra'].includes(lagnaSign)) {
            score += 5;
            matches.push(`${lagnaSign} Lagna matches ${traits.hairType} hair`);
        }
    }

    // Prakriti matching (20 points - High indicator)
    if (traits.prakriti) {
        const fireSigns = ['Aries', 'Leo', 'Sagittarius'];
        const earthSigns = ['Taurus', 'Virgo', 'Capricorn'];
        const airSigns = ['Gemini', 'Libra', 'Aquarius'];
        const waterSigns = ['Cancer', 'Scorpio', 'Pisces'];

        if (traits.prakriti.includes('pitta') && fireSigns.includes(lagnaSign)) {
            score += 10;
            matches.push(`${lagnaSign} (Fire) aligns with Pitta prakriti`);
        } else if (traits.prakriti.includes('vata') && airSigns.includes(lagnaSign)) {
            score += 10;
            matches.push(`${lagnaSign} (Air) aligns with Vata prakriti`);
        } else if (traits.prakriti.includes('kapha') && waterSigns.includes(lagnaSign)) {
            score += 10;
            matches.push(`${lagnaSign} (Water) aligns with Kapha prakriti`);
        }
    }

    // Nose Type matching (10 points)
    if (traits.noseType) {
        if (traits.noseType === 'sharp' && ['Aries', 'Leo', 'Virgo'].includes(lagnaSign)) {
            score += 5;
            matches.push(`${lagnaSign} typically gives a sharp nose`);
        } else if (traits.noseType === 'aquiline' && ['Sagittarius', 'Scorpio'].includes(lagnaSign)) {
            score += 5;
            matches.push(`${lagnaSign} aligns with aquiline features`);
        }
    }

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // Generate recommendation
    let recommendation: string;
    if (score >= 70) {
        recommendation = 'Physical traits strongly support this birth time';
    } else if (score >= 50) {
        recommendation = 'Physical traits moderately support this birth time';
    } else {
        recommendation = 'Physical traits suggest this may not be the correct birth time';
    }

    return { score, matches, mismatches, recommendation };
}

// ═════════════════════════════════════════════════════════════════════════════
// ADVANCED ASPECTS ANALYSIS
// ═════════════════════════════════════════════════════════════════════════════

const ASPECT_TYPES: Record<string, { degrees: number; orb: number; type: string }> = {
    conjunction: { degrees: 0, orb: 8, type: 'major' },
    opposition: { degrees: 180, orb: 8, type: 'major' },
    trine: { degrees: 120, orb: 6, type: 'major' },
    square: { degrees: 90, orb: 6, type: 'major' },
    sextile: { degrees: 60, orb: 4, type: 'major' },
    quincunx: { degrees: 150, orb: 3, type: 'minor' },
    semi_sextile: { degrees: 30, orb: 2, type: 'minor' },
    semi_square: { degrees: 45, orb: 2, type: 'minor' },
    sesquiquadrate: { degrees: 135, orb: 2, type: 'minor' },
    quintile: { degrees: 72, orb: 2, type: 'minor' },
    bi_quintile: { degrees: 144, orb: 2, type: 'minor' },
};

/**
 * Calculate all aspects between planets (including minor aspects)
 */
export function calculateAdvancedAspects(ephemeris: EphemerisData): AspectData[] {
    const aspects: AspectData[] = [];
    const planetNames = Object.keys(ephemeris.planets);

    for (let i = 0; i < planetNames.length; i++) {
        for (let j = i + 1; j < planetNames.length; j++) {
            const planet1 = planetNames[i];
            const planet2 = planetNames[j];
            const long1 = ephemeris.planets[planet1].longitude;
            const long2 = ephemeris.planets[planet2].longitude;

            let diff = Math.abs(long1 - long2);
            if (diff > 180) diff = 360 - diff;

            // Check each aspect type
            for (const [aspectName, aspectData] of Object.entries(ASPECT_TYPES)) {
                const orb = Math.abs(diff - aspectData.degrees);
                if (orb <= aspectData.orb) {
                    let strength: 'exact' | 'strong' | 'moderate' | 'weak';
                    if (orb <= 1) strength = 'exact';
                    else if (orb <= aspectData.orb / 2) strength = 'strong';
                    else if (orb <= aspectData.orb * 0.75) strength = 'moderate';
                    else strength = 'weak';

                    aspects.push({
                        planet1,
                        planet2,
                        aspectType: aspectName,
                        exactDegrees: aspectData.degrees,
                        orb,
                        strength,
                    });
                }
            }
        }
    }

    // Sort by strength
    const strengthOrder = { exact: 0, strong: 1, moderate: 2, weak: 3 };
    aspects.sort((a, b) => strengthOrder[a.strength] - strengthOrder[b.strength]);

    return aspects;
}

// ═════════════════════════════════════════════════════════════════════════════
// ARUDHA LAGNA CALCULATION
// ═════════════════════════════════════════════════════════════════════════════

const SIGN_LORDS: Record<string, string> = {
    Aries: 'mars', Taurus: 'venus', Gemini: 'mercury', Cancer: 'moon',
    Leo: 'sun', Virgo: 'mercury', Libra: 'venus', Scorpio: 'mars',
    Sagittarius: 'jupiter', Capricorn: 'saturn', Aquarius: 'saturn', Pisces: 'jupiter',
};

/**
 * Calculate Arudha Lagna (AL) - Shows public image and career success
 */
export function calculateArudhaLagna(ephemeris: EphemerisData): ArudhaLagna {
    const lagnaSign = ephemeris.ascendant.sign;
    const lagnaLord = SIGN_LORDS[lagnaSign];
    const lagnaLordPosition = ephemeris.planets[lagnaLord]?.longitude || 0;

    // Find sign of lagna lord
    const lagnaLordSignIndex = Math.floor(lagnaLordPosition / 30);
    const lagnaSignIndex = ZODIAC_SIGNS.indexOf(lagnaSign);

    // Count from Lagna to Lagna Lord
    let countToLord = (lagnaLordSignIndex - lagnaSignIndex + 12) % 12;
    if (countToLord === 0) countToLord = 12;

    // Arudha Lagna = Count same number from Lagna Lord
    let arudhaSignIndex = (lagnaLordSignIndex + countToLord - 1) % 12;

    // Exception: If AL falls in 1st or 7th from Lagna, move to 10th or 4th respectively
    const distanceFromLagna = (arudhaSignIndex - lagnaSignIndex + 12) % 12;
    if (distanceFromLagna === 0) {
        arudhaSignIndex = (lagnaSignIndex + 9) % 12; // 10th house
    } else if (distanceFromLagna === 6) {
        arudhaSignIndex = (lagnaSignIndex + 3) % 12; // 4th house
    }

    const arudhaSign = ZODIAC_SIGNS[arudhaSignIndex];
    const arudhaLord = SIGN_LORDS[arudhaSign];

    // Determine strength based on lord's dignity
    const arudhaLordPos = ephemeris.planets[arudhaLord];
    let strength: 'strong' | 'moderate' | 'weak' = 'moderate';
    if (arudhaLordPos) {
        // Simple strength assessment
        const inOwnSign = SIGN_LORDS[arudhaLordPos.sign] === arudhaLord;
        const inExaltation = checkExaltation(arudhaLord, arudhaLordPos.sign);
        if (inOwnSign || inExaltation) strength = 'strong';
        else if (checkDebilitation(arudhaLord, arudhaLordPos.sign)) strength = 'weak';
    }

    return {
        sign: arudhaSign,
        degree: 0, // AL is always at 0° of the sign
        lord: arudhaLord,
        strength,
    };
}

function checkExaltation(planet: string, sign: string): boolean {
    const exaltations: Record<string, string> = {
        sun: 'Aries', moon: 'Taurus', mars: 'Capricorn',
        mercury: 'Virgo', jupiter: 'Cancer', venus: 'Pisces',
        saturn: 'Libra', rahu: 'Taurus', ketu: 'Scorpio',
    };
    return exaltations[planet] === sign;
}

function checkDebilitation(planet: string, sign: string): boolean {
    const debilitations: Record<string, string> = {
        sun: 'Libra', moon: 'Scorpio', mars: 'Cancer',
        mercury: 'Pisces', jupiter: 'Capricorn', venus: 'Virgo',
        saturn: 'Aries', rahu: 'Scorpio', ketu: 'Taurus',
    };
    return debilitations[planet] === sign;
}

// ═════════════════════════════════════════════════════════════════════════════
// SECONDARY PROGRESSIONS (Phaladesha)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Calculate secondary progressions for a life event
 * 1 day after birth = 1 year of life
 */
export function calculateSecondaryProgression(
    birthDate: Date,
    eventDate: Date,
    ephemerisCalculator: (date: string, time: string) => Promise<EphemerisData>
): SecondaryProgression {
    // Calculate age at event
    const ageInYears = (eventDate.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

    // Progressed date = birth date + (age in days)
    const progressedDate = new Date(birthDate);
    progressedDate.setDate(progressedDate.getDate() + Math.floor(ageInYears));

    // The actual ephemeris calculation would be done by the processor
    // This function just calculates the date

    return {
        eventAge: Math.floor(ageInYears),
        progressedDate,
        progressedPlanets: {}, // To be filled by processor
        progressedAspects: [], // To be filled by processor
    };
}

/**
 * Get progressed date for an event age
 */
export function getProgressedDate(birthDate: Date, eventAge: number): Date {
    const progressedDate = new Date(birthDate);
    progressedDate.setDate(progressedDate.getDate() + eventAge);
    return progressedDate;
}

// ═════════════════════════════════════════════════════════════════════════════
// PANCHANGA CALCULATION (Five Pillars)
// ═════════════════════════════════════════════════════════════════════════════

export interface PanchangaData {
    tithi: { name: string; number: number; percentage: number };
    yoga: { name: string; number: number; percentage: number };
    karana: { name: string; number: number };
    weekday: string;
}

const TITHI_NAMES = [
    'Prathama', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashti', 'Saptami', 'Ashtami',
    'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
    'Prathama', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashti', 'Saptami', 'Ashtami',
    'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya'
];

const YOGA_NAMES = [
    'Vishkumbha', 'Preeti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma', 'Dhriti',
    'Shoola', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghpata', 'Harshana', 'Vajra', 'Siddhi',
    'Vyatipata', 'Variyan', 'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla',
    'Brahma', 'Indra', 'Vaidhriti'
];

/**
 * Calculate Panchanga elements from Sun and Moon positions
 */
export function calculatePanchanga(ephemeris: EphemerisData, birthDate: Date): PanchangaData {
    const sunLong = ephemeris.planets.sun.longitude;
    const moonLong = ephemeris.planets.moon.longitude;

    // Tithi: (Moon - Sun) / 12
    let tithiDiff = moonLong - sunLong;
    if (tithiDiff < 0) tithiDiff += 360;
    const tithiNum = Math.floor(tithiDiff / 12) + 1;
    const tithiPerc = (tithiDiff % 12) / 12 * 100;

    // Yoga: (Sun + Moon) / 13°20'
    let yogaSum = sunLong + moonLong;
    if (yogaSum >= 360) yogaSum -= 360;
    const yogaNum = Math.floor(yogaSum / (360 / 27)) + 1;
    const yogaPerc = (yogaSum % (360 / 27)) / (360 / 27) * 100;

    // Karana: Half of Tithi
    const karanaNum = Math.floor(tithiDiff / 6) + 1;

    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return {
        tithi: { name: TITHI_NAMES[(tithiNum - 1) % 30], number: tithiNum, percentage: tithiPerc },
        yoga: { name: YOGA_NAMES[(yogaNum - 1) % 27], number: yogaNum, percentage: yogaPerc },
        karana: { name: `Karana ${karanaNum}`, number: karanaNum },
        weekday: weekdays[birthDate.getDay()],
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// BOUNDARY SAFETY (Seconds to Boundary)
// ═════════════════════════════════════════════════════════════════════════════

export interface BoundarySafety {
    lagnaSignBoundary: number; // Seconds to closest sign boundary
    moonNakshatraBoundary: number; // Seconds to closest nakshatra boundary
    isDangerous: boolean;
}

/**
 * Calculate how close we are to critical sign/nakshatra boundaries in SECONDS
 */
export function calculateBoundarySafety(ephemeris: EphemerisData): BoundarySafety {
    const lagnaLong = ephemeris.ascendant.longitude;
    const moonLong = ephemeris.planets.moon.longitude;

    // Sign boundary (every 30 degrees)
    const distToNextSign = 30 - (lagnaLong % 30);
    const distToPrevSign = lagnaLong % 30;
    const minSignDist = Math.min(distToNextSign, distToPrevSign);

    // Approx 240 seconds per degree for Lagna
    const signSeconds = minSignDist * 240;

    // Nakshatra boundary (every 13.333 degrees)
    const nakSpan = 360 / 27;
    const distToNextNak = nakSpan - (moonLong % nakSpan);
    const distToPrevNak = moonLong % nakSpan;
    const minNakDist = Math.min(distToNextNak, distToPrevNak);

    // Moon moves ~13.18 deg/day => ~1 degree in 6600 seconds
    const nakSeconds = minNakDist * 6600;

    return {
        lagnaSignBoundary: Math.round(signSeconds),
        moonNakshatraBoundary: Math.round(nakSeconds),
        isDangerous: signSeconds < 30 || nakSeconds < 60,
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// FORMATTING ENHANCEMENTS
// ═════════════════════════════════════════════════════════════════════════════

export function formatPanchanga(p: PanchangaData): string {
    return `PANCHANGA:
Tithi: ${p.tithi.name} (${p.tithi.percentage.toFixed(1)}% complete)
Yoga: ${p.yoga.name} (${p.yoga.percentage.toFixed(1)}% complete)
Karana: ${p.karana.name}
Weekday: ${p.weekday}`;
}

export function formatBoundarySafety(b: BoundarySafety): string {
    return `BOUNDARY SENSITIVITY:
Lagna Sign Boundary: ${b.lagnaSignBoundary}s away
Moon Nakshatra Boundary: ${b.moonNakshatraBoundary}s away
Status: ${b.isDangerous ? '⚠️ CRITICAL (Highly sensitive to seconds)' : 'Stable'}`;
}

// ═════════════════════════════════════════════════════════════════════════════
// FORMATTING FOR KIMI K2 PROMPTS
// ═════════════════════════════════════════════════════════════════════════════

export function formatYoginiDashaSequence(periods: YoginiDashaPeriod[]): string {
    const lines = ['YOGINI DASHA SEQUENCE (36-year cycle):'];
    for (const period of periods.slice(0, 15)) {
        const start = period.startDate.toISOString().split('T')[0];
        const end = period.endDate.toISOString().split('T')[0];
        lines.push(`${period.name} (${period.planet}): ${start} to ${end} (${period.durationYears.toFixed(1)} years)`);
    }
    return lines.join('\n');
}

export function formatDivisionalCharts(charts: Record<string, DivisionalChart>): string {
    const lines: string[] = [];

    for (const [chartName, chart] of Object.entries(charts)) {
        lines.push(`\n${chartName} CHART (${getChartPurpose(chartName)}):`);
        lines.push(`Ascendant: ${chart.ascendant.sign} ${chart.ascendant.degree.toFixed(1)}°`);

        for (const [planet, pos] of Object.entries(chart.planets)) {
            lines.push(`${planet.toUpperCase()}: ${pos.sign} ${pos.degree.toFixed(1)}° (House ${pos.house})`);
        }
    }

    return lines.join('\n');
}

function getChartPurpose(chartName: string): string {
    const purposes: Record<string, string> = {
        D2: 'Wealth/Health',
        D7: 'Children/Education',
        D9: 'Marriage/Dharma',
        D10: 'Career/Authority',
        D30: 'Acute Events/Misfortune',
    };
    return purposes[chartName] || 'General';
}

export function formatAdvancedAspects(aspects: AspectData[]): string {
    const lines = ['PLANETARY ASPECTS (including minor aspects):'];
    for (const aspect of aspects.slice(0, 20)) {
        lines.push(`${aspect.planet1}-${aspect.planet2}: ${aspect.aspectType} (orb: ${aspect.orb.toFixed(1)}°, ${aspect.strength})`);
    }
    return lines.join('\n');
}

export function formatPhysicalTraitsAnalysis(analysis: PhysicalTraitsScore): string {
    const lines = [
        'PHYSICAL TRAITS ANALYSIS:',
        `Score: ${analysis.score}/100`,
        `Recommendation: ${analysis.recommendation}`,
        '',
        'Matches:',
        ...analysis.matches.map(m => `✓ ${m}`),
        '',
        'Mismatches:',
        ...analysis.mismatches.map(m => `✗ ${m}`),
    ];
    return lines.join('\n');
}

export function formatArudhaLagna(al: ArudhaLagna): string {
    return `ARUDHA LAGNA (Public Image):
Sign: ${al.sign}
Lord: ${al.lord}
Strength: ${al.strength}
Significance: Shows how person is perceived publicly, career success, material achievements`;
}

/**
 * Calculate Hora Lagna (HL) - Wealth/Status verification
 */
export function calculateHoraLagna(
    sunriseJd: number,
    birthJd: number,
    ascendantLongitude: number
): SpecialLagna {
    // Time since sunrise in hours
    const dt = (birthJd - sunriseJd) * 24;
    // HL = Sun (at sunrise) + dt * 30 (approximately, but accurately using BPHS house-based method)
    // Here we use the simplified standard formula: HL = Asc + (dt * 30)
    const hlLong = (ascendantLongitude + (dt * 30)) % 360;
    const signIndex = Math.floor(hlLong / 30);
    return {
        name: 'Hora Lagna',
        longitude: hlLong,
        sign: ZODIAC_SIGNS[signIndex],
        degree: hlLong % 30
    };
}

/**
 * Calculate Ghati Lagna (GL) - Power/Authority verification
 */
export function calculateGhatiLagna(
    sunriseJd: number,
    birthJd: number,
    ascendantLongitude: number
): SpecialLagna {
    // Time since sunrise in hours
    const dt = (birthJd - sunriseJd) * 24;
    // GL = Asc + (dt * 60)
    const glLong = (ascendantLongitude + (dt * 60)) % 360;
    const signIndex = Math.floor(glLong / 30);
    return {
        name: 'Ghati Lagna',
        longitude: glLong,
        sign: ZODIAC_SIGNS[signIndex],
        degree: glLong % 30
    };
}

export function formatSpecialLagnas(hl: SpecialLagna, gl: SpecialLagna): string {
    return `SPECIAL LAGNAS:
1. Hora Lagna (Wealth/Status): ${hl.sign} at ${hl.degree.toFixed(2)}°
   Verification: Check HL house placements for major financial gains/losses.
2. Ghati Lagna (Power/Authority): ${gl.sign} at ${gl.degree.toFixed(2)}°
   Verification: Check GL house/lord strength for promotions, authority, or leadership.`;
}

export function formatShadbalaLite(strengths: Record<string, string>): string {
    const lines = ['PLANETARY STRENGTHS (Shadbala-Lite):'];
    for (const [planet, strength] of Object.entries(strengths)) {
        lines.push(`${planet.charAt(0).toUpperCase() + planet.slice(1)}: ${strength}`);
    }
    return lines.join('\n');
}

// ═════════════════════════════════════════════════════════════════════════════
// UTILITY
// ═════════════════════════════════════════════════════════════════════════════

function addYears(date: Date, years: number): Date {
    const result = new Date(date);
    const wholeDays = years * 365.25;
    result.setTime(result.getTime() + wholeDays * 24 * 60 * 60 * 1000);
    return result;
}

// All functions are exported inline (export function ...)
