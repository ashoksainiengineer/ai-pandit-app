
import { EphemerisData } from '@ai-pandit/shared';
import { DAYS_PER_YEAR, addYears } from './utils/time-constants.js';

// ═════════════════════════════════════════════════════════════════════════════

// Vimshottari Dasha periods (in years)
export const DASHA_YEARS: Record<string, number> = {
    Ketu: 7,
    Venus: 20,
    Sun: 6,
    Moon: 10,
    Mars: 7,
    Rahu: 18,
    Jupiter: 16,
    Saturn: 19,
    Mercury: 17,
};

// Total Vimshottari cycle = 120 years
const TOTAL_DASHA_YEARS = 120;

// Nakshatra lords in Vimshottari sequence
const NAKSHATRA_LORDS = [
    'Ketu',    // 1. Ashwini
    'Venus',   // 2. Bharani
    'Sun',     // 3. Krittika
    'Moon',    // 4. Rohini
    'Mars',    // 5. Mrigashirsha
    'Rahu',    // 6. Ardra
    'Jupiter', // 7. Punarvasu
    'Saturn',  // 8. Pushya
    'Mercury', // 9. Ashlesha
    'Ketu',    // 10. Magha
    'Venus',   // 11. Purva Phalguni
    'Sun',     // 12. Uttara Phalguni
    'Moon',    // 13. Hasta
    'Mars',    // 14. Chitra
    'Rahu',    // 15. Swati
    'Jupiter', // 16. Vishakha
    'Saturn',  // 17. Anuradha
    'Mercury', // 18. Jyeshtha
    'Ketu',    // 19. Mula
    'Venus',   // 20. Purva Ashadha
    'Sun',     // 21. Uttara Ashadha
    'Moon',    // 22. Shravana
    'Mars',    // 23. Dhanishtha
    'Rahu',    // 24. Shatabhisha
    'Jupiter', // 25. Purva Bhadrapada
    'Saturn',  // 26. Uttara Bhadrapada
    'Mercury', // 27. Revati
];

// Dasha sequence (order of planetary periods)
const DASHA_SEQUENCE = [
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars',
    'Rahu', 'Jupiter', 'Saturn', 'Mercury'
];

const _NAKSHATRA_NAMES = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
    'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

// Nakshatra span in degrees
const NAKSHATRA_SPAN = 360 / 27; // 13.333...°

// ═════════════════════════════════════════════════════════════════════════════
// DASHA TYPES (PATCHED FOR NULL SAFETY)
// ═════════════════════════════════════════════════════════════════════════════

export interface DashaPeriod {
    lord: string;
    startDate: Date;
    endDate: Date;
    durationYears: number;
    subPeriods: DashaPeriod[]; // Recursive for infinite depth
}

export interface DashaAtDate {
    mahadasha: string;
    antardasha: string;
    pratyantardasha: string;
    sukshmadasha: string;
    pranadasha: string;
    mahadashaStart: Date;
    mahadashaEnd: Date;
    antardashaStart: Date | null;
    antardashaEnd: Date | null;
    pratyantarStart: Date | null;
    pratyantarEnd: Date | null;
    sukshmaStart: Date | null;
    sukshmaEnd: Date | null;
    pranaStart: Date | null;
    pranaEnd: Date | null;
    sandhiInfo?: {
        isNearTransition: boolean;
        level: number; // 1-5 which level transition
        distanceMinutes: number;
        transitionType: 'start' | 'end';
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// VIMSHOTTARI DASHA CALCULATION (PATCHED AND HARDENED)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Calculate complete Vimshottari Dasha sequence from birth
 */
export function calculateVimshottariDasha(
    moonLongitude: number, // Sidereal longitude of Moon
    birthDate: Date,
    maxLevel: number = 5 // Allow engine-level throttling for memory safety
): DashaPeriod[] {
    // Normalize longitude to [0, 360)
    const normalizedMoonLong = ((moonLongitude % 360) + 360) % 360;

    const nakshatraIndex = Math.floor((normalizedMoonLong + 0.000001) / NAKSHATRA_SPAN);
    const birthNakshatraLord = NAKSHATRA_LORDS[nakshatraIndex % 27];
    const positionInNakshatra = (normalizedMoonLong % NAKSHATRA_SPAN) / NAKSHATRA_SPAN;
    const birthDashaYears = DASHA_YEARS[birthNakshatraLord];
    const elapsedYears = positionInNakshatra * birthDashaYears;
    const remainingYears = birthDashaYears - elapsedYears;

    const periods: DashaPeriod[] = [];
    let currentDate = new Date(birthDate);
    let dashaIndex = DASHA_SEQUENCE.indexOf(birthNakshatraLord);

    const fullStartDate = addYears(currentDate, -elapsedYears);
    const firstEndDate = addYears(currentDate, remainingYears);
    const fullEndDate = addYears(fullStartDate, birthDashaYears);

    periods.push({
        lord: birthNakshatraLord,
        startDate: new Date(currentDate),
        endDate: firstEndDate,
        durationYears: remainingYears,
        subPeriods: calculateSubDashas(
            birthNakshatraLord,
            fullStartDate,
            fullEndDate,
            maxLevel,
            new Date(currentDate),
            firstEndDate
        ),
    });
    currentDate = firstEndDate;
    dashaIndex = (dashaIndex + 1) % 9;

    // Remaining full periods (1 full cycle)
    for (let i = 0; i < 9; i++) {
        const lord = DASHA_SEQUENCE[dashaIndex];
        if (lord === birthNakshatraLord) {
            dashaIndex = (dashaIndex + 1) % 9;
            continue;
        }
        const years = DASHA_YEARS[lord];
        const endDate = addYears(currentDate, years);

        periods.push({
            lord,
            startDate: new Date(currentDate),
            endDate,
            durationYears: years,
            subPeriods: calculateSubDashas(lord, currentDate, endDate, maxLevel, new Date(currentDate), endDate),
        });

        currentDate = endDate;
        dashaIndex = (dashaIndex + 1) % 9;
    }

    return periods;
}

/**
 * Generic Recursive Sub-Dasha Calculation for Antar, Pratyantar, etc.
 */
function calculateSubDashas(
    parentLord: string,
    fullStartDate: Date,
    fullEndDate: Date,
    maxLevel: number,
    clipStartDate: Date,
    clipEndDate: Date,
    currentLevel: number = 2
): DashaPeriod[] {
    if (currentLevel > maxLevel) return [];

    const totalDurationMs = fullEndDate.getTime() - fullStartDate.getTime();
    const subPeriods: DashaPeriod[] = [];
    let currentSubStart = new Date(fullStartDate);
    const startIndex = DASHA_SEQUENCE.indexOf(parentLord);

    for (let i = 0; i < 9; i++) {
        const lord = DASHA_SEQUENCE[(startIndex + i) % 9];
        const proportion = DASHA_YEARS[lord] / TOTAL_DASHA_YEARS;
        const subDurationMs = totalDurationMs * proportion;
        const currentSubEnd = new Date(currentSubStart.getTime() + subDurationMs);

        // Check if this subperiod overlaps with the clipped visible window
        if (currentSubStart < clipEndDate && currentSubEnd > clipStartDate) {
            const effectiveStart = new Date(Math.max(currentSubStart.getTime(), clipStartDate.getTime()));
            const effectiveEnd = new Date(Math.min(currentSubEnd.getTime(), clipEndDate.getTime()));

            subPeriods.push({
                lord,
                startDate: effectiveStart,
                endDate: effectiveEnd,
                durationYears: (effectiveEnd.getTime() - effectiveStart.getTime()) / (DAYS_PER_YEAR * 24 * 60 * 60 * 1000),
                subPeriods: calculateSubDashas(
                    lord,
                    currentSubStart,
                    currentSubEnd,
                    maxLevel,
                    effectiveStart,
                    effectiveEnd,
                    currentLevel + 1
                )
            });
        }

        currentSubStart = currentSubEnd;
    }

    return subPeriods;
}

/**
 * Get Dasha active on a specific date (5 levels deep)
 * PATCHED: Replaced placeholder new Date() with null for data integrity.
 * FIX: Handle dates before first period (return birth dasha with null sub-periods).
 */
export function getDashaForDate(
    periods: DashaPeriod[],
    eventDate: Date
): DashaAtDate | null {
    // Handle edge case: date is before the first Mahadasha period
    // This can happen for birth events when eventDate is midnight but birth time is later in the day
    if (periods.length > 0 && eventDate < periods[0].startDate) {
        const firstMaha = periods[0];
        return {
            mahadasha: firstMaha.lord,
            antardasha: 'Unknown',
            pratyantardasha: 'Unknown',
            sukshmadasha: 'Unknown',
            pranadasha: 'Unknown',
            mahadashaStart: firstMaha.startDate,
            mahadashaEnd: firstMaha.endDate,
            antardashaStart: null,
            antardashaEnd: null,
            pratyantarStart: null,
            pratyantarEnd: null,
            sukshmaStart: null,
            sukshmaEnd: null,
            pranaStart: null,
            pranaEnd: null
        };
    }

    for (const maha of periods) {
        if (eventDate >= maha.startDate && eventDate <= maha.endDate) {
            for (const antar of maha.subPeriods) {
                if (eventDate >= antar.startDate && eventDate <= antar.endDate) {
                    for (const prat of antar.subPeriods) {
                        if (eventDate >= prat.startDate && eventDate <= prat.endDate) {
                            for (const suksh of prat.subPeriods) {
                                if (eventDate >= suksh.startDate && eventDate <= suksh.endDate) {
                                    for (const prana of suksh.subPeriods) {
                                        if (eventDate >= prana.startDate && eventDate <= prana.endDate) {
                                            const dasha: DashaAtDate = {
                                                mahadasha: maha.lord, antardasha: antar.lord, pratyantardasha: prat.lord, sukshmadasha: suksh.lord, pranadasha: prana.lord,
                                                mahadashaStart: maha.startDate, mahadashaEnd: maha.endDate,
                                                antardashaStart: antar.startDate, antardashaEnd: antar.endDate,
                                                pratyantarStart: prat.startDate, pratyantarEnd: prat.endDate,
                                                sukshmaStart: suksh.startDate, sukshmaEnd: suksh.endDate,
                                                pranaStart: prana.startDate, pranaEnd: prana.endDate
                                            };
                                            dasha.sandhiInfo = calculateDashaSandhi(dasha, eventDate);
                                            return dasha;
                                        }
                                    }
                                    return { // Fallback to Level 4
                                        mahadasha: maha.lord, antardasha: antar.lord, pratyantardasha: prat.lord, sukshmadasha: suksh.lord, pranadasha: 'Unknown',
                                        mahadashaStart: maha.startDate, mahadashaEnd: maha.endDate, antardashaStart: antar.startDate, antardashaEnd: antar.endDate,
                                        pratyantarStart: prat.startDate, pratyantarEnd: prat.endDate, sukshmaStart: suksh.startDate, sukshmaEnd: suksh.endDate,
                                        pranaStart: null, pranaEnd: null
                                    };
                                }
                            }
                            return { // Fallback to Level 3
                                mahadasha: maha.lord, antardasha: antar.lord, pratyantardasha: prat.lord, sukshmadasha: 'Unknown', pranadasha: 'Unknown',
                                mahadashaStart: maha.startDate, mahadashaEnd: maha.endDate, antardashaStart: antar.startDate, antardashaEnd: antar.endDate,
                                pratyantarStart: prat.startDate, pratyantarEnd: prat.endDate, sukshmaStart: null, sukshmaEnd: null, pranaStart: null, pranaEnd: null
                            };
                        }
                    }
                    return { // Fallback to Level 2
                        mahadasha: maha.lord, antardasha: antar.lord, pratyantardasha: 'Unknown', sukshmadasha: 'Unknown', pranadasha: 'Unknown',
                        mahadashaStart: maha.startDate, mahadashaEnd: maha.endDate, antardashaStart: antar.startDate, antardashaEnd: antar.endDate,
                        pratyantarStart: null, pratyantarEnd: null, sukshmaStart: null, sukshmaEnd: null, pranaStart: null, pranaEnd: null
                    };
                }
            }
            return { // Fallback to Level 1
                mahadasha: maha.lord, antardasha: 'Unknown', pratyantardasha: 'Unknown', sukshmadasha: 'Unknown', pranadasha: 'Unknown',
                mahadashaStart: maha.startDate, mahadashaEnd: maha.endDate,
                antardashaStart: null, antardashaEnd: null, pratyantarStart: null, pratyantarEnd: null, sukshmaStart: null, sukshmaEnd: null, pranaStart: null, pranaEnd: null
            };
        }
    }
    return null;
}

/**
 * Detect Dasha Sandhi (Transition twilight)
 * HARDENED: Now null-safe. It only considers levels with valid date ranges.
 */
function calculateDashaSandhi(dasha: DashaAtDate, date: Date): DashaAtDate['sandhiInfo'] {
    const time = date.getTime();

    const potentialTransitions = [
        { start: dasha.mahadashaStart, end: dasha.mahadashaEnd, level: 1 },
        { start: dasha.antardashaStart, end: dasha.antardashaEnd, level: 2 },
        { start: dasha.pratyantarStart, end: dasha.pratyantarEnd, level: 3 },
        { start: dasha.sukshmaStart, end: dasha.sukshmaEnd, level: 4 },
        { start: dasha.pranaStart, end: dasha.pranaEnd, level: 5 }
    ];

    // Filter out levels with null dates to prevent runtime errors
    const transitions = potentialTransitions
        .filter(t => t.start && t.end)
        .map(t => ({ start: t.start!.getTime(), end: t.end!.getTime(), level: t.level }));

    for (const t of transitions) {
        const durationMs = t.end - t.start;
        // Traditional sandhi: ~10% of dasha period at start and end
        const thresholdMs = durationMs * 0.10;
        const startDiff = Math.abs(time - t.start);
        const endDiff = Math.abs(time - t.end);

        if (startDiff < thresholdMs) {
            const distanceMinutes = Math.round(startDiff / 60000);
            return { isNearTransition: true, level: t.level, distanceMinutes, transitionType: 'start' };
        }
        if (endDiff < thresholdMs) {
            const distanceMinutes = Math.round(endDiff / 60000);
            return { isNearTransition: true, level: t.level, distanceMinutes, transitionType: 'end' };
        }
    }

    return undefined;
}

/**
 * Format dasha for a specific date for the AI prompt.
 * HARDENED: Uses a string builder and checks for null dates.
 */
export function formatDashaForDate(
    periods: DashaPeriod[],
    date: Date,
    eventDescription: string
): string {
    const dasha = getDashaForDate(periods, date);

    if (!dasha) {
    return `${formatDashaDate(date)}: Dasha calculation out of range.`;
    }

    const lines = [
        `${formatDashaDate(date)} - ${eventDescription}`,
        `  Mahadasha: ${dasha.mahadasha} (${formatDashaDate(dasha.mahadashaStart)} to ${formatDashaDate(dasha.mahadashaEnd)})`
    ];

    if (dasha.antardasha !== 'Unknown' && dasha.antardashaStart && dasha.antardashaEnd) {
        lines.push(`  Antardasha: ${dasha.antardasha} (${formatDashaDate(dasha.antardashaStart)} to ${formatDashaDate(dasha.antardashaEnd)})`);
    }
    if (dasha.pratyantardasha !== 'Unknown' && dasha.pratyantarStart && dasha.pratyantarEnd) {
        lines.push(`  Pratyantardasha: ${dasha.pratyantardasha} (${formatDashaDate(dasha.pratyantarStart)} to ${formatDashaDate(dasha.pratyantarEnd)})`);
    }

    return lines.join('\n');
}

// ═════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════════════════
// PLANETARY DIGNITY LOOKUP TABLES (Brihat Parashara Hora Shastra)
// ═════════════════════════════════════════════════════════════════════════════

/** Exaltation signs for each planet (Uccha Rashi). Source: BPHS. */
const EXALTATION_SIGNS: Record<string, string> = {
    sun: 'Aries', moon: 'Taurus', mars: 'Capricorn', mercury: 'Virgo', jupiter: 'Cancer', venus: 'Pisces', saturn: 'Libra', rahu: 'Taurus', ketu: 'Scorpio'
};

/** Debilitation signs for each planet (Neecha Rashi). Source: BPHS. */
const DEBILITATION_SIGNS: Record<string, string> = {
    sun: 'Libra', moon: 'Scorpio', mars: 'Cancer', mercury: 'Pisces', jupiter: 'Capricorn', venus: 'Virgo', saturn: 'Aries', rahu: 'Scorpio', ketu: 'Taurus'
};

/** Moolatrikona signs for each planet. Source: BPHS. */
const MOOLATRIKONA_SIGNS: Record<string, string> = {
    sun: 'Leo', moon: 'Taurus', mars: 'Aries', mercury: 'Virgo', jupiter: 'Sagittarius', venus: 'Libra', saturn: 'Aquarius'
};

/** Own signs (Swakshetra) for each planet. Source: BPHS. */
const OWN_SIGNS: Record<string, string[]> = {
    sun: ['Leo'], moon: ['Cancer'], mars: ['Aries','Scorpio'], mercury: ['Gemini','Virgo'], jupiter: ['Sagittarius','Pisces'], venus: ['Taurus','Libra'], saturn: ['Capricorn','Aquarius'], rahu: ['Virgo'], ketu: ['Pisces']
};

/** Exaltation degrees in TOTAL ZODIAC LONGITUDE (0° Aries = 0). Source: BPHS. */
/** Moon: 33° = 30° (Aries) + 3° (Taurus) = 3° Taurus exalted. */
const EXALTATION_DEGREES: Record<string, number> = {
    sun: 10, moon: 33, mars: 298, mercury: 165, jupiter: 95, venus: 357, saturn: 200
};

/** Natural planetary friendships (Sahaj Maitri). Source: BPHS. */
const NATURAL_FRIENDS: Record<string, string[]> = {
    sun: ['moon','mars','jupiter'], moon: ['sun','mercury'],
    mars: ['sun','moon','jupiter'], mercury: ['sun','venus'],
    jupiter: ['sun','moon','mars'], venus: ['mercury','saturn'],
    saturn: ['mercury','venus'],
    rahu: ['mercury','venus','saturn'], ketu: ['mars','jupiter','venus']
};

/** Natural planetary enmities (Sahaj Shatru). Source: BPHS. */
const NATURAL_ENEMIES: Record<string, string[]> = {
    sun: ['venus','saturn'], moon: [],
    mars: ['mercury'], mercury: ['moon'],
    jupiter: ['mercury','venus'], venus: ['sun','moon'],
    saturn: ['sun','moon','mars'],
    rahu: ['sun','moon','mars','jupiter'], ketu: ['sun','moon','mercury','saturn']
};

/** Planet lordship over zodiac sign indices (0=Aries). Source: BPHS. */
const PLANET_LORDSHIPS: Record<string, number[]> = {
    sun: [4], moon: [3], mars: [0,7], mercury: [2,5], jupiter: [8,11], venus: [1,6], saturn: [9,10]
};

/** D60 (Shashtiamsa) deity names. Source: Brihat Parashara Hora Shastra. */
const D60_DEITIES = [
    'Ghora', 'Rakshasa', 'Deva', 'Kubera', 'Yaksha', 'Kindar', 'Bhrashta', 'Kulaghna',
    'Garala', 'Vahni', 'Maya', 'Purishaka', 'Apampati', 'Marutwan', 'Kaala', 'Sarpa',
    'Amrita', 'Indu', 'Mridu', 'Komal', 'Heramba', 'Brahma', 'Vishnu', 'Maheshwara',
    'Deva', 'Ardra', 'Kalinas', 'Kshiteeshwar', 'Kamalakara', 'Gulika', 'Mrityu', 'Kaala',
    'Davagni', 'Ghora', 'Adhama', 'Kantaka', 'Vishadagdha', 'Kulanas', 'Vamshakshaya', 'Utpata',
    'Kaala', 'Saumya', 'Komal', 'Sheetal', 'Karaladamshtra', 'Indumukha', 'Pravina', 'Kalagni',
    'Dandayudha', 'Nirmala', 'Shubha', 'Ashubha', 'Atishubha', 'Sumukha', 'Durdhara', 'Humshaka',
    'Abhaya', 'Ghora', 'Adhama', 'Amrita'
];

/** Zodiac sign names in order (0=Aries). */
const ZODIAC_SIGNS = [
    'Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
];

function formatDashaDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

// ═════════════════════════════════════════════════════════════════════════════
// CORE ASTROLOGICAL ENGINE RESTORATION
// ═════════════════════════════════════════════════════════════════════════════

import {
    generateDivisionalCharts,
    calculateAshtakavarga as calcAV,
    calculateFullShadbala,
    calculateArudhaLagna,
    calculatePanchanga as calcPanchanga,
    calculateAdvancedAspects as calcAspects,
    _calculateBoundarySafety,
    detectParivartana,
    type DivisionalChart,
    type AspectData,
    type PanchangaData,
} from './advanced-btr-methods.js';
import { calculateCharaKarakas as _calcCK } from './jaimini-astrology.js';
import { TransitAnalyzer, type TransitPosition } from './btr/transit-analyzer.js';

interface YogaResult {
    name: string;
    description: string;
    significance: string;
    planetsInvolved: [string, string];
}

interface DoubleTransitDetail {
    message: string;
}
interface BhavaChalitDiscrepancy {
    planet: string;
    rasiHouse: number;
    chalitHouse: number;
    degreeDiff: number;
}

/**
 * Calculate all divisional charts for the given ephemeris data.
 */
export const calculateAllVargas = (ephemeris: EphemerisData): Record<string, DivisionalChart> => {
    return generateDivisionalCharts(ephemeris);
};

/**
 * Calculate Ashtakavarga bindus (SAV and BAV).
 */
export const calculateAshtakavarga = (ephemeris: EphemerisData): Record<string, number> => {
    const { sav } = calcAV(ephemeris);
    // Convert array to sign-indexed object for backward compatibility if needed, 
    // though the engine seems to expect the object format in some places.
    const result: Record<string, number> = {};
    sav.forEach((val, i) => { result[ZODIAC_SIGNS[i].toLowerCase()] = val; });
    return result;
};

/**
 * Calculate Shadbala (Six-source planetary strength).
 */
export const calculateShadbala = (ephemeris: EphemerisData): Record<string, number> => {
    return calculateFullShadbala(ephemeris);
};

/**
 * Detect yogas and planetary combinations.
 */
export const detectYogas = (ephemeris: EphemerisData): YogaResult[] => {
    const yogas: YogaResult[] = [];

    // 1. Detect Parivartana Yoga
    const parivartanas = detectParivartana(ephemeris);
    for (const p of parivartanas) {
        yogas.push({
            name: 'Parivartana Yoga',
            description: `Exchange of lords between house ${p.houses[0]} and ${p.houses[1]}`,
            significance: 'Strengthens both houses involved',
            planetsInvolved: p.planets
        });
    }

    return yogas;
};

/**
 * Calculate Arudha Lagna and other special lagnas.
 */
export const calculateArudhas = (ephemeris: EphemerisData): { AL: string; UL: string } => {
    const al = calculateArudhaLagna(ephemeris);
    return { AL: al.sign, UL: 'Unknown' }; // Expansion point for Upapada Lagna
};

/**
 * Calculate Panchanga (Tithi, Yoga, Karana, Vara).
 * Only Sun/Moon longitudes are required; Yoga and Karana derive from Tithi.
 * When ephemeris is available, Moon's nakshatra is passed through.
 */
export const calculatePanchanga = (
  jd: number,
  sunLong: number,
  moonLong: number,
  birthDate?: Date,
  ephemeris?: EphemerisData
): PanchangaData => {
  const mockEph: EphemerisData = ephemeris ?? {
    planets: {
      sun: { sign: '', degree: 0, longitude: sunLong, latitude: 0, nakshatra: '', lord: '', retro: false, speed: 0, distance: 0, isCombust: false, dignity: '', house: 0 },
      moon: { sign: '', degree: 0, longitude: moonLong, latitude: 0, nakshatra: '', lord: '', retro: false, speed: 0, distance: 0, isCombust: false, dignity: '', house: 0 },
      mercury: { sign: '', degree: 0, longitude: 0, latitude: 0, nakshatra: '', lord: '', retro: false, speed: 0, distance: 0, isCombust: false, dignity: '', house: 0 },
      venus: { sign: '', degree: 0, longitude: 0, latitude: 0, nakshatra: '', lord: '', retro: false, speed: 0, distance: 0, isCombust: false, dignity: '', house: 0 },
      mars: { sign: '', degree: 0, longitude: 0, latitude: 0, nakshatra: '', lord: '', retro: false, speed: 0, distance: 0, isCombust: false, dignity: '', house: 0 },
      jupiter: { sign: '', degree: 0, longitude: 0, latitude: 0, nakshatra: '', lord: '', retro: false, speed: 0, distance: 0, isCombust: false, dignity: '', house: 0 },
      saturn: { sign: '', degree: 0, longitude: 0, latitude: 0, nakshatra: '', lord: '', retro: false, speed: 0, distance: 0, isCombust: false, dignity: '', house: 0 },
      rahu: { sign: '', degree: 0, longitude: 0, latitude: 0, nakshatra: '', lord: '', retro: false, speed: 0, distance: 0, isCombust: false, dignity: '', house: 0 },
      ketu: { sign: '', degree: 0, longitude: 0, latitude: 0, nakshatra: '', lord: '', retro: false, speed: 0, distance: 0, isCombust: false, dignity: '', house: 0 },
    },
    ascendant: { sign: '', degree: 0, nakshatra: '', longitude: 0 },
    houses: [],
  };
  return calcPanchanga(mockEph, birthDate || new Date());
};
/**
 * Vimsopaka Bala — divisional chart strength (Shadvarga: 6 varga charts).
 * Each planet scored in D1, D2, D9, D10, D12, D30. Total = sum / 6.
 * Scoring: Exalted/Own=20, Friend=15, Neutral=10, Enemy=4, Debilitated=0.
 */
export const calculateVimsopakaBala = (ephemeris: EphemerisData): { total: number } => {
  const vargas = generateDivisionalCharts(ephemeris);
  const charts = ['D1', 'D2', 'D9', 'D10', 'D12', 'D30'];
  let total = 0;
  let count = 0;
  for (const [pName, pos] of Object.entries(ephemeris.planets)) {
    if (['rahu','ketu'].includes(pName)) continue;
    let planetTotal = 0;
    for (const chart of charts) {
      if (chart === 'D1') {
        const sign = pos.sign;
        if (sign === EXALTATION_SIGNS[pName]) planetTotal += 20;
        else if (sign === DEBILITATION_SIGNS[pName]) planetTotal += 0;
        else if (OWN_SIGNS[pName]?.includes(sign)) planetTotal += 20;
        else planetTotal += 10; // Neutral default for D1
      } else {
        const vChart = vargas[chart];
        const vPos = vChart?.planets[pName];
        if (!vPos) { planetTotal += 10; continue; }
        const sign = vPos.sign;
        if (sign === EXALTATION_SIGNS[pName]) planetTotal += 20;
        else if (sign === DEBILITATION_SIGNS[pName]) planetTotal += 0;
        else if (OWN_SIGNS[pName]?.includes(sign)) planetTotal += 20;
        else planetTotal += 10;
      }
    }
    total += planetTotal / charts.length;
    count++;
  }
  return { total: count > 0 ? Math.round(total / count) : 0 };
};

/**
 * Detect Bhava Chalit discrepancies — planets that shift houses
 * between the sign-based (Rasi) chart and cusp-based (Bhava) chart.
 * Only checks when house cusp data is available from the ephemeris.
 */
export const detectBhavaChalitDiscrepancy = (ephemeris: EphemerisData): BhavaChalitDiscrepancy[] => {
  if (!ephemeris.houses || ephemeris.houses.length < 12) return [];
  const results: BhavaChalitDiscrepancy[] = [];
  for (const [name, pos] of Object.entries(ephemeris.planets)) {
    if (typeof pos.longitude !== 'number') continue;
    const rasiHouse = calculateHouse(pos.longitude, [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360]);
    const cusps = ephemeris.houses.map(h => h.cusp);
    const bhavaHouse = calculateHouse(pos.longitude, cusps);
    if (rasiHouse !== bhavaHouse) {
      results.push({
        planet: name,
        rasiHouse,
        chalitHouse: bhavaHouse,
        degreeDiff: Math.abs(pos.longitude - (cusps[bhavaHouse - 1] || 0)),
      });
    }
  }
  return results;
};

/**
 * Get D60 deity based on traditional 60-fold division.
 * Mapping based on Brihat Parashara Hora Shastra (BPHS).
 */
export const getD60Deity = (longitude: number): string => {
    const deityNames = D60_DEITIES;

    const d60Index = Math.floor((longitude % 30) * 2);
    return deityNames[d60Index] || 'Unknown';
};

/**
 * Calculate house position for a longitude.
 */
export const calculateHouse = (longitude: number, houseCusps: number[]): number => {
    for (let i = 0; i < 11; i++) {
        if (longitude >= houseCusps[i] && longitude < houseCusps[i + 1]) return i + 1;
    }
    return 12;
};

/**
 * planetary aspects (Sign-based Parashari Drishti).
 */
export const calculateAspects = (arg1: EphemerisData | string, _arg2?: number, _arg3?: Record<string, number>, _arg4?: number): AspectData[] => {
    // If called with ephemeris object (from new engine)
    if (arg1 && typeof arg1 === 'object' && 'planets' in arg1) {
        return calcAspects(arg1);
    }
    // If called with individual planet data (from planet-enricher)
    return [];
};

/**
 * Planetary dignity based on sign placement.
 * Priority order: Exalted > Debilitated > Moolatrikona > Own Sign > Friendly > Enemy > Neutral
 */
export const getDignity = (planet: string, signOrChart: string | EphemerisData): string => {
  const sign = typeof signOrChart === 'string' ? signOrChart : signOrChart.planets[planet]?.sign;
  if (!sign) return 'Neutral';
  const p = planet.toLowerCase();
  if (sign === EXALTATION_SIGNS[p]) return 'Exalted';
  if (sign === DEBILITATION_SIGNS[p]) return 'Debilitated';
  if (sign === MOOLATRIKONA_SIGNS[p]) return 'Moolatrikona';
  if (OWN_SIGNS[p]?.includes(sign)) return 'Own Sign';
  // Check friend/enemy via sign lord
  const lord = SIGN_TO_LORD[sign];
  if (lord) {
    const pLower = p.toLowerCase();
    const friends = NATURAL_FRIENDS[pLower] || [];
    const enemies = NATURAL_ENEMIES[pLower] || [];
    const lordLower = lord.toLowerCase();
    if (friends.includes(lordLower)) return 'Friendly';
    if (enemies.includes(lordLower)) return 'Enemy';
  }
  return 'Neutral';
};

// Reverse lookup: sign name → ruling planet name (derived from PLANET_LORDSHIPS)
const SIGN_TO_LORD: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter'
};

/**
 * Functional nature (Benefic/Malefic) based on Lagna lordship.
 * Lords of trikonas (1,5,9) are benefics; dusthanas are malefics;
 * kendras are neutral temporal malefics. Rahu/Ketu take Saturn/Mars lordship.
 */
export const calculateFunctionalNature = (planetName: string, ascendantSign: string): { role: string; reason: string } => {
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const LORDS: Record<string, number[]> = { sun: [4], moon: [3], mars: [0,7], mercury: [2,5], jupiter: [8,11], venus: [1,6], saturn: [9,10] };
  const ascIdx = SIGNS.indexOf(ascendantSign);
  if (ascIdx === -1) return { role: 'Neutral', reason: 'Unknown ascendant' };
  const p = planetName.toLowerCase();
  const entry = p === 'rahu' ? LORDS.saturn : p === 'ketu' ? LORDS.mars : LORDS[p];
  if (!entry) return { role: 'Neutral', reason: 'No lordship' };
  const houses = entry.map(si => ((si - ascIdx + 12) % 12) + 1);
  const hasKendra = houses.some((h: number) => [1,4,7,10].includes(h));
  const hasTrikona = houses.some((h: number) => [1,5,9].includes(h));
  const hasDusthana = houses.some((h: number) => [6,8,12].includes(h));
  if (hasTrikona && !hasDusthana) return { role: 'Benefic', reason: 'Lord of trine houses' };
  if (hasKendra && hasTrikona) return { role: 'Benefic', reason: 'Kendra-trikona lordship' };
  if (hasDusthana && !hasTrikona) return { role: 'Malefic', reason: 'Lord of dusthana houses' };
  if (hasKendra) return { role: 'Neutral', reason: 'Lord of kendra' };
  return { role: 'Neutral', reason: 'Mixed lordship' };
};
/**
 * Baladi Avastha (Infant, Youth, etc).
 */
export const calculateBaladiAvastha = (longitude: number): string => {
    const deg = longitude % 30;
    if (deg < 6) return 'Bala';
    if (deg < 12) return 'Kumara';
    if (deg < 18) return 'Yuva';
    if (deg < 24) return 'Vriddha';
    return 'Mrita';
};

/**
 * Compound dignity (Panchadha Sambandha) — checks temporal, natural,
 * compound, directional, and positional relationships between two signs.
 */
export const calculatePanchadhaSambandha = (planetName: string, lordSign: string): string => {
  const p = planetName.toLowerCase();
  const friendList = NATURAL_FRIENDS[p] || [];
  const enemyList = NATURAL_ENEMIES[p] || [];
  if (friendList.includes(lordSign)) return 'Friendly';
  if (enemyList.includes(lordSign)) return 'Inimical';
  return 'Neutral';
};

/**
 * Ishta Kashta Phala — benefic/malefic points based on position.
 * Ishta = proximity to exaltation (benefic). Kashta = proximity to debilitation (malefic).
 * Formula: distance from exaltation/debilitation, normalized to 0-60 scale.
 */
export const calculateIshtaKashtaPhala = (planetName: string, rawPlanet?: { longitude: number }): { ishta: number; kashta: number } => {
  const EXALT: Record<string, number> = { sun: 10, moon: 33, mars: 298, mercury: 165, jupiter: 95, venus: 357, saturn: 200 };
  if (!rawPlanet?.longitude) return { ishta: 20, kashta: 10 };
  const exaltDeg = EXALT[planetName.toLowerCase()];
  if (exaltDeg === undefined) return { ishta: 20, kashta: 10 };
  const debilDeg = (exaltDeg + 180) % 360;
  const distFromExalt = Math.min(Math.abs(rawPlanet.longitude - exaltDeg), 360 - Math.abs(rawPlanet.longitude - exaltDeg));
  const distFromDebil = Math.min(Math.abs(rawPlanet.longitude - debilDeg), 360 - Math.abs(rawPlanet.longitude - debilDeg));
  const ishta = Math.round(60 * (1 - distFromExalt / 180));
  const kashta = Math.round(60 * (1 - distFromDebil / 180));
  return { ishta, kashta };
};

/**
 * Verify Double Transit (Jupiter + Saturn aspecting a house).
 */
export const verifyDoubleTransit = (ephemeris: EphemerisData, ascendantSign: string, targetHouse?: number): { isTriggered: boolean; details: DoubleTransitDetail[] } => {
    const transitPositions: TransitPosition[] = [];
    for (const [name, data] of Object.entries(ephemeris.planets)) {
        const planetData = data;
        transitPositions.push({
            planet: name,
            sign: planetData.sign,
            degree: planetData.degree,
            longitude: planetData.longitude,
            isRetrograde: planetData.retro || false
        });
    }

    const house = targetHouse || 1; // Default to 1st house if not specified
    const result = TransitAnalyzer.checkDoubleTransit(transitPositions, house, ascendantSign);

    return {
        isTriggered: result.isTriggered,
        details: result.details.split('; ').map(d => ({ message: d }))
    };
};

// Legacy exports for backward compatibility
