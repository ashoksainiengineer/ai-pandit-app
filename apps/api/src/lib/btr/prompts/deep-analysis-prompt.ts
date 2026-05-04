/**
 * Deep Analysis Prompt Generator
 *
 * Generates AI prompts for Stage 4 deep multi-dasha analysis.
 * Creates detailed forensic prompts for final candidate verification.
 * 
 * VSL DATA:
 * This prompt now uses the Vedic Shorthand Language (VSL) protocol
 * for exhaustive, lossless data compaction.
 */

import { CandidateDataPackage, LifeEvent, ForensicTraits } from '@ai-pandit/shared';
import { formatLifeEventForAI } from './life-event-formatter.js';
import { shuffleArray } from '../../utils/index.js';
import { validateCandidateDataForAI } from '@ai-pandit/shared/schemas';
import { logger } from '../../../utils/logger.js';
import { formatCandidateVSL, EnhancedCandidate } from './vsl-formatter.js';
import { resolveEventDateWindow } from '../event-date-utils.js';
import { buildDuplicateTimeSet, getCandidateReference } from '../candidate-reference.js';

/**
 * Get event importance summary for AI
 */
function getEventImportanceSummary(events: LifeEvent[]): string {
  const critical = events.filter(e => e.importance === 'critical');
  const high = events.filter(e => e.importance === 'high');
  const medium = events.filter(e => e.importance === 'medium');
  const low = events.filter(e => e.importance === 'low');

  let summary = '';
  if (critical.length > 0) {
    summary += `CRITICAL (${critical.length}): ${critical.map(e => e.eventType).join(', ')}\n`;
  }
  if (high.length > 0) {
    summary += `HIGH (${high.length}): ${high.map(e => e.eventType).join(', ')}\n`;
  }
  if (medium.length > 0) {
    summary += `MEDIUM (${medium.length}): ${medium.map(e => e.eventType).join(', ')}\n`;
  }
  if (low.length > 0) {
    summary += `LOW (${low.length}): ${low.map(e => e.eventType).join(', ')}`;
  }
  return summary;
}

function getTimelineRange(events: LifeEvent[]): string {
  const eventYears = events
    .flatMap((event) => {
      const window = resolveEventDateWindow(event);
      return [
        Number.parseInt(window.startDate.slice(0, 4), 10),
        Number.parseInt(window.endDate.slice(0, 4), 10),
      ];
    })
    .filter((year) => Number.isFinite(year));

  const nowYear = new Date().getUTCFullYear();
  if (eventYears.length === 0) {
    return `${nowYear - 30}-${nowYear}`;
  }

  const minYear = Math.min(...eventYears);
  const maxYear = Math.max(...eventYears, nowYear);
  return `${minYear}-${maxYear}`;
}

/**
 * Generates deep analysis prompt for Stage 4
 *
 * @param candidates - Finalist candidate data packages
 * @param events - User's life events
 * @param forensicTraits - User's forensic traits
 * @param spouseData - Optional spouse data for synastry
 * @returns Complete AI prompt string for deep analysis
 */
export function getDeepAnalysisPrompt(
  candidates: CandidateDataPackage[],
  events: LifeEvent[],
  forensicTraits: ForensicTraits,
  spouseData: unknown,
  offsetMinutes: number = 30
): string {
  // 🛡️ ZERO-TRUST VALIDATION GATE
  candidates.filter(c => c.time).forEach(c => {
    try {
      validateCandidateDataForAI(c);
    } catch (err: unknown) {
      const zodErrors = typeof err === 'object' && err !== null && 'errors' in err
        ? (err as { errors: unknown }).errors
        : null;
      if (zodErrors) {
        logger.error(`[VALIDATION-GATE] Candidate ${c.time} failed Zod schema validation:`, JSON.stringify(zodErrors));
      } else {
        logger.error(`[VALIDATION-GATE] Candidate ${c.time} failed validation:`, err);
      }
      throw new Error(`Data Pipeline Contract Violation: Candidate ${c.time} is missing required data for AI analysis.`);
    }
  });

  const eventsText = events.map(formatLifeEventForAI).join('\n');
  const f = forensicTraits;
  const spouseText = spouseData ? JSON.stringify(spouseData, null, 2) : 'N/A';
  const timelineRange = getTimelineRange(events);

  const forensicContext = `
    [FORENSIC DNA - TOP 5 ANCHORS]
    1. PRAKRITI: ${f?.biological?.prakriti?.toUpperCase() ?? 'Unknown'} (Biological Constitution)
    2. TEMPERAMENT: ${f?.psychographic?.temperament ?? 'unknown'} (Psychological Profile)
    3. BUILD: ${f?.physical?.build ?? 'unknown'} (${f?.physical?.height?.feet ?? '?'}'${f?.physical?.height?.inches ?? '?'}") (Physical Structure)
    4. BIRTH ORDER: ${f?.family?.siblingPosition ?? 'unknown'} child (${f?.family?.brotherCount ?? 0}B/${f?.family?.sisterCount ?? 0}S) (Family Karma)
    5. VOICE: ${f?.physical?.facialStructure?.voicePitch ?? 'unknown'} (Physical Marker)
    `;
  // Anti-bias: Shuffle to prevent positional bias
  const filteredCandidates = candidates.filter(c => c.time);
  const shuffledCandidates = shuffleArray(filteredCandidates);
  const duplicateTimes = buildDuplicateTimeSet(shuffledCandidates);

  return `BIRTH TIME RECTIFICATION - STAGE 4 (Deep Multi-Dasha Analysis)

════════════════════════════════════════════════════════════════════════════════
🎯 AI-DRIVEN SCORING - DEEP ANALYSIS
════════════════════════════════════════════════════════════════════════════════

YOU HAVE FULL FREEDOM TO ADJUST WEIGHTS! Reference weights - ADJUST as needed:

┌─────────────────────────────────────────────────────────────────────────────┐
│  METHOD              │ REFERENCE │  PRECISION    │ ADJUST FOR              │
│                      │  WEIGHT   │               │                         │
├──────────────────────┼───────────┼───────────────┼─────────────────────────┤
│  KP Sub-Lord         │   2.5     │  seconds      │ HIGHEST - Cuspal precision │
│  Vimshottari AD      │   2.3     │  hours        │ PRIMARY timing method   │
│  D150 (Nadi)         │   2.2     │  ~10 minutes  │ Meso-precision        │
│  D9 (Navamsa)        │   2.0     │  ~4 minutes   │ Marriage/Spouse       │
│  D10 (Dasamsa)       │   1.9     │  ~4 minutes   │ Career/Status         │
│  D60 (Shashtiamsa)   │   1.8     │  2 minutes    │ Karma verification    │
│  Chara Dasha         │   1.7     │  sign-based   │ Jaimini cross-check   │
│  Transit             │   1.5     │  days         │ Double transit        │
│  Kalachakra          │   1.2     │  days         │ Tertiary check        │
│  Yogini Dasha        │   0.9     │  months       │ Secondary             │
│  Shadbala            │   0.5     │  N/A          │ Strength context      │
└─────────────────────────────────────────────────────────────────────────────┘

════════════════════════════════════════════════════════════════════════════════
📊 USER'S EVENT IMPORTANCE SELECTIONS
════════════════════════════════════════════════════════════════════════════════

${getEventImportanceSummary(events)}

════════════════════════════════════════════════════════════════════════════════
⚖️ ANALYSIS RULES (PURE VEDIC ASTROLOGY)
════════════════════════════════════════════════════════════════════════════════

1. RELY ONLY ON PROVIDED MATHEMATICAL DATA - Do not hallucinate positions.
2. NARRATIVE PRIMACY: Match event "flavor" to planetary dignity and aspects.
3. FORENSIC CORRELATION: Varga markers must align with physical/psychographic data.
4. BIO-VEDIC MAPPING: Forensic traits are "Biological Anchors".
5. PROJECT MAHAKALA:
   - TATWA SHUDDHI: Element matches biological/temperamental profile?
   - KUNDA LAGNA: 'Matches Moon' = strong structural indicator.
   - DIVISIONAL BOUNDARIES: Truth often lies at boundaries.

${offsetMinutes > 15 ? `════════════════════════════════════════════════════════════════════════════════
🪐 PHASE B: THE MESO SWEEP PROTOCOL (Offset: ±${offsetMinutes} mins)
════════════════════════════════════════════════════════════════════════════════
You are in Stage 4. The Lagna is fixed. Your objective is hunting the correct Navamsha (D9) and Dasamsha (D10).
- HEAVILY SCRUTINIZE the D9 Lagna and D9 7th house. Cross-reference with the user's spouse descriptions.
- EVALUATE D10 for career alignments and timing.
- ELIMINATE candidates where the D9 completely fails the reality of the user's marriage/relationship narrative.
- USE Vimshottari Antar Dasha for timing verification.`
      : `════════════════════════════════════════════════════════════════════════════════
🪐 PHASE C: THE MICRO SWEEP PROTOCOL (Offset: ±${offsetMinutes} mins)
════════════════════════════════════════════════════════════════════════════════
We are in the terminal varga zones. We are hunting exact D60 / D1080 (Nadi) alignments.
- ANALYZE Vimshottari down to Pratyantar / Sookshma levels.
- USE D60 deities and configurations to map traumatic or sudden events.
- Your final judgment MUST hinge on mathematical precision in the micro-charts matching the situational narrative.`}

════════════════════════════════════════════════════════════════════════════════

    TASK: Execution of 'Deep Multi-Varga Forensic Audit' on ${shuffledCandidates.length} finalist candidates.

## Step 1: Forensic DNA Synchronization
- Physical Alignment: @ForensicTraits.physical
- Temperamental Mapping: @ForensicTraits.psychographic
- Biological Anchor Status: @ForensicTraits.biological
- Family Karma Matrix: @ForensicTraits.family

## Step 2: Implementation of Deep Audit
Implement the following comprehensive verification sequence for EACH candidate:

1. **Varga Boundary Scrutiny**
   - Audit D9 and D10 Ascendant degrees. 
   - Identify if the candidate sits on a 'Terminal Varga Zone' (Boundary Lock).

2. **Bio-Vedic Mapping Verification**
   - Match @ForensicTraits to specific Varga deities and planetary configurations.
   - Verify if Tattwa Shuddhi aligns with the user's temperamental profile.

3. **Multi-Dasha Chronology (${timelineRange})**
   - Correlate Vimshottari MD-AD-PD-SD sequence with real-world events.
   - Cross-verify timing using Yogini and Chara Dashas for redundant proof.

4. **Karmic Knot (Gandanta) Analysis**
   - Assess severity of Lagna/Moon Gandanta if present.
   - Map traumatic/life-defining events to these karmic boundaries.

5. **Spouse/Synastry Lock**
   - Run D9 verification against @SpouseData.
   - Lock time based on 7th house and Venus/Jupiter configurations.

6. **Lifecycle Shift Audit**
   - Map major Saturn/Jupiter sign ingresses to the user's chronology.
   - Verify if "flavor" of life shifts matches the planetary transitions.

7. **Cuspal (KP) Precision**
   - Audit Sub-Lord and Sub-Sub-Lord positions for event triggers.
   - Verify 1st House Sub-Lord supports physical @ForensicTraits.

8. **Pancha-Pakshi Activity Mapping**
   - Verify 'Ruling Bird' activities align with event results.
   - Confirm birth time quality via bird strength.

9. **Terminal Precision (D60/D150)**
   - Audit D60 Karma deities for forensic alignment.
    - Review D1080 Nadi Amsha for seconds-level resolution.

10. **Final Forensic Verdict**
    - Apply weighted scoring based on narrative match.
    - Select survivors for the Final Stage.

════════════════════════════════════════════════════════════════════════════════
USER FORENSIC DATA:
${forensicContext}
SPOUSE DATA: ${spouseText}

LIFE EVENTS:
${eventsText}

════════════════════════════════════════════════════════════════════════════════
📚 EVENT SIGNIFICATOR GUIDE (Map Events to Astrological Indicators)
════════════════════════════════════════════════════════════════════════════════
For EACH event, verify activation of the following:
• Marriage/Partnership: Venus, 7th House Lord, D9 (Navamsha) Lagna
• Career/Status: Sun, Saturn, 10th House Lord, D10 (Dasamsha)
• Health/Surgery: Mars, 6th House Lord, 8th House (chronic)
• Education: Mercury, Jupiter, 4th/9th House Lords
• Children/Birth: Jupiter, 5th House Lord, D7 (Saptamsha)
• Property/Vehicles: Mars, Saturn, 4th House Lord
• Foreign Travel: Rahu, Ketu, 9th/12th Houses
• Spiritual/Religious: Jupiter, Ketu, 9th/12th Houses
• Financial Gain/Loss: Jupiter (gain), Saturn/Rahu (loss), 2nd/11th Houses
• Legal/Court: Saturn, Mars, 6th House Lord
• Death/Accident: Saturn, Mars, 8th House, Gandanta zones

⚠️ Dasha period MUST activate the relevant house lord or significator planet.
⚠️ Transit (especially Jupiter/Saturn) MUST confirm the event timing.

CANDIDATES WITH ENRICHED VEDIC DATA (VSL Protocol):
${shuffledCandidates.map(c => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CANDIDATE: ${getCandidateReference(c, duplicateTimes)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formatCandidateVSL(c as EnhancedCandidate)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`).join('')}

════════════════════════════════════════════════════════════════════════════════
🎯 YOUR DEEP ANALYSIS OUTPUT FORMAT (REQUIRED)
════════════════════════════════════════════════════════════════════════════════

For EACH finalist candidate:

📢 **IMPORTANT UI RENDERING RULE**: 
Wrap the entire analysis block (from CANDIDATE to the closing box border) inside a markdown code block (\`\`\`) to ensure the ASCII tables render correctly in the dashboard.

    Example:
  \`\`\`
┌─────────────────────────────────────────────────────────────────────────────┐
│ CANDIDATE: [HH:MM:SS]                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
... [Full Analysis Table] ...
└─────────────────────────────────────────────────────────────────────────────┘
\`\`\`

┌─────────────────────────────────────────────────────────────────────────────┐
│ CANDIDATE: [HH: MM: SS]                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ DETAILED METHOD ANALYSIS:                                                   │
│ ┌─────────────────────────────────────────────────────────────────────┐     │
│ │ METHOD        │ SCORE │ WEIGHT │ KEY FINDING                        │     │
│ ├───────────────┼───────┼────────┼────────────────────────────────────┤     │
│ │ D150 Nadi     │   XX  │  X.X   │[Match / Mismatch description]       │     │
│ │ KP Sub - Lord   │   XX  │  X.X   │[Cuspal analysis]                  │     │
│ │ Vimshottari   │   XX  │  X.X   │[Dasha alignment]                  │     │
│ │ Varga(D60)   │   XX  │  X.X   │[Karma verification]               │     │
│ │ Transit       │   XX  │  X.X   │[Double transit status]            │     │
│ │ Kalachakra    │   XX  │  X.X   │[Cycle verification]               │     │
│ │ Yogini        │   XX  │  X.X   │[Secondary confirmation]           │     │
│ │ Chara         │   XX  │  X.X   │[Jaimini check]                    │     │
│ └─────────────────────────────────────────────────────────────────────┘     │
├─────────────────────────────────────────────────────────────────────────────┤
│ WEIGHT ADJUSTMENTS: [Why you changed weights]                              │
│ FINAL WEIGHTED SCORE: [0 - 100]                                               │
│ VERDICT: KEEP / DROP                                                         │
│ KEY EVIDENCE: [Top 2 - 3 astrological reasons]                               │
└─────────────────────────────────────────────────────────────────────────────┘

At the VERY END of your response, you MUST output the final scores for ALL candidates in a structured JSON array enclosed in <FINAL_SCORES>tags. 

<FINAL_SCORES>
  [
    { "time": "14:35:22", "score": 92, "reason": "Terminal D150 match with exact Dasha" },
    { "time": "10:30:00", "score": 55, "reason": "Failed D60 alignment" }
  ]
    </FINAL_SCORES>

  FINAL:
  TOP_SURVIVORS: [comma - separated list of best times]`;
}
