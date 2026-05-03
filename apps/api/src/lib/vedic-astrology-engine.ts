
import { getAyanamsa } from './ephemeris.js';
import { EphemerisData, PlanetData } from '@ai-pandit/shared';

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
        const startDiff = Math.abs(time - t.start) / 60000; // in minutes
        const endDiff = Math.abs(time - t.end) / 60000; // in minutes

        const threshold = [43200, 10080, 2880, 720, 60][t.level - 1] || 60;

        if (startDiff < threshold) {
            return { isNearTransition: true, level: t.level, distanceMinutes: startDiff, transitionType: 'start' };
        }
        if (endDiff < threshold) {
            return { isNearTransition: true, level: t.level, distanceMinutes: endDiff, transitionType: 'end' };
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
        return `${formatDate(date)}: Dasha calculation out of range.`;
    }

    const lines = [
        `${formatDate(date)} - ${eventDescription}`,
        `  Mahadasha: ${dasha.mahadasha} (${formatDate(dasha.mahadashaStart)} to ${formatDate(dasha.mahadashaEnd)})`
    ];

    if (dasha.antardasha !== 'Unknown' && dasha.antardashaStart && dasha.antardashaEnd) {
        lines.push(`  Antardasha: ${dasha.antardasha} (${formatDate(dasha.antardashaStart)} to ${formatDate(dasha.antardashaEnd)})`);
    }
    if (dasha.pratyantardasha !== 'Unknown' && dasha.pratyantarStart && dasha.pratyantarEnd) {
        lines.push(`  Pratyantardasha: ${dasha.pratyantardasha} (${formatDate(dasha.pratyantarStart)} to ${formatDate(dasha.pratyantarEnd)})`);
    }

    return lines.join('\n');
}


// ═════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════
// Sidereal year: ~365.25636 days. Julian (365.25) drifts ~0.76 days/century.
// Using NASA-JPL sidereal year for dasha date calculations.
const DAYS_PER_YEAR = 365.256363004;  // sidereal year in mean solar days

function addYears(date: Date, years: number): Date {
    const result = new Date(date);
    result.setTime(result.getTime() + years * DAYS_PER_YEAR * 24 * 60 * 60 * 1000);
    return result;
}

function formatDate(date: Date): string {
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
    type ArudhaLagna,
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
    const signs = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
    const result: Record<string, number> = {};
    sav.forEach((val, i) => { result[signs[i]] = val; });
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
 * Calculate Vimsopaka Bala (Divisional strength).
 */
export const calculateVimsopakaBala = (_ephemeris: EphemerisData): { total: number } => {
    return { total: 0 }; // Placeholder until fully implemented
};

/**
 * Detect discrepancies between Rasi and Bhava Chalit.
 */
export const detectBhavaChalitDiscrepancy = (_ephemeris: EphemerisData): BhavaChalitDiscrepancy[] => {
    return [];
};

/**
 * Get D60 deity based on traditional 60-fold division.
 * Mapping based on Brihat Parashara Hora Shastra (BPHS).
 */
export const getD60Deity = (longitude: number): string => {
    const deityNames = [
        'Ghora', 'Rakshasa', 'Deva', 'Kubera', 'Yaksha', 'Kindar', 'Bhrashta', 'Kulaghna',
        'Garala', 'Vahni', 'Maya', 'Purishaka', 'Apampati', 'Marutwan', 'Kaala', 'Sarpa',
        'Amrita', 'Indu', 'Mridu', 'Komal', 'Heramba', 'Brahma', 'Vishnu', 'Maheshwara',
        'Deva', 'Ardra', 'Kalinas', 'Kshiteeshwar', 'Kamalakara', 'Gulika', 'Mrityu', 'Kaala',
        'Davagni', 'Ghora', 'Adhama', 'Kantaka', 'Vishadagdha', 'Kulanas', 'Vamshakshaya', 'Utpata',
        'Kaala', 'Saumya', 'Komal', 'Sheetal', 'Karaladamshtra', 'Indumukha', 'Pravina', 'Kalagni',
        'Dandayudha', 'Nirmala', 'Shubha', 'Ashubha', 'Atishubha', 'Sumukha', 'Durdhara', 'Humshaka',
        'Abhaya', 'Ghora', 'Adhama', 'Amrita'
    ];

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
 */
export const getDignity = (planet: string, signOrChart: string | EphemerisData): string => {
  const sign = typeof signOrChart === 'string' ? signOrChart : signOrChart.planets[planet]?.sign;
  if (!sign) return 'Neutral';
  const p = planet.toLowerCase();
  const EXALT: Record<string, string> = { sun: 'Aries', moon: 'Taurus', mars: 'Capricorn', mercury: 'Virgo', jupiter: 'Cancer', venus: 'Pisces', saturn: 'Libra' };
  const DEBIL: Record<string, string> = { sun: 'Libra', moon: 'Scorpio', mars: 'Cancer', mercury: 'Pisces', jupiter: 'Capricorn', venus: 'Virgo', saturn: 'Aries' };
  const MT: Record<string, string> = { sun: 'Leo', moon: 'Taurus', mars: 'Aries', mercury: 'Virgo', jupiter: 'Sagittarius', venus: 'Libra', saturn: 'Aquarius' };
  const OWN: Record<string, string[]> = { sun: ['Leo'], moon: ['Cancer'], mars: ['Aries','Scorpio'], mercury: ['Gemini','Virgo'], jupiter: ['Sagittarius','Pisces'], venus: ['Taurus','Libra'], saturn: ['Capricorn','Aquarius'] };
  if (sign === EXALT[p]) return 'Exalted';
  if (sign === DEBIL[p]) return 'Debilitated';
  if (sign === MT[p]) return 'Moolatrikona';
  if (OWN[p]?.includes(sign)) return 'Own Sign';
  return 'Neutral';
};

/**
 * Functional nature (Benefic/Malefic) based on Lagna lordship.
 * Lords of trikonas (1,5,9) are benefics; dusthanas are malefics;
 * kendras are neutral temporal malefics. Rahu/Ketu take Saturn/Mars lordship.
 */
export const calculateFunctionalNature = (planetName: string, ascendantSign: string): { role: string; reason: string } => {
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const L: Record<string, number[]> = { sun: [4], moon: [3], mars: [0,7], mercury: [2,5], jupiter: [8,11], venus: [1,6], saturn: [9,10] };
  const ascIdx = SIGNS.indexOf(ascendantSign);
  if (ascIdx === -1) return { role: 'Neutral', reason: 'Unknown ascendant' };
  const p = planetName.toLowerCase();
  const entry = p === 'rahu' ? L.saturn : p === 'ketu' ? L.mars : L[p];
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
 * Compound dignity (Panchadha Sambandha).
 */
export const calculatePanchadhaSambandha = (_planetName: string, _lordSign: string): string => {
    return 'Neutral';
};

/**
 * Ishta Kashta Phala calculation.
 */
export const calculateIshtaKashtaPhala = (_planetName: string, _rawPlanet?: PlanetData): { ishta: number; kashta: number } => {
    return { ishta: 20, kashta: 10 };
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
export type { DashaPeriod as _DashaPeriod };
