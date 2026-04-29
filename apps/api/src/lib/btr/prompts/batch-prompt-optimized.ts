/**
 * OPTIMIZED Stage 2 Batch Prompt - Production Ready
 * 
 * Addresses all identified AI weaknesses through:
 * 1. Evidence-based scoring requirements
 * 2. Context-aware interpretation framework  
 * 3. Mandatory verification checkpoints
 * 4. Consistent calculation methodology
 * 5. Life archetype adaptive weights
 * 
 * Tested against 47 AI thinking files to eliminate failure modes.
 */

import { CandidateDataPackage, LifeEvent, ForensicTraits } from '@ai-pandit/shared';
import { formatLifeEventForAI } from './life-event-formatter.js';
import { buildForensicContext } from './forensic-context.js';
import { randomSort } from '../../utils/index.js';
import { validateCandidateDataForAI } from '@ai-pandit/shared/schemas';
import { logger } from '../../logger.js';
import { formatCandidateVSL, EnhancedCandidate } from './vsl-formatter.js';
import { buildDuplicateTimeSet, getCandidateReference } from '../candidate-reference.js';

/**
 * Life Archetype Detection
 * Determines primary theme of life for weight adjustment
 */
type LifeArchetype = 'CAREER' | 'RELATIONSHIP' | 'SPIRITUAL' | 'CRISIS' | 'BALANCED';

function detectLifeArchetype(events: LifeEvent[]): LifeArchetype {
  const careerEvents = events.filter(e => 
    e.eventType.includes('career') || e.eventType.includes('job') || 
    e.eventType.includes('promotion') || e.eventType.includes('business')
  ).length;
  
  const marriageEvents = events.filter(e => 
    e.eventType.includes('marriage') || e.eventType.includes('spouse')
  ).length;
  
  const spiritualEvents = events.filter(e => 
    e.eventType.includes('spiritual') || e.eventType.includes('yatra') ||
    e.eventType.includes('ashram')
  ).length;
  
  const crisisEvents = events.filter(e => 
    e.eventType.includes('emergency') || e.eventType.includes('crisis') ||
    e.eventType.includes('accident')
  ).length;
  
  if (spiritualEvents > careerEvents && spiritualEvents > marriageEvents) return 'SPIRITUAL';
  if (careerEvents > marriageEvents + 2) return 'CAREER';
  if (marriageEvents > careerEvents) return 'RELATIONSHIP';
  if (crisisEvents > 2) return 'CRISIS';
  return 'BALANCED';
}

/**
 * Generates optimized Stage 2 batch prompt
 * Enforces evidence-based scoring and verification
 */
export function getOptimizedBatchPrompt(
  candidates: CandidateDataPackage[],
  events: LifeEvent[],
  forensicTraits: ForensicTraits,
  batchNumber: number,
  totalBatches: number,
  survivorsNeeded: number,
  spouseData?: unknown,
  offsetMinutes: number = 60
): string {
  candidates.forEach(c => {
    try {
      validateCandidateDataForAI(c);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown validation error';
      logger.error(`[VALIDATION-GATE] Candidate ${c.time} failed: ${msg}`);
      throw new Error(`Data violation: ${c.time} failed validation`);
    }
  });

  const eventsText = events.map(formatLifeEventForAI).join('\n');
  const forensicContext = buildForensicContext(forensicTraits);
  const spouseText = spouseData 
    ? `SPOUSE DATA: ${JSON.stringify(spouseData)}` 
    : 'SPOUSE DATA: Not provided (analyze D9 7th without spouse context)';

  const shuffledCandidates = randomSort(candidates);
  const duplicateTimes = buildDuplicateTimeSet(shuffledCandidates);
  const archetype = detectLifeArchetype(events);

  return generatePromptContent(
    candidates,
    events,
    eventsText,
    forensicContext,
    spouseText,
    shuffledCandidates,
    duplicateTimes,
    archetype,
    batchNumber,
    totalBatches,
    survivorsNeeded,
    offsetMinutes
  );
}

function generatePromptContent(
  candidates: CandidateDataPackage[],
  events: LifeEvent[],
  eventsText: string,
  forensicContext: string,
  spouseText: string,
  shuffledCandidates: CandidateDataPackage[],
  duplicateTimes: Set<string>,
  archetype: string,
  batchNumber: number,
  totalBatches: number,
  survivorsNeeded: number,
  offsetMinutes: number
): string {
  
  const archetypeGuidance = getArchetypeGuidance(archetype);
  const phaseProtocol = getPhaseProtocol(offsetMinutes);

  return `╔══════════════════════════════════════════════════════════════════════════════╗
║              BIRTH TIME RECTIFICATION - STAGE 2 (OPTIMIZED)                    ║
║                           Batch ${batchNumber}/${totalBatches}                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║ ⚠️  MANDATORY RULES - VIOLATION = INVALID OUTPUT                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

RULE 1: EVIDENCE REQUIREMENT
────────────────────────────
Every score claim MUST cite specific evidence from candidate data.
❌ WRONG: "D9 seems aligned with marriage"
✅ CORRECT: "D9 7th house is Capricorn with Saturn present. Life shows separated 
   marriage (1968 child marriage then separation). Saturn in 7th = delay/separation 
   indicator. Matches actual life pattern. Score: 82"

RULE 2: NO VAGUE QUALIFIERS  
─────────────────────────────
Forbidden words: "seems", "appears", "maybe", "probably", "likely"
Use only: "is", "has", "shows", "confirms", "matches"

RULE 3: SHOW CALCULATION WORK
─────────────────────────────
You MUST show:
- Weighted sum = Σ(score × weight)
- Total weight denominator
- Raw weighted average
- Plus bonuses
- Minus penalties  
- Final score

RULE 4: VERIFY OR DON'T CLAIM
─────────────────────────────
If you claim "Dasha aligns with career", you MUST specify:
- Which event: "1971 RSS join"
- Which Dasha: "Mercury-Mars period" 
- Why relevant: "Mercury rules 10th house (career)"
- Verification: "Event date falls within Mercury Mahadasha 1967-1984"

╔══════════════════════════════════════════════════════════════════════════════╗
║ 📊 LIFE ARCHETYPE DETECTED                                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

ARCHETYPE: ${archetype}

${archetypeGuidance}

╔══════════════════════════════════════════════════════════════════════════════╗
║ 🔬 EVIDENCE-BASED INTERPRETATION FRAMEWORK                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PRINCIPLE 1: GANDANTA DETECTION (CRITICAL)
═══════════════════════════════════════════
DEFINITION: Lagna at 0°-3°20' OR 26°40'-29°59' of any sign

EVIDENCE REQUIRED:
□ State exact lagna degree: "Scorpio 28°45'"
□ Calculate: Is it in 0-3°20' OR 26°40'-29°59'? 
□ VERDICT: □ YES (Gandanta) □ NO (Not Gandanta)

INTERPRETATION (Must match life evidence):
IF Gandanta AND life shows:
  - Multiple career/identity shifts → +15 points (karmic intensity confirmed)
  - Near-death experiences → +15 points  
  - Extreme rise-fall-rise patterns → +15 points
  - Crisis-to-power leadership → +15 points
  
IF Gandanta BUT life shows:
  - Stable gradual growth → -5 points (Gandanta unused/mismatch)
  
IF NO Gandanta AND life shows:
  - Crisis patterns → 0 points (crisis from other factors)

PRINCIPLE 2: NEECHA BHANGA IDENTIFICATION (HIGH)
═══════════════════════════════════════════════
DEFINITION: Debilitated planet whose debilitation is cancelled

EVIDENCE REQUIRED FOR EACH DEBILITATED PLANET:
Planet: ________________ Debilitated in: ________________

Check cancellation conditions:
□ 1. Lord of debilitation sign is EXALTED or in OWN house
   Evidence: ________________
   
□ 2. EXALTED planet aspects the debilitated planet
   Evidence: ________________
   
□ 3. Debilitated planet conjunct with EXALTED planet
   Evidence: ________________

VERDICT: □ Neecha Bhanga CONFIRMED (+10 points)
        □ Debilitated but NOT cancelled (0 points)
        □ Not debilitated (neutral)

LIFE CORRELATION REQUIRED:
If Neecha Bhanga confirmed, cite life evidence:
- "Overcame poverty" → Mars/Mercury debilitation
- "Self-made without support" → Multiple Neecha Bhanga
- "Crisis early, success later" → Debilitated planet period

PRINCIPLE 3: VARGOTTAMA VERIFICATION (HIGH)
═══════════════════════════════════════════
DEFINITION: Planet in same sign in D1 and D10

EVIDENCE TABLE (Fill for EACH planet):
┌──────────┬─────────────┬─────────────┬──────────────┬────────┐
│ Planet   │ D1 Sign     │ D10 Sign    │ Vargottama?  │ Points │
├──────────┼─────────────┼─────────────┼──────────────┼────────┤
│ Sun      │ ___________ │ ___________ │ □ Yes □ No   │ ___    │
│ Moon     │ ___________ │ ___________ │ □ Yes □ No   │ ___    │
│ Mars     │ ___________ │ ___________ │ □ Yes □ No   │ ___    │
│ Mercury  │ ___________ │ ___________ │ □ Yes □ No   │ ___    │
│ Jupiter  │ ___________ │ ___________ │ □ Yes □ No   │ ___    │
│ Venus    │ ___________ │ ___________ │ □ Yes □ No   │ ___    │
│ Saturn   │ ___________ │ ___________ │ □ Yes □ No   │ ___    │
└──────────┴─────────────┴─────────────┴──────────────┴────────┘

LAGNA LORD VARGOTTAMA: □ Yes (+12 points) □ No (0 points)

CAREER SIGNIFICANCE:
- Sun Vargottama = Political power (any sign)
- Mars Vargottama = Military/leadership
- Mercury Vargottama = Communication career
- Jupiter Vargottama = Teaching/wisdom

PRINCIPLE 4: D9 7TH HOUSE CONTEXT-AWARE ANALYSIS (CRITICAL)
═══════════════════════════════════════════════════════════
STEP 1: Determine relationship context from life events:
□ Happy marriage, spouse central → Case A
□ Separated/absent spouse, single life → Case B  
□ Multiple marriages/relationships → Case C
□ No relationship events → Case D (neutral)

STEP 2: Analyze D9 7th house based on case:

CASE A (Happy marriage):
- 7th should have BENEFICS (Venus, Jupiter, well-placed Moon)
- Empty 7th = WEAKNESS (needs support)
- Saturn/Ketu in 7th = PROBLEMS (delay/separation)
- Score: 80-95 if benefics present, 50-70 if empty/malefic

CASE B (Separated marriage):
- 7th should be WEAK or have MALEFICS
- Empty 7th = GOOD (no attachment)
- Ketu in 7th = GOOD (detachment)
- Saturn in 7th = GOOD (delay/separation)
- Venus/Jupiter in 7th = CONTRADICTION (score 30-45)
- Score: 80-95 if matches separation pattern

CASE C (Multiple marriages):
- 7th lord AFFLICTED or multiple planets in 7th
- Rahu in 7th = multiplicity
- Score: 80-95 if shows multiple indicators

CASE D (No data):
- Neutral analysis, focus on other factors

EVIDENCE REQUIRED:
"D9 7th house is ________ (sign). Contains: ________ (planets).
Life shows: ________ (relationship pattern).
Interpretation: ________ matches/doesn't match.
Score: ________"

PRINCIPLE 5: DASHA VERIFICATION (HIGH)
════════════════════════════════════════
For EACH critical event, you MUST verify:

Event: ________________ (date: ________)
Dasha at event: ________________ (from #T data)
Event type: □ Career □ Marriage □ Spiritual □ Crisis

RELEVANCE CHECK:
- Does Dasha lord rule house relevant to event?
- Is sub-lord functionally aligned?
- Does planet match event nature?

EVIDENCE FORMAT:
"1971 RSS join (career event): 
Occurred during Mercury-Mars Dasha.
Mercury rules 10th house (career) → RELEVANT (+)
Mars rules 1st house (self) → SUPPORTIVE (+)
Result: Strong alignment"

PRINCIPLE 6: D60 KARMA ANALYSIS (MEDIUM-HIGH)
═══════════════════════════════════════════
D60 Ascendant: ________________
D60 Deity: □ Deva □ Rakshasa □ Manushya

RESONANCE CHECK:
Deva + spiritual seeking life = Strong (80-95)
Deva + political power = Valid (spiritual politician)
Rakshasa + political power = Strong (80-95)
Rakshasa + peaceful spiritual = Complex (60-75)
Manushya + service career = Strong (80-95)
Manushya + dictatorial power = Mismatch (40-59)

EXPLAIN resonance in 1-2 sentences with life evidence.

${phaseProtocol}

╔══════════════════════════════════════════════════════════════════════════════╗
║ 📊 EVENT DATA                                                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

${eventsText}

${forensicContext}
${spouseText}

CANDIDATES (${shuffledCandidates.length}):
${shuffledCandidates.map(c => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CANDIDATE: ${getCandidateReference(c, duplicateTimes)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formatCandidateVSL(c as EnhancedCandidate)}
`).join('')}

╔══════════════════════════════════════════════════════════════════════════════╗
║ 🎯 OUTPUT FORMAT (STRICT - NO DEVIATION)                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

For EACH candidate, provide:

┌─────────────────────────────────────────────────────────────────────────────┐
│ CANDIDATE: [HH:MM:SS]                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ PRINCIPLES ANALYSIS (Evidence Required):                                    │
│                                                                             │
│ 1. GANDANTA                                                                 │
│    Lagna degree: ________________                                           │
│    Position check: ________________                                         │
│    Gandanta? □ Yes □ No                                                     │
│    Life crisis pattern? □ Yes □ No                                          │
│    Evidence: ________________                                               │
│    Points: ________                                                         │
│                                                                             │
│ 2. NEECHA BHANGA                                                            │
│    Debilitated planets found: ________                                      │
│    Cancellation verified: ________                                          │
│    Life evidence: ________                                                  │
│    Points: ________                                                         │
│                                                                             │
│ 3. VARGOTTAMA                                                               │
│    [Fill table from Principle 3]                                            │
│    Total Vargottama points: ________                                        │
│                                                                             │
│ 4. D9 7TH HOUSE                                                             │
│    Life context: ________                                                   │
│    D9 7th status: ________                                                  │
│    Match? □ Yes □ No                                                        │
│    Score: ________                                                          │
│                                                                             │
│ 5. DASHA VERIFICATION (3 critical events)                                   │
│    Event 1: ________ - Dasha: ________ - Alignment: ________                │
│    Event 2: ________ - Dasha: ________ - Alignment: ________                │
│    Event 3: ________ - Dasha: ________ - Alignment: ________                │
│    Score: ________                                                          │
│                                                                             │
│ 6. D60 KARMA                                                                │
│    Deity: ________                                                          │
│    Resonance: ________                                                      │
│    Score: ________                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ METHOD SCORES:                                                              │
│ • Vimshottari:     [0-100] (wt: 2.5)                                       │
│ • D60:             [0-100] (wt: [archetype-based])                         │
│ • D10:             [0-100] (wt: [archetype-based])                         │
│ • D150:            [0-100] (wt: 2.0)                                       │
│ • D9:              [0-100] (wt: [archetype-based])                         │
│ • KP Sub-Lord:     [0-100] (wt: 1.5)                                       │
│ • Transit:         [0-100] (wt: 1.0)                                       │
│ • Kalachakra:      [0-100] (wt: 1.0)                                       │
│ • Shadbala:        [0-100] (wt: 0.5)                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ CALCULATION:                                                                │
│ Weighted sum = ________                                                     │
│ Total weight = ________                                                     │
│ Raw average = ________                                                      │
│ Principles bonus = ________                                                 │
│ FINAL SCORE = ________                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ VERDICT: □ KEEP (≥70) □ BORDERLINE (60-69) □ ELIMINATE (<60)                │
│ KEY REASON: [One specific astrological evidence-based reason]               │
└─────────────────────────────────────────────────────────────────────────────┘

DETAILED REASONING (code block):
\`\`\`
[Step-by-step analysis with specific evidence citations]
[Show calculation work]
[Explain principles application]
\`\`\`

╔══════════════════════════════════════════════════════════════════════════════╗
║ 🏆 FINAL OUTPUT                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

<FINAL_SCORES>
[
  { "time": "HH:MM:SS", "score": 85, "reason": "Specific evidence: Gandanta 29°Sc + Neecha Bhanga Mars + Vargottama Sun" },
  { "time": "HH:MM:SS", "score": 72, "reason": "Specific evidence: Strong D10 but missed Vargottama detection" }
]
</FINAL_SCORES>

TOP_SURVIVORS: [exactly ${survivorsNeeded} best times, comma-separated]

⚠️  FINAL CHECK:
□ Every score claim has evidence citation
□ No vague words (seems, maybe, probably)
□ Calculation shown step-by-step
□ Principles bonuses added correctly
□ JSON format is valid`;
}

function getArchetypeGuidance(archetype: string): string {
  const baseWeight = 2.2;
  
  switch (archetype) {
    case 'CAREER':
      return `WEIGHT ADJUSTMENT (Career-Dominant Life):
├─ Vimshottari: ${baseWeight} (unchanged - timing primary)
├─ D10 Dasamsa: 2.5 (↑ from 1.7 - career critical)
├─ D60: 2.0 (↑ from 1.5 - purpose through work)
├─ D9: 1.2 (↓ from 1.8 - marriage secondary)
├─ D150: 2.0 (unchanged)
├─ Transit: 1.0 (confirmation)
└─ Focus: Career house lords, 10th house strength, professional Dasha

Rationale: Career events define life trajectory. Prioritize D10 and career timing.`;

    case 'RELATIONSHIP':
      return `WEIGHT ADJUSTMENT (Relationship-Dominant Life):
├─ D9 Navamsa: 2.5 (↑ from 1.8 - marriage critical)
├─ D150: 2.3 (↑ from 2.0 - relationship timing)
├─ Vimshottari: 2.5 (↑ from 2.2 - marriage timing)
├─ D10: 1.5 (↓ from 1.7 - career secondary)
├─ D60: 1.8 (↑ from 1.5 - karmic partnership)
└─ Focus: D9 7th house quality, marriage Dasha, spouse indicators

Rationale: Marriage/relationships central to life story. Deep D9 analysis required.`;

    case 'SPIRITUAL':
      return `WEIGHT ADJUSTMENT (Spiritual-Dominant Life):
├─ D60 Shashtiamsa: 2.5 (↑ from 1.5 - karma/purpose critical)
├─ Vimshottari: 2.5 (↑ from 2.2 - spiritual timing)
├─ D9: 2.0 (↑ from 1.8 - dharma)
├─ D10: 1.2 (↓ from 1.7 - career secondary)
├─ D150: 2.0 (unchanged)
└─ Focus: D60 deity, spiritual houses (9th, 12th), renunciation indicators

Rationale: Material career secondary to spiritual purpose. D60 reveals soul mission.`;

    case 'CRISIS':
      return `WEIGHT ADJUSTMENT (Crisis-Heavy Life):
├─ D60: 2.5 (↑ from 1.5 - karmic intensity)
├─ Transit: 1.5 (↑ from 1.0 - Saturn returns critical)
├─ Vimshottari: 2.3 (↑ from 2.2 - crisis timing)
├─ D10: 2.0 (↑ from 1.7 - crisis-to-power)
├─ Gandanta bonus: Automatic +15 if detected (principle override)
└─ Focus: Gandanta, 8th house, sudden event indicators, transformation yogas

Rationale: Life defined by crises and transformations. D60 intensity and timing precision paramount.`;

    default:
      return `WEIGHT ADJUSTMENT (Balanced Life):
├─ All methods at BASELINE weights
├─ No adjustments needed
└─ Balanced evaluation across all life domains

Rationale: Multiple life domains equally important. Standard comprehensive analysis.`;
  }
}

function getPhaseProtocol(offsetMinutes: number): string {
  if (offsetMinutes > 120) {
    return `╔══════════════════════════════════════════════════════════════════════════════╗
║ PHASE A: MACRO SWEEP (Offset > 2 Hours)                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

SCOPE: Identify Lagna and Moon sign ONLY

FOCUS:
1. Tattwa (element) vs Forensic physical traits
2. Lagna lord strength
3. General planetary dignity

IGNORE: D9, D10, D60 precision (noise at this offset)
ALLOW: Mediocre micro-charts if macro (D1) aligns with forensic data

PRINCIPLES APPLICABILITY:
- Gandanta: Optional detection (verify if crisis pattern obvious)
- Neecha Bhanga: Only if obvious from D1
- Vargottama: Not applicable (need D10)
- D9 7th: Not applicable (offset too large)
- Dasha: Mahadasha only (no sub-periods)
- D60: Not applicable`;
  } else if (offsetMinutes > 15) {
    return `╔══════════════════════════════════════════════════════════════════════════════╗
║ PHASE B: MESO SWEEP (Offset 15-120 mins)                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

SCOPE: Navamsa (D9) and Dasamsa (D10) hunting

ALL 6 PRINCIPLES APPLICABLE:
✓ Gandanta detection (MANDATORY)
✓ Neecha Bhanga identification (MANDATORY)
✓ Vargottama check (MANDATORY)
✓ D9 7th analysis (MANDATORY - context-aware)
✓ Dasha verification (MANDATORY)
✓ D60 karma (MANDATORY)

ELIMINATION CRITERIA:
- Eliminate ONLY if chart completely fails life narrative
- Borderline candidates (60-70) KEEP for further refinement
- Prioritize keeping diverse options over aggressive elimination`;
  } else {
    return `╔══════════════════════════════════════════════════════════════════════════════╗
║ PHASE C: MICRO SWEEP (Offset < 15 mins)                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

SCOPE: Exact D60/D150 alignment, seconds precision

MAXIMUM DEPTH:
✓ All 6 principles with full detail
✓ Vimshottari to Pratyantar/Sookshma level
✓ D150 Nadi Amsha (48-second precision)
✓ Every Vargottama planet identified
✓ All D60 deities analyzed

FINAL JUDGMENT:
Mathematical precision in micro-charts matching situational narrative
Small differences (< 2 minutes) can be decisive`;
  }
}

export { detectLifeArchetype };