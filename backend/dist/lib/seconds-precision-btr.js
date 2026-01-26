"use strict";
// lib/seconds-precision-btr.ts
// 🔱 GOD-TIER BTR v7.0: Batch-Based Tournament System
// Research-backed: Max 10 candidates per AI call (Lost in the Middle mitigation)
// Swiss Eph = Calculator (Data Only) | DeepSeek AI = Brain (All Decisions)
Object.defineProperty(exports, "__esModule", { value: true });
exports.SURVIVORS_PER_BATCH = exports.MAX_BATCH_SIZE = void 0;
exports.processSecondsPrecisionBTR = processSecondsPrecisionBTR;
const ephemeris_js_1 = require("./ephemeris.js");
const vedic_astrology_engine_js_1 = require("./vedic-astrology-engine.js");
const advanced_btr_methods_js_1 = require("./advanced-btr-methods.js");
const jaimini_astrology_js_1 = require("./jaimini-astrology.js");
const ai_client_js_1 = require("./ai-client.js");
const time_offset_manager_js_1 = require("./time-offset-manager.js");
Object.defineProperty(exports, "MAX_BATCH_SIZE", { enumerable: true, get: function () { return time_offset_manager_js_1.MAX_BATCH_SIZE; } });
Object.defineProperty(exports, "SURVIVORS_PER_BATCH", { enumerable: true, get: function () { return time_offset_manager_js_1.SURVIVORS_PER_BATCH; } });
const logger_js_1 = require("./logger.js");
const progress_tracker_js_1 = require("./progress-tracker.js");
const cancellation_manager_js_1 = require("./cancellation-manager.js");
const session_events_js_1 = require("./session-events.js");
// ═════════════════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════════════════
const ZODIAC_SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];
// ═════════════════════════════════════════════════════════════════════════════
// MEMORY-EFFICIENT HELPERS
// ═════════════════════════════════════════════════════════════════════════════
const sleep = (ms) => new Promise(res => setTimeout(res, ms));
function formatTimeHHMMSS(time) {
    const parts = time.split(':');
    if (parts.length === 2)
        return `${time}:00`;
    return time;
}
// ═════════════════════════════════════════════════════════════════════════════
// DATA PACKAGE BUILDER (Swiss Eph → Pure JSON)
// ═════════════════════════════════════════════════════════════════════════════
async function buildCandidateDataPackage(time, offsetMinutes, input, includeFullData = false) {
    let ephemeris = await (0, ephemeris_js_1.calculateEphemeris)(input.dateOfBirth, time, input.latitude, input.longitude, input.timezone);
    // Calculate All Vargas and Special Metrics
    const { calculateAllVargas, calculateAshtakavarga, calculateShadbala, detectYogas, verifyDoubleTransit, calculateArudhas, calculatePanchanga } = await import('./vedic-astrology-engine.js');
    ephemeris.divisionalCharts = calculateAllVargas(ephemeris);
    ephemeris.ashtakavarga = calculateAshtakavarga(ephemeris);
    ephemeris.shadbala = calculateShadbala(ephemeris);
    const yogas = detectYogas(ephemeris);
    const moonLong = ephemeris.planets.moon.longitude;
    const birthDate = new Date(input.dateOfBirth);
    // Build planet positions
    const planets = {};
    // Helper for DMS
    function toDMS(decimal) {
        const d = Math.floor(decimal);
        const m = Math.floor((decimal - d) * 60);
        const s = Math.round(((decimal - d) * 60 - m) * 60);
        return `${d}° ${m.toString().padStart(2, '0')}' ${s.toString().padStart(2, '0')}"`;
    }
    for (const [name, data] of Object.entries(ephemeris.planets)) {
        const nakshatra = (0, vedic_astrology_engine_js_1.getNakshatraForLongitude)(data.longitude);
        planets[name] = {
            sign: data.sign,
            degree: (data.longitude % 30).toFixed(4) + '°',
            nakshatra: nakshatra.name
        };
    }
    // Build Vimshottari Dasha table (Flattened to Prana level for God-Tier Precision)
    const vimDashas = (0, vedic_astrology_engine_js_1.calculateVimshottariDasha)(moonLong, birthDate);
    // Determine relevant date range (Birth to Present/Max Event + 1 Year buffer)
    const eventDates = input.lifeEvents.map(e => new Date(e.eventDate).getTime());
    const now = Date.now();
    const minDate = Math.min(...eventDates, now) - (365 * 24 * 60 * 60 * 1000); // 1 year before first event
    const maxEventDate = Math.max(...eventDates, now);
    const maxDate = maxEventDate + (365 * 24 * 60 * 60 * 1000); // 1 year buffer
    const vimshottariDasha = [];
    for (const maha of vimDashas) {
        if (!maha.subPeriods)
            continue;
        for (const antar of maha.subPeriods) {
            for (const prat of antar.subPeriods) {
                for (const suksh of prat.subPeriods) {
                    for (const prana of suksh.subPeriods) {
                        const start = prana.startDate.getTime();
                        const end = prana.endDate.getTime();
                        // Include if overlaps with event range
                        if (start <= maxDate && end >= minDate) {
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
                }
            }
        }
    }
    const ascNakshatra = (0, vedic_astrology_engine_js_1.getNakshatraForLongitude)(ephemeris.ascendant.longitude);
    // 🔱 GOD-TIER DATA ENRICHMENT
    // We calculate explicit Vedic metrics so the AI doesn't have to "think" about them (reducing hallucination risk)
    const richPlanets = {};
    // Capitalize helper
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const arudhas = calculateArudhas(ephemeris);
    const panchanga = calculatePanchanga((0, ephemeris_js_1.calculateJulianDay)(birthDate), ephemeris.planets.sun.longitude, ephemeris.planets.moon.longitude);
    // Pre-calculate target map for aspects
    const planetLongitudes = {};
    for (const [key, p] of Object.entries(ephemeris.planets)) {
        planetLongitudes[cap(key)] = p.longitude;
    }
    // Capture Longitude Map for Aspects
    for (const [key, p] of Object.entries(ephemeris.planets)) {
        const planetName = cap(key);
        const functional = (0, vedic_astrology_engine_js_1.calculateFunctionalNature)(ephemeris.ascendant.sign, planetName);
        const aspects = (0, vedic_astrology_engine_js_1.calculateAspects)(planetName, p.longitude, planetLongitudes, ephemeris.ascendant.longitude);
        const signIdx = ZODIAC_SIGNS.indexOf(p.sign);
        richPlanets[key] = {
            sign: p.sign,
            degree: (p.longitude % 30).toFixed(4) + '°',
            nakshatra: p.nakshatra,
            house: p.house || (0, vedic_astrology_engine_js_1.calculateHouse)(ephemeris.ascendant.sign, p.sign),
            dignity: p.dignity || (0, vedic_astrology_engine_js_1.getDignity)(planetName, p.sign),
            isRetro: p.retro,
            speed: p.speed,
            isCombust: p.isCombust,
            shadbala: ephemeris.shadbala?.[planetName],
            bav: ephemeris.ashtakavarga?.[planetName]?.[signIdx],
            functionalNature: functional,
            aspects: aspects
        };
    }
    const pkg = {
        time,
        offsetMinutes,
        planets: richPlanets,
        ascendant: {
            sign: ephemeris.ascendant.sign,
            degree: (ephemeris.ascendant.longitude % 30).toFixed(4) + '°',
            nakshatra: ascNakshatra.name
        },
        houseLords: (0, vedic_astrology_engine_js_1.getAllHouseLords)(ephemeris.ascendant.sign),
        moonNakshatra: ephemeris.planets.moon.nakshatra,
        vimshottariDasha,
        ashtakavarga: ephemeris.ashtakavarga,
        panchanga,
        specialPoints: {
            AL: { sign: arudhas.AL, degree: '0.00°', house: ((ZODIAC_SIGNS.indexOf(arudhas.AL) - ZODIAC_SIGNS.indexOf(ephemeris.ascendant.sign) + 12) % 12) + 1 },
            UL: { sign: arudhas.UL, degree: '0.00°', house: ((ZODIAC_SIGNS.indexOf(arudhas.UL) - ZODIAC_SIGNS.indexOf(ephemeris.ascendant.sign) + 12) % 12) + 1 }
        },
        yogas
    };
    // Include extended data for later stages
    if (includeFullData) {
        // 1. Yogini Dasha - Filtered by Timeline
        const yogDashas = (0, advanced_btr_methods_js_1.calculateYoginiDasha)(moonLong, birthDate);
        pkg.yoginiDasha = yogDashas.filter(d => {
            const start = d.startDate.getTime();
            const end = d.endDate.getTime();
            return start <= maxDate && end >= minDate;
        }).map(d => ({
            lord: d.name,
            startEnd: `${d.startDate.toISOString().split('T')[0]} to ${d.endDate.toISOString().split('T')[0]}`
        }));
        // 2. Chara Dasha - Filtered by Timeline
        const charDashas = (0, jaimini_astrology_js_1.calculateCharaDasha)(ephemeris, birthDate);
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
            const d9Planets = {};
            for (const [name, p] of Object.entries(vargas.D9.planets)) {
                d9Planets[name] = p.sign;
            }
            pkg.d9Chart = { ascendant: vargas.D9.ascendant.sign, planets: d9Planets };
        }
        if (vargas.D10) {
            const d10Planets = {};
            for (const [name, p] of Object.entries(vargas.D10.planets)) {
                d10Planets[name] = p.sign;
            }
            pkg.d10Chart = { ascendant: vargas.D10.ascendant.sign, planets: d10Planets };
        }
        // 4. Transit Data - Enhanced with Retro
        pkg.transitData = {};
        for (const event of input.lifeEvents) {
            try {
                const eventEph = await (0, ephemeris_js_1.calculateEphemeris)(event.eventDate, event.eventTime || '12:00:00', input.latitude, input.longitude, input.timezone);
                // 🔱 GOD-TIER: Dasha Hierarchy at Event Moment (MH -> AD -> PD -> SD -> PD)
                const dashaAtEvent = (0, vedic_astrology_engine_js_1.getDashaForDate)(vimDashas, new Date(event.eventDate));
                const dashaSequence = dashaAtEvent ?
                    `${dashaAtEvent.mahadasha}-${dashaAtEvent.antardasha}-${dashaAtEvent.pratyantardasha}-${dashaAtEvent.sukshmadasha}-${dashaAtEvent.pranadasha}` :
                    'Unknown';
                // Double Transit Check for relevant categories
                let dtResult = null;
                if (event.category === 'marriage') {
                    dtResult = verifyDoubleTransit(eventEph, ephemeris.ascendant.sign, 7);
                }
                else if (event.category === 'career') {
                    dtResult = verifyDoubleTransit(eventEph, ephemeris.ascendant.sign, 10);
                }
                pkg.transitData[event.eventDate] = {
                    dasha: dashaSequence,
                    saturn: `${eventEph.planets.saturn.sign}${eventEph.planets.saturn.retro ? ' (R)' : ''}`,
                    jupiter: `${eventEph.planets.jupiter.sign}${eventEph.planets.jupiter.retro ? ' (R)' : ''}`,
                    rahu: `${eventEph.planets.rahu.sign}${eventEph.planets.rahu.retro ? ' (R)' : ''}`,
                    ketu: `${eventEph.planets.ketu.sign}${eventEph.planets.ketu.retro ? ' (R)' : ''}`,
                    doubleTransit: dtResult
                };
            }
            catch {
                // Skip
            }
        }
    }
    return pkg;
}
// ═════════════════════════════════════════════════════════════════════════════
// LIFE EVENT FORMATTER
// ═════════════════════════════════════════════════════════════════════════════
function formatLifeEventForAI(event) {
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
            }
            else {
                timeStr = yStart;
            }
            nuance = '(Year-Level)';
            break;
        case 'date_range':
            if (endDate)
                timeStr = `${eventDate} to ${endDate}`;
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
function getBatchPrompt(candidates, events, traits, batchNumber, totalBatches, survivorsNeeded) {
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
        const aspects = p.aspects?.filter((a) => a.isHit).map((a) => `${a.type}→${a.targetPlanet || 'H' + a.targetHouse}`).join(', ') || 'None';
        return `│ ${caps.padEnd(7)}: ${p.sign.padEnd(10)} ${p.degree.padEnd(8)} | H: ${p.house} | Role: ${p.functionalNature?.role.padEnd(8)} | Sh: ${p.shadbala || '?'} | BAV: ${p.bav || '?'} | SAV: ${sav} | Asp: ${aspects}`;
    }).join('\n')}

${c.yogas && c.yogas.length > 0 ? `YOGAS DETECTED: ${c.yogas.map(y => `${y.name} (${y.level})`).join(', ')}` : ''}

${c.d9Lagna ? `D9 NAVAMSHA LAGNA: ${c.d9Lagna}` : ''}
${c.d10Lagna ? `D10 DASAMSHA LAGNA: ${c.d10Lagna}` : ''}

VIMSHOTTARI DASHA PERIODS (MD-AD-PD-SD-PRD):
${c.vimshottariDasha.slice(0, 10).map(d => `  • ${d.maha}/${d.antar}/${d.pratyantar}/${d.sukshma}/${d.prana} : ${d.startEnd}`).join('\n')}
${c.yoginiDasha ? `\nYOGINI DASHA: ${c.yoginiDasha.map(d => `${d.lord} (${d.startEnd})`).join(' → ')}` : ''}
`).join('')}

SCORING ALGORITHM (STRICT VEDIC LOGIC):
+30: PRIMARY MATCH - Dasha/Antar Lord is DIRECTLY the House Lord of the event (e.g. Marriage in 7th Lord dasha).
+20: SECONDARY MATCH - Dasha Lord is placed in the event house or aspects it.
+15: STRENGTH PROOF - Event dasha lord has high Shadbala (>120) or high SAV points (>28) in event house.
+10: NATURAL KARAKA - Dasha Lord is natural significator (Venus=Marriage, Sun=Career) even if not functional lord.
+10: LAGNA MATCH - Ascendant element/lord matches physical traits.
-50: CONTRADICTION - Event happened in dasha of 6/8/12 lord with NO connection to event house.

OUTPUT FORMAT (one line per candidate):
[TIME] | SCORE: [0-100] | VERDICT: KEEP/ELIMINATE | REASON: [Explicit Astrological Reason e.g. "Venus is 7th Lord"]

FINAL LINE (required):
TOP_SURVIVORS: [comma-separated list of ${survivorsNeeded} best times]`;
}
function getDeepAnalysisPrompt(candidates, events, traits, spouseData) {
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
3. USE DIVISIONAL CHARTS: Verify D9/D10/D60 promises.
4. CORRELATE DASHAS: Match Dasha Lords (and their House ownerships) to life events.
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
        const aspects = p.aspects?.filter((a) => a.isHit).map((a) => `${a.type}→${a.targetPlanet || 'H' + a.targetHouse}`).join(', ') || 'None';
        const status = [p.isRetro ? 'RETRO' : '', p.isCombust ? 'COMBUST' : ''].filter(Boolean).join('/') || 'DIRECT';
        return `│ ${caps.padEnd(7)}: ${p.sign.padEnd(10)} ${p.degree.padEnd(8)} | H: ${p.house} | ${p.nakshatra.padEnd(12)} | ${p.dignity.padEnd(10)} | Sp: ${p.speed.toFixed(3)} | Sh: ${p.shadbala || '?'} | BAV: ${p.bav || '?'} | SAV: ${sav} | ${status} | Asp: ${aspects}`;
    }).join('\n')}
├ YOGAS: ${c.yogas?.map(y => y.name).join(', ') || 'None'}
├ DIVISIONAL CHARTS:
│ D9 (Navamsa): Lagna=${c.d9Lagna} | Planets=${c.d9Chart ? Object.entries(c.d9Chart.planets).map(([k, v]) => `${k.substring(0, 2).toUpperCase()}=${v}`).join(' ') : ''}
│ D10 (Dasamsa): Lagna=${c.d10Lagna} | Planets=${c.d10Chart ? Object.entries(c.d10Chart.planets).map(([k, v]) => `${k.substring(0, 2).toUpperCase()}=${v}`).join(' ') : ''}
│ D60 (Shashtyamsa): Lagna=${c.d60Sign}
├ VIMSHOTTARI DASHA SEQUENCE (Full 5-Level Resolve):
${c.vimshottariDasha.slice(0, 12).map(d => `│ ${d.maha} -> ${d.antar} -> ${d.pratyantar} -> ${d.sukshma} -> ${d.prana} : ${d.startEnd}`).join('\n')}
├ YOGINI DASHA: ${c.yoginiDasha?.map(d => `${d.lord} [${d.startEnd}]`).join(' | ') || 'N/A'}
├ CHARA DASHA: ${c.charaDasha?.map(d => `${d.sign} [${d.startEnd}]`).join(' | ') || 'N/A'}
├ ASHTAKAVARGA SAV: ${c.ashtakavarga?.SAV ? `[${c.ashtakavarga.SAV.join(', ')}]` : 'N/A'}
${c.transitData ? `├ TRANSITS ON EVENTS:
${Object.entries(c.transitData).slice(0, 5).map(([date, t]) => `│ [${date}]: Dasha=${t.dasha} | Sa=${t.saturn}, Ju=${t.jupiter}${t.doubleTransit?.isTriggered ? ` | 🔱 DT H${t.doubleTransit.targetHouse}` : ''}`).join('\n')}` : ''}
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
function getFinalPrecisionPrompt(candidates, events, traits, spouseData) {
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
        const status = [p.isRetro ? 'RETRO' : '', p.isCombust ? 'COMBUST' : ''].filter(Boolean).join('/') || 'DIRECT';
        return `│ ${caps.padEnd(7)}: ${p.sign.padEnd(10)} [H${p.house}, ${p.dignity.padEnd(8)}, Sh:${p.shadbala || '?'}, BAV:${p.bav || '?'}, SAV:${sav}, ${status}]`;
    }).join('\n')}
├ YOGAS: ${c.yogas?.map(y => y.name).join(', ') || 'N/A'}
├ VIMSHOTTARI SEQUENCE (MD-AD-PD-SD-PRD):
${c.vimshottariDasha.slice(0, 15).map(d => `│ ${d.maha} -> ${d.antar} -> ${d.pratyantar} -> ${d.sukshma} -> ${d.prana} : ${d.startEnd}`).join('\n')}
├ SAV: ${c.ashtakavarga?.SAV ? c.ashtakavarga.SAV.join(',') : ''}
${c.transitData ? `├ TRANSITS & DASHAS:
${Object.entries(c.transitData).slice(0, 3).map(([date, t]) => `│ [${date}]: Dasha=${t.dasha} | Ju=${t.jupiter}, Sa=${t.saturn}${t.doubleTransit?.isTriggered ? ` (DT H${t.doubleTransit.targetHouse})` : ''}`).join('\n')}` : ''}
└ BOUNDARY CHECK: ${parseFloat(c.ascendant.degree) < 1 || parseFloat(c.ascendant.degree) > 29 ? '⚠️ EDGE' : 'SAFE'}`).join('\n')}

FINAL VERDICT (required format):
BEST TIME: [HH:MM:SS]
REASONING: [Explicitly cite D60 Lagna, Dasha Connection, and Shadbala/SAV proof. No generic text.]
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
function extractBatchSurvivors(aiContent, candidateTimes, neededCount) {
    // Try to extract from TOP_SURVIVORS line
    const survivorMatch = aiContent.match(/TOP_SURVIVORS?[:\s]*([^\n]+)/i);
    if (survivorMatch) {
        const times = survivorMatch[1].match(/\d{2}:\d{2}:\d{2}/g) || [];
        if (times.length >= neededCount) {
            return times.slice(0, neededCount);
        }
    }
    // Fallback: Extract scores and pick top N
    const scores = [];
    for (const time of candidateTimes) {
        const timePattern = new RegExp(`CANDIDATE[:\\s]*${time.replace(/:/g, '[:\\s]?')}[\\s\\S]{0,300}SCORE[:\\s]*(\\d+)`, 'i');
        const match = aiContent.match(timePattern);
        const score = match ? parseInt(match[1]) : 50;
        scores.push({ time, score });
    }
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, neededCount).map(s => s.time);
}
function extractFinalVerdict(aiContent) {
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
async function stage1ExhaustiveDataGeneration(input, progress) {
    await progress.startStep('grid', 'Stage 1: Generating ALL candidate data...');
    const rawCandidates = (0, time_offset_manager_js_1.generateCandidateTimes)(input.tentativeTime, input.offsetConfig);
    const candidates = [];
    const total = rawCandidates.length;
    let processed = 0;
    logger_js_1.logger.info('🔱 Stage 1: Generating Swiss Eph data for ALL candidates', { total });
    for (const raw of rawCandidates) {
        const pkg = await buildCandidateDataPackage(raw.time, raw.offsetMinutes, input, true);
        candidates.push(pkg);
        processed++;
        // Log EVERY calculation (user requested)
        (0, session_events_js_1.emitCalculationLog)(input.sessionId, {
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
        if (processed % 5 === 0)
            await sleep(20);
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
async function stage2BatchTournament(input, candidates, progress) {
    await progress.startStep('coarse', 'Stage 2: Batch Tournament...');
    const rounds = [];
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
    const batchSize = (0, time_offset_manager_js_1.getDynamicBatchSize)(candidates.length, offsetMinutes);
    const survivorsPerBatch = (0, time_offset_manager_js_1.getDynamicSurvivors)(batchSize);
    logger_js_1.logger.info('🔱 Stage 2: Starting batch tournament', {
        totalCandidates: currentCandidates.length,
        offsetMinutes,
        batchSize, // Dynamic!
        survivorsPerBatch
    });
    // Helper for Eph formatting
    const getMinifiedEph = (c) => ({
        sun: `${c.planets.sun.sign} ${c.planets.sun.degree}`,
        moon: `${c.planets.moon.sign} ${c.planets.moon.degree}`,
        ascendant: `${c.ascendant.sign} ${c.ascendant.degree}`
    });
    // Continue tournament until we have batchSize or fewer candidates
    while (currentCandidates.length > batchSize) {
        roundNumber++;
        const batches = (0, time_offset_manager_js_1.splitIntoBatches)(currentCandidates, batchSize);
        const roundSurvivors = [];
        await progress.updateMessage(`Round ${roundNumber}: ${batches.length} batches of ${batchSize}`);
        // 🔱 Parallel Execution Logic
        const tasks = batches.map((batch, i) => async () => {
            // Emit context just before execution (or inside to track start)
            // Note: Context emission here might interleave in logs, which is fine for parallel
            (0, session_events_js_1.emitAIContext)(input.sessionId, {
                stage: 2,
                candidateTime: `Batch ${i + 1}/${batches.length}`,
                round: roundNumber,
                batch: i + 1,
                totalBatches: batches.length,
                candidatesInBatch: batch.length
            });
            const prompt = getBatchPrompt(batch, input.lifeEvents, input.physicalTraits, i + 1, batches.length, survivorsPerBatch);
            return (0, ai_client_js_1.callAIWithStream)(input.sessionId, 2, 'You are the SUPREME VEDIC ASTROLOGER. Analyze ALL candidates with EQUAL attention.', prompt, {
                // model: 'deepseek/deepseek-r1', // Use env default
                candidateTime: `Batch ${i + 1}/${batches.length}`,
                progressTracker: progress
            });
        });
        // Execute in parallel (Max IO Concurrency)
        const results = await (0, ai_client_js_1.executeAIInParallel)(tasks, 20, 100);
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
                (0, session_events_js_1.emitCandidateScore)(input.sessionId, candidate.time, score, 2, undefined, getMinifiedEph(candidate));
            }
        }
        // Check for cancellation once per round instead of per batch
        await (0, cancellation_manager_js_1.throwIfCancelled)(input.sessionId, input.abortSignal);
        rounds.push({
            roundNumber,
            batchesProcessed: batches.length,
            candidatesIn: currentCandidates.length,
            candidatesOut: roundSurvivors.length
        });
        logger_js_1.logger.info(`🔱 Round ${roundNumber} complete`, {
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
async function stage3RefinementGrid(input, survivors, progress) {
    await progress.startStep('fine', 'Stage 3: Generating refinement grid...');
    const refinedCandidates = [];
    // Generate ±5 min grid at 1-min interval around each survivor
    for (const survivor of survivors) {
        const fineGrid = (0, time_offset_manager_js_1.generateRefinementGrid)(survivor.time, 5, 60); // ±5 min @ 1 min
        for (const gridPoint of fineGrid) {
            // Check if already exists
            if (!refinedCandidates.some(c => c.time === gridPoint.time)) {
                const pkg = await buildCandidateDataPackage(gridPoint.time, gridPoint.offsetMinutes, input, true // Include full data for deep analysis
                );
                refinedCandidates.push(pkg);
                (0, session_events_js_1.emitCalculationLog)(input.sessionId, {
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
async function stage4DeepAnalysis(input, candidates, progress) {
    await progress.startStep('deep', 'Stage 4: Deep multi-dasha analysis...');
    // Run another tournament round if needed
    let currentCandidates = [...candidates];
    let allReasoning = '';
    while (currentCandidates.length > time_offset_manager_js_1.MAX_BATCH_SIZE) {
        const batches = (0, time_offset_manager_js_1.splitIntoBatches)(currentCandidates, time_offset_manager_js_1.MAX_BATCH_SIZE);
        const batchSurvivors = [];
        // 🔱 Parallel Execution Logic (Stage 4)
        const tasks = batches.map((batch, i) => async () => {
            (0, session_events_js_1.emitAIContext)(input.sessionId, {
                stage: 4,
                candidateTime: `Deep ${i + 1}/${batches.length}`,
                round: 1,
                batch: i + 1,
                totalBatches: batches.length,
                candidatesInBatch: batch.length
            });
            const prompt = getDeepAnalysisPrompt(batch, input.lifeEvents, input.physicalTraits, input.spouseData);
            return (0, ai_client_js_1.callAIWithStream)(input.sessionId, 4, 'You are performing DEEP astrological verification.', prompt, {
                // model: 'deepseek/deepseek-r1', // Use env default
                candidateTime: `Deep ${i + 1}/${batches.length}`,
                progressTracker: progress
            });
        });
        // Execute in parallel (Max IO Concurrency)
        const results = await (0, ai_client_js_1.executeAIInParallel)(tasks, 20, 100);
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const response = results[i];
            const aiContent = response.success ? (response.content || response.thinking || '') : '';
            allReasoning += aiContent + '\n\n';
            const getMinifiedEph = (c) => ({
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
                (0, session_events_js_1.emitCandidateScore)(input.sessionId, candidate.time, score, 4, undefined, getMinifiedEph(candidate));
            }
        }
        currentCandidates = batchSurvivors;
    }
    // Final deep analysis on remaining candidates
    if (currentCandidates.length > 3) {
        const prompt = getDeepAnalysisPrompt(currentCandidates, input.lifeEvents, input.physicalTraits, input.spouseData);
        const response = await (0, ai_client_js_1.callAIWithStream)(input.sessionId, 4, 'You are performing FINAL deep verification.', prompt, {
            candidateTime: 'Deep Final',
            progressTracker: progress
        });
        const aiContent = response.success ? (response.content || response.thinking || '') : '';
        allReasoning += aiContent;
        const survivorTimes = extractBatchSurvivors(aiContent, currentCandidates.map(c => c.time), 7);
        // Helper (Stage 4 Final)
        const getMinifiedEph = (c) => ({
            sun: `${c.planets.sun.sign} ${c.planets.sun.degree}`,
            moon: `${c.planets.moon.sign} ${c.planets.moon.degree}`,
            ascendant: `${c.ascendant.sign} ${c.ascendant.degree}`
        });
        const survivors = [];
        for (const candidate of currentCandidates) {
            const isSurvivor = survivorTimes.includes(candidate.time);
            const score = isSurvivor ? 95 : 65;
            if (isSurvivor)
                survivors.push(candidate);
            (0, session_events_js_1.emitCandidateScore)(input.sessionId, candidate.time, score, 4, undefined, getMinifiedEph(candidate));
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
async function stage5MicroGrid(input, survivors, progress) {
    await progress.startStep('micro', 'Stage 5: Micro-precision grid...');
    const microCandidates = [];
    // Generate ±30 sec grid at 6-sec interval around top 3
    for (const survivor of survivors.slice(0, 3)) {
        const microGrid = (0, time_offset_manager_js_1.generateRefinementGrid)(survivor.time, 0.5, 6); // ±30 sec @ 6 sec
        for (const gridPoint of microGrid) {
            if (!microCandidates.some(c => c.time === gridPoint.time)) {
                const pkg = await buildCandidateDataPackage(gridPoint.time, gridPoint.offsetMinutes, input, true);
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
async function stage6FinalPrecision(input, candidates, progress) {
    await progress.startStep('final', 'Stage 6: Final precision judgement...');
    // If too many, run one more batch round
    let finalists = [...candidates];
    while (finalists.length > time_offset_manager_js_1.MAX_BATCH_SIZE) {
        const batches = (0, time_offset_manager_js_1.splitIntoBatches)(finalists, time_offset_manager_js_1.MAX_BATCH_SIZE);
        const batchWinners = [];
        // 🔱 Parallel Execution Logic (Stage 6)
        const tasks = batches.map((batch) => async () => {
            const prompt = getFinalPrecisionPrompt(batch, input.lifeEvents, input.physicalTraits, input.spouseData);
            return (0, ai_client_js_1.callAIWithStream)(input.sessionId, 6, 'FINAL JUDGEMENT. Pick THE ONE.', prompt, {
                candidateTime: 'FINAL',
                progressTracker: progress
            });
        });
        // Execute in parallel (Concurrency: 10)
        const results = await (0, ai_client_js_1.executeAIInParallel)(tasks, 10, 200);
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const response = results[i];
            const aiContent = response.success ? (response.content || response.thinking || '') : '';
            const verdict = extractFinalVerdict(aiContent);
            const getMinifiedEph = (c) => ({
                sun: `${c.planets.sun.sign} ${c.planets.sun.degree}`,
                moon: `${c.planets.moon.sign} ${c.planets.moon.degree}`,
                ascendant: `${c.ascendant.sign} ${c.ascendant.degree}`
            });
            for (const candidate of batch) {
                const isWinner = verdict && candidate.time === verdict.time;
                const score = isWinner ? (verdict.accuracy || 90) : 60;
                if (isWinner)
                    batchWinners.push(candidate);
                else if (!verdict && batch.length > 0 && candidate === batch[0]) {
                    batchWinners.push(candidate);
                }
                (0, session_events_js_1.emitCandidateScore)(input.sessionId, candidate.time, score, 6, undefined, getMinifiedEph(candidate));
            }
        }
        finalists = batchWinners;
    }
    // Final judgement
    const prompt = getFinalPrecisionPrompt(finalists, input.lifeEvents, input.physicalTraits, input.spouseData);
    const response = await (0, ai_client_js_1.callAIWithStream)(input.sessionId, 6, 'You are the DIVINE ARCHITECT of Time. FINAL JUDGEMENT.', prompt, {
        model: 'deepseek/deepseek-v3.2',
        candidateTime: 'FINAL VERDICT',
        progressTracker: progress,
        timeoutMs: 120000
    });
    const aiContent = response.success ? (response.content || response.thinking || '') : '';
    const verdict = extractFinalVerdict(aiContent);
    const finalTime = verdict?.time || finalists[0]?.time || input.tentativeTime;
    const accuracy = verdict?.accuracy || 85;
    const confidence = verdict?.confidence || 'MEDIUM';
    const margin = verdict?.margin || 5;
    // Helper (Stage 6 Final)
    const getMinifiedEph = (c) => ({
        sun: `${c.planets.sun.sign} ${c.planets.sun.degree}`,
        moon: `${c.planets.moon.sign} ${c.planets.moon.degree}`,
        ascendant: `${c.ascendant.sign} ${c.ascendant.degree}`
    });
    const winnerPkg = finalists.find(c => c.time === finalTime) || finalists[0];
    (0, session_events_js_1.emitCandidateScore)(input.sessionId, finalTime, accuracy, 6, 1, winnerPkg ? getMinifiedEph(winnerPkg) : undefined);
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
async function processSecondsPrecisionBTR(input) {
    const startTime = Date.now();
    const progress = new progress_tracker_js_1.ProgressTracker(input.sessionId);
    const stageHistory = {};
    try {
        await progress.updateETA(600);
        await progress.startStep('init', '🔱 Initializing God-Tier BTR v7.0 (Batch Tournament)...');
        logger_js_1.logger.info('🔱 Starting GOD-TIER BTR v7.0 (10-Candidate Batches)', {
            sessionId: input.sessionId,
            dateOfBirth: input.dateOfBirth,
            offsetConfig: input.offsetConfig,
            maxBatchSize: time_offset_manager_js_1.MAX_BATCH_SIZE
        });
        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 1: EXHAUSTIVE DATA GENERATION
        // ═══════════════════════════════════════════════════════════════════════
        await (0, cancellation_manager_js_1.throwIfCancelled)(input.sessionId, input.abortSignal);
        const stage1 = await stage1ExhaustiveDataGeneration(input, progress);
        stageHistory[1] = stage1.stageResult;
        (0, session_events_js_1.emitStageStats)(input.sessionId, 1, stage1.stageResult.candidatesOut, `Generated ${stage1.stageResult.candidatesOut} candidates`);
        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 2: BATCH TOURNAMENT
        // ═══════════════════════════════════════════════════════════════════════
        await (0, cancellation_manager_js_1.throwIfCancelled)(input.sessionId, input.abortSignal);
        await progress.updateETA(480);
        const stage2 = await stage2BatchTournament(input, stage1.candidates, progress);
        stageHistory[2] = stage2.stageResult;
        (0, session_events_js_1.emitStageStats)(input.sessionId, 2, stage2.stageResult.candidatesOut, `Tournament: ${stage2.rounds.length} rounds, ${stage2.survivors.length} survivors`);
        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 3: REFINEMENT GRID
        // ═══════════════════════════════════════════════════════════════════════
        await (0, cancellation_manager_js_1.throwIfCancelled)(input.sessionId, input.abortSignal);
        await progress.updateETA(360);
        const stage3 = await stage3RefinementGrid(input, stage2.survivors, progress);
        stageHistory[3] = stage3.stageResult;
        (0, session_events_js_1.emitStageStats)(input.sessionId, 3, stage3.stageResult.candidatesOut, `Refined to ${stage3.stageResult.candidatesOut}`);
        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 4: DEEP ANALYSIS
        // ═══════════════════════════════════════════════════════════════════════
        await (0, cancellation_manager_js_1.throwIfCancelled)(input.sessionId, input.abortSignal);
        await progress.updateETA(240);
        const stage4 = await stage4DeepAnalysis(input, stage3.candidates, progress);
        stageHistory[4] = stage4.stageResult;
        (0, session_events_js_1.emitStageStats)(input.sessionId, 4, stage4.stageResult.candidatesOut, `Deep: ${stage4.survivors.length} survivors`);
        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 5: MICRO GRID
        // ═══════════════════════════════════════════════════════════════════════
        await (0, cancellation_manager_js_1.throwIfCancelled)(input.sessionId, input.abortSignal);
        await progress.updateETA(120);
        const stage5 = await stage5MicroGrid(input, stage4.survivors, progress);
        stageHistory[5] = stage5.stageResult;
        (0, session_events_js_1.emitStageStats)(input.sessionId, 5, stage5.stageResult.candidatesOut, `Micro: ${stage5.candidates.length}`);
        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 6: FINAL PRECISION
        // ═══════════════════════════════════════════════════════════════════════
        await (0, cancellation_manager_js_1.throwIfCancelled)(input.sessionId, input.abortSignal);
        await progress.updateETA(60);
        const stage6 = await stage6FinalPrecision(input, stage5.candidates, progress);
        stageHistory[6] = stage6.stageResult;
        (0, session_events_js_1.emitStageStats)(input.sessionId, 6, 1, 'FINAL TIME DETERMINED');
        // ═══════════════════════════════════════════════════════════════════════
        // BUILD FINAL RESULT
        // ═══════════════════════════════════════════════════════════════════════
        const finalEphemeris = await (0, ephemeris_js_1.calculateEphemeris)(input.dateOfBirth, stage6.finalTime, input.latitude, input.longitude, input.timezone);
        const divCharts = (0, advanced_btr_methods_js_1.generateDivisionalCharts)(finalEphemeris);
        const boundary = (0, advanced_btr_methods_js_1.calculateBoundarySafety)(finalEphemeris);
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
    }
    catch (error) {
        logger_js_1.logger.error('GOD-TIER BTR v7.0 FAILED', error);
        if ((0, cancellation_manager_js_1.isCancellationError)(error)) {
            throw error;
        }
        const currentStepId = progress_tracker_js_1.ANALYSIS_STEPS[Math.min(progress_tracker_js_1.ANALYSIS_STEPS.length - 1, progress.getProgress().currentStep)]?.id || 'final';
        await progress.errorStep(currentStepId, error instanceof Error ? error.message : String(error));
        throw error;
    }
}
//# sourceMappingURL=seconds-precision-btr.js.map