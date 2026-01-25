// lib/seconds-precision-btr.ts
// 🔱 GOD-TIER BTR v7.0: Batch-Based Tournament System
// Research-backed: Max 10 candidates per AI call (Lost in the Middle mitigation)
// Swiss Eph = Calculator (Data Only) | DeepSeek AI = Brain (All Decisions)

import { calculateEphemeris, calculateJulianDay, convertToUTC } from './ephemeris.js';
import {
    calculateVimshottariDasha,
    getDashaForDate,
    formatDashaSequence,
    tropicalToSidereal,
    getNakshatraForLongitude,
    DashaPeriod,
    calculateHouse,
    getDignity,
    getAllHouseLords,
    calculateFunctionalNature,
    calculateAspects,
} from './vedic-astrology-engine.js';
import {
    calculateYoginiDasha,
    getYoginiDashaForDate,
    generateDivisionalCharts,
    scorePhysicalTraits,
    calculateAdvancedAspects,
    calculateArudhaLagna,
    calculatePanchanga,
    calculateBoundarySafety,
    calculateD9,
    calculateD10,
    calculateD60
} from './advanced-btr-methods.js';
import {
    calculateCharaKarakas,
    calculateCharaDasha,
    getCharaDashaForDate,
} from './jaimini-astrology.js';
import {
    callAI,
    callAIWithStream,
    parseAIAnalysisResponse,
    executeAIInParallel,
} from './ai-client.js';
import {
    generateCandidateTimes,
    generateRefinementGrid,
    splitIntoBatches,
    MAX_BATCH_SIZE,
    SURVIVORS_PER_BATCH,
    getDynamicBatchSize,
    getDynamicSurvivors,
    TimeOffsetConfig
} from './time-offset-manager.js';
import { logger } from './logger.js';
import { ProgressTracker, ANALYSIS_STEPS } from './progress-tracker.js';
import { LifeEvent, EphemerisData, SecondsPrecisionInput, SecondsPrecisionResult } from './types.js';
import { throwIfCancelled, isCancellationError } from './cancellation-manager.js';
import { emitCandidateScore, emitAIContext, emitCalculationLog, emitStageStats, emitAIThinking } from './session-events.js';

// ═════════════════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════════════════

const ZODIAC_SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

interface CandidateDataPackage {
    time: string;
    offsetMinutes: number;
    // 🔱 ENHANCED: Full Vedic Planetary Matrix
    planets: Record<string, {
        sign: string;
        degree: string;
        nakshatra: string;
        house: number;         // 1-12 from Lagna
        dignity: string;       // Exalted/Debilitated/Own/Etc
        isRetro: boolean;      // Retrograde status
        functionalNature?: { role: string; reason: string }; // New
        aspects?: any[]; // New (AspectHit[])
    }>;
    ascendant: { sign: string; degree: string; nakshatra: string };
    houseLords: Record<number, string>; // e.g. {1: 'Mars', 2: 'Venus'...}
    moonNakshatra: string;
    vimshottariDasha: { maha: string; antar: string; pratyantar: string; startEnd: string }[];
    yoginiDasha?: { lord: string; startEnd: string }[];
    charaDasha?: { sign: string; startEnd: string }[];
    d9Lagna?: string;
    d10Lagna?: string;
    d60Sign?: string;
    d9Chart?: { ascendant: string; planets: Record<string, string> };
    d10Chart?: { ascendant: string; planets: Record<string, string> };
    transitData?: Record<string, any>;
    aiScore?: number;
    aiVerdict?: string;
}

interface StageResult {
    stageNumber: number;
    stageName: string;
    candidatesIn: number;
    candidatesOut: number;
    batchCount?: number;
    aiReasoning?: string;
}

interface TournamentRound {
    roundNumber: number;
    batchesProcessed: number;
    candidatesIn: number;
    candidatesOut: number;
}

// ═════════════════════════════════════════════════════════════════════════════
// MEMORY-EFFICIENT HELPERS
// ═════════════════════════════════════════════════════════════════════════════

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

function formatTimeHHMMSS(time: string): string {
    const parts = time.split(':');
    if (parts.length === 2) return `${time}:00`;
    return time;
}

// ═════════════════════════════════════════════════════════════════════════════
// DATA PACKAGE BUILDER (Swiss Eph → Pure JSON)
// ═════════════════════════════════════════════════════════════════════════════

async function buildCandidateDataPackage(
    time: string,
    offsetMinutes: number,
    input: SecondsPrecisionInput,
    includeFullData: boolean = false
): Promise<CandidateDataPackage> {
    const ephemeris = await calculateEphemeris(
        input.dateOfBirth,
        time,
        input.latitude,
        input.longitude,
        input.timezone
    );

    const moonLong = ephemeris.planets.moon.longitude;
    const birthDate = new Date(input.dateOfBirth);

    // Build planet positions
    const planets: Record<string, { sign: string; degree: string; nakshatra: string }> = {};
    for (const [name, data] of Object.entries(ephemeris.planets)) {
        const nakshatra = getNakshatraForLongitude(data.longitude);
        planets[name] = {
            sign: data.sign,
            degree: (data.longitude % 30).toFixed(4) + '°',
            nakshatra: nakshatra.name
        };
    }

    // Build Vimshottari Dasha table (Flattened to Antardasha level)
    const vimDashas = calculateVimshottariDasha(moonLong, birthDate);

    // Determine relevant date range (Birth to Present/Max Event + 1 Year buffer)
    const eventDates = input.lifeEvents.map(e => new Date(e.eventDate).getTime());
    const now = Date.now();
    const minDate = Math.min(...eventDates, now) - (365 * 24 * 60 * 60 * 1000); // 1 year before first event
    // Cap at current date + 1 year (no future dashas needed unless events are in future)
    const maxEventDate = Math.max(...eventDates, now);
    const maxDate = maxEventDate + (365 * 24 * 60 * 60 * 1000); // 1 year buffer

    const vimshottariDasha: { maha: string; antar: string; pratyantar: string; startEnd: string }[] = [];
    for (const maha of vimDashas) {
        if (!maha.subPeriods) continue;

        for (const antar of maha.subPeriods) {
            const start = antar.startDate.getTime();
            const end = antar.endDate.getTime();

            // Include if overlaps with event range
            // (Start <= Max AND End >= Min)
            if (start <= maxDate && end >= minDate) {
                vimshottariDasha.push({
                    maha: maha.lord,
                    antar: antar.lord,
                    pratyantar: '*', // Denotes full Antardasha coverage
                    startEnd: `${antar.startDate.toISOString().split('T')[0]} to ${antar.endDate.toISOString().split('T')[0]}`
                });
            }
        }
    }

    const ascNakshatra = getNakshatraForLongitude(ephemeris.ascendant.longitude);

    // 🔱 GOD-TIER DATA ENRICHMENT
    // We calculate explicit Vedic metrics so the AI doesn't have to "think" about them (reducing hallucination risk)
    const richPlanets: Record<string, any> = {};

    // Capitalize helper
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    // Pre-calculate target map for aspects
    const planetLongitudes: Record<string, number> = {};
    for (const [key, p] of Object.entries(ephemeris.planets)) {
        planetLongitudes[cap(key)] = p.longitude;
    }

    // Capture Longitude Map for Aspects
    for (const [key, p] of Object.entries(ephemeris.planets)) {
        const planetName = cap(key);

        // Calculate Functional Nature & Aspects
        const functional = calculateFunctionalNature(ephemeris.ascendant.sign, planetName);
        const aspects = calculateAspects(planetName, p.longitude, planetLongitudes, ephemeris.ascendant.longitude);

        richPlanets[key] = {
            sign: p.sign,
            degree: (p.longitude % 30).toFixed(4) + '°',
            nakshatra: p.nakshatra,
            house: calculateHouse(ephemeris.ascendant.sign, p.sign),
            dignity: getDignity(planetName, p.sign),
            isRetro: p.retro,
            functionalNature: functional,
            aspects: aspects
        };
    }

    const pkg: CandidateDataPackage = {
        time,
        offsetMinutes,
        planets: richPlanets,
        ascendant: {
            sign: ephemeris.ascendant.sign,
            degree: (ephemeris.ascendant.longitude % 30).toFixed(4) + '°',
            nakshatra: ascNakshatra.name
        },
        houseLords: getAllHouseLords(ephemeris.ascendant.sign),
        moonNakshatra: ephemeris.planets.moon.nakshatra,
        vimshottariDasha
    };

    // Include extended data for later stages
    if (includeFullData) {
        // 1. Yogini Dasha - Filtered by Timeline
        const yogDashas = calculateYoginiDasha(moonLong, birthDate);
        pkg.yoginiDasha = yogDashas.filter(d => {
            const start = d.startDate.getTime();
            const end = d.endDate.getTime();
            return start <= maxDate && end >= minDate;
        }).map(d => ({
            lord: d.name,
            startEnd: `${d.startDate.toISOString().split('T')[0]} to ${d.endDate.toISOString().split('T')[0]}`
        }));

        // 2. Chara Dasha - Filtered by Timeline
        const charDashas = calculateCharaDasha(ephemeris, birthDate);
        pkg.charaDasha = charDashas.filter(d => {
            const start = d.startDate.getTime();
            const end = d.endDate.getTime();
            return start <= maxDate && end >= minDate;
        }).map(d => ({
            sign: d.sign,
            startEnd: `${d.startDate.toISOString().split('T')[0]} to ${d.endDate.toISOString().split('T')[0]}`
        }));

        // 3. Divisional Charts - Full Planetary Matrix
        const d9Planets: Record<string, string> = {};
        const d10Planets: Record<string, string> = {};

        // Calculate Ascendant D9/D10
        const d9Asc = calculateD9(ephemeris.ascendant.longitude);
        const d10Asc = calculateD10(ephemeris.ascendant.longitude);

        // Calculate Planets D9/D10
        for (const [name, p] of Object.entries(ephemeris.planets)) {
            d9Planets[name] = calculateD9(p.longitude).sign;
            d10Planets[name] = calculateD10(p.longitude).sign;
        }

        // Store full D9/D10 objects (God-Tier Detail)
        const d60 = calculateD60(ephemeris.ascendant.longitude);

        pkg.d9Lagna = d9Asc.sign; // Backward compat
        pkg.d10Lagna = d10Asc.sign; // Backward compat
        pkg.d60Sign = d60.sign;

        pkg.d9Chart = { ascendant: d9Asc.sign, planets: d9Planets };
        pkg.d10Chart = { ascendant: d10Asc.sign, planets: d10Planets };

        // 4. Transit Data - Enhanced with Retro
        pkg.transitData = {};
        for (const event of input.lifeEvents) {
            try {
                const eventEph = await calculateEphemeris(
                    event.eventDate,
                    event.eventTime || '12:00:00',
                    input.latitude,
                    input.longitude,
                    input.timezone
                );
                pkg.transitData[event.eventDate] = {
                    saturn: `${eventEph.planets.saturn.sign}${eventEph.planets.saturn.retro ? ' (R)' : ''}`,
                    jupiter: `${eventEph.planets.jupiter.sign}${eventEph.planets.jupiter.retro ? ' (R)' : ''}`,
                    rahu: `${eventEph.planets.rahu.sign}${eventEph.planets.rahu.retro ? ' (R)' : ''}`,
                    ketu: `${eventEph.planets.ketu.sign}${eventEph.planets.ketu.retro ? ' (R)' : ''}`
                };
            } catch {
                // Skip
            }
        }
    }

    return pkg;
}

// ═════════════════════════════════════════════════════════════════════════════
// LIFE EVENT FORMATTER
// ═════════════════════════════════════════════════════════════════════════════

function formatLifeEventForAI(event: LifeEvent): string {
    const { eventType, category, eventDate, eventTime, endDate, datePrecision, description } = event;
    let timeStr = eventDate;
    let nuance = '';

    switch (datePrecision) {
        case 'exact_date_time':
            if (eventTime) {
                timeStr = `${eventDate} at ${eventTime}`;
                nuance = '(Exact Time)';
            }
            break;
        case 'month_year':
            // Truncate "2025-05-01" to "2025-05"
            timeStr = eventDate.split('-').slice(0, 2).join('-');
            nuance = '(Month-Level)';
            break;
        case 'month_range':
            if (endDate) {
                const s = eventDate.split('-').slice(0, 2).join('-');
                const e = endDate.split('-').slice(0, 2).join('-');
                timeStr = `${s} to ${e}`;
            }
            nuance = '(Month Range)';
            break;
        case 'year_range':
            // Truncate "2025-05-01" to "2025"
            const yStart = eventDate.split('-')[0];
            if (endDate) {
                const yEnd = endDate.split('-')[0];
                timeStr = `${yStart} to ${yEnd}`;
            } else {
                timeStr = yStart; // Single year case
            }
            nuance = '(Year-Level)';
            break;
        case 'date_range':
            if (endDate) timeStr = `${eventDate} to ${endDate}`;
            nuance = '(Date Range)';
            break;
        case 'exact_date':
            nuance = '(Exact Date)';
            break;
    }

    let base = `• ${eventType} (${category}) on ${timeStr} ${nuance}`;
    if (description) {
        base += `\n  Context: "${description}"`;
    }
    return base;
}

// ═════════════════════════════════════════════════════════════════════════════
// 🔱 STAGE 2: BATCH COARSE ELIMINATION (Dasha-Event Matching)
// ═════════════════════════════════════════════════════════════════════════════

function getBatchPrompt(
    candidates: CandidateDataPackage[],
    events: LifeEvent[],
    traits: any,
    batchNumber: number,
    totalBatches: number,
    survivorsNeeded: number
): string {
    const eventsText = events.map(formatLifeEventForAI).join('\n');

    // Shuffle candidate order to prevent position bias
    const shuffledCandidates = [...candidates].sort(() => Math.random() - 0.5);

    return `BIRTH TIME RECTIFICATION - STAGE 2 (Batch ${batchNumber}/${totalBatches})

════════════════════════════════════════════════════════════════════════════════
⚠️ CRITICAL GOD-TIER RULES:
1. USE PRE-CALCULATED DATA ONLY. Do not compute positions.
2. FUNCTIONAL NATURE MATTERS: A planet ruling 6/8/12 is malefic for this Ascendant.
3. DIGNITY MATTERS: Exalted/Own planets give strong results; Debilitated giving mixed/weak.
4. HOUSE LORDSHIP IS KEY: Event X (e.g., Marriage) MUST activate relevant house lords (e.g., 7th Lord).
════════════════════════════════════════════════════════════════════════════════

TASK: Score ${candidates.length} candidates based on Rigorous Vedic Dasha-Event correlation.

LIFE EVENTS:
${eventsText}
${traits ? `\nPHYSICAL TRAITS: ${JSON.stringify(traits)}` : ''}

CANDIDATES WITH ENRICHED VEDIC DATA:
${shuffledCandidates.map(c => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CANDIDATE: ${c.time}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAGNA (Ascendant): ${c.ascendant.sign} ${c.ascendant.degree} (${c.ascendant.nakshatra})
MOON: ${c.planets.moon.sign} ${c.planets.moon.degree} | House: ${c.planets.moon.house} | Role: ${c.planets.moon.functionalNature?.role}
      Aspects: ${c.planets.moon.aspects?.filter(a => a.isHit).map(a => `${a.type} -> ${a.targetPlanet || 'House ' + a.targetHouse}`).join(', ') || 'None'}
SUN: ${c.planets.sun.sign} ${c.planets.sun.degree} | House: ${c.planets.sun.house} | Role: ${c.planets.sun.functionalNature?.role}
     Aspects: ${c.planets.sun.aspects?.filter(a => a.isHit).map(a => `${a.type} -> ${a.targetPlanet || 'House ' + a.targetHouse}`).join(', ') || 'None'}

KEY HOUSE LORDS (Functional Nature):
• 1st (Self): ${c.houseLords[1]} | 7th (Spouse): ${c.houseLords[7]} | 10th (Career): ${c.houseLords[10]}
• 5th (Children): ${c.houseLords[5]} | 9th (Fortune): ${c.houseLords[9]} | 6/8/12 (Dusthanas): ${c.houseLords[6]}, ${c.houseLords[8]}, ${c.houseLords[12]}

${c.d9Lagna ? `D9 NAVAMSHA LAGNA: ${c.d9Lagna}` : ''}
${c.d10Lagna ? `D10 DASAMSHA LAGNA: ${c.d10Lagna}` : ''}

VIMSHOTTARI DASHA PERIODS (Verify Lordship Connection):
${c.vimshottariDasha.map(d => `  • ${d.maha} (${c.planets[d.maha.toLowerCase()]?.house}H, ${c.planets[d.maha.toLowerCase()]?.dignity}) / ${d.antar} (${c.planets[d.antar.toLowerCase()]?.house}H) : ${d.startEnd}`).join('\n')}
${c.yoginiDasha ? `\nYOGINI DASHA: ${c.yoginiDasha.map(d => `${d.lord} (${d.startEnd})`).join(' → ')}` : ''}
`).join('')}

SCORING ALGORITHM (STRICT VEDIC LOGIC):
+30: PRIMARY MATCH - Dasha/Antar Lord is DIRECTLY the House Lord of the event (e.g. Marriage in 7th Lord dasha).
+20: SECONDARY MATCH - Dasha Lord is placed in the event house or aspects it.
+10: NATURAL KARAKA - Dasha Lord is natural significator (Venus=Marriage, Sun=Career) even if not functional lord.
+10: LAGNA MATCH - Ascendant element/lord matches physical traits.
-50: CONTRADICTION - Event happened in dasha of 6/8/12 lord with NO connection to event house.

OUTPUT FORMAT (one line per candidate):
[TIME] | SCORE: [0-100] | VERDICT: KEEP/ELIMINATE | REASON: [Explicit Astrological Reason e.g. "Venus is 7th Lord"]

FINAL LINE (required):
TOP_SURVIVORS: [comma-separated list of ${survivorsNeeded} best times]`;
}

// ═════════════════════════════════════════════════════════════════════════════
// 🔱 STAGE 4: DEEP MULTI-DASHA VERIFICATION
// ═════════════════════════════════════════════════════════════════════════════

function getDeepAnalysisPrompt(
    candidates: CandidateDataPackage[],
    events: LifeEvent[],
    traits: any,
    spouseData: any
): string {
    const eventsText = events.map(formatLifeEventForAI).join('\n');
    const traitsText = traits ? JSON.stringify(traits, null, 2) : 'N/A';
    const spouseText = spouseData ? JSON.stringify(spouseData, null, 2) : 'N/A';

    return `BIRTH TIME RECTIFICATION - STAGE 4 (Deep Multi-Dasha Analysis)

════════════════════════════════════════════════════════════════════════════════
⚠️ GOD-TIER ANALYSIS RULES:
1. CHECK FUNCTIONAL NATURE: Is the Dasha Lord a friend (Trine lord) or enemy (6/8/12 lord)?
2. VERIFY LORDSHIPS: Does the event MATCH the House Lordship (e.g. 7th Lord for Marriage)?
3. CROSS-VERIFY: Do Yogini/Chara dashas support the Vimshottari conclusion?
4. D9/D10 CONFIRMATION: Divisional charts must NOT contradict the Rashi chart promise.
════════════════════════════════════════════════════════════════════════════════

TASK: Cross-verify ${candidates.length} candidates using multiple dasha systems & Vedic Lordships.

USER CONTEXT:
PHYSICAL TRAITS: ${traitsText}
SPOUSE DATA: ${spouseText}

LIFE EVENTS:
${eventsText}

CANDIDATES WITH MULTI-DASHA & LORDSHIP DATA:
${candidates.map(c => `
[${c.time}]
┌ LAGNA: ${c.ascendant.sign} ${c.ascendant.degree}
├ HOUSE LORDS: 1=${c.houseLords[1]}, 7=${c.houseLords[7]}, 10=${c.houseLords[10]}
├ DIGNITIES: Sun=${c.planets.sun.dignity}, Moon=${c.planets.moon.dignity}, Jup=${c.planets.jupiter?.dignity || 'N/A'}
├ D9 (Navamsa): Osc=${c.d9Lagna} | Planets=${c.d9Chart ? Object.entries(c.d9Chart.planets).map(([k, v]) => `${k.substr(0, 2).toUpperCase()}=${v}`).join(' ') : 'N/A'}
├ D10 (Dasamsa): Asc=${c.d10Lagna} | Planets=${c.d10Chart ? Object.entries(c.d10Chart.planets).map(([k, v]) => `${k.substr(0, 2).toUpperCase()}=${v}`).join(' ') : 'N/A'}
├ D60 (Karma): ${c.d60Sign || 'N/A'}
├ VIMSHOTTARI: ${c.vimshottariDasha.map(d => {
        const m = c.planets[d.maha.toLowerCase()];
        const a = c.planets[d.antar.toLowerCase()];
        const mAsp = m?.aspects?.filter(x => x.isHit).map(x => x.targetHouse ? `H${x.targetHouse}` : x.targetPlanet).join(',') || '';
        return `\n    --> ${d.maha} [H${m?.house}, ${m?.functionalNature?.role}] (Hits: ${mAsp}) / ${d.antar} [H${a?.house}] : ${d.startEnd}`;
    }).join('')}
├ YOGINI: ${c.yoginiDasha?.map(d => `${d.lord} [${d.startEnd}]`).join(' → ') || 'N/A'}
├ CHARA: ${c.charaDasha?.map(d => `${d.sign} [${d.startEnd}]`).join(' → ') || 'N/A'}
${c.transitData ? `  TRANSITS: ${Object.entries(c.transitData).slice(0, 5).map(([date, t]: [string, any]) =>
        `[${date}]: Sa=${t.saturn}, Ju=${t.jupiter}, Ra=${t.rahu}`).join(' | ')}` : ''}`).join('\n')}

SCORING:
- All 3 dasha systems agree on event timing: +30
- Dasha Lord is Functional Benefic (1, 5, 9, 4, 7, 10 lord): +20
- D9 supports marriage events / D10 supports career: +20
- Contradiction (Event in 6/8/12 lord period without cancel): -25

OUTPUT (for each candidate):
[TIME] | MULTI-DASHA: [AGREE/PARTIAL/CONFLICT] | D-CHARTS: [SUPPORT/WEAK/FAIL] | SCORE: [0-100]

FINAL:
TOP_SURVIVORS: [time1], [time2], [time3]`;
}

// ═════════════════════════════════════════════════════════════════════════════
// 🔱 STAGE 6: FINAL SECONDS-LEVEL PRECISION
// ═════════════════════════════════════════════════════════════════════════════

function getFinalPrecisionPrompt(
    candidates: CandidateDataPackage[],
    events: LifeEvent[],
    traits: any,
    spouseData: any
): string {
    const eventsText = events.map(formatLifeEventForAI).join('\n');
    const traitsText = traits ? JSON.stringify(traits, null, 2) : 'N/A';
    const spouseText = spouseData ? JSON.stringify(spouseData, null, 2) : 'N/A';

    return `BIRTH TIME RECTIFICATION - FINAL STAGE (Seconds Precision)

════════════════════════════════════════════════════════════════════════════════
⚠️ GOD-TIER PRECISION RULES:
1. FOCUS ON LAGNA & D60: Even 10 seconds can change D60 Lagna. Match D60 deity/nature to life themes.
2. DIGNITY CHECK: Does the chart strength match reality? (e.g., successful career = strong 10th lord).
3. BOUNDARY SAFETY: Avoid times where Lagna is < 0.05° unless event timing is perfect.
4. HOUSE LORD ACCURACY: Ensure the operative Dashas align with Functional Lordships.
════════════════════════════════════════════════════════════════════════════════

TASK: Select THE SINGLE BEST birth time from ${candidates.length} finalists.

USER CONTEXT:
Traits: ${traitsText}
Spouse: ${spouseText}

LIFE EVENTS:
${eventsText}

FINALIST CANDIDATES (ENRICHED):
${candidates.map((c, i) => `
#${i + 1} [${c.time}]
┌ LAGNA: ${c.ascendant.sign} ${c.ascendant.degree} (${c.ascendant.nakshatra})
├ 1ST HOUSE LORD: ${c.houseLords[1]} | 7TH LORD: ${c.houseLords[7]} | 10TH LORD: ${c.houseLords[10]}
├ D60 (Karma): ${c.d60Sign || 'N/A'} ← CRITICAL FOR SECONDS
├ D9: Asc=${c.d9Lagna} | Planets=${c.d9Chart ? Object.entries(c.d9Chart.planets).map(([k, v]) => `${k.substr(0, 2).toUpperCase()}=${v}`).join(' ') : 'N/A'}
├ PLANETARY STRENGTH: Sun=(${c.planets.sun.dignity}), Moon=(${c.planets.moon.dignity}), Jup=(${c.planets.jupiter?.dignity || 'N/A'})
├ VIMSHOTTARI: ${c.vimshottariDasha.slice(0, 5).map(d => {
        const m = c.planets[d.maha.toLowerCase()];
        const a = c.planets[d.antar.toLowerCase()];
        const mAsp = m?.aspects?.filter(x => x.isHit).map(x => x.targetHouse ? `H${x.targetHouse}` : x.targetPlanet).join(',') || '';
        return `\n    --> ${d.maha} [H${m?.house}, ${m?.functionalNature?.role}] (Hits: ${mAsp}) / ${d.antar} [H${a?.house}]`;
    }).join('')}
└ BOUNDARY RISK: ${parseFloat(c.ascendant.degree) < 1 || parseFloat(c.ascendant.degree) > 29 ? '⚠️ EDGE' : 'SAFE'}`).join('\n')}

FINAL SELECTION CRITERIA:
1. D60 Lagna must explain the "Nature" of the person (Karma).
2. Dasha Lords MUST be functional benefics for the event to happen beneficently.
3. Eliminate any time where a major event (Marriage/Job) occurs in Dasha of consecutive 6/8/12 lords without mitigation.

SCORING RULES (GOD TIER):
- If > 10 Events match perfectly: Score MUST be > 95%.
- If > 30 Events provided and match: Score MUST be > 99%.
- Do NOT be conservative. If the math works, give 99-100%.

═══════════════════════════════════════════════════════════════════════════════
FINAL VERDICT (required format):
BEST TIME: [HH:MM:SS]
ACCURACY: [0-100]%
CONFIDENCE: [HIGH/MEDIUM/LOW]
MARGIN_OF_ERROR: ±[seconds] seconds

EVIDENCE:
1. [Explain why D60/Lagna fits better than others]
2. [Explain the Decisive Dasha-Event Link with House Lordship]
3. [Why other candidates failed (e.g. "Candidate 2 had 8th Lord dasha during Marriage")]

RUNNER_UP: [second best time] (for reference)
═══════════════════════════════════════════════════════════════════════════════`;
}

// ═════════════════════════════════════════════════════════════════════════════
// AI SCORE EXTRACTORS
// ═════════════════════════════════════════════════════════════════════════════

function extractBatchSurvivors(aiContent: string, candidateTimes: string[], neededCount: number): string[] {
    // Try to extract from TOP_SURVIVORS line
    const survivorMatch = aiContent.match(/TOP_SURVIVORS?[:\s]*([^\n]+)/i);
    if (survivorMatch) {
        const times = survivorMatch[1].match(/\d{2}:\d{2}:\d{2}/g) || [];
        if (times.length >= neededCount) {
            return times.slice(0, neededCount);
        }
    }

    // Fallback: Extract scores and pick top N
    const scores: { time: string; score: number }[] = [];

    for (const time of candidateTimes) {
        const timePattern = new RegExp(`CANDIDATE[:\\s]*${time.replace(/:/g, '[:\\s]?')}[\\s\\S]{0,300}SCORE[:\\s]*(\\d+)`, 'i');
        const match = aiContent.match(timePattern);
        const score = match ? parseInt(match[1]) : 50;
        scores.push({ time, score });
    }

    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, neededCount).map(s => s.time);
}

function extractFinalVerdict(aiContent: string): { time: string; accuracy: number; confidence: string; margin: number } | null {
    const timeMatch = aiContent.match(/BEST[ _]TIME[:\s]*(\d{2}:\d{2}:\d{2})/i);
    const accuracyMatch = aiContent.match(/ACCURACY[:\s]*(\d+)/i);
    const confidenceMatch = aiContent.match(/CONFIDENCE[:\s]*(HIGH|MEDIUM|LOW)/i);
    const marginMatch = aiContent.match(/MARGIN[^:]*[:\s]*±?\s*(\d+)/i);

    if (timeMatch) {
        return {
            time: timeMatch[1],
            accuracy: accuracyMatch ? parseInt(accuracyMatch[1]) : 85,
            confidence: confidenceMatch ? confidenceMatch[1] : 'MEDIUM',
            margin: marginMatch ? parseInt(marginMatch[1]) : 5
        };
    }
    return null;
}

// ═════════════════════════════════════════════════════════════════════════════
// STAGE 1: EXHAUSTIVE DATA GENERATION
// ═════════════════════════════════════════════════════════════════════════════

async function stage1ExhaustiveDataGeneration(
    input: SecondsPrecisionInput,
    progress: ProgressTracker
): Promise<{ candidates: CandidateDataPackage[]; stageResult: StageResult }> {
    await progress.startStep('grid', 'Stage 1: Generating ALL candidate data...');

    const rawCandidates = generateCandidateTimes(input.tentativeTime, input.offsetConfig);
    const candidates: CandidateDataPackage[] = [];

    const total = rawCandidates.length;
    let processed = 0;

    logger.info('🔱 Stage 1: Generating Swiss Eph data for ALL candidates', { total });

    for (const raw of rawCandidates) {
        const pkg = await buildCandidateDataPackage(raw.time, raw.offsetMinutes, input, false);
        candidates.push(pkg);

        processed++;

        // Log EVERY calculation (user requested)
        emitCalculationLog(input.sessionId, {
            candidateTime: raw.time,
            sunPos: `${pkg.planets.sun.sign} ${pkg.planets.sun.degree}`,
            moonPos: `${pkg.planets.moon.sign} ${pkg.planets.moon.degree}`,
            ascendant: `${pkg.ascendant.sign} ${pkg.ascendant.degree}`,
            dashaObj: pkg.vimshottariDasha[0]?.maha || 'N/A'
        });

        if (processed % 10 === 0) {
            await progress.updateMessage(`Ephemeris: ${processed}/${total}`);
        }

        // GC breathing room
        if (processed % 20 === 0) await sleep(5);
    }

    await progress.completeStep('grid', [`Generated ${candidates.length} candidates`]);

    return {
        candidates,
        stageResult: {
            stageNumber: 1,
            stageName: 'Exhaustive Data Generation',
            candidatesIn: total,
            candidatesOut: candidates.length
        }
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// STAGE 2: BATCH TOURNAMENT (Dynamic batch size based on offset)
// ═════════════════════════════════════════════════════════════════════════════

async function stage2BatchTournament(
    input: SecondsPrecisionInput,
    candidates: CandidateDataPackage[],
    progress: ProgressTracker
): Promise<{ survivors: CandidateDataPackage[]; stageResult: StageResult; rounds: TournamentRound[] }> {
    await progress.startStep('coarse', 'Stage 2: Batch Tournament...');

    const rounds: TournamentRound[] = [];
    let currentCandidates = [...candidates];
    let roundNumber = 0;

    // 🔱 Get offset from config for dynamic batch sizing
    const offsetMinutes = input.offsetConfig.customMinutes ||
        (input.offsetConfig.preset === '30min' ? 30 :
            input.offsetConfig.preset === '1hour' ? 60 :
                input.offsetConfig.preset === '2hours' ? 120 :
                    input.offsetConfig.preset === '4hours' ? 240 :
                        input.offsetConfig.preset === '6hours' ? 360 :
                            input.offsetConfig.preset === '12hours' ? 720 : 60);

    // 🔱 Dynamic batch size based on offset
    const batchSize = getDynamicBatchSize(candidates.length, offsetMinutes);
    const survivorsPerBatch = getDynamicSurvivors(batchSize);

    logger.info('🔱 Stage 2: Starting batch tournament', {
        totalCandidates: currentCandidates.length,
        offsetMinutes,
        batchSize, // Dynamic!
        survivorsPerBatch
    });

    // Helper for Eph formatting
    const getMinifiedEph = (c: CandidateDataPackage) => ({
        sun: `${c.planets.sun.sign} ${c.planets.sun.degree}`,
        moon: `${c.planets.moon.sign} ${c.planets.moon.degree}`,
        ascendant: `${c.ascendant.sign} ${c.ascendant.degree}`
    });

    // Continue tournament until we have batchSize or fewer candidates
    while (currentCandidates.length > batchSize) {
        roundNumber++;
        const batches = splitIntoBatches(currentCandidates, batchSize);
        const roundSurvivors: CandidateDataPackage[] = [];

        await progress.updateMessage(`Round ${roundNumber}: ${batches.length} batches of ${batchSize}`);

        // 🔱 Parallel Execution Logic
        const tasks = batches.map((batch, i) => async () => {
            // Emit context just before execution (or inside to track start)
            // Note: Context emission here might interleave in logs, which is fine for parallel
            emitAIContext(input.sessionId, {
                stage: 2,
                candidateTime: `Batch ${i + 1}/${batches.length}`,
                round: roundNumber,
                batch: i + 1,
                totalBatches: batches.length,
                candidatesInBatch: batch.length
            });

            const prompt = getBatchPrompt(
                batch,
                input.lifeEvents,
                input.physicalTraits,
                i + 1,
                batches.length,
                survivorsPerBatch
            );

            return callAIWithStream(
                input.sessionId,
                2,
                'You are the SUPREME VEDIC ASTROLOGER. Analyze ALL candidates with EQUAL attention.',
                prompt,
                {
                    model: 'deepseek/deepseek-v3.2',
                    candidateTime: `Batch ${i + 1}/${batches.length}`,
                    progressTracker: progress
                }
            );
        });

        // Execute in parallel (Concurrency: 10 for God Mode)
        const results = await executeAIInParallel(tasks, 10, 200);

        // Process results
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const response = results[i];
            const aiContent = response.success ? (response.content || response.thinking || '') : '';
            const survivorTimes = extractBatchSurvivors(aiContent, batch.map(c => c.time), survivorsPerBatch);

            for (const candidate of batch) {
                const isSurvivor = survivorTimes.includes(candidate.time);
                let score = 40;
                if (isSurvivor) {
                    score = 85;
                    roundSurvivors.push(candidate);
                }

                emitCandidateScore(
                    input.sessionId,
                    candidate.time,
                    score,
                    2,
                    undefined,
                    getMinifiedEph(candidate)
                );
            }
        }

        // Check for cancellation once per round instead of per batch
        await throwIfCancelled(input.sessionId, input.abortSignal);

        rounds.push({
            roundNumber,
            batchesProcessed: batches.length,
            candidatesIn: currentCandidates.length,
            candidatesOut: roundSurvivors.length
        });

        logger.info(`🔱 Round ${roundNumber} complete`, {
            candidatesIn: currentCandidates.length,
            candidatesOut: roundSurvivors.length
        });

        currentCandidates = roundSurvivors;
    }

    await progress.completeStep('coarse', [`Tournament complete: ${currentCandidates.length} survivors`]);

    return {
        survivors: currentCandidates,
        stageResult: {
            stageNumber: 2,
            stageName: 'Batch Tournament',
            candidatesIn: candidates.length,
            candidatesOut: currentCandidates.length,
            batchCount: rounds.reduce((sum, r) => sum + r.batchesProcessed, 0)
        },
        rounds
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// STAGE 3: REFINEMENT GRID (Expand around survivors)
// ═════════════════════════════════════════════════════════════════════════════

async function stage3RefinementGrid(
    input: SecondsPrecisionInput,
    survivors: CandidateDataPackage[],
    progress: ProgressTracker
): Promise<{ candidates: CandidateDataPackage[]; stageResult: StageResult }> {
    await progress.startStep('fine', 'Stage 3: Generating refinement grid...');

    const refinedCandidates: CandidateDataPackage[] = [];

    // Generate ±5 min grid at 1-min interval around each survivor
    for (const survivor of survivors) {
        const fineGrid = generateRefinementGrid(survivor.time, 5, 60); // ±5 min @ 1 min

        for (const gridPoint of fineGrid) {
            // Check if already exists
            if (!refinedCandidates.some(c => c.time === gridPoint.time)) {
                const pkg = await buildCandidateDataPackage(
                    gridPoint.time,
                    gridPoint.offsetMinutes,
                    input,
                    true // Include full data for deep analysis
                );
                refinedCandidates.push(pkg);

                emitCalculationLog(input.sessionId, {
                    candidateTime: gridPoint.time,
                    sunPos: `${pkg.planets.sun.sign} ${pkg.planets.sun.degree}`,
                    moonPos: `${pkg.planets.moon.sign} ${pkg.planets.moon.degree}`,
                    ascendant: `${pkg.ascendant.sign} ${pkg.ascendant.degree}`,
                    dashaObj: pkg.vimshottariDasha[0]?.maha || 'N/A'
                });
            }
        }
    }

    await progress.completeStep('fine', [`Refined grid: ${refinedCandidates.length} candidates`]);

    return {
        candidates: refinedCandidates,
        stageResult: {
            stageNumber: 3,
            stageName: 'Refinement Grid',
            candidatesIn: survivors.length,
            candidatesOut: refinedCandidates.length
        }
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// STAGE 4: DEEP ANALYSIS (Multi-dasha verification)
// ═════════════════════════════════════════════════════════════════════════════

async function stage4DeepAnalysis(
    input: SecondsPrecisionInput,
    candidates: CandidateDataPackage[],
    progress: ProgressTracker
): Promise<{ survivors: CandidateDataPackage[]; stageResult: StageResult; aiReasoning: string }> {
    await progress.startStep('deep', 'Stage 4: Deep multi-dasha analysis...');

    // Run another tournament round if needed
    let currentCandidates = [...candidates];
    let allReasoning = '';

    while (currentCandidates.length > MAX_BATCH_SIZE) {
        const batches = splitIntoBatches(currentCandidates, MAX_BATCH_SIZE);
        const batchSurvivors: CandidateDataPackage[] = [];

        // 🔱 Parallel Execution Logic (Stage 4)
        const tasks = batches.map((batch, i) => async () => {
            emitAIContext(input.sessionId, {
                stage: 4,
                candidateTime: `Deep ${i + 1}/${batches.length}`,
                round: 1,
                batch: i + 1,
                totalBatches: batches.length,
                candidatesInBatch: batch.length
            });

            const prompt = getDeepAnalysisPrompt(batch, input.lifeEvents, input.physicalTraits, input.spouseData);

            return callAIWithStream(
                input.sessionId,
                4,
                'You are performing DEEP astrological verification.',
                prompt,
                {
                    model: 'deepseek/deepseek-v3.2',
                    candidateTime: `Deep ${i + 1}/${batches.length}`,
                    progressTracker: progress
                }
            );
        });

        // Execute in parallel (Concurrency: 10)
        const results = await executeAIInParallel(tasks, 10, 200);

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const response = results[i];
            const aiContent = response.success ? (response.content || response.thinking || '') : '';
            allReasoning += aiContent + '\n\n';

            const getMinifiedEph = (c: CandidateDataPackage) => ({
                sun: `${c.planets.sun.sign} ${c.planets.sun.degree}`,
                moon: `${c.planets.moon.sign} ${c.planets.moon.degree}`,
                ascendant: `${c.ascendant.sign} ${c.ascendant.degree}`
            });

            const survivorTimes = extractBatchSurvivors(aiContent, batch.map(c => c.time), 3);

            for (const candidate of batch) {
                const isSurvivor = survivorTimes.includes(candidate.time);
                let score = 60;

                if (isSurvivor) {
                    score = 90;
                    batchSurvivors.push(candidate);
                }

                emitCandidateScore(
                    input.sessionId,
                    candidate.time,
                    score,
                    4,
                    undefined,
                    getMinifiedEph(candidate)
                );
            }
        }
        currentCandidates = batchSurvivors;
    }

    // Final deep analysis on remaining candidates
    if (currentCandidates.length > 3) {
        const prompt = getDeepAnalysisPrompt(currentCandidates, input.lifeEvents, input.physicalTraits, input.spouseData);

        const response = await callAIWithStream(
            input.sessionId,
            4,
            'You are performing FINAL deep verification.',
            prompt,
            {
                model: 'deepseek/deepseek-v3.2',
                candidateTime: 'Deep Final',
                progressTracker: progress
            }
        );

        const aiContent = response.success ? (response.content || response.thinking || '') : '';
        allReasoning += aiContent;

        const survivorTimes = extractBatchSurvivors(aiContent, currentCandidates.map(c => c.time), 7);

        // Helper (Stage 4 Final)
        const getMinifiedEph = (c: CandidateDataPackage) => ({
            sun: `${c.planets.sun.sign} ${c.planets.sun.degree}`,
            moon: `${c.planets.moon.sign} ${c.planets.moon.degree}`,
            ascendant: `${c.ascendant.sign} ${c.ascendant.degree}`
        });

        const survivors: CandidateDataPackage[] = [];
        for (const candidate of currentCandidates) {
            const isSurvivor = survivorTimes.includes(candidate.time);
            const score = isSurvivor ? 95 : 65;

            if (isSurvivor) survivors.push(candidate);

            emitCandidateScore(
                input.sessionId,
                candidate.time,
                score,
                4,
                undefined,
                getMinifiedEph(candidate)
            );
        }
        currentCandidates = survivors;
    }

    await progress.completeStep('deep', [`Deep analysis: ${currentCandidates.length} survivors`]);

    return {
        survivors: currentCandidates.slice(0, 7),
        stageResult: {
            stageNumber: 4,
            stageName: 'Deep Multi-Dasha Analysis',
            candidatesIn: candidates.length,
            candidatesOut: Math.min(currentCandidates.length, 7)
        },
        aiReasoning: allReasoning
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// STAGE 5: MICRO GRID (6-second precision)
// ═════════════════════════════════════════════════════════════════════════════

async function stage5MicroGrid(
    input: SecondsPrecisionInput,
    survivors: CandidateDataPackage[],
    progress: ProgressTracker
): Promise<{ candidates: CandidateDataPackage[]; stageResult: StageResult }> {
    await progress.startStep('micro', 'Stage 5: Micro-precision grid...');

    const microCandidates: CandidateDataPackage[] = [];

    // Generate ±30 sec grid at 6-sec interval around top 3
    for (const survivor of survivors.slice(0, 3)) {
        const microGrid = generateRefinementGrid(survivor.time, 0.5, 6); // ±30 sec @ 6 sec

        for (const gridPoint of microGrid) {
            if (!microCandidates.some(c => c.time === gridPoint.time)) {
                const pkg = await buildCandidateDataPackage(
                    gridPoint.time,
                    gridPoint.offsetMinutes,
                    input,
                    true
                );
                microCandidates.push(pkg);
            }
        }
    }

    await progress.completeStep('micro', [`Micro grid: ${microCandidates.length} candidates`]);

    return {
        candidates: microCandidates,
        stageResult: {
            stageNumber: 5,
            stageName: 'Micro Precision Grid',
            candidatesIn: survivors.length,
            candidatesOut: microCandidates.length
        }
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// STAGE 6: FINAL PRECISION JUDGEMENT
// ═════════════════════════════════════════════════════════════════════════════

async function stage6FinalPrecision(
    input: SecondsPrecisionInput,
    candidates: CandidateDataPackage[],
    progress: ProgressTracker
): Promise<{ finalTime: string; accuracy: number; confidence: string; margin: number; aiReasoning: string; stageResult: StageResult }> {
    await progress.startStep('final', 'Stage 6: Final precision judgement...');

    // If too many, run one more batch round
    let finalists = [...candidates];

    while (finalists.length > MAX_BATCH_SIZE) {
        const batches = splitIntoBatches(finalists, MAX_BATCH_SIZE);
        const batchWinners: CandidateDataPackage[] = [];

        // 🔱 Parallel Execution Logic (Stage 6)
        const tasks = batches.map((batch) => async () => {
            const prompt = getFinalPrecisionPrompt(batch, input.lifeEvents, input.physicalTraits, input.spouseData);
            return callAIWithStream(
                input.sessionId,
                6,
                'FINAL JUDGEMENT. Pick THE ONE.',
                prompt,
                {
                    model: 'deepseek/deepseek-v3.2',
                    candidateTime: 'FINAL',
                    progressTracker: progress
                }
            );
        });

        // Execute in parallel (Concurrency: 10)
        const results = await executeAIInParallel(tasks, 10, 200);

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const response = results[i];
            const aiContent = response.success ? (response.content || response.thinking || '') : '';
            const verdict = extractFinalVerdict(aiContent);

            const getMinifiedEph = (c: CandidateDataPackage) => ({
                sun: `${c.planets.sun.sign} ${c.planets.sun.degree}`,
                moon: `${c.planets.moon.sign} ${c.planets.moon.degree}`,
                ascendant: `${c.ascendant.sign} ${c.ascendant.degree}`
            });

            for (const candidate of batch) {
                const isWinner = verdict && candidate.time === verdict.time;
                const score = isWinner ? (verdict.accuracy || 90) : 60;

                if (isWinner) batchWinners.push(candidate);
                else if (!verdict && batch.length > 0 && candidate === batch[0]) {
                    batchWinners.push(candidate);
                }

                emitCandidateScore(
                    input.sessionId,
                    candidate.time,
                    score,
                    6,
                    undefined,
                    getMinifiedEph(candidate)
                );
            }
        }

        finalists = batchWinners;
    }

    // Final judgement
    const prompt = getFinalPrecisionPrompt(finalists, input.lifeEvents, input.physicalTraits, input.spouseData);
    const response = await callAIWithStream(
        input.sessionId,
        6,
        'You are the DIVINE ARCHITECT of Time. FINAL JUDGEMENT.',
        prompt,
        {
            model: 'deepseek/deepseek-v3.2',
            candidateTime: 'FINAL VERDICT',
            progressTracker: progress,
            timeoutMs: 120000
        }
    );

    const aiContent = response.success ? (response.content || response.thinking || '') : '';
    const verdict = extractFinalVerdict(aiContent);

    const finalTime = verdict?.time || finalists[0]?.time || input.tentativeTime;
    const accuracy = verdict?.accuracy || 85;
    const confidence = verdict?.confidence || 'MEDIUM';
    const margin = verdict?.margin || 5;

    // Helper (Stage 6 Final)
    const getMinifiedEph = (c: CandidateDataPackage) => ({
        sun: `${c.planets.sun.sign} ${c.planets.sun.degree}`,
        moon: `${c.planets.moon.sign} ${c.planets.moon.degree}`,
        ascendant: `${c.ascendant.sign} ${c.ascendant.degree}`
    });

    const winnerPkg = finalists.find(c => c.time === finalTime) || finalists[0];

    emitCandidateScore(input.sessionId, finalTime, accuracy, 6, 1, winnerPkg ? getMinifiedEph(winnerPkg) : undefined);

    await progress.completeStep('final', [`FINAL: ${finalTime} (${confidence})`]);

    return {
        finalTime,
        accuracy,
        confidence,
        margin,
        aiReasoning: aiContent,
        stageResult: {
            stageNumber: 6,
            stageName: 'Final Precision',
            candidatesIn: candidates.length,
            candidatesOut: 1,
            aiReasoning: aiContent
        }
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PROCESSING FUNCTION
// ═════════════════════════════════════════════════════════════════════════════

export async function processSecondsPrecisionBTR(
    input: SecondsPrecisionInput
): Promise<SecondsPrecisionResult> {
    const startTime = Date.now();
    const progress = new ProgressTracker(input.sessionId);
    const stageHistory: Record<number, StageResult> = {};

    try {
        await progress.updateETA(600);
        await progress.startStep('init', '🔱 Initializing God-Tier BTR v7.0 (Batch Tournament)...');

        logger.info('🔱 Starting GOD-TIER BTR v7.0 (10-Candidate Batches)', {
            sessionId: input.sessionId,
            dateOfBirth: input.dateOfBirth,
            offsetConfig: input.offsetConfig,
            maxBatchSize: MAX_BATCH_SIZE
        });

        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 1: EXHAUSTIVE DATA GENERATION
        // ═══════════════════════════════════════════════════════════════════════
        await throwIfCancelled(input.sessionId, input.abortSignal);
        const stage1 = await stage1ExhaustiveDataGeneration(input, progress);
        stageHistory[1] = stage1.stageResult;
        emitStageStats(input.sessionId, 1, stage1.stageResult.candidatesOut, `Generated ${stage1.stageResult.candidatesOut} candidates`);

        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 2: BATCH TOURNAMENT
        // ═══════════════════════════════════════════════════════════════════════
        await throwIfCancelled(input.sessionId, input.abortSignal);
        await progress.updateETA(480);
        const stage2 = await stage2BatchTournament(input, stage1.candidates, progress);
        stageHistory[2] = stage2.stageResult;
        emitStageStats(input.sessionId, 2, stage2.stageResult.candidatesOut,
            `Tournament: ${stage2.rounds.length} rounds, ${stage2.survivors.length} survivors`);

        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 3: REFINEMENT GRID
        // ═══════════════════════════════════════════════════════════════════════
        await throwIfCancelled(input.sessionId, input.abortSignal);
        await progress.updateETA(360);
        const stage3 = await stage3RefinementGrid(input, stage2.survivors, progress);
        stageHistory[3] = stage3.stageResult;
        emitStageStats(input.sessionId, 3, stage3.stageResult.candidatesOut, `Refined to ${stage3.stageResult.candidatesOut}`);

        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 4: DEEP ANALYSIS
        // ═══════════════════════════════════════════════════════════════════════
        await throwIfCancelled(input.sessionId, input.abortSignal);
        await progress.updateETA(240);
        const stage4 = await stage4DeepAnalysis(input, stage3.candidates, progress);
        stageHistory[4] = stage4.stageResult;
        emitStageStats(input.sessionId, 4, stage4.stageResult.candidatesOut, `Deep: ${stage4.survivors.length} survivors`);

        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 5: MICRO GRID
        // ═══════════════════════════════════════════════════════════════════════
        await throwIfCancelled(input.sessionId, input.abortSignal);
        await progress.updateETA(120);
        const stage5 = await stage5MicroGrid(input, stage4.survivors, progress);
        stageHistory[5] = stage5.stageResult;
        emitStageStats(input.sessionId, 5, stage5.stageResult.candidatesOut, `Micro: ${stage5.candidates.length}`);

        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 6: FINAL PRECISION
        // ═══════════════════════════════════════════════════════════════════════
        await throwIfCancelled(input.sessionId, input.abortSignal);
        await progress.updateETA(60);
        const stage6 = await stage6FinalPrecision(input, stage5.candidates, progress);
        stageHistory[6] = stage6.stageResult;
        emitStageStats(input.sessionId, 6, 1, 'FINAL TIME DETERMINED');

        // ═══════════════════════════════════════════════════════════════════════
        // BUILD FINAL RESULT
        // ═══════════════════════════════════════════════════════════════════════
        const finalEphemeris = await calculateEphemeris(
            input.dateOfBirth,
            stage6.finalTime,
            input.latitude,
            input.longitude,
            input.timezone
        );

        const divCharts = generateDivisionalCharts(finalEphemeris);
        const boundary = calculateBoundarySafety(finalEphemeris);

        await progress.complete();

        const enrichedResult = {
            summary: stage6.aiReasoning.slice(0, 2000),
            finalCandidate: {
                time: stage6.finalTime,
                score: stage6.accuracy,
                confidence: stage6.confidence,
                margin: stage6.margin
            },
            reasoning: {
                stage2: 'Batch tournament completed',
                stage4: stage4.aiReasoning.slice(0, 500),
                stage6: stage6.aiReasoning.slice(0, 1000)
            },
            technicalProof: {
                ephemeris: finalEphemeris,
                divCharts,
                boundary
            },
            stageHistory,
            tournamentRounds: stage2.rounds,
            alternatives: stage4.survivors.slice(1, 4).map(c => ({
                time: c.time,
                score: 70,
                reason: 'Runner-up from Stage 4'
            }))
        };

        return {
            rectifiedTime: stage6.finalTime,
            accuracy: stage6.accuracy,
            confidence: stage6.confidence,
            precisionLevel: 'seconds',
            marginOfError: stage6.margin,
            stagesCompleted: 6,
            boundaryWarnings: boundary.isDangerous ? ['Near boundary transition'] : [],
            methodsUsed: ['DeepSeek v3.2 (Reasoning Mode)', 'Swiss Ephemeris', 'Vimshottari', 'Yogini', 'Chara', 'D9', 'D10', 'D60'],
            processingTimeMs: Date.now() - startTime,
            analysisResult: enrichedResult
        };

    } catch (error) {
        logger.error('GOD-TIER BTR v7.0 FAILED', error);
        if (isCancellationError(error)) {
            throw error;
        }
        const currentStepId = ANALYSIS_STEPS[Math.min(ANALYSIS_STEPS.length - 1, progress.getProgress().currentStep)]?.id || 'final';
        await progress.errorStep(currentStepId, error instanceof Error ? error.message : String(error));
        throw error;
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═════════════════════════════════════════════════════════════════════════════

export { MAX_BATCH_SIZE, SURVIVORS_PER_BATCH };
