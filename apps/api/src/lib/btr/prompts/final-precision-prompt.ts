/**
 * Final Precision Prompt Generator
 *
 * Generates AI prompts for Stage 6 final seconds-level precision judgment.
 * Creates the ultimate forensic prompt for selecting the single best birth time.
 * 
 * VSL 4.0 INTEGRATION:
 * This prompt now uses the Vedic Shorthand Language (VSL) 4.0 protocol
 * for exhaustive, lossless data compaction.
 */

import { CandidateDataPackage, LifeEvent, ForensicTraits } from '@ai-pandit/shared';
import { formatLifeEventForAI } from './life-event-formatter.js';
import { buildForensicDNASummary } from './forensic-context.js';
import { randomSort } from '../../utils/index.js';
import { validateCandidateDataForAI } from '@ai-pandit/shared/schemas';
import { logger } from '../../logger.js';
import { formatCandidateVSL, EnhancedCandidate } from './vsl-formatter.js';

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
 * Generates final precision prompt for Stage 6
 *
 * @param candidates - Finalist candidate data packages
 * @param events - User's life events
 * @param forensicTraits - User's forensic traits
 * @param spouseData - Optional spouse data for synastry
 * @param currentTransits - Optional present-day transit data
 * @returns Complete AI prompt string for final judgment
 */
export function getFinalPrecisionPrompt(
  candidates: CandidateDataPackage[],
  events: LifeEvent[],
  forensicTraits: ForensicTraits,
  spouseData: unknown,
  currentTransits?: unknown
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
  const spouseText = spouseData ? JSON.stringify(spouseData, null, 2) : 'N/A';

  const forensicDNA = buildForensicDNASummary(forensicTraits);

  // Anti-bias: Final shuffling
  const shuffledCandidates = randomSort(candidates);

  const transitData = currentTransits as {
    dashaAtNow?: string;
    jupiter?: string;
    saturn?: string;
    rahu?: string;
  } | undefined;
  const presentTransitSection = transitData
    ? `PRESENT-DAY TRANSIT LOCK:
- Dasha@Now: ${transitData.dashaAtNow || 'Unknown'}
- Jupiter: ${transitData.jupiter || 'Unknown'}
- Saturn: ${transitData.saturn || 'Unknown'}
- Rahu: ${transitData.rahu || 'Unknown'}`
    : 'PRESENT-DAY TRANSIT LOCK: N/A';

  return `BIRTH TIME RECTIFICATION - FINAL STAGE (Seconds Precision)

════════════════════════════════════════════════════════════════════════════════
🎯 AI-DRIVEN SCORING - FINAL SECONDS PRECISION
════════════════════════════════════════════════════════════════════════════════

YOU HAVE FULL FREEDOM TO ADJUST WEIGHTS! This is the FINAL judgment - be precise:

┌─────────────────────────────────────────────────────────────────────────────┐
│  METHOD          │ REFERENCE │  PRECISION    │ FINAL STAGE FOCUS          │
│                  │  WEIGHT   │               │                            │
├──────────────────┼───────────┼───────────────┼────────────────────────────┤
│  D150 Nadi       │   2.5     │  48 seconds   │ CRITICAL for seconds!      │
│  KP Sub-Lord     │   2.3     │  seconds      │ 4-level precision          │
│  Vimshottari     │   2.0     │  hours        │ Prana Dasha level          │
│  Varga (D60)     │   1.8     │  2 minutes    │ Karma Lagna changes        │
│  Transit         │   1.5     │  days         │ Final verification         │
│  Kalachakra      │   1.3     │  days         │ Cross-check                │
│  Shadbala        │   1.0     │  N/A          │ Strength context           │
└─────────────────────────────────────────────────────────────────────────────┘

⚠️ FOR SECONDS PRECISION - FOCUS ON:
• D150 Nadi Amsha - Changes every 48 seconds!
• KP Sub-Sub-Sub-Lord - 4th level precision
• Vimshottari Prana Dasha - Hour-level refinement
• D60 Lagna - Changes every 2 minutes

════════════════════════════════════════════════════════════════════════════════
📊 USER'S EVENT IMPORTANCE SELECTIONS
════════════════════════════════════════════════════════════════════════════════

${getEventImportanceSummary(events)}

════════════════════════════════════════════════════════════════════════════════
⚖️ FINAL JUDGMENT RULES
════════════════════════════════════════════════════════════════════════════════

1. TOTAL NEUTRALITY: You are a cold, mathematical evaluator.
2. NO POSITIONAL BIAS: Candidate #1 is NOT more likely than Candidate #N.
3. MANDATORY PROOF: Every score must be backed by technical proof.
4. FOCUS ON D60: Even 10 seconds can change D60 Lagna!
5. NADI AMSHA (D150): Changes every 48 seconds - THIS IS THE KEY!
6. BIO-VEDIC LOCK: Time must match Life Events + Forensic DNA + Family Karma.

════════════════════════════════════════════════════════════════════════════════
════════════════════════════════════════════════════════════════════════════════

    TASK: Solve the Bio-Vedic Identity Matrix. Select THE SINGLE BEST birth time from ${shuffledCandidates.length} finalists.

## Step 1: Criminal-Level Forensic Correlation
- DNA Signature Matching: @ForensicTraits (Physical + Biological)
- Alibi Verification: @UserEvents (Narrative Integrity)
- Family Witness Matrix: @ForensicTraits.family
- Bio-Vedic Lock Status: @CurrentTransits

## Step 2: Final Judgment Logic
Execute the following 10-step final judgment sequence:

1. **Micro-Chart Boundary Lock (D60/D150)**
   - Analyze Nadi Amsha shifts (every 48 seconds).
   - Match D60 Lagna deity to life-defining traumatic/spiritual events.

2. **Vimshottari Prana Dasha Audit**
   - Scrutinize the hour-level Prana Dasha for the most critical user-weighted event.
   - Verify if the lord of the micro-period has a direct 'Mahakala signature'.

3. **Cuspal (KP) 4th Level Precision**
   - Audit Sub-Sub-Sub-Lord positions.
   - Verify alignment with seconds-level forensic traits.

4. **Tattwa Shuddhi & Mahakala Anchor**
   - Verify if the exact second of birth aligns with the biological element (Fire/Earth/Air/Water).
   - Check 'Kunda Lagna' matches Moon position for structural integrity.

5. **Spouse/Synastry Final Proof**
   - Apply final 'Spouse D9 Verification' score.
   - Mismatch on Synastry is grounds for immediate elimination.

6. **Gandanta Boundary Check**
   - If candidate is in a 'Gandanta' (Karmic Knot), verify if the user's life reflects this intense energy.
   - Distance to Gandanta must match the severity of childhood events.

7. **Pancha-Pakshi Final Verification**
   - Confirm 'Ruling Bird' modality matches the user's present-day success/failure cycles.
   - High-strength bird is required for high-accuracy verdicts.

8. **Chronology & Narrative Ingress**
   - Map exact sign ingresses of Saturn/Jupiter to the user's lifecycle shifts.
   - Narrative flavor must match planetary dignity at the exact transition point.

9. **Total Neutrality & Anti-Bias Final Scrub**
   - Perform a "Cold Audit" ignoring all previous stage rankings.
   - Penalize any candidate relying on 'hallucinated' or interpolated data.

10. **Final Verdict Generation**
    - Output the single best birth time with confidence and margin of error.

════════════════════════════════════════════════════════════════════════════════
USER FORENSIC DOSSIER:
${forensicDNA}
SPOUSE INFO: ${spouseText}
${presentTransitSection}

LIFE EVENTS:
${eventsText}

CANDIDATES WITH ENRICHED VEDIC DATA (VSL 4.0 Protocol):
${shuffledCandidates.map(c => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CANDIDATE: ${c.time}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formatCandidateVSL(c as EnhancedCandidate)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`).join('')}

FINAL VERDICT (required format):

📢 **IMPORTANT UI RENDERING RULE**: 
Wrap your final reasoning and evidence inside a markdown code block (\`\`\`) to ensure it renders correctly in the results dashboard.

\`\`\`
BEST TIME: [HH:MM:SS]
REASONING: [Explicitly cite D60 Lagna, Dasha Connection, Synastry Match (if any), and Lifecycle Chronology. No generic text.]
CONFIDENCE SCORE: [0-100]
ACCURACY: [0-100]%
CONFIDENCE LEVEL: [HIGH / MEDIUM / LOW]
MARGIN_OF_ERROR: ±[seconds] seconds

EVIDENCE:
1. [D60 Justification]
2. [Event-Dasha Link]

RUNNER_UP: [second best time]
\`\`\`

At the VERY END of your response, you MUST output the final verdict in a structured JSON object enclosed in <FINAL_VERDICT>tags.

<FINAL_VERDICT>
  {
    "time": "14:35:22",
      "accuracy": 95,
        "confidence": "HIGH",
          "margin": 15
  }
  </FINAL_VERDICT>
═══════════════════════════════════════════════════════════════════════════════`;
}
