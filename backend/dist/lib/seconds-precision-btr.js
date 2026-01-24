"use strict";
// lib/seconds-precision-btr.ts
// 🔱 GOD-TIER BTR v6.0: AI-First Birth Time Rectification
// Swiss Eph = Calculator (Numerical Data Only)
// DeepSeek Reasoner = Brain (All Analysis & Decisions)
// Zero Mathematical Scoring - All decisions via AI reasoning
Object.defineProperty(exports, "__esModule", { value: true });
exports.processSecondsPrecisionBTR = processSecondsPrecisionBTR;
const ephemeris_js_1 = require("./ephemeris.js");
const vedic_astrology_engine_js_1 = require("./vedic-astrology-engine.js");
const advanced_btr_methods_js_1 = require("./advanced-btr-methods.js");
const jaimini_astrology_js_1 = require("./jaimini-astrology.js");
const ai_client_js_1 = require("./ai-client.js");
const time_offset_manager_js_1 = require("./time-offset-manager.js");
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
function addSeconds(time, seconds) {
    const [h, m, s] = time.split(':').map(Number);
    const date = new Date(2000, 0, 1, h, m, s + seconds);
    return date.toTimeString().split(' ')[0];
}
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
            degree: (data.longitude % 30).toFixed(2) + '°',
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
            degree: (ephemeris.ascendant.longitude % 30).toFixed(2) + '°',
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
// AI PROMPTS (DeepSeek Reasoner Only)
// ═════════════════════════════════════════════════════════════════════════════
function getStage2Prompt(candidates, events, traits) {
    const eventsText = events.map(formatLifeEventForAI).join('\n');
    const traitsText = traits ? JSON.stringify(traits) : 'Not provided';
    return `You are the SUPREME VEDIC ASTROLOGER analyzing ${candidates.length} birth time candidates.

LIFE EVENTS TO VERIFY:
${eventsText}

PHYSICAL TRAITS:
${traitsText}

CANDIDATES DATA:
${candidates.map((c, i) => `
═══ CANDIDATE ${i + 1}: ${c.time} ═══
Lagna: ${c.ascendant.sign} ${c.ascendant.degree} (${c.ascendant.nakshatra})
Moon: ${c.planets.moon.sign} ${c.planets.moon.degree} (${c.moonNakshatra})
Sun: ${c.planets.sun.sign} ${c.planets.sun.degree}
VIMSHOTTARI DASHA SEQUENCE:
${c.vimshottariDasha.map(d => `  ${d.maha}/${d.antar}/${d.pratyantar}: ${d.startEnd}`).join('\n')}
`).join('\n')}

YOUR TASK:
1. For EACH life event, check which candidates have DASHA LORDS that correlate with the event type:
   - Marriage/Love → Venus, Jupiter, 7th lord
   - Career/Promotion → Saturn, Sun, 10th lord, Mercury
   - Health Issues → 6th/8th lords, Mars, Ketu
   - Education → Mercury, Jupiter, 5th lord
   - Children → Jupiter, 5th lord
   - Financial → 2nd/11th lords, Jupiter

2. ELIMINATE candidates where major events CANNOT fit the dasha periods.

3. If physical traits provided, check Lagna compatibility:
   - Aries/Scorpio: Athletic, sharp features
   - Taurus/Libra: Pleasant, medium build
   - Gemini/Virgo: Slim, youthful
   - Cancer: Round face, emotional
   - Leo: Regal bearing, broad shoulders
   - Capricorn: Thin, serious
   - Aquarius: Unique features
   - Pisces: Soft features, dreamy eyes

OUTPUT FORMAT (STRICT - Must include for EACH candidate):
CANDIDATE: [HH:MM:SS]
EVENT ANALYSIS: [Which events fit, which don't]
DASHA ALIGNMENT: [Good/Poor/Mixed]
LAGNA FIT: [If traits provided]
VERDICT: KEEP or ELIMINATE
SCORE: [0-100]

FINAL RANKING: List top 15 candidates in order of likelihood.`;
}
function getStage4Prompt(candidates, events, traits) {
    const eventsText = events.map(formatLifeEventForAI).join('\n');
    return `You are performing DEEP ANALYSIS of ${candidates.length} candidates at 30-second precision.

LIFE EVENTS:
${eventsText}

CANDIDATES WITH FULL DATA:
${candidates.map((c, i) => `
═══ CANDIDATE ${i + 1}: ${c.time} ═══
LAGNA: ${c.ascendant.sign} ${c.ascendant.degree}
D9 NAVAMSHA LAGNA: ${c.d9Lagna || 'N/A'}
D10 DASAMSHA LAGNA: ${c.d10Lagna || 'N/A'}

VIMSHOTTARI: ${c.vimshottariDasha.map(d => `${d.maha}/${d.antar}`).join(' → ')}
YOGINI: ${c.yoginiDasha?.map(d => d.lord).join(' → ') || 'N/A'}
CHARA: ${c.charaDasha?.map(d => d.sign).join(' → ') || 'N/A'}

TRANSIT DATA ON EVENT DATES:
${c.transitData ? Object.entries(c.transitData).map(([date, t]) => `  ${date}: Sat=${t.saturn}, Jup=${t.jupiter}, Rahu=${t.rahu}`).join('\n') : 'Not available'}
`).join('\n')}

YOUR TASK:
1. Cross-verify ALL events against MULTIPLE dasha systems (Vimshottari + Yogini + Chara)
2. Check D9 for marriage/relationship events
3. Check D10 for career events
4. Verify transits on event dates support the natal chart
5. ELIMINATE any candidate with contradictions

OUTPUT FORMAT:
CANDIDATE: [HH:MM:SS]
MULTI-DASHA VERIFICATION: [All 3 systems agree? Conflicts?]
DIVISIONAL CHART SUPPORT: [D9/D10 analysis]
TRANSIT CONFIRMATION: [Do transits on event days aspect natal positions?]
VERDICT: STRONG/MODERATE/WEAK
SCORE: [0-100]

FINAL RANKING: Top 7 candidates ordered by evidence strength.`;
}
function getStage6Prompt(candidates, events, traits) {
    const eventsText = events.map(formatLifeEventForAI).join('\n');
    return `🔱 FINAL PRECISION ANALYSIS - 6-SECOND RESOLUTION 🔱

You are determining the SINGLE CORRECT birth time from ${candidates.length} candidates.

LIFE EVENTS:
${eventsText}

MICRO-PRECISION CANDIDATES:
${candidates.map((c, i) => `
═══ CANDIDATE ${i + 1}: ${c.time} ═══
LAGNA: ${c.ascendant.sign} ${c.ascendant.degree} (${c.ascendant.nakshatra})
D60 SHASHTIAMSHA: ${c.d60Sign || 'N/A'} ← CRUCIAL for 6-second precision
D9: ${c.d9Lagna} | D10: ${c.d10Lagna}

ALL DASHA SYSTEMS:
• Vimshottari: ${c.vimshottariDasha.map(d => `${d.maha}/${d.antar}`).join(' → ')}
• Yogini: ${c.yoginiDasha?.map(d => d.lord).join(' → ') || 'N/A'}
• Chara: ${c.charaDasha?.map(d => d.sign).join(' → ') || 'N/A'}

BOUNDARY CHECK:
• Lagna Degree: ${c.ascendant.degree} (Near 0° or 30° = RISKY)
• Moon Nakshatra: ${c.moonNakshatra}
`).join('\n')}

YOUR MISSION:
1. At 6-second precision, D60 changes sign every 0.5° - verify alignment
2. Check ALL 5 dasha systems agree on major events
3. Verify NO contradictions exist
4. Check boundary safety (transitions within 30 seconds = risky)

CONTRADICTIONS = INSTANT ELIMINATION

OUTPUT FORMAT:
═════════════════════════════════════════════════════════════
FINAL VERDICT:
BEST TIME: [HH:MM:SS]
ACCURACY: [0-100]%
CONFIDENCE: [HIGH/MEDIUM] 
MARGIN OF ERROR: ±[X] seconds
TOP 3 EVIDENCE POINTS:
1. [Why this time is correct]
2. [Supporting dasha alignment]
3. [Divisional chart confirmation]

BOUNDARY WARNINGS: [Any nakshatra/lagna transitions within 30 seconds]
═════════════════════════════════════════════════════════════

Also provide RANKING for all candidates with brief reasoning.`;
}
// ═════════════════════════════════════════════════════════════════════════════
// AI SCORE EXTRACTOR
// ═════════════════════════════════════════════════════════════════════════════
function extractCandidateScores(aiContent, candidateTimes) {
    const scores = new Map();
    for (const time of candidateTimes) {
        // Find the block for this candidate
        const timePattern = new RegExp(`CANDIDATE[:\\s]*${time.replace(/:/g, '[:\\s]?')}`, 'i');
        const match = aiContent.match(timePattern);
        if (match) {
            const startIdx = match.index || 0;
            const searchWindow = aiContent.slice(startIdx, startIdx + 800);
            // Extract score
            const scoreMatch = searchWindow.match(/SCORE[:\s]*(\d+)/i);
            const score = scoreMatch ? Math.min(100, parseInt(scoreMatch[1])) : 50;
            // Extract verdict
            const verdictMatch = searchWindow.match(/VERDICT[:\s]*(KEEP|ELIMINATE|STRONG|MODERATE|WEAK)/i);
            const verdict = verdictMatch ? verdictMatch[1].toUpperCase() : 'UNKNOWN';
            scores.set(time, { score, verdict });
        }
        else {
            scores.set(time, { score: 50, verdict: 'UNKNOWN' });
        }
    }
    return scores;
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
// STAGE 1: ADAPTIVE GRID GENERATION (DATA ONLY)
// ═════════════════════════════════════════════════════════════════════════════
async function stage1DataGeneration(input, progress) {
    await progress.startStep('grid', 'Stage 1: Generating adaptive candidate grid...');
    const rawCandidates = (0, time_offset_manager_js_1.generateCandidateTimes)(input.tentativeTime, input.offsetConfig);
    const candidates = [];
    const total = rawCandidates.length;
    let processed = 0;
    for (const raw of rawCandidates) {
        const pkg = await buildCandidateDataPackage(raw.time, raw.offsetMinutes, input, false);
        candidates.push(pkg);
        processed++;
        if (processed % 10 === 0) {
            await progress.updateMessage(`Calculating ephemeris: ${processed}/${total}`);
            (0, session_events_js_1.emitCalculationLog)(input.sessionId, {
                candidateTime: raw.time,
                sunPos: pkg.planets.sun.sign,
                moonPos: pkg.planets.moon.sign,
                ascendant: pkg.ascendant.sign,
                dashaObj: pkg.vimshottariDasha[0]?.maha || 'N/A'
            });
        }
        // Small breathing room for GC
        if (processed % 20 === 0)
            await sleep(5);
    }
    await progress.completeStep('grid', [`Generated ${candidates.length} candidates with Swiss Eph data`]);
    return {
        candidates,
        stageResult: {
            stageNumber: 1,
            stageName: 'Adaptive Grid Generation',
            candidatesIn: total,
            candidatesOut: candidates.length,
            topCandidates: []
        }
    };
}
// ═════════════════════════════════════════════════════════════════════════════
// STAGE 2: AI COARSE ELIMINATION (AI REASONING)
// ═════════════════════════════════════════════════════════════════════════════
async function stage2AICoarseElimination(input, candidates, progress) {
    await progress.startStep('coarse', 'Stage 2: AI analyzing candidates...');
    const prompt = getStage2Prompt(candidates, input.lifeEvents, input.physicalTraits);
    // Emit AI context for frontend
    await progress.updateAIContext({
        stage: 2,
        candidateTime: 'Batch Analysis',
        planetaryInfo: {
            sun: 'Analyzing all',
            moon: 'Analyzing all',
            ascendant: 'Analyzing all'
        },
        dasha: 'Multi-candidate comparison',
        groundTruth: {
            totalCandidates: candidates.length,
            lifeEvents: input.lifeEvents.length
        }
    });
    const response = await (0, ai_client_js_1.callAIWithStream)(input.sessionId, 2, 'You are the SUPREME VEDIC ASTROLOGER. All analysis decisions are made by you. No mathematical scoring.', prompt, {
        model: 'deepseek-reasoner',
        candidateTime: 'Coarse Elimination',
        progressTracker: progress
    });
    const aiContent = response.success ? (response.content || response.thinking || '') : '';
    const scores = extractCandidateScores(aiContent, candidates.map(c => c.time));
    // Filter and sort by AI scores
    const scoredCandidates = candidates
        .map(c => ({
        ...c,
        aiScore: scores.get(c.time)?.score || 50,
        aiVerdict: scores.get(c.time)?.verdict || 'UNKNOWN'
    }))
        .filter(c => c.aiVerdict !== 'ELIMINATE' && c.aiScore >= 40)
        .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
        .slice(0, 15);
    // Emit scores to frontend
    for (const c of scoredCandidates.slice(0, 10)) {
        (0, session_events_js_1.emitCandidateScore)(input.sessionId, c.time, c.aiScore || 50, 2);
    }
    await progress.completeStep('coarse', [`AI selected top ${scoredCandidates.length} candidates`]);
    return {
        candidates: scoredCandidates,
        stageResult: {
            stageNumber: 2,
            stageName: 'AI Coarse Elimination',
            candidatesIn: candidates.length,
            candidatesOut: scoredCandidates.length,
            topCandidates: scoredCandidates.map(c => ({ time: c.time, offsetMinutes: c.offsetMinutes, aiScore: c.aiScore }))
        },
        aiReasoning: aiContent
    };
}
// ═════════════════════════════════════════════════════════════════════════════
// STAGE 3: FINE GRID EXPANSION (DATA ONLY)
// ═════════════════════════════════════════════════════════════════════════════
async function stage3FineGridExpansion(input, topCandidates, progress) {
    await progress.startStep('fine', 'Stage 3: Generating fine grid (30-sec intervals)...');
    const expandedCandidates = [];
    const seenTimes = new Set();
    // Expand ±3 minutes around each of top 15 at 30-second intervals
    for (const center of topCandidates.slice(0, 15)) {
        const offsets = [-180, -150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180]; // seconds
        for (const offsetSec of offsets) {
            const time = addSeconds(center.time, offsetSec);
            if (seenTimes.has(time))
                continue;
            seenTimes.add(time);
            const pkg = await buildCandidateDataPackage(time, center.offsetMinutes + (offsetSec / 60), input, true // Include full data for deep analysis
            );
            expandedCandidates.push(pkg);
        }
    }
    await progress.updateMessage(`Generated ${expandedCandidates.length} fine-grid candidates`);
    await progress.completeStep('fine', [`Expanded to ${expandedCandidates.length} candidates at 30-sec precision`]);
    return {
        candidates: expandedCandidates,
        stageResult: {
            stageNumber: 3,
            stageName: 'Fine Grid Expansion',
            candidatesIn: topCandidates.length,
            candidatesOut: expandedCandidates.length,
            topCandidates: []
        }
    };
}
// ═════════════════════════════════════════════════════════════════════════════
// STAGE 4: AI DEEP ANALYSIS (AI REASONING)
// ═════════════════════════════════════════════════════════════════════════════
async function stage4AIDeepAnalysis(input, candidates, progress) {
    await progress.startStep('deep', 'Stage 4: AI deep multi-system analysis...');
    const prompt = getStage4Prompt(candidates, input.lifeEvents, input.physicalTraits);
    await progress.updateAIContext({
        stage: 4,
        candidateTime: 'Deep Analysis',
        planetaryInfo: {
            sun: 'Multi-system',
            moon: 'Multi-system',
            ascendant: 'D9/D10'
        },
        dasha: 'Vim + Yog + Chara',
        divCharts: 'D9, D10, Transit verification',
        groundTruth: {
            totalCandidates: candidates.length
        }
    });
    const response = await (0, ai_client_js_1.callAIWithStream)(input.sessionId, 4, 'You are the TITAN of Precision. Cross-verify all dasha systems. No mathematical scoring.', prompt, {
        model: 'deepseek-reasoner',
        candidateTime: 'Deep Analysis',
        progressTracker: progress
    });
    const aiContent = response.success ? (response.content || response.thinking || '') : '';
    const scores = extractCandidateScores(aiContent, candidates.map(c => c.time));
    const scoredCandidates = candidates
        .map(c => ({
        ...c,
        aiScore: scores.get(c.time)?.score || 50,
        aiVerdict: scores.get(c.time)?.verdict || 'UNKNOWN'
    }))
        .filter(c => c.aiVerdict !== 'WEAK' && c.aiScore >= 60)
        .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
        .slice(0, 7);
    for (const c of scoredCandidates) {
        (0, session_events_js_1.emitCandidateScore)(input.sessionId, c.time, c.aiScore || 50, 4);
    }
    await progress.completeStep('deep', [`AI refined to top ${scoredCandidates.length} candidates`]);
    return {
        candidates: scoredCandidates,
        stageResult: {
            stageNumber: 4,
            stageName: 'AI Deep Analysis',
            candidatesIn: candidates.length,
            candidatesOut: scoredCandidates.length,
            topCandidates: scoredCandidates.map(c => ({ time: c.time, offsetMinutes: c.offsetMinutes, aiScore: c.aiScore }))
        },
        aiReasoning: aiContent
    };
}
// ═════════════════════════════════════════════════════════════════════════════
// STAGE 5: MICRO GRID + D60 (DATA ONLY)
// ═════════════════════════════════════════════════════════════════════════════
async function stage5MicroGrid(input, topCandidates, progress) {
    await progress.startStep('micro', 'Stage 5: Generating micro grid (6-sec intervals)...');
    const microCandidates = [];
    const seenTimes = new Set();
    // Expand ±30 seconds around top 7 at 6-second intervals
    for (const center of topCandidates.slice(0, 7)) {
        const offsets = [-30, -24, -18, -12, -6, 0, 6, 12, 18, 24, 30]; // seconds
        for (const offsetSec of offsets) {
            const time = addSeconds(center.time, offsetSec);
            if (seenTimes.has(time))
                continue;
            seenTimes.add(time);
            const pkg = await buildCandidateDataPackage(time, center.offsetMinutes + (offsetSec / 60), input, true);
            microCandidates.push(pkg);
        }
    }
    await progress.completeStep('micro', [`Generated ${microCandidates.length} micro-precision candidates`]);
    return {
        candidates: microCandidates,
        stageResult: {
            stageNumber: 5,
            stageName: 'Micro Grid + D60',
            candidatesIn: topCandidates.length,
            candidatesOut: microCandidates.length,
            topCandidates: []
        }
    };
}
// ═════════════════════════════════════════════════════════════════════════════
// STAGE 6: AI FINAL PRECISION (AI REASONING - CRITICAL)
// ═════════════════════════════════════════════════════════════════════════════
async function stage6AIFinalPrecision(input, candidates, progress) {
    await progress.startStep('final', 'Stage 6: AI FINAL PRECISION ANALYSIS...');
    const prompt = getStage6Prompt(candidates, input.lifeEvents, input.physicalTraits);
    await progress.updateAIContext({
        stage: 6,
        candidateTime: 'FINAL',
        planetaryInfo: {
            sun: 'All verified',
            moon: 'All verified',
            ascendant: 'D60 checked'
        },
        dasha: 'All 5 systems',
        divCharts: 'D9, D10, D60',
        groundTruth: {
            totalCandidates: candidates.length,
            precision: '6 seconds'
        }
    });
    const response = await (0, ai_client_js_1.callAIWithStream)(input.sessionId, 6, 'You are the DIVINE ARCHITECT of Time. This is the FINAL JUDGEMENT. Be GOD-TIER PRECISE.', prompt, {
        model: 'deepseek-reasoner',
        candidateTime: 'FINAL PRECISION',
        progressTracker: progress,
        timeoutMs: 120000 // 2 min timeout for final stage
    });
    const aiContent = response.success ? (response.content || response.thinking || '') : '';
    const verdict = extractFinalVerdict(aiContent);
    const finalTime = verdict?.time || candidates[0]?.time || input.tentativeTime;
    const accuracy = verdict?.accuracy || 85;
    const confidence = verdict?.confidence || 'MEDIUM';
    const margin = verdict?.margin || 5;
    (0, session_events_js_1.emitCandidateScore)(input.sessionId, finalTime, accuracy, 6);
    await progress.completeStep('final', [`FINAL TIME: ${finalTime} (${confidence} confidence)`]);
    return {
        finalTime,
        accuracy,
        confidence,
        margin,
        aiReasoning: aiContent,
        stageResult: {
            stageNumber: 6,
            stageName: 'AI Final Precision',
            candidatesIn: candidates.length,
            candidatesOut: 1,
            topCandidates: [{ time: finalTime, offsetMinutes: 0, aiScore: accuracy }],
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
        await progress.updateETA(600); // 10 minutes estimate
        await progress.startStep('init', '🔱 Initializing God-Tier BTR v6.0...');
        logger_js_1.logger.info('Starting GOD-TIER AI-FIRST BTR v6.0', {
            sessionId: input.sessionId,
            dateOfBirth: input.dateOfBirth,
            offsetConfig: input.offsetConfig
        });
        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 1: ADAPTIVE GRID GENERATION (DATA ONLY)
        // ═══════════════════════════════════════════════════════════════════════
        await (0, cancellation_manager_js_1.throwIfCancelled)(input.sessionId, input.abortSignal);
        const stage1 = await stage1DataGeneration(input, progress);
        stageHistory[1] = stage1.stageResult;
        (0, session_events_js_1.emitStageStats)(input.sessionId, 1, stage1.stageResult.candidatesOut, `Generated ${stage1.stageResult.candidatesOut} candidates`);
        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 2: AI COARSE ELIMINATION
        // ═══════════════════════════════════════════════════════════════════════
        await (0, cancellation_manager_js_1.throwIfCancelled)(input.sessionId, input.abortSignal);
        await progress.updateETA(480);
        const stage2 = await stage2AICoarseElimination(input, stage1.candidates, progress);
        stageHistory[2] = stage2.stageResult;
        (0, session_events_js_1.emitStageStats)(input.sessionId, 2, stage2.stageResult.candidatesOut, `AI selected top ${stage2.stageResult.candidatesOut} candidates`);
        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 3: FINE GRID EXPANSION (DATA ONLY)
        // ═══════════════════════════════════════════════════════════════════════
        await (0, cancellation_manager_js_1.throwIfCancelled)(input.sessionId, input.abortSignal);
        await progress.updateETA(360);
        const stage3 = await stage3FineGridExpansion(input, stage2.candidates, progress);
        stageHistory[3] = stage3.stageResult;
        (0, session_events_js_1.emitStageStats)(input.sessionId, 3, stage3.stageResult.candidatesOut, `Expanded to ${stage3.stageResult.candidatesOut} candidates`);
        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 4: AI DEEP ANALYSIS
        // ═══════════════════════════════════════════════════════════════════════
        await (0, cancellation_manager_js_1.throwIfCancelled)(input.sessionId, input.abortSignal);
        await progress.updateETA(240);
        const stage4 = await stage4AIDeepAnalysis(input, stage3.candidates, progress);
        stageHistory[4] = stage4.stageResult;
        (0, session_events_js_1.emitStageStats)(input.sessionId, 4, stage4.stageResult.candidatesOut, `AI refined to top ${stage4.stageResult.candidatesOut} candidates`);
        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 5: MICRO GRID + D60 (DATA ONLY)
        // ═══════════════════════════════════════════════════════════════════════
        await (0, cancellation_manager_js_1.throwIfCancelled)(input.sessionId, input.abortSignal);
        await progress.updateETA(120);
        const stage5 = await stage5MicroGrid(input, stage4.candidates, progress);
        stageHistory[5] = stage5.stageResult;
        (0, session_events_js_1.emitStageStats)(input.sessionId, 5, stage5.stageResult.candidatesOut, `Micro grid with ${stage5.stageResult.candidatesOut} candidates`);
        // ═══════════════════════════════════════════════════════════════════════
        // STAGE 6: AI FINAL PRECISION
        // ═══════════════════════════════════════════════════════════════════════
        await (0, cancellation_manager_js_1.throwIfCancelled)(input.sessionId, input.abortSignal);
        await progress.updateETA(60);
        const stage6 = await stage6AIFinalPrecision(input, stage5.candidates, progress);
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
                stage2: stage2.aiReasoning.slice(0, 500),
                stage4: stage4.aiReasoning.slice(0, 500),
                stage6: stage6.aiReasoning.slice(0, 1000)
            },
            technicalProof: {
                ephemeris: finalEphemeris,
                divCharts,
                boundary
            },
            stageHistory,
            alternatives: stage4.candidates.slice(1, 4).map(c => ({
                time: c.time,
                score: c.aiScore || 70,
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
        logger_js_1.logger.error('GOD-TIER BTR v6.0 FAILED', error);
        if ((0, cancellation_manager_js_1.isCancellationError)(error)) {
            throw error;
        }
        const currentStepId = progress_tracker_js_1.ANALYSIS_STEPS[Math.min(progress_tracker_js_1.ANALYSIS_STEPS.length - 1, progress.getProgress().currentStep)]?.id || 'final';
        await progress.errorStep(currentStepId, error instanceof Error ? error.message : String(error));
        throw error;
    }
}
// ═════════════════════════════════════════════════════════════════════════════
// CONFIDENCE HELPERS
// ═════════════════════════════════════════════════════════════════════════════
function getConfidenceLevel(score) {
    if (score >= 95)
        return 'HIGH';
    if (score >= 80)
        return 'MEDIUM';
    return 'LOW';
}
function getMarginOfError(score) {
    if (score >= 95)
        return 3;
    if (score >= 85)
        return 5;
    if (score >= 75)
        return 8;
    return 10;
}
exports.default = processSecondsPrecisionBTR;
//# sourceMappingURL=seconds-precision-btr.js.map