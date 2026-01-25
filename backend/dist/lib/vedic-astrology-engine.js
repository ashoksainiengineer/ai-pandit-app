"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NAKSHATRAS = exports.DASHA_YEARS = void 0;
exports.calculateLahiriAyanamsa = calculateLahiriAyanamsa;
exports.tropicalToSidereal = tropicalToSidereal;
exports.calculateVimshottariDasha = calculateVimshottariDasha;
exports.getDashaForDate = getDashaForDate;
exports.dashaSupportsEvent = dashaSupportsEvent;
exports.formatDashaSequence = formatDashaSequence;
exports.formatDashaForDate = formatDashaForDate;
exports.getNakshatraForLongitude = getNakshatraForLongitude;
exports.calculateHouse = calculateHouse;
exports.getHouseLord = getHouseLord;
exports.getDignity = getDignity;
exports.getAllHouseLords = getAllHouseLords;
const ephemeris_js_1 = require("./ephemeris.js");
// ═════════════════════════════════════════════════════════════════════════════
// Vimshottari Dasha periods (in years)
exports.DASHA_YEARS = {
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
    'Ketu', // 1. Ashwini
    'Venus', // 2. Bharani
    'Sun', // 3. Krittika
    'Moon', // 4. Rohini
    'Mars', // 5. Mrigashirsha
    'Rahu', // 6. Ardra
    'Jupiter', // 7. Punarvasu
    'Saturn', // 8. Pushya
    'Mercury', // 9. Ashlesha
    'Ketu', // 10. Magha
    'Venus', // 11. Purva Phalguni
    'Sun', // 12. Uttara Phalguni
    'Moon', // 13. Hasta
    'Mars', // 14. Chitra
    'Rahu', // 15. Swati
    'Jupiter', // 16. Vishakha
    'Saturn', // 17. Anuradha
    'Mercury', // 18. Jyeshtha
    'Ketu', // 19. Mula
    'Venus', // 20. Purva Ashadha
    'Sun', // 21. Uttara Ashadha
    'Moon', // 22. Shravana
    'Mars', // 23. Dhanishtha
    'Rahu', // 24. Shatabhisha
    'Jupiter', // 25. Purva Bhadrapada
    'Saturn', // 26. Uttara Bhadrapada
    'Mercury', // 27. Revati
];
// Dasha sequence (order of planetary periods)
const DASHA_SEQUENCE = [
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars',
    'Rahu', 'Jupiter', 'Saturn', 'Mercury'
];
// Nakshatra span in degrees
const NAKSHATRA_SPAN = 360 / 27; // 13.333...°
// ═════════════════════════════════════════════════════════════════════════════
// AYANAMSA CALCULATION
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Calculate Lahiri Ayanamsa for a given Julian Day
 * Synchronized with Swiss Ephemeris for God-Tier Precision.
 */
function calculateLahiriAyanamsa(julianDay) {
    return (0, ephemeris_js_1.getAyanamsa)(julianDay);
}
/**
 * Convert tropical longitude to sidereal (Vedic)
 */
function tropicalToSidereal(tropicalLongitude, julianDay) {
    const ayanamsa = calculateLahiriAyanamsa(julianDay);
    let sidereal = tropicalLongitude - ayanamsa;
    if (sidereal < 0)
        sidereal += 360;
    return sidereal;
}
// ═════════════════════════════════════════════════════════════════════════════
// VIMSHOTTARI DASHA CALCULATION
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Calculate complete Vimshottari Dasha sequence from birth
 * This is THE most important calculation for birth time rectification
 */
function calculateVimshottariDasha(moonLongitude, // Sidereal longitude of Moon
birthDate) {
    // Step 1: Determine birth nakshatra
    const nakshatraIndex = Math.floor(moonLongitude / NAKSHATRA_SPAN);
    const birthNakshatra = nakshatraIndex;
    const birthNakshatraLord = NAKSHATRA_LORDS[nakshatraIndex];
    // Step 2: Calculate position within nakshatra (0 to 1)
    const positionInNakshatra = (moonLongitude % NAKSHATRA_SPAN) / NAKSHATRA_SPAN;
    // Step 3: Calculate elapsed portion of birth dasha
    const birthDashaYears = exports.DASHA_YEARS[birthNakshatraLord];
    const elapsedYears = positionInNakshatra * birthDashaYears;
    const remainingYears = birthDashaYears - elapsedYears;
    // Step 4: Build all dasha periods
    const periods = [];
    let currentDate = new Date(birthDate);
    // Find starting index in dasha sequence
    let dashaIndex = DASHA_SEQUENCE.indexOf(birthNakshatraLord);
    // First period (partial - remaining from birth)
    const firstEndDate = addYears(currentDate, remainingYears);
    periods.push({
        lord: birthNakshatraLord,
        startDate: new Date(currentDate),
        endDate: firstEndDate,
        durationYears: remainingYears,
        subPeriods: calculateSubDashas(birthNakshatraLord, currentDate, firstEndDate, 5, // GOD-TIER: 5 levels deep
        positionInNakshatra),
    });
    currentDate = firstEndDate;
    dashaIndex = (dashaIndex + 1) % 9;
    // Remaining full periods (for ~120 years from birth)
    for (let cycle = 0; cycle < 1; cycle++) { // 1 cycle (120 years) is sufficient for life
        for (let i = 0; i < 9; i++) {
            const lord = DASHA_SEQUENCE[dashaIndex];
            if (lord === birthNakshatraLord && cycle === 0) {
                dashaIndex = (dashaIndex + 1) % 9;
                continue; // Already added birth dasha
            }
            const years = exports.DASHA_YEARS[lord];
            const endDate = addYears(currentDate, years);
            periods.push({
                lord,
                startDate: new Date(currentDate),
                endDate,
                durationYears: years,
                subPeriods: calculateSubDashas(lord, currentDate, endDate, 5, 0),
            });
            currentDate = endDate;
            dashaIndex = (dashaIndex + 1) % 9;
        }
    }
    return periods;
}
/**
 * Calculate Antardasha periods within a Mahadasha
 */
/**
 * Generic Recursive Sub-Dasha Calculation
 * Supports Level 2 (Antar) to Level 5 (Prana)
 */
function calculateSubDashas(mahadashaLord, startDate, endDate, maxLevel = 2, startOffset = 0, // 0-1, amount of the first period already elapsed
currentLevel = 2) {
    if (currentLevel > maxLevel)
        return [];
    const totalDurationMs = endDate.getTime() - startDate.getTime();
    const subPeriods = [];
    let currentDate = new Date(startDate);
    // Sub-dasha sequence starts with the current parent lord
    let startIndex = DASHA_SEQUENCE.indexOf(mahadashaLord);
    for (let i = 0; i < 9; i++) {
        const index = (startIndex + i) % 9;
        const lord = DASHA_SEQUENCE[index];
        const lordYears = exports.DASHA_YEARS[lord];
        // Traditional Rule: Sub-period is proportional to planet's years in 120-year cycle
        const proportion = lordYears / TOTAL_DASHA_YEARS;
        let pDurationMs = totalDurationMs * proportion;
        // Apply offset for the very first period of birth
        if (i === 0 && startOffset > 0) {
            const elapsed = startOffset * pDurationMs;
            pDurationMs -= elapsed;
            if (pDurationMs <= 0)
                continue;
        }
        const pEndDate = new Date(currentDate.getTime() + pDurationMs);
        // Sanity check for very small periods (Prana level can be minutes)
        if (pDurationMs < 1000)
            continue;
        subPeriods.push({
            lord,
            startDate: new Date(currentDate),
            endDate: pEndDate,
            durationYears: pDurationMs / (365.25 * 24 * 60 * 60 * 1000),
            subPeriods: calculateSubDashas(lord, currentDate, pEndDate, maxLevel, 0, currentLevel + 1)
        });
        currentDate = pEndDate;
    }
    return subPeriods;
}
/**
 * Get Dasha active on a specific date
 * Used to verify life events
 */
/**
 * Get Dasha active on a specific date (5 levels deep)
 * Used to verify life events with GOD-TIER precision
 */
function getDashaForDate(periods, eventDate) {
    for (const maha of periods) {
        if (eventDate >= maha.startDate && eventDate <= maha.endDate) {
            // Level 2 (Antar)
            for (const antar of maha.subPeriods) {
                if (eventDate >= antar.startDate && eventDate <= antar.endDate) {
                    // Level 3 (Pratyantar)
                    for (const prat of antar.subPeriods) {
                        if (eventDate >= prat.startDate && eventDate <= prat.endDate) {
                            // Level 4 (Sukshma)
                            for (const suksh of prat.subPeriods) {
                                if (eventDate >= suksh.startDate && eventDate <= suksh.endDate) {
                                    // Level 5 (Prana)
                                    for (const prana of suksh.subPeriods) {
                                        if (eventDate >= prana.startDate && eventDate <= prana.endDate) {
                                            const dasha = {
                                                mahadasha: maha.lord,
                                                antardasha: antar.lord,
                                                pratyantardasha: prat.lord,
                                                sukshmadasha: suksh.lord,
                                                pranadasha: prana.lord,
                                                mahadashaStart: maha.startDate,
                                                mahadashaEnd: maha.endDate,
                                                antardashaStart: antar.startDate,
                                                antardashaEnd: antar.endDate,
                                                pratyantarStart: prat.startDate,
                                                pratyantarEnd: prat.endDate,
                                                sukshmaStart: suksh.startDate,
                                                sukshmaEnd: suksh.endDate,
                                                pranaStart: prana.startDate,
                                                pranaEnd: prana.endDate
                                            };
                                            // Attach Sandhi Info (Transition analysis)
                                            dasha.sandhiInfo = calculateDashaSandhi(dasha, eventDate);
                                            return dasha;
                                        }
                                    }
                                    // Fallback to Level 4
                                    return {
                                        mahadasha: maha.lord,
                                        antardasha: antar.lord,
                                        pratyantardasha: prat.lord,
                                        sukshmadasha: suksh.lord,
                                        pranadasha: 'Unknown',
                                        mahadashaStart: maha.startDate,
                                        mahadashaEnd: maha.endDate,
                                        antardashaStart: antar.startDate,
                                        antardashaEnd: antar.endDate,
                                        pratyantarStart: prat.startDate,
                                        pratyantarEnd: prat.endDate,
                                        sukshmaStart: suksh.startDate,
                                        sukshmaEnd: suksh.endDate,
                                        pranaStart: new Date(), pranaEnd: new Date()
                                    };
                                }
                            }
                            // Fallback to Level 3
                            return {
                                mahadasha: maha.lord,
                                antardasha: antar.lord,
                                pratyantardasha: prat.lord,
                                sukshmadasha: 'Unknown',
                                pranadasha: 'Unknown',
                                mahadashaStart: maha.startDate,
                                mahadashaEnd: maha.endDate,
                                antardashaStart: antar.startDate,
                                antardashaEnd: antar.endDate,
                                pratyantarStart: prat.startDate,
                                pratyantarEnd: prat.endDate,
                                sukshmaStart: new Date(), sukshmaEnd: new Date(),
                                pranaStart: new Date(), pranaEnd: new Date()
                            };
                        }
                    }
                    // Fallback to Level 2
                    return {
                        mahadasha: maha.lord,
                        antardasha: antar.lord,
                        pratyantardasha: 'Unknown',
                        sukshmadasha: 'Unknown',
                        pranadasha: 'Unknown',
                        mahadashaStart: maha.startDate,
                        mahadashaEnd: maha.endDate,
                        antardashaStart: antar.startDate,
                        antardashaEnd: antar.endDate,
                        pratyantarStart: new Date(), pratyantarEnd: new Date(),
                        sukshmaStart: new Date(), sukshmaEnd: new Date(),
                        pranaStart: new Date(), pranaEnd: new Date()
                    };
                }
            }
            // Fallback to Level 1
            return {
                mahadasha: maha.lord,
                antardasha: 'Unknown',
                pratyantardasha: 'Unknown',
                sukshmadasha: 'Unknown',
                pranadasha: 'Unknown',
                mahadashaStart: maha.startDate,
                mahadashaEnd: maha.endDate,
                antardashaStart: new Date(), antardashaEnd: new Date(),
                pratyantarStart: new Date(), pratyantarEnd: new Date(),
                sukshmaStart: new Date(), sukshmaEnd: new Date(),
                pranaStart: new Date(), pranaEnd: new Date()
            };
        }
    }
    return null;
}
// ═════════════════════════════════════════════════════════════════════════════
// DASHA-EVENT CORRELATION
// ═════════════════════════════════════════════════════════════════════════════
// Which dashas favor which event types (expert knowledge)
const DASHA_EVENT_MAP = {
    // Career and authority
    Sun: ['career', 'promotion', 'recognition', 'government', 'father'],
    // Wealth, relationships, arts
    Venus: ['marriage', 'love', 'arts', 'luxury', 'vehicles', 'beauty'],
    // Mind, mother, emotions
    Moon: ['mother', 'travel', 'emotions', 'mental', 'home', 'nurturing'],
    // Energy, courage, property
    Mars: ['property', 'siblings', 'courage', 'surgery', 'accidents', 'conflict'],
    // Communication, education, business
    Mercury: ['education', 'business', 'writing', 'communication', 'skills', 'friends'],
    // Expansion, spirituality, children
    Jupiter: ['children', 'marriage', 'spirituality', 'higher_education', 'luck', 'wealth'],
    // Discipline, delays, career
    Saturn: ['career', 'discipline', 'delays', 'chronic_health', 'old_age', 'service'],
    // Sudden events, foreign, unconventional
    Rahu: ['foreign', 'sudden_events', 'unconventional', 'technology', 'research', 'obsession'],
    // Spiritual, detachment, losses
    Ketu: ['spiritual', 'losses', 'isolation', 'mystical', 'past_karma', 'endings'],
};
/**
 * Detect Dasha Sandhi (Transition twilight)
 * Events near transitions are high-confidence indicators.
 */
function calculateDashaSandhi(dasha, date) {
    const time = date.getTime();
    // Level 1-2 transitions (Mahadasha, Antardasha) are the most powerful
    const transitions = [
        { start: dasha.mahadashaStart.getTime(), end: dasha.mahadashaEnd.getTime(), level: 1 },
        { start: dasha.antardashaStart.getTime(), end: dasha.antardashaEnd.getTime(), level: 2 },
        { start: dasha.pratyantarStart.getTime(), end: dasha.pratyantarEnd.getTime(), level: 3 },
        { start: dasha.sukshmaStart.getTime(), end: dasha.sukshmaEnd.getTime(), level: 4 },
        { start: dasha.pranaStart.getTime(), end: dasha.pranaEnd.getTime(), level: 5 }
    ];
    for (const t of transitions) {
        const startDiff = Math.abs(time - t.start) / (60 * 1000);
        const endDiff = Math.abs(time - t.end) / (60 * 1000);
        // Thresholds: L1=30d, L2=7d, L3=2d, L4=12h, L5=2h
        const threshold = t.level === 1 ? 43200 : // 30 days in mins
            t.level === 2 ? 10080 : // 7 days in mins
                t.level === 3 ? 2880 : // 2 days in mins
                    t.level === 4 ? 720 : // 12 hours in mins
                        60; // 1 hour in mins
        if (startDiff < threshold) {
            return { isNearTransition: true, level: t.level, distanceMinutes: startDiff, transitionType: 'start' };
        }
        if (endDiff < threshold) {
            return { isNearTransition: true, level: t.level, distanceMinutes: endDiff, transitionType: 'end' };
        }
    }
    return { isNearTransition: false, level: 0, distanceMinutes: 0, transitionType: 'start' };
}
/**
 * Check if a dasha supports a particular event type
 */
function dashaSupportsEvent(dasha, eventCategory, eventType) {
    const category = eventCategory.toLowerCase();
    const type = eventType.toLowerCase();
    let supports = false;
    let strength = 0;
    const reasons = [];
    // Check Mahadasha
    const mahaSupportedEvents = DASHA_EVENT_MAP[dasha.mahadasha] || [];
    for (const supportedEvent of mahaSupportedEvents) {
        if (category.includes(supportedEvent) || type.includes(supportedEvent)) {
            supports = true;
            strength += 60;
            reasons.push(`${dasha.mahadasha} Mahadasha supports ${supportedEvent} events`);
            break;
        }
    }
    // Check Antardasha
    const antarSupportedEvents = DASHA_EVENT_MAP[dasha.antardasha] || [];
    for (const supportedEvent of antarSupportedEvents) {
        if (category.includes(supportedEvent) || type.includes(supportedEvent)) {
            supports = true;
            strength += 40;
            reasons.push(`${dasha.antardasha} Antardasha reinforces this`);
            break;
        }
    }
    // Specific combinations
    const combo = `${dasha.mahadasha}-${dasha.antardasha}`;
    // Marriage combinations
    if ((category === 'marriage' || type.includes('marriage') || type.includes('wedding'))) {
        if (['Venus-Jupiter', 'Jupiter-Venus', 'Venus-Venus', 'Moon-Venus'].includes(combo)) {
            strength += 30;
            reasons.push(`${combo} is excellent for marriage`);
        }
    }
    // Career combinations
    if (category === 'career' || type.includes('job') || type.includes('promotion')) {
        if (['Saturn-Sun', 'Sun-Saturn', 'Sun-Jupiter', 'Saturn-Jupiter'].includes(combo)) {
            strength += 30;
            reasons.push(`${combo} favors career advancement`);
        }
    }
    return {
        supports,
        strength: Math.min(100, strength),
        reason: reasons.join('. ') || 'No direct correlation found',
    };
}
// ═════════════════════════════════════════════════════════════════════════════
// FORMAT DASHA FOR AI PROMPT
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Format dasha sequence for AI K2 analysis
 */
function formatDashaSequence(periods) {
    const lines = ['VIMSHOTTARI DASHA SEQUENCE:'];
    for (const period of periods.slice(0, 12)) { // First 12 mahadashas (~100 years)
        const start = formatDate(period.startDate);
        const end = formatDate(period.endDate);
        lines.push(`\n${period.lord} MAHADASHA: ${start} to ${end} (${period.durationYears.toFixed(1)} years)`);
        // Add level 2 (Antar)
        for (const antar of period.subPeriods) {
            const aStart = formatDate(antar.startDate);
            const aEnd = formatDate(antar.endDate);
            lines.push(`  └─ ${period.lord}/${antar.lord}: ${aStart} to ${aEnd}`);
            // For AI prompt, we limit to 3 levels deep per candidate section to avoid token bloat
            // while keeping the full technical resolution available in the JSON Technical Data.
            for (const prat of antar.subPeriods) {
                const pStart = formatDate(prat.startDate);
                lines.push(`     · ${prat.lord}: starts ${pStart}`);
            }
        }
    }
    return lines.join('\n');
}
/**
 * Format dasha for a specific date
 */
function formatDashaForDate(periods, date, eventDescription) {
    const dasha = getDashaForDate(periods, date);
    if (!dasha) {
        return `${formatDate(date)}: Unable to determine dasha (date out of range)`;
    }
    return `${formatDate(date)} - ${eventDescription}
  Mahadasha: ${dasha.mahadasha} (${formatDate(dasha.mahadashaStart)} to ${formatDate(dasha.mahadashaEnd)})
  Antardasha: ${dasha.antardasha} (${formatDate(dasha.antardashaStart)} to ${formatDate(dasha.antardashaEnd)})`;
}
// ═════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════
function addYears(date, years) {
    const result = new Date(date);
    const wholeDays = years * 365.25;
    result.setTime(result.getTime() + wholeDays * 24 * 60 * 60 * 1000);
    return result;
}
function formatDate(date) {
    return date.toISOString().split('T')[0];
}
// ═════════════════════════════════════════════════════════════════════════════
// NAKSHATRA UTILITIES
// ═════════════════════════════════════════════════════════════════════════════
exports.NAKSHATRAS = [
    { name: 'Ashwini', lord: 'Ketu', deity: 'Ashwini Kumaras', startDegree: 0 },
    { name: 'Bharani', lord: 'Venus', deity: 'Yama', startDegree: 13.333 },
    { name: 'Krittika', lord: 'Sun', deity: 'Agni', startDegree: 26.667 },
    { name: 'Rohini', lord: 'Moon', deity: 'Brahma', startDegree: 40 },
    { name: 'Mrigashirsha', lord: 'Mars', deity: 'Soma', startDegree: 53.333 },
    { name: 'Ardra', lord: 'Rahu', deity: 'Rudra', startDegree: 66.667 },
    { name: 'Punarvasu', lord: 'Jupiter', deity: 'Aditi', startDegree: 80 },
    { name: 'Pushya', lord: 'Saturn', deity: 'Brihaspati', startDegree: 93.333 },
    { name: 'Ashlesha', lord: 'Mercury', deity: 'Nagas', startDegree: 106.667 },
    { name: 'Magha', lord: 'Ketu', deity: 'Pitris', startDegree: 120 },
    { name: 'Purva Phalguni', lord: 'Venus', deity: 'Bhaga', startDegree: 133.333 },
    { name: 'Uttara Phalguni', lord: 'Sun', deity: 'Aryaman', startDegree: 146.667 },
    { name: 'Hasta', lord: 'Moon', deity: 'Savitar', startDegree: 160 },
    { name: 'Chitra', lord: 'Mars', deity: 'Tvashtar', startDegree: 173.333 },
    { name: 'Swati', lord: 'Rahu', deity: 'Vayu', startDegree: 186.667 },
    { name: 'Vishakha', lord: 'Jupiter', deity: 'Indra-Agni', startDegree: 200 },
    { name: 'Anuradha', lord: 'Saturn', deity: 'Mitra', startDegree: 213.333 },
    { name: 'Jyeshtha', lord: 'Mercury', deity: 'Indra', startDegree: 226.667 },
    { name: 'Mula', lord: 'Ketu', deity: 'Nirriti', startDegree: 240 },
    { name: 'Purva Ashadha', lord: 'Venus', deity: 'Apas', startDegree: 253.333 },
    { name: 'Uttara Ashadha', lord: 'Sun', deity: 'Vishvadevas', startDegree: 266.667 },
    { name: 'Shravana', lord: 'Moon', deity: 'Vishnu', startDegree: 280 },
    { name: 'Dhanishtha', lord: 'Mars', deity: 'Vasus', startDegree: 293.333 },
    { name: 'Shatabhisha', lord: 'Rahu', deity: 'Varuna', startDegree: 306.667 },
    { name: 'Purva Bhadrapada', lord: 'Jupiter', deity: 'Aja Ekapada', startDegree: 320 },
    { name: 'Uttara Bhadrapada', lord: 'Saturn', deity: 'Ahir Budhnya', startDegree: 333.333 },
    { name: 'Revati', lord: 'Mercury', deity: 'Pushan', startDegree: 346.667 },
];
/**
 * Get nakshatra for a longitude
 */
function getNakshatraForLongitude(siderealLongitude) {
    const index = Math.floor(siderealLongitude / NAKSHATRA_SPAN);
    const nakshatra = exports.NAKSHATRAS[index % 27];
    // Calculate pada (quarter) - each nakshatra has 4 padas
    const positionInNakshatra = siderealLongitude % NAKSHATRA_SPAN;
    const pada = Math.floor(positionInNakshatra / (NAKSHATRA_SPAN / 4)) + 1;
    return {
        name: nakshatra.name,
        lord: nakshatra.lord,
        pada,
        number: (index % 27) + 1,
    };
}
// ═════════════════════════════════════════════════════════════════════════════
// VEDIC HELPERS (GOD-TIER DATA PREP)
// ═════════════════════════════════════════════════════════════════════════════
const ZODIAC_SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];
const PLANET_RULERSHIPS = {
    'Aries': 'Mars',
    'Taurus': 'Venus',
    'Gemini': 'Mercury',
    'Cancer': 'Moon',
    'Leo': 'Sun',
    'Virgo': 'Mercury',
    'Libra': 'Venus',
    'Scorpio': 'Mars',
    'Sagittarius': 'Jupiter',
    'Capricorn': 'Saturn',
    'Aquarius': 'Saturn',
    'Pisces': 'Jupiter'
};
const EXALTATION_SIGNS = {
    'Sun': 'Aries',
    'Moon': 'Taurus',
    'Mars': 'Capricorn',
    'Mercury': 'Virgo',
    'Jupiter': 'Cancer',
    'Venus': 'Pisces',
    'Saturn': 'Libra',
    'Rahu': 'Taurus',
    'Ketu': 'Scorpio'
};
const DEBILITATION_SIGNS = {
    'Sun': 'Libra',
    'Moon': 'Scorpio',
    'Mars': 'Cancer',
    'Mercury': 'Pisces',
    'Jupiter': 'Capricorn',
    'Venus': 'Virgo',
    'Saturn': 'Aries',
    'Rahu': 'Scorpio',
    'Ketu': 'Taurus'
};
/**
 * Calculate Vedic House System (Whole Sign)
 * @param ascSign Ascendant Sign Name
 * @param planetSign Planet Sign Name
 * @returns House Number (1-12)
 */
function calculateHouse(ascSign, planetSign) {
    const ascIdx = ZODIAC_SIGNS.indexOf(ascSign);
    const pltIdx = ZODIAC_SIGNS.indexOf(planetSign);
    if (ascIdx === -1 || pltIdx === -1)
        return 0;
    let house = (pltIdx - ascIdx) + 1;
    if (house <= 0)
        house += 12;
    return house;
}
/**
 * Get the Lord of a specific house number for a given Ascendant
 */
function getHouseLord(ascSign, houseNum) {
    const ascIdx = ZODIAC_SIGNS.indexOf(ascSign);
    // Target sign index = (ascIndex + houseNum - 1) % 12
    const targetIdx = (ascIdx + houseNum - 1) % 12;
    const sign = ZODIAC_SIGNS[targetIdx];
    return PLANET_RULERSHIPS[sign];
}
/**
 * Calculate Planetary Dignity
 */
function getDignity(planet, sign) {
    if (EXALTATION_SIGNS[planet] === sign)
        return 'Exalted';
    if (DEBILITATION_SIGNS[planet] === sign)
        return 'Debilitated';
    if (PLANET_RULERSHIPS[sign] === planet)
        return 'Own Sign';
    // Simplified Friend/Enemy logic (could be more complex natural + temporal)
    // For now, return Neutral/Friendly based on simple groups
    // Deva Group: Sun, Moon, Mars, Jupiter
    // Asura Group: Venus, Saturn, Mercury(mixed), Rahu, Ketu
    const devas = ['Sun', 'Moon', 'Mars', 'Jupiter'];
    const asuras = ['Venus', 'Saturn', 'Rahu', 'Ketu'];
    const neutral = ['Mercury'];
    const ruler = PLANET_RULERSHIPS[sign];
    if (devas.includes(planet) && devas.includes(ruler))
        return 'Friendly';
    if (asuras.includes(planet) && asuras.includes(ruler))
        return 'Friendly';
    if (devas.includes(planet) && asuras.includes(ruler))
        return 'Enemy';
    if (asuras.includes(planet) && devas.includes(ruler))
        return 'Enemy';
    return 'Neutral';
}
/**
 * Get map of all house lords for a chart
 */
function getAllHouseLords(ascSign) {
    const lords = {};
    for (let i = 1; i <= 12; i++) {
        lords[i] = getHouseLord(ascSign, i);
    }
    return lords;
}
//# sourceMappingURL=vedic-astrology-engine.js.map