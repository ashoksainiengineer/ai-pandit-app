/**
 * Batch Prompt Generator
 *
 * Generates AI prompts for Stage 2 batch tournament analysis.
 * Creates comprehensive prompts for Stage 2 batch tournament analysis.
 * 
 * VSL DATA:
 * This prompt now uses the Vedic Shorthand Language (VSL) protocol
 * for exhaustive, lossless data compaction.
 */

import { CandidateDataPackage, LifeEvent } from '@ai-pandit/shared';
import { formatLifeEventForAI } from './life-event-formatter.js';
import { shuffleArray } from '../../utils/index.js';
import { validateCandidateDataForAI } from '@ai-pandit/shared/schemas';
import { logger } from '../../../utils/logger.js';
import { formatCandidateVSL, EnhancedCandidate } from './vsl-formatter.js';
import { buildDuplicateTimeSet, getCandidateReference } from '../candidate-reference.js';
import { ValidationError } from '../../../errors/index.js';

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

/**
 * Generates batch analysis prompt for Stage 2 tournament
 *
 * @param candidates - Candidate data packages to evaluate
 * @param events - User's life events
 * @param batchNumber - Current batch number
 * @param totalBatches - Total number of batches
 * @param survivorsNeeded - Number of survivors to select
 * @param spouseData - Optional spouse data for synastry analysis
 * @param offsetMinutes - Window offset for determining sweep protocol
 * @returns Complete AI prompt string
 */
export function getBatchPrompt(
  candidates: CandidateDataPackage[],
  events: LifeEvent[],
  batchNumber: number,
  totalBatches: number,
  survivorsNeeded: number,
  spouseData?: unknown,
  offsetMinutes: number = 60
): string {
  // 🛡️ ZERO-TRUST VALIDATION GATE: Ensure all candidates strictly meet contract before AI sees them
  candidates.forEach(c => {
    try {
      validateCandidateDataForAI(c);
    } catch (err: unknown) {
      const zodErrors = typeof err === 'object' && err !== null && 'errors' in err
        ? (err as { errors: unknown }).errors
        : null;
      if (zodErrors) {
        logger.error(`[VALIDATION-GATE] Candidate ${c.time} failed Zod schema validation:`, JSON.stringify(zodErrors));
        throw new ValidationError(`Data Pipeline Contract Violation: Candidate ${c.time} failed Zod validation`, { zodErrors });
      } else {
        logger.error(`[VALIDATION-GATE] Candidate ${c.time} failed validation:`, err);
        throw new ValidationError(`Data Pipeline Contract Violation: Candidate ${c.time} is missing required data for AI analysis.`);
      }
    }
  });

  const eventsText = events.map(formatLifeEventForAI).join('\n');
  const spouseText = spouseData ? `SPOUSE DATA: ${JSON.stringify(spouseData)}` : 'SPOUSE DATA: N/A';

  // Anti-bias: Shuffle candidate order in every batch to prevent positional bias
  const shuffledCandidates = shuffleArray(candidates);
  const duplicateTimes = buildDuplicateTimeSet(shuffledCandidates);

  return `BIRTH TIME RECTIFICATION - STAGE 2 (Batch ${batchNumber}/${totalBatches})

════════════════════════════════════════════════════════════════════════════════
🎯 AI-DRIVEN SCORING SYSTEM
════════════════════════════════════════════════════════════════════════════════

YOU HAVE FULL FREEDOM TO ADJUST WEIGHTS! Here are REFERENCE weights - you MAY change them:

┌─────────────────────────────────────────────────────────────────────────────┐
│  METHOD              │ REFERENCE │  PRECISION    │ WHEN TO INCREASE        │
│                      │  WEIGHT   │               │                         │
├──────────────────────┼───────────┼───────────────┼─────────────────────────┤
│  Vimshottari         │   2.2     │  hours        │ PRIMARY timing method   │
│  KP Sub-Lord         │   2.0     │  seconds      │ Marriage, career        │
│  D150 (Nadi)         │   2.0     │  ~10 minutes  │ Meso-precision        │
│  D9 (Navamsa)        │   1.8     │  ~4 minutes   │ Marriage/Spouse       │
│  D10 (Dasamsa)       │   1.7     │  ~4 minutes   │ Career events         │
│  Transit             │   1.2     │  days         │ Confirmation          │
│  Kalachakra          │   1.2     │  days         │ Cross-verification    │
│  Shadbala            │   0.5     │  N/A          │ Strength context      │
│  AI Judgment         │   0.3     │  N/A          │ Pattern recognition   │
└─────────────────────────────────────────────────────────────────────────────┘

WEIGHT ADJUSTMENT RULES:
• CRITICAL events → Up-weight precision (Nadi, KP)
• Incomplete D60 → Down-weight Varga
• No spouse data → Ignore spouseD9

════════════════════════════════════════════════════════════════════════════════
📊 EVENT IMPORTANCE
════════════════════════════════════════════════════════════════════════════════

${getEventImportanceSummary(events)}

⚠️ Multipliers: CRITICAL (5x) | HIGH (3x) | MEDIUM (2x) | LOW (1x)

════════════════════════════════════════════════════════════════════════════════
⚖️ ANTI-BIAS PROTOCOL:
════════════════════════════════════════════════════════════════════════════════

1. TOTAL NEUTRALITY: Treat all provided times as equally likely candidates.
2. ZERO TENTATIVE BIAS: Do not favor times just because they are closer to the "original" time.
3. DATA-DRIVEN SCORE: Your score must reflect astrological alignment only.
4. NARRATIVE PRIMACY: The user's "SITUATIONAL NARRATIVE" is the ultimate source of truth.

════════════════════════════════════════════════════════════════════════════════
⚠️ CRITICAL SCORING RULES:
════════════════════════════════════════════════════════════════════════════════

1. USE PRE-CALCULATED DATA ONLY. Do not compute positions.
2. FUNCTIONAL NATURE MATTERS: A planet ruling 6/8/12 is malefic for this Ascendant.
3. DIGNITY MATTERS: Exalted/Own planets give strong results; Debilitated give mixed/weak.
4. HOUSE LORDSHIP IS KEY: Event MUST activate relevant house lords.
5. MAHAKALA PRECISION:
   - TATWA SHUDDHI: Verify Element aligns with user's nature.
   - KUNDA LAGNA: 'Matches Moon' = strong structural indicator.
   - BOUNDARY LOCKS: Pay special attention - truth often lies at boundaries.

${offsetMinutes > 120 ? `════════════════════════════════════════════════════════════════════════════════
🪐 PHASE A: THE MACRO SWEEP PROTOCOL (Offset is > 2 Hours)
════════════════════════════════════════════════════════════════════════════════
The time uncertainty is MASSIVE (±${offsetMinutes} mins). Your SOLE astrological objective is to identify the correct Lagna (D1) and Moon position.
- IGNORE D9, D10, D60, and Vimshottari pratyantar precision. (At this offset, micro-charts are mathematical noise).`
      : offsetMinutes > 15 ? `════════════════════════════════════════════════════════════════════════════════
🪐 PHASE B: THE MESO SWEEP PROTOCOL (Offset is Medium: ±${offsetMinutes} mins)
════════════════════════════════════════════════════════════════════════════════
The Lagna is likely fixed. Your objective is hunting the correct Navamsha (D9) and Dasamsha (D10).
- HEAVILY SCRUTINIZE the D9 Lagna and D9 7th house. Cross-reference with the user's spouse descriptions.
- EVALUATE D10 for career alignments and timing.
- ELIMINATE candidates where the D9 completely fails the reality of the user's marriage/relationship narrative.
- USE Vimshottari Antar Dasha for timing verification.`
        : `════════════════════════════════════════════════════════════════════════════════
🪐 PHASE C: THE MICRO SWEEP PROTOCOL (Offset is Tight: ±${offsetMinutes} mins)
════════════════════════════════════════════════════════════════════════════════
We are in the terminal varga zones. We are hunting exact D60 / D150 alignments.
- ANALYZE Vimshottari down to Pratyantar / Sookshma levels.
- USE D60 deities and configurations to map traumatic or sudden events.
- Your final judgment MUST hinge on mathematical precision in the micro-charts matching the situational narrative.`}

════════════════════════════════════════════════════════════════════════════════

    TASK: Execution of the 'Astrological Tournament' for ${candidates.length} candidates.

## Step 1: Current Case Analysis
- Event Importance Matrix: @UserEvents
- Narrative Integrity Check: @SituationalNarrative

## Step 2: Implementation of Technical Audit
Implement the following 10-step audit for EACH candidate:

1. **Lagna & Element Verification**
   - Verify if Lagna Lord's strength supports the user's vitality narrative.

2. **D1 Planetary Matrix Audit**
   - Assess planetary dignity (Exaltation/Debilitation) for all major planets.
   - Map 6/8/12 house activations against the "flavor" of life events.

3. **Vimshottari Dasha Chronology**
   - Link MD-AD-PD periods to major lifecycle markers.
   - Verify if the "Lord of the Period" has a functional relationship with the event house.

4. **Varga (Navamsa/Dasamsa) Cross-Check**
   - Scrutinize D9 for marriage/relationship narratives.
   - Audit D10 for professional peaks and career transitions.

5. **Micro-Precision (D60/Nadi) Assessment**
   - Evaluate D60 deities for "Karmic Weight" on critical events.
   - Check Nadi Amsha shifts for seconds-level resolution if offset is tight.

6. **Transit & Double-Transit Verification**
   - Confirm Jupiter/Saturn transits confirm major life shifts.
   - Apply 'Mahakala Precision' for current present-day anchors.

7. **Vedic High-Signals Audit**
   - Verify Pushkar, Vargottama, and Parivartana strengths.
   - Run Tattwa Shuddhi check for biological alignment.

8. **Pancha-Pakshi & Shadbala Context**
   - Use 'Ruling Bird' behavior to verify birth time quality.
   - Adjust weights based on total Shadbala strength.

9. **Macro/Meso/Micro Protocol Application**
   - Apply specific rules for the current offset (±${offsetMinutes} mins).
   - Penalize mathematical noise in micro-charts for large offsets.

10. **Final Score Aggregation & Verification**
    - Compile weighted scores based on method reliability.
    - Select survivors for the next precision stage.

════════════════════════════════════════════════════════════════════════════════
LIFE EVENTS:
${eventsText}



${spouseText}

CANDIDATES WITH ENRICHED VEDIC DATA (VSL Protocol):
${shuffledCandidates.map(c => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CANDIDATE: ${getCandidateReference(c, duplicateTimes)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formatCandidateVSL(c as EnhancedCandidate, { stage: 2 })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`).join('')}

════════════════════════════════════════════════════════════════════════════════
🎯 YOUR SCORING OUTPUT FORMAT (REQUIRED)
════════════════════════════════════════════════════════════════════════════════

For EACH candidate, provide THIS EXACT FORMAT for your working:

┌─────────────────────────────────────────────────────────────────────────────┐
│ CANDIDATE: [HH:MM:SS]                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ METHOD SCORES (0-100 each):                                                 │
│ • D150 Nadi:    [score]  (weight: [your chosen weight])                    │
│ • KP Sub-Lord:  [score]  (weight: [your chosen weight])                    │
│ • Vimshottari:  [score]  (weight: [your chosen weight])                    │
│ • Varga (D60):  [score]  (weight: [your chosen weight])                    │
│ • Transit:      [score]  (weight: [your chosen weight])                    │
│ • Kalachakra:   [score]  (weight: [your chosen weight])                    │
│ • Shadbala:     [score]  (weight: [your chosen weight])                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ WEIGHT ADJUSTMENTS: [Explain WHY you changed weights, if you did]          │
│ FINAL WEIGHTED SCORE: [0-100]                                               │
│ VERDICT: KEEP / ELIMINATE                                                    │
│ KEY REASON: [One-line astrological reason]                                   │
└─────────────────────────────────────────────────────────────────────────────┘

For EACH candidate analysis, your reasoning must be detailed and follow a structured format based on the 10-step audit. 

📢 **IMPORTANT UI RENDERING RULE**: 
Wrap your detailed reasoning/analysis for EACH candidate inside a markdown code block (\`\`\`) to ensure it renders correctly in the technical dashboard.

Example:
Candidate [10:30:00]:
\`\`\`
ASTROLOGICAL ANALYSIS:
- Lagna Match: [Detail]
- Dasha Check: [Detail]
- Verdict: [Score]
\`\`\`

At the VERY END of your response, you MUST output the final scores for ALL candidates in a structured JSON array enclosed in <FINAL_SCORES> tags. 

<FINAL_SCORES>
[
  { "time": "14:35:22", "score": 82, "reason": "Venus MD + KP Sub-Lord match for marriage event" },
  { "time": "10:30:00", "score": 45, "reason": "Mismatch on D9" }
]
</FINAL_SCORES>

FINAL LINE (required):
TOP_SURVIVORS: [comma-separated list of ${survivorsNeeded} best times]`;
}
