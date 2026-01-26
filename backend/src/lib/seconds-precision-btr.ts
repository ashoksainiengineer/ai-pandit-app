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
    calculateBaladiAvastha,
    getD60Deity,
    verifyDoubleTransit,
    calculateVimsopakaBala,
    detectBhavaChalitDiscrepancy,
    calculatePanchadhaSambandha,
    calculateIshtaKashtaPhala
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
    calculateD60,
    detectVargottama,
    detectParivartana,
    detectPushkarNavamsa
} from './advanced-btr-methods.js';
import {
    calculateCharaKarakas,
    calculateCharaDasha,
    getCharaDashaForDate,
    calculateBhriguBindu
} from './jaimini-astrology.js';
import {
    callAI,
    callAIWithStream,
    parseAIAnalysisResponse,
    executeAIInParallel,
} from './ai-client.js';
import {
    CandidateTime,
    generateCandidateTimes,
    generateRefinementGrid,
    splitIntoBatches,
    MAX_BATCH_SIZE,
    SURVIVORS_PER_BATCH,
    getDynamicBatchSize,
    getDynamicSurvivors,
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
        speed: number;
        isCombust: boolean;
        shadbala?: number;
        bav?: number; // Binnashtakavarga points in current sign
        functionalNature?: { role: string; reason: string };
        aspects?: any[];
        avastha?: string;
        d60Deity?: string;
        compoundDignity?: string;
    }>;
    specialPoints?: Record<string, { sign: string; degree: string; house: number }>;
    ascendant: { sign: string; degree: string; nakshatra: string };
    houseLords: Record<number, string>; // e.g. {1: 'Mars', 2: 'Venus'...}
    moonNakshatra: string;
    vimshottariDasha: {
        maha: string;
        antar: string;
        pratyantar: string;
        sukshma: string;
        prana: string;
        startEnd: string;
    }[];
    yoginiDasha?: { lord: string; startEnd: string }[];
    charaDasha?: { sign: string; startEnd: string }[];
    d9Lagna?: string;
    d10Lagna?: string;
    d60Sign?: string;
    d9Chart?: { ascendant: string; planets: Record<string, string> };
    d10Chart?: { ascendant: string; planets: Record<string, string> };
    ashtakavarga?: Record<string, number[]>;
    panchanga?: {
        tithi: string;
        vara: string;
        nakshatra: string;
        yoga: string;
        karana: string;
    };
    yogas?: any[];
    doubleTransitAnalysis?: Record<string, any>;
    lifecycleShifts?: { date: string; event: string; dasha: string }[]; // 🔱 Lifecycle chronicle
    transitData?: Record<string, any>;
    aiScore?: number;
    aiVerdict?: string;
    rawVimshottari?: any[]; // 🔱 Store raw DashaPeriod[] for internal lookups
    vedicSignals?: any; // 🔱 Vargottama, Parivartana, Karakas, etc.
    charaKarakas?: any[]; // 🔱 Jaimini significators
    vimsopakaBala?: Record<string, number>; // 🔱 Total Vigour (0-20)
    chalitDiscrepancies?: any[]; // 🔱 House-sign border flags
    ishtaKashtaPhala?: Record<string, { ishta: number; kashta: number }>; // 🔱 Benefic Fruit
    spouseMatch?: {
        lagnaMatch: boolean;
        moonMatch: boolean;
        score: number;
        reason: string;
    };
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
    let ephemeris = await calculateEphemeris(
        input.dateOfBirth,
        time,
        input.latitude,
        input.longitude,
        input.timezone
    );

    // Calculate All Vargas and Special Metrics
    const {
        calculateAllVargas,
        calculateAshtakavarga,
        calculateShadbala,
        detectYogas,
        verifyDoubleTransit,
        calculateArudhas,
        calculatePanchanga
    } = await import('./vedic-astrology-engine.js');
    ephemeris.divisionalCharts = calculateAllVargas(ephemeris);
    ephemeris.ashtakavarga = calculateAshtakavarga(ephemeris);
    ephemeris.shadbala = calculateShadbala(ephemeris);
    const yogas = detectYogas(ephemeris);

    // 🔱 Spouse Synastry Calculation
    let spouseMatch: any = undefined;
    if (input.spouseData && input.spouseData.dateOfBirth) {
        try {
            const spouseEph = await calculateEphemeris(
                input.spouseData.dateOfBirth,
                input.spouseData.birthTime || '12:00:00',
                input.spouseData.latitude || 0,
                input.spouseData.longitude || 0,
                input.spouseData.timezone || 0
            );
            const spouseLagna = spouseEph.ascendant.sign;
            const targetHouseSign = ephemeris.houses[6]?.sign; // 7th House Sign (0-indexed house 6)

            const lagnaMatch = spouseLagna === targetHouseSign;
            const moonSignMatch = spouseEph.planets.moon.sign === ephemeris.planets.moon.sign;

            spouseMatch = {
                lagnaMatch,
                moonMatch: moonSignMatch,
                score: lagnaMatch ? 90 : (moonSignMatch ? 60 : 40),
                reason: lagnaMatch ? `Spouse Lagna (${spouseLagna}) matches Candidate 7th House!` : (moonSignMatch ? `Moon signs match!` : 'No direct synastry link')
            };
        } catch (e) {
            logger.warn('Spouse data calculation failed', e);
        }
    }

    const moonLong = ephemeris.planets.moon.longitude;
    const birthDate = new Date(input.dateOfBirth);

    // Build planet positions
    const planets: Record<string, { sign: string; degree: string; nakshatra: string }> = {};

    // Helper for DMS
    function toDMS(decimal: number): string {
        const d = Math.floor(decimal);
        const m = Math.floor((decimal - d) * 60);
        const s = Math.round(((decimal - d) * 60 - m) * 60);
        return `${d}° ${m.toString().padStart(2, '0')}' ${s.toString().padStart(2, '0')}"`;
    }

    for (const [name, data] of Object.entries(ephemeris.planets)) {
        const nakshatra = getNakshatraForLongitude(data.longitude);
        planets[name] = {
            sign: data.sign,
            degree: (data.longitude % 30).toFixed(4) + '°',
            nakshatra: nakshatra.name
        };
    }

    // Build Vimshottari Dasha table (Flattened to Prana level for God-Tier Precision)
    const vimDashas = calculateVimshottariDasha(moonLong, birthDate);

    // Determine relevant date range (Birth to Present/Max Event + 1 Year buffer)
    const eventDates = input.lifeEvents.map(e => new Date(e.eventDate).getTime());
    const now = Date.now();
    const minDate = Math.min(...eventDates, now) - (365 * 24 * 60 * 60 * 1000); // 1 year before first event
    const maxEventDate = Math.max(...eventDates, now);
    const maxDate = maxEventDate + (365 * 24 * 60 * 60 * 1000); // 1 year buffer

    const vimshottariDasha: CandidateDataPackage['vimshottariDasha'] = [];
    for (const maha of vimDashas) {
        if (!maha.subPeriods) continue;

        for (const antar of maha.subPeriods) {
            // Include AD level for the entire life (Birth to Present)
            // This ensures a complete high-level timeline
            const isLatest = antar.endDate.getTime() >= now;

            for (const prat of antar.subPeriods) {
                // For Pratyantars, we only include the full chain if it's within a 1-year buffer of ANY event 
                // OR if it's the current/future period (Active Anchor). 
                // Providing 27 years of Pratyantars (thousands of entries) would crash the AI window.
                const start = prat.startDate.getTime();
                const end = prat.endDate.getTime();
                const fitsEvent = start <= maxDate && end >= minDate;

                if (fitsEvent || isLatest) {
                    for (const suksh of prat.subPeriods) {
                        for (const prana of suksh.subPeriods) {
                            vimshottariDasha.push({
                                maha: maha.lord,
                                antar: antar.lord,
                                pratyantar: prat.lord,
                                sukshma: suksh.lord,
                                prana: prana.lord,
                                startEnd: `${prana.startDate.toISOString().split('T')[1].slice(0, 8)} to ${prana.endDate.toISOString().split('T')[1].slice(0, 8)} (${prana.startDate.toISOString().split('T')[0]})`
                            });
                        }
                    }
                } else if (prat.endDate.getTime() < now) {
                    // Fallback abbreviated entry for historical context without bloat
                    vimshottariDasha.push({
                        maha: maha.lord,
                        antar: antar.lord,
                        pratyantar: prat.lord,
                        sukshma: '-',
                        prana: '-',
                        startEnd: `[Historical Period] ${prat.startDate.toISOString().split('T')[0]} to ${prat.endDate.toISOString().split('T')[0]}`
                    });
                }
            }
        }
    }

    const ascNakshatra = getNakshatraForLongitude(ephemeris.ascendant.longitude);

    // 🔱 GOD-TIER DATA ENRICHMENT
    // We calculate explicit Vedic metrics so the AI doesn't have to "think" about them (reducing hallucination risk)
    const richPlanets: Record<string, any> = {};

    // Capitalize helper
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    const arudhas = calculateArudhas(ephemeris);
    const panchanga = calculatePanchanga(calculateJulianDay(birthDate), ephemeris.planets.sun.longitude, ephemeris.planets.moon.longitude);

    // Pre-calculate target map for aspects
    const planetLongitudes: Record<string, number> = {};
    for (const [key, p] of Object.entries(ephemeris.planets)) {
        planetLongitudes[cap(key)] = p.longitude;
    }

    // Capture Longitude Map for Aspects
    for (const [key, p] of Object.entries(ephemeris.planets)) {
        const planetName = cap(key);

        const functional = calculateFunctionalNature(ephemeris.ascendant.sign, planetName);
        const aspects = calculateAspects(planetName, p.longitude, planetLongitudes, ephemeris.ascendant.longitude);

        const signIdx = ZODIAC_SIGNS.indexOf(p.sign);
        richPlanets[key] = {
            sign: p.sign,
            degree: (p.longitude % 30).toFixed(4) + '°',
            nakshatra: p.nakshatra,
            house: p.house || calculateHouse(ephemeris.ascendant.sign, p.sign),
            dignity: p.dignity || getDignity(planetName, p.sign),
            isRetro: p.retro,
            speed: p.speed,
            isCombust: p.isCombust,
            shadbala: ephemeris.shadbala?.[planetName],
            bav: ephemeris.ashtakavarga?.[planetName]?.[signIdx],
            functionalNature: functional,
            aspects: aspects,
            avastha: calculateBaladiAvastha(p.longitude),
            d60Deity: getD60Deity(p.longitude),
            compoundDignity: calculatePanchadhaSambandha(planetName, cap(ephemeris.houses[signIdx]?.lord || ''), ephemeris)
        };
    }

    const pkg: CandidateDataPackage = {
        time,
        offsetMinutes,
        rawVimshottari: vimDashas, // 🔱 Store raw for internal lookup in Stage 6
        vedicSignals: {
            vargottama: detectVargottama(ephemeris),
            parivartana: detectParivartana(ephemeris),
            pushkar: detectPushkarNavamsa(ephemeris),
            charaKarakas: calculateCharaKarakas(ephemeris)
        },
        planets: richPlanets,
        ascendant: {
            sign: ephemeris.ascendant.sign,
            degree: (ephemeris.ascendant.longitude % 30).toFixed(4) + '°',
            nakshatra: ascNakshatra.name
        },
        houseLords: getAllHouseLords(ephemeris.ascendant.sign),
        moonNakshatra: ephemeris.planets.moon.nakshatra,
        vimshottariDasha,
        ashtakavarga: ephemeris.ashtakavarga,
        panchanga,
        lifecycleShifts: [], // To be populated
        vimsopakaBala: calculateVimsopakaBala(ephemeris),
        chalitDiscrepancies: detectBhavaChalitDiscrepancy(ephemeris),
        ishtaKashtaPhala: (() => {
            const res: Record<string, any> = {};
            ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].forEach(p => {
                res[p] = calculateIshtaKashtaPhala(p, ephemeris);
            });
            return res;
        })(),
        specialPoints: {
            AL: { sign: arudhas.AL, degree: '0.00°', house: ((ZODIAC_SIGNS.indexOf(arudhas.AL) - ZODIAC_SIGNS.indexOf(ephemeris.ascendant.sign) + 12) % 12) + 1 },
            UL: { sign: arudhas.UL, degree: '0.00°', house: ((ZODIAC_SIGNS.indexOf(arudhas.UL) - ZODIAC_SIGNS.indexOf(ephemeris.ascendant.sign) + 12) % 12) + 1 },
            BB: { sign: calculateBhriguBindu(ephemeris).sign, degree: calculateBhriguBindu(ephemeris).degree.toFixed(2) + '°', house: 0 }
        },
        yogas,
        spouseMatch
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

        // 3. Divisional Charts - Full Planetary Matrix (D2-D60)
        const vargas = ephemeris.divisionalCharts || {};

        pkg.d9Lagna = vargas.D9?.ascendant.sign;
        pkg.d10Lagna = vargas.D10?.ascendant.sign;
        pkg.d60Sign = vargas.D60?.ascendant.sign;

        if (vargas.D9) {
            const d9Planets: Record<string, string> = {};
            for (const [name, p] of Object.entries(vargas.D9.planets)) {
                d9Planets[name] = p.sign;
            }
            pkg.d9Chart = { ascendant: vargas.D9.ascendant.sign, planets: d9Planets };
        }

        if (vargas.D10) {
            const d10Planets: Record<string, string> = {};
            for (const [name, p] of Object.entries(vargas.D10.planets)) {
                d10Planets[name] = p.sign;
            }
            pkg.d10Chart = { ascendant: vargas.D10.ascendant.sign, planets: d10Planets };
        }

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

                // 🔱 GOD-TIER: Dasha Hierarchy at Event Moment (MH -> AD -> PD -> SD -> PD)
                const dashaAtEvent = getDashaForDate(vimDashas, new Date(event.eventDate));
                const dashaSequence = dashaAtEvent ?
                    `${dashaAtEvent.mahadasha}-${dashaAtEvent.antardasha}-${dashaAtEvent.pratyantardasha}-${dashaAtEvent.sukshmadasha}-${dashaAtEvent.pranadasha}` :
                    'Unknown';

                // 🔱 DEEP SYNTHESIS: Event-Specific Astrological Signature
                const eventSignatures: string[] = [];

                // 1. Dasha-Varga Synergy
                if (dashaAtEvent) {
                    const lclLord = dashaAtEvent.mahadasha.toLowerCase() as keyof typeof ephemeris.planets;
                    if (event.category === 'career' || event.category === 'education') {
                        const d10Pos = ephemeris.divisionalCharts?.D10?.planets[lclLord];
                        if (d10Pos && [1, 5, 9, 10].includes(d10Pos.house)) {
                            eventSignatures.push(`Dasha Lord ${dashaAtEvent.mahadasha} is STRONG in D10 (H${d10Pos.house})`);
                        }
                    } else if (event.category === 'marriage') {
                        const d9Pos = ephemeris.divisionalCharts?.D9?.planets[lclLord];
                        if (d9Pos && [1, 5, 7, 9].includes(d9Pos.house)) {
                            eventSignatures.push(`Dasha Lord ${dashaAtEvent.mahadasha} is STRONG in D9 (H${d9Pos.house})`);
                        }
                    }
                }

                // 2. Multi-House Double Transit
                const houseMap: Record<string, number> = {
                    marriage: 7, career: 10, education: 4, family: 2, children: 5, health: 6, travel: 9
                };
                const targetHouse = houseMap[event.category as keyof typeof houseMap] || 1;
                const importVE = await import('./vedic-astrology-engine.js');
                const dtResult = importVE.verifyDoubleTransit(eventEph, ephemeris.ascendant.sign, targetHouse);
                if (dtResult.isTriggered) {
                    eventSignatures.push(`🔱 DOUBLE TRANSIT active in H${targetHouse}`);
                }

                // 3. Jaimini Karaka Correlation
                const karakas = pkg.vedicSignals.charaKarakas;
                if (karakas) {
                    const ak = karakas.find((k: any) => k.karakaName === 'Atmakaraka')?.planet;
                    const amk = karakas.find((k: any) => k.karakaName === 'Amatyakaraka')?.planet;
                    const dk = karakas.find((k: any) => k.karakaName === 'Darakaraka')?.planet;

                    if (event.category === 'marriage' && (dashaAtEvent?.mahadasha === dk || dashaAtEvent?.antardasha === dk)) {
                        eventSignatures.push(`Jaimini: Darakaraka ${dk} (Spouse) is active`);
                    }
                    if (event.category === 'career' && (dashaAtEvent?.mahadasha === amk || dashaAtEvent?.antardasha === amk)) {
                        eventSignatures.push(`Jaimini: Amatyakaraka ${amk} (Career) is active`);
                    }
                }

                // 4. Kakshya Precision (The 'Quantum' Filter)
                const jupKakshya = calculateKakshya(eventEph.planets.jupiter.longitude);
                const satKakshya = calculateKakshya(eventEph.planets.saturn.longitude);
                eventSignatures.push(`Quantum: Ju in ${jupKakshya} Kakshya | Sa in ${satKakshya} Kakshya`);

                pkg.transitData[event.eventDate] = {
                    dasha: dashaSequence,
                    signatures: eventSignatures,
                    saturn: `${eventEph.planets.saturn.sign}${eventEph.planets.saturn.retro ? ' (R)' : ''}`,
                    jupiter: `${eventEph.planets.jupiter.sign}${eventEph.planets.jupiter.retro ? ' (R)' : ''}`,
                    rahu: `${eventEph.planets.rahu.sign}${eventEph.planets.rahu.retro ? ' (R)' : ''}`,
                    ketu: `${eventEph.planets.ketu.sign}${eventEph.planets.ketu.retro ? ' (R)' : ''}`,
                    doubleTransit: dtResult
                };
            } catch {
                // Skip
            }
        }

        // 🦾 5. Lifecycle Chronicle: Track Sign Ingress (Sign Changes) for Saturn/Jupiter
        const lifecycleShifts: any[] = [];
        const startYear = birthDate.getFullYear();
        const endYear = new Date().getFullYear();

        let lastSaturnSign = '';
        let lastJupiterSign = '';

        // Optimized sampling: Every 4 months (Catching all sign changes)
        for (let year = startYear; year <= endYear; year++) {
            for (let month of [1, 5, 9]) {
                try {
                    const checkDateForCycle = `${year}-${String(month).padStart(2, '0')}-01`;
                    const ephShift = await calculateEphemeris(checkDateForCycle, '12:00:00', input.latitude, input.longitude, input.timezone);
                    const currentSatSign = ephShift.planets.saturn.sign;
                    const currentJupSign = ephShift.planets.jupiter.sign;

                    if (currentSatSign !== lastSaturnSign || currentJupSign !== lastJupiterSign) {
                        const dashaCycle = getDashaForDate(vimDashas, new Date(checkDateForCycle));
                        lifecycleShifts.push({
                            date: checkDateForCycle,
                            event: `TRANSIT INGRESS: Saturn in ${currentSatSign} | Jupiter in ${currentJupSign}`,
                            dasha: dashaCycle ? `${dashaCycle.mahadasha}-${dashaCycle.antardasha}` : 'N/A'
                        });
                        lastSaturnSign = currentSatSign;
                        lastJupiterSign = currentJupSign;
                    }
                } catch { }
                if (lifecycleShifts.length > 50) break; // Hard cap for prompt safety
            }
            if (lifecycleShifts.length > 50) break;
        }
        pkg.lifecycleShifts = lifecycleShifts;
    }

    return pkg;
}

// ═════════════════════════════════════════════════════════════════════════════
// LIFE EVENT FORMATTER
// ═════════════════════════════════════════════════════════════════════════════

function formatLifeEventForAI(event: LifeEvent): string {
    const { eventType, category, eventDate, eventTime, endDate, datePrecision, description, importance } = event;
    let timeStr = eventDate;
    let nuance = '';

    // ... (logic for timeStr remains same) ...
    switch (datePrecision) {
        case 'exact_date_time':
            if (eventTime) {
                timeStr = `${eventDate} at ${eventTime}`;
                nuance = '(Exact Time)';
            }
            break;
        case 'month_year':
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
            const yStart = eventDate.split('-')[0];
            if (endDate) {
                const yEnd = endDate.split('-')[0];
                timeStr = `${yStart} to ${yEnd}`;
            } else {
                timeStr = yStart;
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

    let base = `• [${importance?.toUpperCase() || 'MEDIUM'} IMPORTANCE] ${eventType} (${category})\n  Date: ${timeStr} ${nuance}`;
    if (description) {
        base += `\n  SITUATIONAL NARRATIVE & EXPERIENCE: "${description}"`;
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

    // 🔱 ANTI-BIAS PROTOCOL: Shuffle candidate order in every batch to prevent positional bias
    const shuffledCandidates = [...candidates].sort(() => Math.random() - 0.5);

    return `BIRTH TIME RECTIFICATION - STAGE 2 (Batch ${batchNumber}/${totalBatches})

════════════════════════════════════════════════════════════════════════════════
⚖️ ANTI-BIAS PROTOCOL:
1. TOTAL NEUTRALITY: Treat all provided times as equally likely candidates.
2. ZERO TENTATIVE BIAS: Do not favor times just because they are closer to the "original" time.
3. DATA-DRIVEN SCORE: Your score must reflect mathematical alignment only.
4. NARRATIVE PRIMACY: The user's "SITUATIONAL NARRATIVE" is the ultimate source of truth. If a user describes a "sudden, shocking loss," prioritize candidates where Rahu/Ketu/8th house are activated in that dasha, even if raw scores are lower.
════════════════════════════════════════════════════════════════════════════════

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

CANDIDATES WITH ENRICHED VEDIC DATA (100% Mathematical Matrix):
${shuffledCandidates.map(c => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CANDIDATE: ${c.time}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PANCHANGA: Day=${c.panchanga?.vara} | Tithi=${c.panchanga?.tithi} | Yoga=${c.panchanga?.yoga} | Karana=${c.panchanga?.karana}
SPECIAL POINTS: AL (Arudha Lagna)=${c.specialPoints?.AL.sign} | UL (Upapada Lagna)=${c.specialPoints?.UL.sign}
LAGNA (Ascendant): ${c.ascendant.sign} ${c.ascendant.degree} (${c.ascendant.nakshatra})
HOUSE LORDS: 1=${c.houseLords[1]}, 7=${c.houseLords[7]}, 10=${c.houseLords[10]}, 5=${c.houseLords[5]}, 9=${c.houseLords[9]}

PLANETARY MATRIX (Verified Swiss Eph Positions):
${Object.entries(c.planets).map(([name, p]) => {
        const caps = name.charAt(0).toUpperCase() + name.slice(1);
        const sav = c.ashtakavarga?.SAV?.[ZODIAC_SIGNS.indexOf(p.sign)] || '?';
        const aspects = p.aspects?.filter((a: any) => a.isHit).map((a: any) => `${a.type}→${a.targetPlanet || 'H' + a.targetHouse}`).join(', ') || 'None';
        const avastha = p.avastha || 'Unknown';
        const deity = p.d60Deity || 'Unknown';
        const ikp = c.ishtaKashtaPhala?.[caps] ? `${c.ishtaKashtaPhala[caps].ishta}/${c.ishtaKashtaPhala[caps].kashta}` : '?';
        const sambandha = p.compoundDignity || 'Sama';
        return `│ ${caps.padEnd(7)}: ${p.sign.padEnd(10)} | H${p.house} | ${avastha.padEnd(7)} | ${deity.padEnd(12)} | I/K:${ikp.padEnd(10)} | ${sambandha.padEnd(9)} | Sh:${p.shadbala || '?'} | SAV:${sav} | ${aspects}`;
    }).join('\n')}

${c.yogas && c.yogas.length > 0 ? `YOGAS DETECTED: ${c.yogas.map(y => `${y.name} (${y.level})`).join(', ')}` : ''}

${c.d9Lagna ? `D9 NAVAMSHA LAGNA: ${c.d9Lagna}` : ''}
${c.d10Lagna ? `D10 DASAMSHA LAGNA: ${c.d10Lagna}` : ''}

VIMSHOTTARI DASHA PERIODS (MD-AD-PD):
${c.vimshottariDasha.slice(0, 100).map(d => `  • ${d.maha}/${d.antar}/${d.pratyantar} : ${d.startEnd}`).join('\n')}
${c.yoginiDasha ? `\nYOGINI DASHA: ${c.yoginiDasha.slice(0, 20).map(d => `${d.lord} (${d.startEnd})`).join(' → ')}` : ''}

${c.transitData ? `TRANSITS & DASHAS ON EVENTS:
${Object.entries(c.transitData).map(([date, t]: [string, any]) =>
        `│ [${date}]: Dasha=${t.dasha} | ${t.signatures?.join(', ') || 'Regular Period'}`).join('\n')}` : ''}
${c.vedicSignals ? `VEDIC HIGH-SIGNALS:
│ Vargottama: ${c.vedicSignals.vargottama?.join(', ') || 'None'}
│ Pushkar: ${c.vedicSignals.pushkar?.join(', ') || 'None'}
│ Parivartana: ${c.vedicSignals.parivartana?.map((ex: any) => `L${ex.houses[0]}↔L${ex.houses[1]}`).join(', ') || 'None'}` : ''}
${c.vimsopakaBala ? `├ VIM SOPAKA BALA (Total Shodashvarga Strength - 0-20):
│ ${Object.entries(c.vimsopakaBala).map(([n, s]) => `${n}:${s}`).join(' | ')}` : ''}
${c.chalitDiscrepancies?.length ? `├ BHAVA CHALIT DISCREPANCIES:
${c.chalitDiscrepancies.map((d: any) => `│ ${d.planet}: Rashi-H${d.rasiHouse} ↔ Chalit-H${d.chalitHouse}`).join('\n')}` : ''}
${c.spouseMatch ? `├ SPOUSE SYNASTRY MATCH:
│ ${c.spouseMatch.reason} (Synastry Score: ${c.spouseMatch.score})` : ''}
${c.lifecycleShifts?.length ? `├ LIFECYCLE CHRONOLOGY (Major Sign Ingresses):
${c.lifecycleShifts.slice(0, 15).map(s => `│ [${s.date}]: ${s.event}`).join('\n')}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`).join('')}

SCORING ALGORITHM (STRICT VEDIC LOGIC):
+30: PRIMARY MATCH - Dasha/Antar Lord is DIRECTLY the House Lord of the event (e.g. Marriage in 7th Lord dasha).
+20: SECONDARY MATCH - Dasha Lord is placed in the event house or aspects it.
+15: STRENGTH PROOF - Event dasha lord has high Shadbala (>120) or high SAV points (>28) in event house.
+10: NATURAL KARAKA - Dasha Lord is natural significator (Venus=Marriage, Sun=Career) even if not functional lord.
+10: LAGNA MATCH - Ascendant element/lord matches physical traits.
+15: AVASTHA PRECISION - If planet is in 'Yuva' (Youth) or 'Kumara' (Adolescent) avastha, results are 100% manifest. If 'Mritya' (Dead), results are blocked.
+20: D60 DEITY FLAVOR - Match event narrative to D60 Deity (e.g. 'Amrita' for recovery, 'Ghora' for sudden accident).
-50: CONTRADICTION - Event happened in dasha of 6/8/12 lord with NO connection to event house.

OUTPUT FORMAT (one line per candidate):
[TIME] | SCORE: [0-100] | VERDICT: KEEP/ELIMINATE | REASON: [Explicit Astrological Reason e.g. "Venus is 7th Lord"]

FINAL LINE (required):
TOP_SURVIVORS: [comma-separated list of ${survivorsNeeded} best times]`;
}

function getDeepAnalysisPrompt(
    candidates: CandidateDataPackage[],
    events: LifeEvent[],
    traits: any,
    spouseData: any
): string {
    const eventsText = events.map(formatLifeEventForAI).join('\n');
    const traitsText = traits ? JSON.stringify(traits, null, 2) : 'N/A';
    const spouseText = spouseData ? JSON.stringify(spouseData, null, 2) : 'N/A';

    // 🔱 ANTI-BIAS PROTOCOL: Shuffle to prevent positional bias
    const filteredCandidates = candidates.filter(c => c.time);
    const shuffledCandidates = [...filteredCandidates].sort(() => Math.random() - 0.5);

    return `BIRTH TIME RECTIFICATION - STAGE 4 (Deep Multi-Dasha Analysis)

════════════════════════════════════════════════════════════════════════════════
⚖️ ANTI-BIAS PROTOCOLS:
1. BLIND EVALUATION: Treat ALL candidates as equally probable. 
2. ZERO TENTATIVE BIAS: Do not favor times closest to the "original" tentative time.
3. DATA-ONLY VERDICT: If candidates are technically equal, say so. Do not guess.
════════════════════════════════════════════════════════════════════════════════

════════════════════════════════════════════════════════════════════════════════
⚠️ ANALYSIS RULES (PURE VEDIC ASTROLOGY):
1. RELY ONLY ON THE PROVIDED MATHEMATICAL DATA. Do not hallucinate planetary positions.
2. NARRATIVE PRIMACY: Qualitative experiences (SITUATIONAL NARRATIVE) outrank generic scoring. Match the flavor of the experience (e.g. "intense struggle" vs "smooth success") to the specific planetary dignity and aspects provided.
4. CORRELATE DASHAS: Match Dasha Lords (and their House ownerships) to life events.
5. HIGH-SIGNALS: Vargottama and Pushkar planets are 2-3x more potent in delivering results. Parivartana (Exchange) links two houses indissolubly.
6. EVENT SIGNATURES: Use the pre-calculated signatures (D10 strength, Double Transit) to confirm "VIGOUR".
════════════════════════════════════════════════════════════════════════════════

TASK: Cross-verify ${shuffledCandidates.length} candidates using Dasha systems & Vedic Mathematics.

USER CONTEXT:
PHYSICAL TRAITS: ${traitsText}
SPOUSE DATA: ${spouseText}

LIFE EVENTS:
${eventsText}

CANDIDATES (100% VERIFIED MATHEMATICAL DATA):
${shuffledCandidates.map(c => `
[${c.time}]
┌ LAGNA: ${c.ascendant.sign} ${c.ascendant.degree} (${c.ascendant.nakshatra})
├ PANCHANGA: Tithi=${c.panchanga?.tithi} | Vara=${c.panchanga?.vara} | Yoga=${c.panchanga?.yoga}
├ ARUDHAS: AL=${c.specialPoints?.AL.sign} | UL=${c.specialPoints?.UL.sign}
├ HOUSE LORDS: 1=${c.houseLords[1]} | 7=${c.houseLords[7]} | 10=${c.houseLords[10]} | 5=${c.houseLords[5]} | 9=${c.houseLords[9]}
├ PLANETARY MATRIX (Full Vedic Metrics):
${Object.entries(c.planets).map(([name, p]) => {
        const caps = name.charAt(0).toUpperCase() + name.slice(1);
        const sav = c.ashtakavarga?.SAV?.[ZODIAC_SIGNS.indexOf(p.sign)] || '?';
        const aspects = p.aspects?.filter((a: any) => a.isHit).map((a: any) => `${a.type}→${a.targetPlanet || 'H' + a.targetHouse}`).join(', ') || 'None';
        const avastha = p.avastha || 'Unknown';
        const deity = p.d60Deity || 'Unknown';
        const ikp = c.ishtaKashtaPhala?.[caps] ? `${c.ishtaKashtaPhala[caps].ishta}/${c.ishtaKashtaPhala[caps].kashta}` : '?';
        const sambandha = p.compoundDignity || 'Sama';
        return `│ ${caps.padEnd(7)}: ${p.sign.padEnd(10)} | H${p.house} | ${avastha.padEnd(7)} | ${deity.padEnd(12)} | I/K:${ikp.padEnd(10)} | ${sambandha.padEnd(9)} | Sh:${p.shadbala || '?'} | SAV:${sav} | ${aspects}`;
    }).join('\n')}
├ YOGAS: ${c.yogas?.map(y => y.name).join(', ') || 'None'}
├ DIVISIONAL CHARTS:
│ D9 (Navamsa): Lagna=${c.d9Lagna} | Planets=${c.d9Chart ? Object.entries(c.d9Chart.planets).map(([k, v]) => `${k.substring(0, 2).toUpperCase()}=${v}`).join(' ') : ''}
│ D10 (Dasamsa): Lagna=${c.d10Lagna} | Planets=${c.d10Chart ? Object.entries(c.d10Chart.planets).map(([k, v]) => `${k.substring(0, 2).toUpperCase()}=${v}`).join(' ') : ''}
│ D60 (Shashtyamsa): Lagna=${c.d60Sign}
├ VIMSHOTTARI DASHA SEQUENCE (Full Lifecycle, 1999-2026):
${c.vimshottariDasha.map(d => `│ ${d.maha} -> ${d.antar} -> ${d.pratyantar}${d.sukshma !== '-' ? ` -> ${d.sukshma}` : ''} : ${d.startEnd}`).join('\n')}
├ MAJOR LIFECYCLE SHIFTS (Saturn/Jupiter Chronology):
${c.lifecycleShifts?.map(s => `│ [${s.date}]: ${s.event} (Dasha: ${s.dasha})`).join('\n') || 'N/A'}
├ YOGINI DASHA (Full): ${c.yoginiDasha?.map(d => `${d.lord} [${d.startEnd}]`).join(' | ') || 'N/A'}
├ CHARA DASHA: ${c.charaDasha?.map(d => `${d.sign} [${d.startEnd}]`).join(' | ') || 'N/A'}
├ ASHTAKAVARGA SAV: ${c.ashtakavarga?.SAV ? `[${c.ashtakavarga.SAV.join(', ')}]` : 'N/A'}
${c.transitData ? `├ TRANSITS & DASHAS ON ALL EVENTS:
${Object.entries(c.transitData).map(([date, t]: [string, any]) =>
        `│ [${date}]: Dasha=${t.dasha} | ${t.signatures?.join(', ') || 'Regular Period'}`).join('\n')}` : ''}
${c.vedicSignals ? `├ VEDIC HIGH-SIGNALS:
│ Vargottama: ${c.vedicSignals.vargottama?.join(', ') || 'None'}
│ Pushkar: ${c.vedicSignals.pushkar?.join(', ') || 'None'}
│ Parivartana: ${c.vedicSignals.parivartana?.map((ex: any) => `L${ex.houses[0]}↔L${ex.houses[1]}`).join(', ') || 'None'}` : ''}
${c.spouseMatch ? `├ SPOUSE SYNASTRY CORRELATION:
│ ${c.spouseMatch.reason}` : ''}
${c.lifecycleShifts?.length ? `├ LIFECYCLE CHRONOLOGY (SATURN/JUPITER INGRESS):
${c.lifecycleShifts.map(s => `│ [${s.date}]: ${s.event} (Dasha: ${s.dasha})`).join('\n')}` : ''}
└──────────────────────────────────────────────────────────────`).join('\n')}

SCORING:
- Rate 0-100 based on how well the Dasha Lords + Divisional Charts explain the Events.
- Strict correlation required.

OUTPUT (for each candidate):
[TIME] | REASONING: [Brief 1-liner] | VERDICT: [KEEP/DROP] | SCORE: [0-100]

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
    spouseData: any,
    currentTransits?: any // 🔱 Present-day anchor
): string {
    const eventsText = events.map(formatLifeEventForAI).join('\n');
    const traitsText = traits ? JSON.stringify(traits, null, 2) : 'N/A';
    const spouseText = spouseData ? JSON.stringify(spouseData, null, 2) : 'N/A';

    // 🔱 ANTI-BIAS PROTOCOL: Final shuffling
    const shuffledCandidates = [...candidates].sort(() => Math.random() - 0.5);

    return `BIRTH TIME RECTIFICATION - FINAL STAGE (Seconds Precision)

════════════════════════════════════════════════════════════════════════════════
⚖️ ANTI-BIAS & OBJECTIVITY RULES:
1. TOTAL NEUTRALITY: You are a cold, mathematical evaluator.
2. NO POSITIONAL BIAS: Candidate #1 is NOT more likely than Candidate #N.
3. MANDATORY PROOF: Every point in SCORE must be backed by a Technical Proof (e.g. D60 Lagna).
════════════════════════════════════════════════════════════════════════════════

════════════════════════════════════════════════════════════════════════════════
⚠️ GOD-TIER PRECISION RULES:
1. FOCUS ON D60 (SHASHTYAMSA): Even 10 seconds can change D60 Lagna.
2. NARRATIVE SYNC: The rectified time MUST explain the "NARRATIVE EXPERIENCE" describing the flavor of the life event (e.g. "sudden surgery" implies Mars/Ketu in 8th or 6th).
3. VERIFY PRANADASHAS: Use Vimshottari logic down to the finest level.
════════════════════════════════════════════════════════════════════════════════

TASK: Select THE SINGLE BEST birth time from ${shuffledCandidates.length} finalists.

USER CONTEXT:
Traits: ${traitsText}
Spouse: ${spouseText}

LIFE EVENTS:
${eventsText}

FINALIST CANDIDATES (100% COMPLETE MATHEMATICAL DATA):
${shuffledCandidates.map((c, i) => `
#${i + 1} [${c.time}]
┌ LAGNA: ${c.ascendant.sign} ${c.ascendant.degree} (${c.ascendant.nakshatra})
├ PANCHANGA: ${c.panchanga?.tithi} | ${c.panchanga?.vara}
├ ARUDHAS: AL=${c.specialPoints?.AL.sign} | UL=${c.specialPoints?.UL.sign}
├ HOUSE LORDS: 1=${c.houseLords[1]} | 7=${c.houseLords[7]} | 10=${c.houseLords[10]}
├ D60 (Karma Lagna): ${c.d60Sign || 'N/A'}
├ PLANETARY STRENGTH MATRIX:
${Object.entries(c.planets).map(([name, p]) => {
        const caps = name.charAt(0).toUpperCase() + name.slice(1);
        const sav = c.ashtakavarga?.SAV?.[ZODIAC_SIGNS.indexOf(p.sign)] || '?';
        const avastha = p.avastha || 'Unknown';
        const deity = p.d60Deity || 'Unknown';
        const ikp = c.ishtaKashtaPhala?.[caps] ? `${c.ishtaKashtaPhala[caps].ishta}/${c.ishtaKashtaPhala[caps].kashta}` : '?';
        const sambandha = p.compoundDignity || 'Sama';
        const aspects = p.aspects?.filter((a: any) => a.isHit).map((a: any) => `${a.type}`).join(', ') || 'None';
        return `│ ${caps.padEnd(7)}: ${p.sign.padEnd(10)} [H${p.house}, ${avastha}, ${deity}, I/K:${ikp}, ${sambandha}, Sh:${p.shadbala || '?'}, SAV:${sav}] | Asp: ${aspects}`;
    }).join('\n')}
├ YOGAS: ${c.yogas?.map(y => y.name).join(', ') || 'N/A'}
├ HIGHER DIVISIONALS: D9=${c.d9Lagna} | D10=${c.d10Lagna} | D60=${c.d60Sign}
├ VIMSHOTTARI SEQUENCE (Full Lifecycle):
${c.vimshottariDasha.map(d => `│ ${d.maha} -> ${d.antar} -> ${d.pratyantar}${d.sukshma !== '-' ? ` -> ${d.sukshma}` : ''} : ${d.startEnd}`).join('\n')}
${c.transitData ? `├ TRANSITS & DASHAS ON ALL EVENTS:
${Object.entries(c.transitData).map(([date, t]: [string, any]) =>
        `│ [${date}]: Dasha=${t.dasha} | ${t.signatures?.join(', ') || 'Regular Period'}`).join('\n')}` : ''}
${c.vedicSignals ? `├ VEDIC HIGH-SIGNALS:
│ Vargottama: ${c.vedicSignals.vargottama?.join(', ') || 'None'}
│ Pushkar: ${c.vedicSignals.pushkar?.join(', ') || 'None'}
│ Parivartana: ${c.vedicSignals.parivartana?.map((ex: any) => `L${ex.houses[0]}↔L${ex.houses[1]}`).join(', ') || 'None'}` : ''}
${currentTransits ? `├ PRESENT DAY ANCHOR (2026 Transits):
│ [Dasha Now]: ${currentTransits.dashaAtNow}
│ [Planets Now]: Ju=${currentTransits.jupiter}, Sa=${currentTransits.saturn}, Ra=${currentTransits.rahu}` : ''}
${c.spouseMatch ? `├ FINAL SPOUSE SYNASTRY PROOF:
│ ${c.spouseMatch.reason} | Multiplier: ${c.spouseMatch.lagnaMatch ? 'HIGH' : 'LOW'}` : ''}
${c.lifecycleShifts?.length ? `├ FINAL CHRONOLOGY VERIFICATION:
${c.lifecycleShifts.map(s => `│ [${s.date}]: ${s.event}`).join('\n')}` : ''}
└ BOUNDARY CHECK: ${parseFloat(c.ascendant.degree) < 1 || parseFloat(c.ascendant.degree) > 29 ? '⚠️ EDGE' : 'SAFE'}`).join('\n')}

FINAL VERDICT (required format):
BEST TIME: [HH:MM:SS]
REASONING: [Explicitly cite D60 Lagna, Dasha Connection, Synastry Match (if any), and Lifecycle Chronology. No generic text.]
CONFIDENCE: [0-100]
ACCURACY: [0-100]%
CONFIDENCE: [HIGH/MEDIUM/LOW]
MARGIN_OF_ERROR: ±[seconds] seconds

EVIDENCE:
1. [D60 Justification]
2. [Event-Dasha Link]

RUNNER_UP: [second best time]
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
    // 🧠 Robust Regex: Handles "BEST TIME: 12:30:45", "BEST_TIME: [12:30:45]", etc.
    const timeMatch = aiContent.match(/(?:BEST[ _]TIME|RECTIFIED[ _]TIME)[:\s]*\[?(\d{2}:\d{2}:\d{2})\]?/i);
    const accuracyMatch = aiContent.match(/(?:ACCURACY|CONFIDENCE[ _]SCORE)[:\s]*(\d+)/i);
    const confidenceMatch = aiContent.match(/CONFIDENCE[:\s]*(HIGH|MEDIUM|LOW)/i);
    const marginMatch = aiContent.match(/(?:MARGIN|ERROR|PRECISION)[^:]*[:\s]*±?\s*(\d+)/i);

    if (timeMatch) {
        return {
            time: timeMatch[1],
            accuracy: accuracyMatch ? parseInt(accuracyMatch[1]) : 85,
            confidence: confidenceMatch ? confidenceMatch[1].toUpperCase() : 'MEDIUM',
            margin: marginMatch ? parseInt(marginMatch[1]) : 5
        };
    }

    // 🕵️ Deep Search Fallback: Look for any time string occurring after a "Verdict" keyword
    const verdictKeywordIndex = aiContent.toLowerCase().lastIndexOf('verdict');
    if (verdictKeywordIndex !== -1) {
        const afterVerdict = aiContent.substring(verdictKeywordIndex);
        const fallbackTimeMatch = afterVerdict.match(/(\d{2}:\d{2}:\d{2})/);
        if (fallbackTimeMatch) {
            return {
                time: fallbackTimeMatch[1],
                accuracy: 75,
                confidence: 'MEDIUM',
                margin: 10
            };
        }
    }

    return null;
}

// ═════════════════════════════════════════════════════════════════════════════
// STAGE 1: EXHAUSTIVE DATA GENERATION
// ═════════════════════════════════════════════════════════════════════════════

async function stage1ExhaustiveDataGeneration(
    input: SecondsPrecisionInput,
    progress: ProgressTracker
): Promise<{ candidates: CandidateTime[]; stageResult: StageResult }> {
    await progress.startStep('grid', 'Stage 1: Generating ALL candidate data...');

    const rawCandidates = generateCandidateTimes(input.tentativeTime, input.offsetConfig);

    const total = rawCandidates.length;
    let processed = 0;

    logger.info('🔱 Stage 1: Initializing metadata for candidates', { total });

    for (const raw of rawCandidates) {
        // We build the package once to ensure the calculation log is sent, 
        // but we DO NOT keep it in memory.
        const pkg = await buildCandidateDataPackage(raw.time, raw.offsetMinutes, input, false);

        processed++;

        // Log EVERY calculation (user requested) but with lightweight data
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

        // GC breathing room (Gentle Mode for Free Tier)
        if (processed % 5 === 0) await sleep(10);
    }

    await progress.completeStep('grid', [`Initialized ${rawCandidates.length} paths`]);

    return {
        candidates: rawCandidates,
        stageResult: {
            stageNumber: 1,
            stageName: 'Exhaustive Data Generation',
            candidatesIn: total,
            candidatesOut: rawCandidates.length
        }
    };
}

// ═════════════════════════════════════════════════════════════════════════════
// STAGE 2: BATCH TOURNAMENT (Dynamic batch size based on offset)
// ═════════════════════════════════════════════════════════════════════════════

async function stage2BatchTournament(
    input: SecondsPrecisionInput,
    candidates: CandidateTime[],
    progress: ProgressTracker
): Promise<{ survivors: CandidateTime[]; stageResult: StageResult; rounds: TournamentRound[] }> {
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
        const roundSurvivors: CandidateTime[] = [];

        await progress.updateMessage(`Round ${roundNumber}: ${batches.length} batches of ${batchSize}`);

        // Execute in parallel
        const batchDataMap = new Map<number, CandidateDataPackage[]>();
        const tasks = batches.map((batchTimes, i) => async () => {
            const batchEnriched = await Promise.all(batchTimes.map(ct => buildCandidateDataPackage(ct.time, ct.offsetMinutes, input, true)));
            batchDataMap.set(i, batchEnriched);
            return callAIWithStream(
                input.sessionId,
                2,
                'You are the SUPREME VEDIC ASTROLOGER. Analyze ALL candidates with EQUAL attention.',
                getBatchPrompt(batchEnriched, input.lifeEvents, input.physicalTraits, i + 1, batches.length, survivorsPerBatch),
                {
                    candidateTime: `Batch ${i + 1}/${batches.length}`,
                    progressTracker: progress
                }
            );
        });

        const results = await executeAIInParallel(tasks, 20, 100);

        // Process results
        for (let i = 0; i < batches.length; i++) {
            const batchTimes = batches[i];
            const response = results[i];
            const fullBatchData = batchDataMap.get(i) || [];
            const aiContent = response.success ? (response.content || response.thinking || '') : '';
            const survivorTimes = extractBatchSurvivors(aiContent, batchTimes.map(c => c.time), survivorsPerBatch);

            for (let j = 0; j < fullBatchData.length; j++) {
                const candidate = fullBatchData[j];
                const originalTimeInfo = batchTimes[j];
                const isSurvivor = survivorTimes.includes(candidate.time);
                let score = 40;
                if (isSurvivor) {
                    score = 85;
                    roundSurvivors.push(originalTimeInfo);
                }

                emitCandidateScore(input.sessionId, candidate.time, score, 2, undefined, getMinifiedEph(candidate));
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

    // 🔱 Flush Reasoning: Wait for stream stabilization
    await new Promise(resolve => setTimeout(resolve, 2000));
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
    survivors: CandidateTime[],
    progress: ProgressTracker
): Promise<{ candidates: CandidateTime[]; stageResult: StageResult }> {
    await progress.startStep('fine', 'Stage 3: Generating refinement grid...');

    const refinedCandidates: CandidateTime[] = [];

    // Generate ±5 min grid at 1-min interval around each survivor
    for (const survivor of survivors) {
        const fineGrid = generateRefinementGrid(survivor.time, 5, 60); // ±5 min @ 1 min

        for (const gridPoint of fineGrid) {
            // Check if already exists
            if (!refinedCandidates.some(c => c.time === gridPoint.time)) {
                refinedCandidates.push(gridPoint);
            }
        }
    }

    await progress.completeStep('fine', [`Generated refinement grid: ${refinedCandidates.length} points`]);

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
    candidates: CandidateTime[],
    progress: ProgressTracker
): Promise<{ survivors: CandidateTime[]; stageResult: StageResult; aiReasoning: string }> {
    await progress.startStep('deep', 'Stage 4: Deep analysis tournament...');

    let currentCandidates = [...candidates];
    let allReasoning = '';

    const batchSize = MAX_BATCH_SIZE;
    const survivorsPerBatch = SURVIVORS_PER_BATCH; // Assuming a default or defined constant

    // Helper for Eph formatting
    const getMinifiedEph = (c: CandidateDataPackage) => ({
        sun: `${c.planets.sun.sign} ${c.planets.sun.degree}`,
        moon: `${c.planets.moon.sign} ${c.planets.moon.degree}`,
        ascendant: `${c.ascendant.sign} ${c.ascendant.degree}`
    });

    while (currentCandidates.length > batchSize) {
        const batches = splitIntoBatches(currentCandidates, batchSize);
        const batchSurvivors: CandidateTime[] = [];
        const batchDataMap = new Map<number, CandidateDataPackage[]>();

        // 🔱 Parallel Execution Logic (Stage 4)
        const tasks = batches.map((batchTimes, i) => async () => {
            const batchEnriched = await Promise.all(batchTimes.map(ct => buildCandidateDataPackage(ct.time, ct.offsetMinutes, input, true)));
            batchDataMap.set(i, batchEnriched);

            emitAIContext(input.sessionId, {
                stage: 4,
                candidateTime: `Deep Batch ${i + 1}/${batches.length}`,
                batch: i + 1,
                totalBatches: batches.length,
                candidatesInBatch: batchEnriched.length
            });

            return callAIWithStream(
                input.sessionId,
                4,
                'You are the GOD-TIER VEDIC ANALYST. Perform deep multi-dasha verification.',
                getDeepAnalysisPrompt(batchEnriched, input.lifeEvents, input.physicalTraits, input.spouseData),
                {
                    candidateTime: `Deep ${i + 1}/${batches.length}`,
                    progressTracker: progress
                }
            );
        });

        const results = await executeAIInParallel(tasks, 20, 100);

        for (let i = 0; i < batches.length; i++) {
            const batchTimes = batches[i];
            const response = results[i];
            const fullBatchData = batchDataMap.get(i) || [];
            const aiContent = response.success ? (response.content || response.thinking || '') : '';
            allReasoning += aiContent + '\n\n';

            const survivorTimes = extractBatchSurvivors(aiContent, batchTimes.map(c => c.time), survivorsPerBatch);

            for (let j = 0; j < fullBatchData.length; j++) {
                const candidate = fullBatchData[j];
                const originalTimeInfo = batchTimes[j];
                const isSurvivor = survivorTimes.includes(candidate.time);
                let score = 60;

                if (isSurvivor) {
                    score = 90;
                    batchSurvivors.push(originalTimeInfo);
                }

                emitCandidateScore(input.sessionId, candidate.time, score, 4, undefined, getMinifiedEph(candidate));
            }
        }
        currentCandidates = batchSurvivors;
    }

    // Final deep analysis on remaining candidates
    if (currentCandidates.length > 0) { // Changed from > 3 to > 0 to handle small remaining batches
        // JIT Enrichment for the final batch
        const finalBatchData = await Promise.all(currentCandidates.map(ct => buildCandidateDataPackage(ct.time, ct.offsetMinutes, input, true)));

        const prompt = getDeepAnalysisPrompt(finalBatchData, input.lifeEvents, input.physicalTraits, input.spouseData);

        const response = await callAIWithStream(
            input.sessionId,
            4,
            'You are performing FINAL deep verification.',
            prompt,
            {
                candidateTime: 'Deep Final',
                progressTracker: progress
            }
        );

        const aiContent = response.success ? (response.content || response.thinking || '') : '';
        allReasoning += aiContent;

        const survivorTimes = extractBatchSurvivors(aiContent, currentCandidates.map(c => c.time), 7);

        const survivors: CandidateTime[] = [];
        for (let j = 0; j < finalBatchData.length; j++) {
            const candidate = finalBatchData[j];
            const originalTimeInfo = currentCandidates[j];
            const isSurvivor = survivorTimes.includes(candidate.time);
            const score = isSurvivor ? 95 : 65;

            if (isSurvivor) survivors.push(originalTimeInfo);

            emitCandidateScore(input.sessionId, candidate.time, score, 4, undefined, getMinifiedEph(candidate));
        }
        currentCandidates = survivors;
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
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
    survivors: CandidateTime[],
    progress: ProgressTracker
): Promise<{ candidates: CandidateTime[]; stageResult: StageResult }> {
    await progress.startStep('micro', 'Stage 5: Micro-precision grid...');

    const microCandidates: CandidateTime[] = [];

    // Generate ±30 sec grid at 6-sec interval around top 3 survivors
    for (const survivor of survivors.slice(0, 3)) {
        const microGrid = generateRefinementGrid(survivor.time, 0.5, 6); // ±30 sec @ 6 sec

        for (const gridPoint of microGrid) {
            if (!microCandidates.some(c => c.time === gridPoint.time)) {
                microCandidates.push(gridPoint);
            }
        }
    }

    await progress.completeStep('micro', [`Generated micro grid: ${microCandidates.length} candidates`]);

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
    candidates: CandidateTime[],
    progress: ProgressTracker
): Promise<{ finalTime: string; accuracy: number; confidence: string; margin: number; aiReasoning: string; thinking?: string; stageResult: StageResult }> {
    const now = new Date();
    const currentEph = await calculateEphemeris(
        now.toISOString().split('T')[0],
        now.toTimeString().split(' ')[0],
        input.latitude,
        input.longitude,
        input.timezone
    );

    const getPresentTransitData = (c: CandidateDataPackage) => {
        const dashaAtNow = getDashaForDate(c.rawVimshottari as any, now);
        return {
            dashaAtNow: dashaAtNow ? `${dashaAtNow.mahadasha}-${dashaAtNow.antardasha}-${dashaAtNow.pratyantardasha}` : 'Unknown',
            jupiter: `${currentEph.planets.jupiter.sign}${currentEph.planets.jupiter.retro ? ' (R)' : ''}`,
            saturn: `${currentEph.planets.saturn.sign}${currentEph.planets.saturn.retro ? ' (R)' : ''}`,
            rahu: `${currentEph.planets.rahu.sign}${currentEph.planets.rahu.retro ? ' (R)' : ''}`,
        };
    };

    let finalists = [...candidates];

    while (finalists.length > MAX_BATCH_SIZE) {
        const batches = splitIntoBatches(finalists, MAX_BATCH_SIZE);
        const batchWinners: CandidateTime[] = [];
        const batchDataMap = new Map<number, CandidateDataPackage[]>();

        const tasks = batches.map((batchTimes, i) => async () => {
            const batchEnriched = await Promise.all(batchTimes.map(ct => buildCandidateDataPackage(ct.time, ct.offsetMinutes, input, true)));
            batchDataMap.set(i, batchEnriched);
            const presentAnchor = getPresentTransitData(batchEnriched[0]);

            return callAIWithStream(
                input.sessionId,
                6,
                'FINAL JUDGEMENT. Pick THE ONE.',
                getFinalPrecisionPrompt(batchEnriched, input.lifeEvents, input.physicalTraits, input.spouseData, presentAnchor),
                {
                    candidateTime: 'FINAL',
                    progressTracker: progress
                }
            );
        });

        // Execute in parallel
        const results = await executeAIInParallel(tasks, 10, 200);

        for (let i = 0; i < batches.length; i++) {
            const batchTimes = batches[i];
            const response = results[i];
            const fullBatchData = batchDataMap.get(i) || [];
            const aiContent = response.success ? (response.content || response.thinking || '') : '';
            const verdict = extractFinalVerdict(aiContent);

            const getMinifiedEph = (c: CandidateDataPackage) => ({
                sun: `${c.planets.sun.sign} ${c.planets.sun.degree}`,
                moon: `${c.planets.moon.sign} ${c.planets.moon.degree}`,
                ascendant: `${c.ascendant.sign} ${c.ascendant.degree}`
            });

            for (let j = 0; j < fullBatchData.length; j++) {
                const candidate = fullBatchData[j];
                const originalTimeInfo = batchTimes[j];
                const isWinner = verdict && candidate.time === verdict.time;
                const score = isWinner ? (verdict.accuracy || 90) : 60;

                if (isWinner) {
                    batchWinners.push(originalTimeInfo);
                } else if (!verdict && fullBatchData.length > 0 && candidate === fullBatchData[0]) {
                    batchWinners.push(originalTimeInfo);
                }

                emitCandidateScore(input.sessionId, candidate.time, score, 6, undefined, getMinifiedEph(candidate));
            }
        }

        finalists = batchWinners;
    }

    // Final judgement
    const finalBatch = await Promise.all(finalists.map(ct => buildCandidateDataPackage(ct.time, ct.offsetMinutes, input, true)));
    const finalAnchor = getPresentTransitData(finalBatch[0]);
    const prompt = getFinalPrecisionPrompt(finalBatch, input.lifeEvents, input.physicalTraits, input.spouseData, finalAnchor);
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

    const finalTime = verdict?.time || finalBatch[0]?.time || input.tentativeTime;
    const accuracy = verdict?.accuracy || 85;
    const confidence = verdict?.confidence || 'MEDIUM';
    const margin = verdict?.margin || 5;

    // Helper (Stage 6 Final)
    const getMinifiedEph = (c: CandidateDataPackage) => ({
        sun: `${c.planets.sun.sign} ${c.planets.sun.degree}`,
        moon: `${c.planets.moon.sign} ${c.planets.moon.degree}`,
        ascendant: `${c.ascendant.sign} ${c.ascendant.degree}`
    });

    const winnerPkg = finalBatch.find(c => c.time === finalTime) || finalBatch[0];

    emitCandidateScore(input.sessionId, finalTime, accuracy, 6, 1, winnerPkg ? getMinifiedEph(winnerPkg) : undefined);

    await progress.completeStep('final', [`FINAL: ${finalTime} (${confidence})`]);

    return {
        finalTime,
        accuracy,
        confidence,
        margin,
        aiReasoning: aiContent,
        thinking: response.thinking, // 🧠 Explicitly return thinking tokens
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
        // FINAL JIT: Enrich the winner package for the final report
        const winnerPkg = await buildCandidateDataPackage(stage6.finalTime, 0, input, true);

        const enrichedResult = {
            summary: stage6.aiReasoning.slice(0, 5000),
            finalCandidate: {
                time: stage6.finalTime,
                score: stage6.accuracy,
                confidence: stage6.confidence,
                margin: stage6.margin,
                thinking: stage6.thinking,
                vimsopakaBala: winnerPkg?.vimsopakaBala,
                ishtaKashtaPhala: winnerPkg?.ishtaKashtaPhala,
                chalitDiscrepancies: winnerPkg?.chalitDiscrepancies
            },
            technicalProof: {
                ephemeris: finalEphemeris,
                divCharts,
                boundary,
                d60Deity: (winnerPkg?.planets?.sun as any)?.d60Deity, // Sample from sun
                vimsopakaAvg: winnerPkg?.vimsopakaBala ? Object.values(winnerPkg.vimsopakaBala).reduce((a: number, b: number) => a + b, 0) / 7 : 0
            },
            godTierData: {
                ephemeris: finalEphemeris,
                divCharts,
                boundarySafety: boundary,
                dasha: stage6.aiReasoning.match(/DASHA[:\s]*([^\n]+)/i)?.[1] || 'Final decision context',
                precisionMetrics: {
                    vimsopaka: winnerPkg?.vimsopakaBala,
                    avasthaMap: Object.fromEntries(Object.entries(winnerPkg?.planets || {}).map(([k, p]) => [k, (p as any).avastha])),
                    deityMap: Object.fromEntries(Object.entries(winnerPkg?.planets || {}).map(([k, p]) => [k, (p as any).d60Deity])),
                    sambandhaMap: Object.fromEntries(Object.entries(winnerPkg?.planets || {}).map(([k, p]) => [k, (p as any).compoundDignity]))
                }
            },
            stageHistory: Object.fromEntries(
                Object.entries(stageHistory).map(([k, v]) => [k, {
                    candidatesIn: v.candidatesIn,
                    candidatesOut: v.candidatesOut
                }])
            )
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
/**
 * Calculate Kakshya (8 sub-divisions of a sign, 3°45' each)
 * Order: Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon, Ascendant
 */
function calculateKakshya(longitude: number): string {
    const degreeInSign = longitude % 30;
    const kakshyaSize = 30 / 8; // 3.75 degrees
    const kakshyaNum = Math.floor(degreeInSign / kakshyaSize);
    const KAKSHYA_ORDER = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon', 'Ascendant'];
    return KAKSHYA_ORDER[kakshyaNum] || 'Unknown';
}
