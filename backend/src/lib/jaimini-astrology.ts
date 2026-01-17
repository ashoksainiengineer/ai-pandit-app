// lib/jaimini-astrology.ts
// Jaimini Astrology System Methods
// Includes: Chara Dasha, Chara Karakas, Jaimini Aspects

import { EphemerisData } from './types';

// ═════════════════════════════════════════════════════════════════════════════
// JAIMINI SYSTEM CONSTANTS
// ═════════════════════════════════════════════════════════════════════════════

const ZODIAC_SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// Chara Karaka (Variable Significator) order based on degree
const KARAKA_NAMES = [
    'Atmakaraka',      // AK - Soul, Self (highest degree)
    'Amatyakaraka',    // AmK - Minister, Career
    'Bhratrikaraka',   // BK - Siblings, Courage
    'Matrikaraka',     // MK - Mother, Mind
    'Putrakaraka',     // PK - Children, Learning
    'Gnatikaraka',     // GK - Enemies, Diseases
    'Darakaraka',      // DK - Spouse (lowest degree)
];

// Used planets for Jaimini (Rahu excluded in classical texts)
const JAIMINI_PLANETS = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];

// ═════════════════════════════════════════════════════════════════════════════
// CHARA KARAKA (Variable Significators)
// ═════════════════════════════════════════════════════════════════════════════

export interface CharaKaraka {
    planet: string;
    karakaName: string;
    degree: number;
    sign: string;
}

/**
 * Calculate Chara Karakas - Variable significators based on planetary degrees
 * This is THE foundation of Jaimini astrology
 */
export function calculateCharaKarakas(ephemeris: EphemerisData): CharaKaraka[] {
    // Get degrees for each planet (only degree within sign matters)
    const planetDegrees = JAIMINI_PLANETS.map(planet => ({
        planet,
        degree: ephemeris.planets[planet].longitude % 30, // Degree within sign
        sign: ephemeris.planets[planet].sign,
        fullLongitude: ephemeris.planets[planet].longitude,
    }));

    // Sort by degree (highest first for AK)
    planetDegrees.sort((a, b) => b.degree - a.degree);

    // Assign karaka names
    return planetDegrees.slice(0, 7).map((p, index) => ({
        planet: p.planet,
        karakaName: KARAKA_NAMES[index],
        degree: p.degree,
        sign: p.sign,
    }));
}

// ═════════════════════════════════════════════════════════════════════════════
// CHARA DASHA (Sign-Based Dasha)
// ═════════════════════════════════════════════════════════════════════════════

export interface CharaDashaPeriod {
    sign: string;
    startDate: Date;
    endDate: Date;
    durationYears: number;
    signNumber: number;
}

/**
 * Calculate Chara Dasha sequence
 * Sign-based dasha system unique to Jaimini
 * 
 * Duration calculation:
 * - Count from sign to its lord (including both)
 * - If lord is in same sign, duration = 12 years
 * - Exception adjustments for certain signs
 */
export function calculateCharaDasha(
    ephemeris: EphemerisData,
    birthDate: Date
): CharaDashaPeriod[] {
    const lagnaSign = ephemeris.ascendant.sign;
    const lagnaIndex = ZODIAC_SIGNS.indexOf(lagnaSign);

    // Determine if starting from Lagna or 7th
    // Odd signs (Aries, Gemini, Leo, etc.) start forward
    // Even signs start from 7th and go backward
    const isOddSign = lagnaIndex % 2 === 0;

    const periods: CharaDashaPeriod[] = [];
    let currentDate = new Date(birthDate);

    for (let i = 0; i < 12; i++) {
        let signIndex: number;
        if (isOddSign) {
            signIndex = (lagnaIndex + i) % 12;
        } else {
            signIndex = (lagnaIndex - i + 12) % 12;
        }

        const sign = ZODIAC_SIGNS[signIndex];
        const duration = calculateCharaDashaDuration(sign, signIndex, ephemeris);
        const endDate = addYears(currentDate, duration);

        periods.push({
            sign,
            startDate: new Date(currentDate),
            endDate,
            durationYears: duration,
            signNumber: signIndex + 1,
        });

        currentDate = endDate;
    }

    return periods;
}

/**
 * Calculate duration for a Chara Dasha period
 */
function calculateCharaDashaDuration(
    sign: string,
    signIndex: number,
    ephemeris: EphemerisData
): number {
    // Sign lords
    const SIGN_LORDS: Record<string, string> = {
        Aries: 'mars', Taurus: 'venus', Gemini: 'mercury', Cancer: 'moon',
        Leo: 'sun', Virgo: 'mercury', Libra: 'venus', Scorpio: 'mars',
        Sagittarius: 'jupiter', Capricorn: 'saturn', Aquarius: 'saturn', Pisces: 'jupiter',
    };

    const lord = SIGN_LORDS[sign];
    const lordPosition = ephemeris.planets[lord].longitude;
    const lordSignIndex = Math.floor(lordPosition / 30);

    // Count from sign to lord's sign
    let count = (lordSignIndex - signIndex + 12) % 12;
    if (count === 0) count = 12; // Same sign = 12 years

    // Adjustment: If lord is in own sign, some traditions use different count
    // Using standard method here

    return count;
}

/**
 * Get Chara Dasha active on a date
 */
export function getCharaDashaForDate(
    periods: CharaDashaPeriod[],
    eventDate: Date
): CharaDashaPeriod | null {
    for (const period of periods) {
        if (eventDate >= period.startDate && eventDate <= period.endDate) {
            return period;
        }
    }
    return null;
}

// ═════════════════════════════════════════════════════════════════════════════
// JAIMINI ASPECTS (Rasi Drishti - Sign-Based Aspects)
// ═════════════════════════════════════════════════════════════════════════════

export interface JaiminiAspect {
    fromSign: string;
    toSign: string;
    aspectingPlanets: string[];
    affectedPlanets: string[];
    aspectType: 'full' | 'special';
}

/**
 * Calculate Jaimini aspects (different from Parashari)
 * 
 * Jaimini Rules:
 * - Movable signs (Aries, Cancer, Libra, Cap) aspect Fixed signs except adjacent
 * - Fixed signs aspect Movable signs except adjacent
 * - Dual signs aspect each other
 */
export function calculateJaiminiAspects(ephemeris: EphemerisData): JaiminiAspect[] {
    const aspects: JaiminiAspect[] = [];

    // Group signs by modality
    const movable = [0, 3, 6, 9]; // Aries, Cancer, Libra, Capricorn
    const fixed = [1, 4, 7, 10];  // Taurus, Leo, Scorpio, Aquarius
    const dual = [2, 5, 8, 11];   // Gemini, Virgo, Sagittarius, Pisces

    // Get planets in each sign
    const signPlanets: Record<number, string[]> = {};
    for (let i = 0; i < 12; i++) signPlanets[i] = [];

    for (const [planet, data] of Object.entries(ephemeris.planets)) {
        const signIndex = Math.floor(data.longitude / 30);
        signPlanets[signIndex].push(planet);
    }

    // Movable aspects Fixed (except adjacent)
    for (const m of movable) {
        for (const f of fixed) {
            if (Math.abs(m - f) !== 1 && Math.abs(m - f) !== 11) {
                if (signPlanets[m].length > 0 || signPlanets[f].length > 0) {
                    aspects.push({
                        fromSign: ZODIAC_SIGNS[m],
                        toSign: ZODIAC_SIGNS[f],
                        aspectingPlanets: signPlanets[m],
                        affectedPlanets: signPlanets[f],
                        aspectType: 'full',
                    });
                }
            }
        }
    }

    // Fixed aspects Movable (except adjacent)
    for (const f of fixed) {
        for (const m of movable) {
            if (Math.abs(m - f) !== 1 && Math.abs(m - f) !== 11) {
                if (signPlanets[f].length > 0 || signPlanets[m].length > 0) {
                    aspects.push({
                        fromSign: ZODIAC_SIGNS[f],
                        toSign: ZODIAC_SIGNS[m],
                        aspectingPlanets: signPlanets[f],
                        affectedPlanets: signPlanets[m],
                        aspectType: 'full',
                    });
                }
            }
        }
    }

    // Dual signs aspect each other
    for (let i = 0; i < dual.length; i++) {
        for (let j = i + 1; j < dual.length; j++) {
            const d1 = dual[i], d2 = dual[j];
            if (signPlanets[d1].length > 0 || signPlanets[d2].length > 0) {
                aspects.push({
                    fromSign: ZODIAC_SIGNS[d1],
                    toSign: ZODIAC_SIGNS[d2],
                    aspectingPlanets: signPlanets[d1],
                    affectedPlanets: signPlanets[d2],
                    aspectType: 'full',
                });
            }
        }
    }

    return aspects;
}

// ═════════════════════════════════════════════════════════════════════════════
// RASI DASHA (Sign-Based Progression)
// ═════════════════════════════════════════════════════════════════════════════

export interface RasiDashaPeriod {
    sign: string;
    startDate: Date;
    endDate: Date;
    durationYears: number;
}

/**
 * Calculate Rasi Dasha (simple sign-based progression)
 * Each sign gets a fixed 9-year period
 * Starting from Lagna
 */
export function calculateRasiDasha(
    ephemeris: EphemerisData,
    birthDate: Date
): RasiDashaPeriod[] {
    const lagnaSign = ephemeris.ascendant.sign;
    const lagnaIndex = ZODIAC_SIGNS.indexOf(lagnaSign);

    const periods: RasiDashaPeriod[] = [];
    let currentDate = new Date(birthDate);
    const YEARS_PER_SIGN = 9; // Standard Rasi Dasha uses 9 years

    for (let i = 0; i < 12; i++) {
        const signIndex = (lagnaIndex + i) % 12;
        const sign = ZODIAC_SIGNS[signIndex];
        const endDate = addYears(currentDate, YEARS_PER_SIGN);

        periods.push({
            sign,
            startDate: new Date(currentDate),
            endDate,
            durationYears: YEARS_PER_SIGN,
        });

        currentDate = endDate;
    }

    return periods;
}

// ═════════════════════════════════════════════════════════════════════════════
// TATWA DASHA (Elemental Dasha)
// ═════════════════════════════════════════════════════════════════════════════

export interface TatwaDashaPeriod {
    tatwa: string;
    element: string;
    planet: string;
    startDate: Date;
    endDate: Date;
    durationYears: number;
}

// Tatwa sequence (5 elements × various periods = 60 year cycle)
const TATWA_SEQUENCE = [
    { tatwa: 'Prithvi', element: 'Earth', planet: 'Mercury', years: 12 },
    { tatwa: 'Jala', element: 'Water', planet: 'Venus', years: 12 },
    { tatwa: 'Agni', element: 'Fire', planet: 'Mars', years: 12 },
    { tatwa: 'Vayu', element: 'Air', planet: 'Saturn', years: 12 },
    { tatwa: 'Akasha', element: 'Ether', planet: 'Jupiter', years: 12 },
];

/**
 * Calculate Tatwa Dasha (Element-based periods)
 * 60-year cycle based on 5 elements
 * Useful for health and body-related events
 */
export function calculateTatwaDasha(
    moonLongitude: number,
    birthDate: Date
): TatwaDashaPeriod[] {
    // Starting Tatwa based on Moon's nakshatra
    const NAKSHATRA_SPAN = 360 / 27;
    const nakshatraIndex = Math.floor(moonLongitude / NAKSHATRA_SPAN);
    const startingTatwaIndex = nakshatraIndex % 5;

    const periods: TatwaDashaPeriod[] = [];
    let currentDate = new Date(birthDate);
    let tatwaIndex = startingTatwaIndex;

    // 2 cycles for 120+ years coverage
    for (let cycle = 0; cycle < 2; cycle++) {
        for (let i = 0; i < 5; i++) {
            const tatwa = TATWA_SEQUENCE[tatwaIndex];
            const endDate = addYears(currentDate, tatwa.years);

            periods.push({
                tatwa: tatwa.tatwa,
                element: tatwa.element,
                planet: tatwa.planet,
                startDate: new Date(currentDate),
                endDate,
                durationYears: tatwa.years,
            });

            currentDate = endDate;
            tatwaIndex = (tatwaIndex + 1) % 5;
        }
    }

    return periods;
}

/**
 * Get Tatwa Dasha for a date
 */
export function getTatwaForDate(
    periods: TatwaDashaPeriod[],
    eventDate: Date
): TatwaDashaPeriod | null {
    for (const period of periods) {
        if (eventDate >= period.startDate && eventDate <= period.endDate) {
            return period;
        }
    }
    return null;
}

// ═════════════════════════════════════════════════════════════════════════════
// TITHI PRAVESHA (Solar Return / Annual Chart)  
// ═════════════════════════════════════════════════════════════════════════════

export interface TithiPraveshaData {
    year: number;
    solarReturnDate: Date;
    age: number;
    themes: string[];
}

/**
 * Calculate Solar Return dates for each year of life
 * Shows annual themes and important periods
 */
export function calculateTithiPravesha(
    sunLongitude: number,
    birthDate: Date,
    yearsToCalculate: number = 100
): TithiPraveshaData[] {
    const returns: TithiPraveshaData[] = [];
    const birthYear = birthDate.getFullYear();

    for (let i = 0; i <= yearsToCalculate; i++) {
        // Solar return occurs when Sun returns to birth position
        // Approximate: birth date + i years (more precise would require ephemeris)
        const returnDate = new Date(birthDate);
        returnDate.setFullYear(birthYear + i);

        // Generate themes based on age (simplified - actual themes from chart)
        const themes = getAnnualThemes(i);

        returns.push({
            year: birthYear + i,
            solarReturnDate: returnDate,
            age: i,
            themes,
        });
    }

    return returns;
}

/**
 * Get general themes for an age (based on planetary periods)
 */
function getAnnualThemes(age: number): string[] {
    const themes: string[] = [];

    // Saturn cycle themes
    if (age >= 28 && age <= 30) themes.push('Saturn Return - Major life restructuring');
    if (age >= 56 && age <= 60) themes.push('Second Saturn Return - Wisdom phase');

    // Jupiter cycle themes
    if (age % 12 === 0) themes.push('Jupiter Return - Expansion and growth');

    // Key age themes
    if (age === 18 || age === 19) themes.push('Rahu maturation - Breaking from tradition');
    if (age === 36) themes.push('Double Jupiter Return - Career peak');
    if (age === 42) themes.push('Uranus opposition - Midlife evaluation');
    if (age === 48) themes.push('Chiron Return - Healing old wounds');

    if (themes.length === 0) themes.push('Standard year');

    return themes;
}

/**
 * Get Tithi Pravesha for a specific year
 */
export function getTithiPraveshaForYear(
    returns: TithiPraveshaData[],
    year: number
): TithiPraveshaData | null {
    return returns.find(r => r.year === year) || null;
}

// ═════════════════════════════════════════════════════════════════════════════
// FORMATTING FOR KIMI K2 PROMPTS
// ═════════════════════════════════════════════════════════════════════════════

export function formatCharaKarakas(karakas: CharaKaraka[]): string {
    const lines = ['CHARA KARAKAS (Jaimini Significators):'];
    for (const k of karakas) {
        lines.push(`${k.karakaName} (${k.planet.toUpperCase()}): ${k.sign} ${k.degree.toFixed(1)}°`);
    }
    return lines.join('\n');
}

export function formatCharaDasha(periods: CharaDashaPeriod[]): string {
    const lines = ['CHARA DASHA (Jaimini Sign-Based Periods):'];
    for (const p of periods.slice(0, 12)) {
        const start = p.startDate.toISOString().split('T')[0];
        const end = p.endDate.toISOString().split('T')[0];
        lines.push(`${p.sign}: ${start} to ${end} (${p.durationYears} years)`);
    }
    return lines.join('\n');
}

export function formatRasiDasha(periods: RasiDashaPeriod[]): string {
    const lines = ['RASI DASHA (Sign Progression - 9 years each):'];
    for (const p of periods.slice(0, 12)) {
        const start = p.startDate.toISOString().split('T')[0];
        const end = p.endDate.toISOString().split('T')[0];
        lines.push(`${p.sign}: ${start} to ${end}`);
    }
    return lines.join('\n');
}

export function formatTatwaDasha(periods: TatwaDashaPeriod[]): string {
    const lines = ['TATWA DASHA (Elemental Periods - Health/Body):'];
    for (const p of periods.slice(0, 10)) {
        const start = p.startDate.toISOString().split('T')[0];
        const end = p.endDate.toISOString().split('T')[0];
        lines.push(`${p.tatwa} (${p.element}/${p.planet}): ${start} to ${end} (${p.durationYears} years)`);
    }
    return lines.join('\n');
}

export function formatJaiminiAspects(aspects: JaiminiAspect[]): string {
    const lines = ['JAIMINI (RASI) ASPECTS:'];
    for (const a of aspects.slice(0, 15)) {
        lines.push(`${a.fromSign} → ${a.toSign}: ${a.aspectingPlanets.join(', ') || 'none'} aspecting ${a.affectedPlanets.join(', ') || 'none'}`);
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

// ═════════════════════════════════════════════════════════════════════════════
// DASHA-EVENT CORRELATIONS FOR ALL SYSTEMS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Check if Chara Dasha sign supports an event
 */
export function charaDashaSupportsEvent(
    dasha: CharaDashaPeriod,
    eventCategory: string,
    ephemeris: EphemerisData
): { supports: boolean; reason: string; strength: number } {
    const category = eventCategory.toLowerCase();

    // Get planets in this sign
    const planetsInSign: string[] = [];
    for (const [planet, data] of Object.entries(ephemeris.planets)) {
        if (data.sign === dasha.sign) {
            planetsInSign.push(planet);
        }
    }

    // Check which houses the sign represents
    const lagnaIndex = ZODIAC_SIGNS.indexOf(ephemeris.ascendant.sign);
    const signIndex = ZODIAC_SIGNS.indexOf(dasha.sign);
    const houseNumber = ((signIndex - lagnaIndex + 12) % 12) + 1;

    let supports = false;
    let strength = 0;
    const reasons: string[] = [];

    // House-based event correlation
    const houseEvents: Record<number, string[]> = {
        1: ['self', 'health', 'personality'],
        2: ['wealth', 'family', 'speech'],
        3: ['siblings', 'courage', 'travel'],
        4: ['mother', 'home', 'education', 'property'],
        5: ['children', 'romance', 'creativity'],
        6: ['health', 'enemies', 'service'],
        7: ['marriage', 'partnership', 'spouse'],
        8: ['death', 'transformation', 'accidents'],
        9: ['father', 'luck', 'higher_education', 'travel'],
        10: ['career', 'status', 'recognition'],
        11: ['gains', 'friends', 'income'],
        12: ['loss', 'expenses', 'foreign', 'spiritual'],
    };

    const houseEventsForSign = houseEvents[houseNumber] || [];
    for (const event of houseEventsForSign) {
        if (category.includes(event)) {
            supports = true;
            strength += 50;
            reasons.push(`Chara Dasha of ${dasha.sign} (${houseNumber}th house) supports ${event}`);
            break;
        }
    }

    // Bonus for planets in sign
    if (planetsInSign.length > 0) {
        strength += planetsInSign.length * 10;
        reasons.push(`Planets in sign: ${planetsInSign.join(', ')}`);
    }

    return {
        supports,
        strength: Math.min(100, strength),
        reason: reasons.join('. ') || 'No direct correlation',
    };
}

// All functions are exported inline (export function ...)
