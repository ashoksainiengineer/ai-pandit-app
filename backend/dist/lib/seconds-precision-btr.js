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
    const ephemeris = await (0, ephemeris_js_1.calculateEphemeris)(input.dateOfBirth, time, input.latitude, input.longitude, input.timezone);
    const moonLong = ephemeris.planets.moon.longitude;
    const birthDate = new Date(input.dateOfBirth);
    // Build planet positions
    const planets = {};
    for (const [name, data] of Object.entries(ephemeris.planets)) {
        const nakshatra = (0, vedic_astrology_engine_js_1.getNakshatraForLongitude)(data.longitude);
        planets[name] = {
            sign: data.sign,
            degree: (data.longitude % 30).toFixed(4) + '°',
            nakshatra: nakshatra.name
        };
    }
    // Build Vimshottari Dasha table
    const vimDashas = (0, vedic_astrology_engine_js_1.calculateVimshottariDasha)(moonLong, birthDate);
    const vimshottariDasha = vimDashas.slice(0, 3).map(d => ({
        maha: d.lord,
        antar: d.subPeriods?.[0]?.lord || 'N/A',
        pratyantar: d.subPeriods?.[0]?.subPeriods?.[0]?.lord || 'N/A',
        startEnd: `${d.startDate.toISOString().split('T')[0]} to ${d.endDate.toISOString().split('T')[0]}`
    }));
    const ascNakshatra = (0, vedic_astrology_engine_js_1.getNakshatraForLongitude)(ephemeris.ascendant.longitude);
    const pkg = {
        time,
        offsetMinutes,
        planets,
        ascendant: {
            sign: ephemeris.ascendant.sign,
            degree: (ephemeris.ascendant.longitude % 30).toFixed(4) + '°',
            nakshatra: ascNakshatra.name
        },
        moonNakshatra: planets.moon.nakshatra,
        vimshottariDasha
    };
    // Include extended data for later stages
    if (includeFullData) {
        const yogDashas = (0, advanced_btr_methods_js_1.calculateYoginiDasha)(moonLong, birthDate);
        pkg.yoginiDasha = yogDashas.slice(0, 3).map(d => ({
            lord: d.name,
            startEnd: `${d.startDate.toISOString().split('T')[0]} to ${d.endDate.toISOString().split('T')[0]}`
        }));
        const charDashas = (0, jaimini_astrology_js_1.calculateCharaDasha)(ephemeris, birthDate);
        pkg.charaDasha = charDashas.slice(0, 3).map(d => ({
            sign: d.sign,
            startEnd: `${d.startDate.toISOString().split('T')[0]} to ${d.endDate.toISOString().split('T')[0]}`
        }));
        const d9 = (0, advanced_btr_methods_js_1.calculateD9)(ephemeris.ascendant.longitude);
        const d10 = (0, advanced_btr_methods_js_1.calculateD10)(ephemeris.ascendant.longitude);
        const d60 = (0, advanced_btr_methods_js_1.calculateD60)(ephemeris.ascendant.longitude);
        pkg.d9Lagna = d9.sign;
        pkg.d10Lagna = d10.sign;
        pkg.d60Sign = d60.sign;
        // Build transit data for each life event
        pkg.transitData = {};
        for (const event of input.lifeEvents) {
            try {
                const eventEph = await (0, ephemeris_js_1.calculateEphemeris)(event.eventDate, event.eventTime || '12:00:00', input.latitude, input.longitude, input.timezone);
                pkg.transitData[event.eventDate] = {
                    saturn: eventEph.planets.saturn.sign,
                    jupiter: eventEph.planets.jupiter.sign,
                    rahu: eventEph.planets.rahu.sign
                };
            }
            catch {
                // Skip if transit calc fails
            }
        }
    }
    return pkg;
}
// ═════════════════════════════════════════════════════════════════════════════
// LIFE EVENT FORMATTER
// ═════════════════════════════════════════════════════════════════════════════
function formatLifeEventForAI(event) {
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
            nuance = '(Month-Level)';
            break;
        case 'month_range':
            if (endDate)
                timeStr = `${eventDate} to ${endDate}`;
            nuance = '(Month Range)';
            break;
        case 'year_range':
            if (endDate)
                timeStr = `${eventDate} to ${endDate}`;
            nuance = '(Year Range)';
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
function getBatchPrompt(candidates, events, traits, batchNumber, totalBatches, survivorsNeeded) {
    const eventsText = events.map(formatLifeEventForAI).join('\n');
    // Shuffle candidate order to prevent position bias
    const shuffledCandidates = [...candidates].sort(() => Math.random() - 0.5);
    return `BIRTH TIME RECTIFICATION - STAGE 2 (Batch ${batchNumber}/${totalBatches})

════════════════════════════════════════════════════════════════════════════════
⚠️ CRITICAL RULES:
1. DO NOT calculate any planetary positions, dashas, or dates yourself
2. USE ONLY the pre-calculated data provided below
3. Your job is to COMPARE and SCORE, not to compute
4. All astrological data is already calculated by Swiss Ephemeris
════════════════════════════════════════════════════════════════════════════════

TASK: Score ${candidates.length} candidates based on Dasha-Event correlation.

LIFE EVENTS:
${eventsText}
${traits ? `\nPHYSICAL TRAITS: ${JSON.stringify(traits)}` : ''}

CANDIDATES WITH PRE-CALCULATED DATA:
${shuffledCandidates.map(c => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CANDIDATE: ${c.time}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAGNA: ${c.ascendant.sign} ${c.ascendant.degree} (${c.ascendant.nakshatra})
MOON: ${c.planets.moon.sign} ${c.planets.moon.degree} (${c.moonNakshatra})
SUN: ${c.planets.sun.sign} ${c.planets.sun.degree}
${c.d9Lagna ? `D9 NAVAMSHA LAGNA: ${c.d9Lagna}` : ''}
${c.d10Lagna ? `D10 DASAMSHA LAGNA: ${c.d10Lagna}` : ''}

VIMSHOTTARI DASHA PERIODS:
${c.vimshottariDasha.map(d => `  • ${d.maha}/${d.antar}/${d.pratyantar}: ${d.startEnd}`).join('\n')}
${c.yoginiDasha ? `\nYOGINI DASHA: ${c.yoginiDasha.map(d => `${d.lord} (${d.startEnd})`).join(' → ')}` : ''}
${c.charaDasha ? `\nCHARA DASHA: ${c.charaDasha.map(d => `${d.sign} (${d.startEnd})`).join(' → ')}` : ''}
`).join('')}

SCORING (use provided data only):
+25: Vimshottari dasha lord matches event type (marriage during Venus, career during Saturn/Sun)
+15: Antardasha timing overlaps with event date
+10: Lagna sign matches physical traits
-50: Clear timing contradiction (event outside dasha period)

OUTPUT FORMAT (one line per candidate):
[TIME] | SCORE: [0-100] | VERDICT: KEEP/ELIMINATE | REASON: [1-2 words]

FINAL LINE (required):
TOP_SURVIVORS: [comma-separated list of ${survivorsNeeded} best times]`;
}
// ═════════════════════════════════════════════════════════════════════════════
// 🔱 STAGE 4: DEEP MULTI-DASHA VERIFICATION
// ═════════════════════════════════════════════════════════════════════════════
function getDeepAnalysisPrompt(candidates, events, traits) {
    const eventsText = events.map(formatLifeEventForAI).join('\n');
    return `BIRTH TIME RECTIFICATION - STAGE 4 (Deep Multi-Dasha Analysis)

════════════════════════════════════════════════════════════════════════════════
⚠️ CRITICAL RULES:
1. DO NOT calculate any positions, dates, or dashas yourself
2. USE ONLY the pre-calculated data below - all computed by Swiss Ephemeris
3. COMPARE the provided data against life events - do not invent data
════════════════════════════════════════════════════════════════════════════════

TASK: Cross-verify ${candidates.length} candidates using multiple dasha systems.

VERIFICATION PRINCIPLE:
- TRUE birth time shows consistency across Vimshottari, Yogini, and Chara
- Divisional charts (D9, D10) must support life event themes
- Contradiction in any system = reduce score

LIFE EVENTS:
${eventsText}

CANDIDATES WITH MULTI-DASHA DATA:
${candidates.map(c => `
[${c.time}]
┌ LAGNA: ${c.ascendant.sign} ${c.ascendant.degree}
├ D9 (Marriage): ${c.d9Lagna || 'N/A'}
├ D10 (Career): ${c.d10Lagna || 'N/A'}
├ D60 (Karma): ${c.d60Sign || 'N/A'}
├ VIMSHOTTARI: ${c.vimshottariDasha.map(d => `${d.maha}/${d.antar}`).join(' → ')}
├ YOGINI: ${c.yoginiDasha?.map(d => d.lord).join(' → ') || 'N/A'}
└ CHARA: ${c.charaDasha?.map(d => d.sign).join(' → ') || 'N/A'}
${c.transitData ? `  TRANSITS: ${Object.entries(c.transitData).slice(0, 2).map(([date, t]) => `${date}: Sat=${t.saturn}, Jup=${t.jupiter}`).join(' | ')}` : ''}`).join('\n')}

SCORING:
- All 3 dasha systems agree on event timing: +30
- D9 supports marriage events / D10 supports career: +20
- Transit Saturn/Jupiter confirm major events: +15
- Contradiction in any system: -25

OUTPUT (for each candidate):
[TIME] | MULTI-DASHA: [AGREE/PARTIAL/CONFLICT] | D-CHARTS: [SUPPORT/WEAK/FAIL] | SCORE: [0-100]

FINAL:
TOP_SURVIVORS: [time1], [time2], [time3]`;
}
// ═════════════════════════════════════════════════════════════════════════════
// 🔱 STAGE 6: FINAL SECONDS-LEVEL PRECISION
// ═════════════════════════════════════════════════════════════════════════════
function getFinalPrecisionPrompt(candidates, events) {
    const eventsText = events.map(formatLifeEventForAI).join('\n');
    return `BIRTH TIME RECTIFICATION - FINAL STAGE (Seconds Precision)

════════════════════════════════════════════════════════════════════════════════
⚠️ CRITICAL RULES:
1. DO NOT calculate anything yourself - all data is pre-computed
2. USE ONLY the D60, Lagna, and dasha data provided below
3. Your job is to SELECT the best candidate, not to compute
════════════════════════════════════════════════════════════════════════════════

TASK: Select THE SINGLE BEST birth time from ${candidates.length} finalists.

PRECISION FACTORS:
- D60 (Shashtiamsha) changes every 2 minutes → critical for seconds
- Lagna degree near 0° or 30° = higher uncertainty
- All evidence must converge on ONE time

LIFE EVENTS FOR FINAL CHECK:
${eventsText}

FINALIST CANDIDATES:
${candidates.map((c, i) => `
#${i + 1} [${c.time}]
┌ LAGNA: ${c.ascendant.sign} ${c.ascendant.degree} (${c.ascendant.nakshatra})
├ D60: ${c.d60Sign || 'N/A'} ← SECONDS-LEVEL INDICATOR
├ D9: ${c.d9Lagna} | D10: ${c.d10Lagna}
├ VIMSHOTTARI: ${c.vimshottariDasha.map(d => `${d.maha}/${d.antar}`).join(' → ')}
├ YOGINI: ${c.yoginiDasha?.map(d => d.lord).join(' → ') || 'N/A'}
└ BOUNDARY RISK: ${parseFloat(c.ascendant.degree) < 2 || parseFloat(c.ascendant.degree) > 28 ? 'HIGH (near sign boundary)' : 'LOW'}`).join('\n')}

FINAL SELECTION CRITERIA:
1. Strongest overall dasha-event correlation
2. D60 stability (not changing within ±30 seconds)
3. No boundary risks in Lagna
4. Multi-dasha consensus across all systems

═══════════════════════════════════════════════════════════════════════════════
FINAL VERDICT (required format):
BEST_TIME: [HH:MM:SS]
ACCURACY: [0-100]%
CONFIDENCE: [HIGH/MEDIUM/LOW]
MARGIN_OF_ERROR: ±[seconds] seconds

EVIDENCE:
1. [Primary reason for selection]
2. [Secondary supporting factor]
3. [Additional confirmation]

RUNNER_UP: [second best time] (for reference)
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
    const timeMatch = aiContent.match(/BEST TIME[:\s]*(\d{2}:\d{2}:\d{2})/i);
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
        const pkg = await buildCandidateDataPackage(raw.time, raw.offsetMinutes, input, false);
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
        // GC breathing room
        if (processed % 20 === 0)
            await sleep(5);
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
    // Continue tournament until we have batchSize or fewer candidates
    while (currentCandidates.length > batchSize) {
        roundNumber++;
        const batches = (0, time_offset_manager_js_1.splitIntoBatches)(currentCandidates, batchSize);
        const roundSurvivors = [];
        await progress.updateMessage(`Round ${roundNumber}: ${batches.length} batches of ${batchSize}`);
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            // Emit AI context
            (0, session_events_js_1.emitAIContext)(input.sessionId, {
                stage: 2,
                candidateTime: `Batch ${i + 1}/${batches.length}`,
                round: roundNumber,
                batch: i + 1,
                totalBatches: batches.length,
                candidatesInBatch: batch.length
            });
            const prompt = getBatchPrompt(batch, input.lifeEvents, input.physicalTraits, i + 1, batches.length, survivorsPerBatch);
            const response = await (0, ai_client_js_1.callAIWithStream)(input.sessionId, 2, 'You are the SUPREME VEDIC ASTROLOGER. Analyze ALL candidates with EQUAL attention.', prompt, {
                model: 'deepseek-reasoner',
                candidateTime: `Batch ${i + 1}/${batches.length}`,
                progressTracker: progress
            });
            const aiContent = response.success ? (response.content || response.thinking || '') : '';
            const survivorTimes = extractBatchSurvivors(aiContent, batch.map(c => c.time), survivorsPerBatch);
            // Find and add survivors
            for (const time of survivorTimes) {
                const survivor = batch.find(c => c.time === time);
                if (survivor) {
                    roundSurvivors.push(survivor);
                    (0, session_events_js_1.emitCandidateScore)(input.sessionId, time, 80, 2);
                }
            }
            // Check for cancellation
            await (0, cancellation_manager_js_1.throwIfCancelled)(input.sessionId, input.abortSignal);
        }
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
        for (let i = 0; i < batches.length; i++) {
            const prompt = getDeepAnalysisPrompt(batches[i], input.lifeEvents, input.physicalTraits);
            const response = await (0, ai_client_js_1.callAIWithStream)(input.sessionId, 4, 'You are performing DEEP astrological verification.', prompt, {
                model: 'deepseek-reasoner',
                candidateTime: `Deep ${i + 1}/${batches.length}`,
                progressTracker: progress
            });
            const aiContent = response.success ? (response.content || response.thinking || '') : '';
            allReasoning += aiContent + '\n\n';
            const survivorTimes = extractBatchSurvivors(aiContent, batches[i].map(c => c.time), 3);
            for (const time of survivorTimes) {
                const survivor = batches[i].find(c => c.time === time);
                if (survivor)
                    batchSurvivors.push(survivor);
            }
        }
        currentCandidates = batchSurvivors;
    }
    // Final deep analysis on remaining candidates
    if (currentCandidates.length > 3) {
        const prompt = getDeepAnalysisPrompt(currentCandidates, input.lifeEvents, input.physicalTraits);
        const response = await (0, ai_client_js_1.callAIWithStream)(input.sessionId, 4, 'You are performing FINAL deep verification.', prompt, {
            model: 'deepseek-reasoner',
            candidateTime: 'Deep Final',
            progressTracker: progress
        });
        const aiContent = response.success ? (response.content || response.thinking || '') : '';
        allReasoning += aiContent;
        const survivorTimes = extractBatchSurvivors(aiContent, currentCandidates.map(c => c.time), 7);
        currentCandidates = currentCandidates.filter(c => survivorTimes.includes(c.time));
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
        for (const batch of batches) {
            const prompt = getFinalPrecisionPrompt(batch, input.lifeEvents);
            const response = await (0, ai_client_js_1.callAIWithStream)(input.sessionId, 6, 'FINAL JUDGEMENT. Pick THE ONE.', prompt, {
                model: 'deepseek-reasoner',
                candidateTime: 'FINAL',
                progressTracker: progress
            });
            const aiContent = response.success ? (response.content || response.thinking || '') : '';
            const verdict = extractFinalVerdict(aiContent);
            if (verdict) {
                const winner = batch.find(c => c.time === verdict.time);
                if (winner)
                    batchWinners.push(winner);
            }
            else if (batch.length > 0) {
                batchWinners.push(batch[0]);
            }
        }
        finalists = batchWinners;
    }
    // Final judgement
    const prompt = getFinalPrecisionPrompt(finalists, input.lifeEvents);
    const response = await (0, ai_client_js_1.callAIWithStream)(input.sessionId, 6, 'You are the DIVINE ARCHITECT of Time. FINAL JUDGEMENT.', prompt, {
        model: 'deepseek-reasoner',
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
    (0, session_events_js_1.emitCandidateScore)(input.sessionId, finalTime, accuracy, 6);
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
            methodsUsed: ['DeepSeek Reasoner', 'Swiss Ephemeris', 'Vimshottari', 'Yogini', 'Chara', 'D9', 'D10', 'D60'],
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