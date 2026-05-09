/**
 * Final Precision Prompt Generator
 *
 * Generates AI prompts for Stage 6 final seconds-level precision judgment.
 * Creates the ultimate precision prompt for selecting the single best birth time.
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

type PresentTransitLock = {
  dashaAtNow?: string;
  jupiter?: string;
  saturn?: string;
  rahu?: string;
};

/**
 * Generates final precision prompt for Stage 6
 *
 * @param candidates - Finalist candidate data packages
 * @param events - User's life events
 * @param spouseData - Optional spouse data for synastry
 * @param currentTransits - Optional present-day transit data
 * @returns Complete AI prompt string for final judgment
 */
export function getFinalPrecisionPrompt(
  candidates: CandidateDataPackage[],
  events: LifeEvent[],
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
      throw new ValidationError(`Data Pipeline Contract Violation: Candidate ${c.time} is missing required data for AI analysis.`);
    }
  });

  const eventsText = events.map(formatLifeEventForAI).join('\n');
  const spouseText = spouseData ? JSON.stringify(spouseData, null, 2) : 'N/A';

  // Anti-bias: Final shuffling

  const shuffledCandidates = shuffleArray(candidates);
  const duplicateTimes = buildDuplicateTimeSet(shuffledCandidates);

  const transitData = currentTransits as PresentTransitLock | Record<string, PresentTransitLock> | undefined;
  const presentTransitSection = !transitData
    ? 'PRESENT-DAY TRANSIT LOCK: N/A'
    : isPerCandidateTransitLockMap(transitData)
      ? `PRESENT-DAY TRANSIT LOCKS BY CANDIDATE:
${Object.entries(transitData).map(([time, lock]) =>
  `- ${time}: Dasha@Now=${lock.dashaAtNow || 'Unknown'} | Jupiter=${lock.jupiter || 'Unknown'} | Saturn=${lock.saturn || 'Unknown'} | Rahu=${lock.rahu || 'Unknown'}`
).join('\n')}`
      : `PRESENT-DAY TRANSIT LOCK:
- Dasha@Now: ${transitData.dashaAtNow || 'Unknown'}
- Jupiter: ${transitData.jupiter || 'Unknown'}
- Saturn: ${transitData.saturn || 'Unknown'}
- Rahu: ${transitData.rahu || 'Unknown'}`;

  return `BIRTH TIME RECTIFICATION - FINAL STAGE (Seconds Precision)

════════════════════════════════════════════════════════════════════════════════
🎯 AI-DRIVEN SCORING - FINAL SECONDS PRECISION
════════════════════════════════════════════════════════════════════════════════

YOU HAVE FULL FREEDOM TO ADJUST WEIGHTS! This is the FINAL judgment - be precise:

┌─────────────────────────────────────────────────────────────────────────────┐
│  METHOD              │ REFERENCE │  PRECISION    │ FINAL STAGE FOCUS      │
│                      │  WEIGHT   │               │                        │
├──────────────────────┼───────────┼───────────────┼────────────────────────┤
│  KP Sub-Sub-Sub-Lord │   2.8     │  30-60 sec    │ HIGHEST precision      │
│  D1080 Nadi Amsha    │   2.5     │  48 seconds   │ Seconds-level          │
│  KP Sub-Sub-Lord     │   2.2     │  2-4 minutes  │ High precision         │
│  Vimshottari Prana   │   2.0     │  ~24 seconds  │ Micro-dasha level      │
│  D9 (Navamsa)        │   1.8     │  ~4 minutes   │ Marriage/Dharma        │
│  D60 (Shashtiamsa)   │   1.8     │  2 minutes    │ Karma verification     │
│  D10 (Dasamsa)       │   1.7     │  ~4 minutes   │ Career status          │
│  Transit             │   1.0     │  days         │ Background only        │
│  Chara Dasha         │   1.3     │  sign-based   │ Cross-verification     │
│  Shadbala            │   0.3     │  N/A          │ Not for micro-timing   │
└─────────────────────────────────────────────────────────────────────────────┘

⚠️ FOR SECONDS PRECISION - FOCUS ON:
• D1080 Nadi Amsha - Changes every 48 seconds (CRITICAL!)
• KP Sub-Sub-Sub-Lord - 4th level precision
• Vimshottari Prana Dasha - Seconds-level (~24 sec per prana)
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
5. NADI AMSHA (D1080): Changes every 48 seconds - THIS IS THE KEY!
6. BIO-VEDIC LOCK: Time must match Life Events.

════════════════════════════════════════════════════════════════════════════════
════════════════════════════════════════════════════════════════════════════════

    TASK: Solve the Bio-Vedic Identity Matrix. Select THE SINGLE BEST birth time from ${shuffledCandidates.length} finalists.


## Step 1: Final Judgment Logic
Execute the following 10-step final judgment sequence:

1. **Micro-Chart Boundary Lock (D60/D1080 Nadi)**
   - Analyze D1080 Nadi Amsha shifts (every 48 seconds).
   - Match D60 Lagna deity to life-defining traumatic/spiritual events.

2. **Vimshottari Prana Dasha Audit**
   - Scrutinize the seconds-level Prana Dasha (~24 sec) for the most critical user-weighted event.
   - Verify if the lord of the micro-period has a direct 'Mahakala signature'.

3. **Cuspal (KP) 4th Level Precision**
   - Audit Sub-Sub-Sub-Lord positions.
   - Verify alignment with seconds-level birth time indicators.

4. **Tattwa Shuddhi & Mahakala Anchor**
   - Verify Tattwa (5-element cycle) compatibility with biological profile (Fire/Earth/Air/Water).
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

SPOUSE INFO: ${spouseText}
${presentTransitSection}

LIFE EVENTS:
${eventsText}

CANDIDATES WITH ENRICHED VEDIC DATA (VSL Protocol):
${shuffledCandidates.map(c => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CANDIDATE: ${getCandidateReference(c, duplicateTimes)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formatCandidateVSL(c as EnhancedCandidate)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`).join('')}

FINAL VERDICT (required format):

📢 **IMPORTANT UI RENDERING RULE**: 
Wrap your final reasoning and evidence inside a markdown code block (\`\`\`) to ensure it renders correctly in the results dashboard.

\`\`\`
BEST TIME: [candidate reference]
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

function isPerCandidateTransitLockMap(value: PresentTransitLock | Record<string, PresentTransitLock>): value is Record<string, PresentTransitLock> {
  return Object.values(value).some((entry) => typeof entry === 'object' && entry !== null && ('dashaAtNow' in entry || 'jupiter' in entry || 'saturn' in entry || 'rahu' in entry));
}
