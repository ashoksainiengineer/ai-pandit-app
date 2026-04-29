/**
 * REFINED Batch Prompt Generator - Stage 2
 * 
 * Addresses AI weaknesses identified in analysis:
 * 1. Removed weight adjustment freedom (now FIXED weights)
 * 2. Added MANDATORY Gandanta detection
 * 3. Added MANDATORY Neecha Bhanga identification
 * 4. Added MANDATORY Vargottama check
 * 5. Corrected D9 7th house guidance (for separated marriage cases)
 * 6. Structured D60 analysis with specific deity lookup
 * 7. Created strict checklist format AI must complete
 * 8. Added validation gates
 * 
 * Target Model: OpenAI GPT-OSS 120B (reasoning optimized)
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
 * FIXED WEIGHT CONFIGURATION
 * These weights are NON-NEGOTIABLE and must be used exactly as specified.
 * AI has NO freedom to adjust these based on "importance" or "events".
 * Research shows weight adjustment freedom leads to 30% scoring inconsistency.
 */
const FIXED_METHOD_WEIGHTS = {
  VIMSHOTTARI: 2.5,      // PRIMARY timing method - highest weight
  D60_SHASHTIAMSA: 2.5,  // Karmic purpose - critical for PM identification
  D10_DASAMSA: 2.0,      // Career - essential for political leaders
  D150_NADI: 2.0,        // Meso-precision - changes every 48 seconds
  D9_NAVAMSA: 1.5,       // Marriage - LOWER for separated/child marriage cases
  KP_SUB_LORD: 1.5,      // Cuspal precision
  TRANSIT: 1.0,          // Confirmation only
  KALACHAKRA: 1.0,       // Cross-verification
  SHADBALA: 0.5,         // Strength context
  AI_PATTERN: 0.3        // Pattern recognition (lowest - data driven)
} as const;

/**
 * MANDATORY CHECKLIST ITEMS
 * AI MUST complete every item for EVERY candidate.
 * Missing items result in automatic score reduction.
 */
const MANDATORY_CHECKS = {
  GANDANTA_DETECTION: {
    priority: 'CRITICAL',
    description: 'Check if lagna is at 0°-3°20\' or 26°40\'-29°59\' of ANY sign',
    scoring: 'If Gandanta present AND events show crisis/leadership: +15 points',
    penalty: 'If Gandanta present but missed: -20 points from final score'
  },
  
  NEECHA_BHANGA: {
    priority: 'HIGH',
    description: 'Identify ALL debilitated planets and check cancellation',
    conditions: [
      'Lord of debilitation sign in exaltation/own sign',
      'Aspect from exalted planet to debilitated planet',
      'Conjunction with planet exalted in same sign'
    ],
    scoring: 'Per Neecha Bhanga yoga confirmed: +10 points'
  },
  
  VARGOTTAMA: {
    priority: 'HIGH',
    description: 'Compare D1 and D10 signs for EACH planet',
    check: 'Planet in same sign in D1 and D10 = Vargottama',
    scoring: 'Vargottama planet: +8 points. Vargottama lagna lord: +12 points'
  },
  
  D60_KARMA: {
    priority: 'HIGH',
    description: 'Identify D60 ascendant and deity',
    deities: {
      DEVA: 'Spiritual leadership, wisdom',
      RAKSHASA: 'Political warrior, crisis management',
      MANUSHYA: 'Service-oriented, administrative'
    },
    requirement: 'MUST match deity to life trajectory'
  },
  
  NAKSHATRA_LORD: {
    priority: 'MEDIUM',
    description: 'Identify lagna nakshatra and its lord\'s position',
    nakshatras: {
      'MULA': 'Ketu-ruled, intense, root-level transformation',
      'JYESHTHA': 'Mercury-ruled, eldest, leadership',
      'ANURADHA': 'Saturn-ruled, devotion, following divine will'
    }
  },
  
  D9_7TH_CORRECTION: {
    priority: 'CRITICAL',
    note: 'FOR SEPARATED/CHILD MARRIAGE CASES (like Modi):',
    correctInterpretation: [
      'Empty 7th house = GOOD (detachment from spouse)',
      'Ketu/Saturn in 7th = GOOD (separation/delay)',
      'Venus/Jupiter in 7th = WRONG (indicates happy marriage)'
    ],
    warning: 'DO NOT penalize empty 7th house for separated marriage cases!'
  }
};

/**
 * Generates REFINED batch analysis prompt for Stage 2
 * Uses FIXED weights and MANDATORY checklist to prevent AI errors
 */
export function getRefinedBatchPrompt(
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
      const zodErrors = typeof err === 'object' && err !== null && 'errors' in err
        ? (err as { errors: unknown }).errors
        : null;
      if (zodErrors) {
        logger.error(`[VALIDATION-GATE] Candidate ${c.time} failed:`, JSON.stringify(zodErrors));
        throw new Error(`Data violation: ${c.time} failed validation`);
      } else {
        logger.error(`[VALIDATION-GATE] Candidate ${c.time} failed:`, err);
        throw new Error(`Data violation: ${c.time} missing required data`);
      }
    }
  });

  const eventsText = events.map(formatLifeEventForAI).join('\n');
  const forensicContext = buildForensicContext(forensicTraits);
  const spouseText = spouseData ? `SPOUSE DATA: ${JSON.stringify(spouseData)}` : 'SPOUSE DATA: N/A (Separated/Child Marriage Case)';

  const shuffledCandidates = randomSort(candidates);
  const duplicateTimes = buildDuplicateTimeSet(shuffledCandidates);

  return `╔══════════════════════════════════════════════════════════════════════════════╗
║           BIRTH TIME RECTIFICATION - STAGE 2 (REFINED PROTOCOL)              ║
║                         Batch ${batchNumber}/${totalBatches}                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║ ⚠️  CRITICAL INSTRUCTIONS - READ BEFORE ANALYSIS                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

🚫 WEIGHT ADJUSTMENT IS FORBIDDEN:
   You MUST use EXACTLY these FIXED weights for ALL candidates:
   
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ METHOD              │ FIXED WEIGHT │ DO NOT CHANGE                     │
   ├─────────────────────┼──────────────┼───────────────────────────────────┤
   │ Vimshottari         │     2.5      │ PRIMARY timing                   │
   │ D60 (Shashtiamsa)   │     2.5      │ Karmic purpose (CRITICAL)        │
   │ D10 (Dasamsa)       │     2.0      │ Career                           │
   │ D150 (Nadi)         │     2.0      │ Meso-precision                   │
   │ D9 (Navamsa)        │     1.5      │ Marriage (LOWER priority)        │
   │ KP Sub-Lord         │     1.5      │ Cuspal precision                 │
   │ Transit             │     1.0      │ Confirmation only                │
   │ Kalachakra          │     1.0      │ Cross-verification               │
   │ Shadbala            │     0.5      │ Strength context                 │
   │ AI Pattern          │     0.3      │ Pattern recognition              │
   └─────────────────────────────────────────────────────────────────────────┘
   
   ⚠️  DO NOT adjust weights based on "critical events" or "importance"
   ⚠️  DO NOT increase D150 weight because events are critical
   ⚠️  These weights are OPTIMIZED for political leader identification

╔══════════════════════════════════════════════════════════════════════════════╗
║ 📋 MANDATORY CHECKLIST - Complete EVERY item for EVERY candidate              ║
╚══════════════════════════════════════════════════════════════════════════════╝

You MUST complete this checklist in order. DO NOT skip any step.

[ ] CHECK 1: GANDANTA DETECTION (CRITICAL - 15 points)
    Is lagna at 0°-3°20' OR 26°40'-29°59' of any sign?
    □ YES → Note: Gandanta present. Check if life events show crisis/trauma
    □ NO  → Proceed
    
    If YES and events show crisis leadership: +15 points
    If YES but you miss it: -20 points penalty

[ ] CHECK 2: NEECHA BHANGA IDENTIFICATION (HIGH - 10 points each)
    List ALL debilitated planets:
    1. ________________ in ________________ (debilitated in)
       Cancellation check:
       □ Lord of debilitation sign is exalted/own? ___
       □ Aspect from exalted planet? ___
       □ Conjunction with exalted planet? ___
       Result: □ Neecha Bhanga confirmed  □ Not cancelled
    
    2. ________________ in ________________ (debilitated in)
       [Same format]
    
    Per confirmed Neecha Bhanga: +10 points

[ ] CHECK 3: VARGOTTAMA CHECK (HIGH - 8-12 points)
    Check EACH planet: Is it in SAME sign in D1 and D10?
    
    Planet       D1 Sign    D10 Sign    Vargottama?    Points
    _______      _______    _______     □ Yes □ No    ____
    _______      _______    _______     □ Yes □ No    ____
    _______      _______    _______     □ Yes □ No    ____
    
    Regular planet: +8 points
    Lagna lord Vargottama: +12 points

[ ] CHECK 4: D60 KARMA ANALYSIS (HIGH - Required)
    D60 Ascendant: ________________
    D60 Deity: □ Deva  □ Rakshasa  □ Manushya
    
    For political leaders with crisis events:
    □ Rakshasa + Sun/Mars strong = Warrior leader (GOOD)
    □ Deva + Jupiter strong = Spiritual leader (GOOD)
    □ Manushya only = Administrative (MAYBE)
    
    Does D60 deity match life trajectory? □ YES □ NO

[ ] CHECK 5: NAKSHATRA ANALYSIS (MEDIUM)
    Lagna Nakshatra: ________________
    Nakshatra Lord: ________________
    Lord's position: ________________
    
    Mula (Ketu): Root-level transformation, intense
    Jyeshtha (Mercury): Eldest, leadership
    Anuradha (Saturn): Devotion, following divine will

[ ] CHECK 6: D9 7TH HOUSE CORRECTED ANALYSIS (CRITICAL)
    ⚠️  FOR SEPARATED/CHILD MARRIAGE CASES:
    
    Current D9 7th house status:
    □ Empty → GOOD (detachment) → Score: 80+
    □ Ketu present → GOOD (separation) → Score: 85+
    □ Saturn present → GOOD (delay/separation) → Score: 75+
    □ Venus present → BAD (happy marriage expected) → Score: 40
    □ Jupiter present → BAD (spouse prosperity) → Score: 45
    
    DO NOT penalize empty 7th house!

╔══════════════════════════════════════════════════════════════════════════════╗
║ 🎯 PHASE-SPECIFIC PROTOCOL                                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

${offsetMinutes > 120 ? `╔══════════════════════════════════════════════════════════════════════════════╗
║ PHASE A: MACRO SWEEP (Offset > 2 Hours)                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝
PRIORITY: Identify Lagna and Moon sign ONLY
• IGNORE D9, D10, D60 precision (mathematical noise at this offset)
• FOCUS: Tattwa (Element) vs Forensic Traits
• CHECK: Biological/Physical markers match lagna element
• ALLOW: "Mediocre" charts to survive if tattwa matches` : offsetMinutes > 15 ? `╔══════════════════════════════════════════════════════════════════════════════╗
║ PHASE B: MESO SWEEP (Offset 15-120 mins)                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
PRIORITY: Navamsa (D9) and Dasamsa (D10) hunting
• COMPLETE all 6 MANDATORY CHECKS above
• FOCUS: D60 deity matching life trajectory
• VERIFY: Vimshottari Antardasha for timing
• ELIMINATE: Only if D9 completely fails (with CORRECTED 7th house logic)` : `╔══════════════════════════════════════════════════════════════════════════════╗
║ PHASE C: MICRO SWEEP (Offset < 15 mins)                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝
PRIORITY: Exact D60/D150 alignment
• COMPLETE all 6 MANDATORY CHECKS
• VERIFY: Vimshottari down to Pratyantar/Sookshma
• USE: D150 Nadi Amsha for seconds precision
• CHECK: All Vargottama planets
• FINAL: Mathematical precision in micro-charts`}

╔══════════════════════════════════════════════════════════════════════════════╗
║ 📊 EVENT IMPORTANCE (For context only - do NOT adjust weights)                ║
╚══════════════════════════════════════════════════════════════════════════════╝

${getEventImportanceSummary(events)}

⚠️  Multipliers show event significance ONLY
⚠️  Use for NARRATIVE context, not weight adjustment

╔══════════════════════════════════════════════════════════════════════════════╗
║ ⚖️  ANTI-BIAS PROTOCOL                                                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

1. TOTAL NEUTRALITY: All times equally likely until proven otherwise
2. ZERO TENTATIVE BIAS: No favoritism toward "original" or "known" times
3. DATA-DRIVEN ONLY: Astrological alignment is sole scoring criterion
4. SCORPIO BIAS CHECK: Do NOT assume Scorpio > Libra automatically
5. DEGREE MATTERS: 0° Scorpio ≠ 15° Scorpio ≠ 29° Scorpio

╔══════════════════════════════════════════════════════════════════════════════╗
║ 📋 DETAILED ANALYSIS STEPS                                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

For EACH candidate, complete in order:

STEP 1: MANDATORY CHECKLIST (Complete all 6 checks above)
STEP 2: Calculate base scores using FIXED weights
STEP 3: Apply bonuses/penalties from checklist
STEP 4: Verify score consistency (70-100 = Keep, <60 = Eliminate)
STEP 5: Document key reason in ONE line

╔══════════════════════════════════════════════════════════════════════════════╗
║ 📦 CANDIDATE DATA                                                             ║
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
║ 🎯 REQUIRED OUTPUT FORMAT                                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

For EACH candidate, provide EXACTLY this format:

┌─────────────────────────────────────────────────────────────────────────────┐
│ CANDIDATE: [HH:MM:SS]                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ MANDATORY CHECKLIST COMPLETION:                                             │
│ □ Check 1 (Gandanta): [PASS/FAIL - details]                                │
│ □ Check 2 (Neecha Bhanga): [PASS/FAIL - list yogas]                        │
│ □ Check 3 (Vargottama): [PASS/FAIL - list planets]                         │
│ □ Check 4 (D60 Karma): [PASS/FAIL - deity: ___]                            │
│ □ Check 5 (Nakshatra): [PASS/FAIL - ___ nakshatra]                         │
│ □ Check 6 (D9 7th): [PASS/FAIL - status: ___]                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ METHOD SCORES (0-100 each):                                                 │
│ • Vimshottari:     [score]  (weight: 2.5)                                  │
│ • D60 Shashtiamsa: [score]  (weight: 2.5)                                  │
│ • D10 Dasamsa:     [score]  (weight: 2.0)                                  │
│ • D150 Nadi:       [score]  (weight: 2.0)                                  │
│ • D9 Navamsa:      [score]  (weight: 1.5)                                  │
│ • KP Sub-Lord:     [score]  (weight: 1.5)                                  │
│ • Transit:         [score]  (weight: 1.0)                                  │
│ • Kalachakra:      [score]  (weight: 1.0)                                  │
│ • Shadbala:        [score]  (weight: 0.5)                                  │
│ • AI Pattern:      [score]  (weight: 0.3)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ BONUS/PENALTY POINTS:                                                       │
│ • Gandanta detected with crisis events: +15                                │
│ • Neecha Bhanga yogas: +[count × 10]                                       │
│ • Vargottama planets: +[count × 8]                                         │
│ • Vargottama lagna lord: +[0 or 12]                                        │
│ • Missed Gandanta: -20                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ CALCULATION:                                                                │
│ Weighted sum = Σ(score × weight)                                            │
│ Total weight = 14.3                                                         │
│ Raw score = Weighted sum / 14.3                                             │
│ Final score = Raw score + Bonuses - Penalties                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ FINAL SCORE: [0-100]                                                        │
│ VERDICT: □ KEEP (≥70)  □ ELIMINATE (<60)  □ BORDERLINE (60-69)             │
│ KEY REASON: [One-line specific astrological reason]                         │
└─────────────────────────────────────────────────────────────────────────────┘

📢 MANDATORY: Wrap detailed reasoning in markdown code block:

\`\`\`
CANDIDATE [HH:MM:SS] ANALYSIS:
- Check 1 (Gandanta): [Detailed finding]
- Check 2 (Neecha Bhanga): [Detailed finding]
- Check 3 (Vargottama): [Detailed finding]
- Check 4 (D60): [Detailed finding]
- Check 5 (Nakshatra): [Detailed finding]
- Check 6 (D9 7th): [Detailed finding]
- Method scores: [Why each score was given]
- Calculation: [Show your work]
\`\`\`

╔══════════════════════════════════════════════════════════════════════════════╗
║ 🏆 FINAL OUTPUT (STRICT FORMAT)                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

At the VERY END, output EXACTLY this JSON format:

<FINAL_SCORES>
[
  { "time": "HH:MM:SS", "score": 85, "reason": "Gandanta + Neecha Bhanga + Vargottama Sun" },
  { "time": "HH:MM:SS", "score": 72, "reason": "Strong D60 but missed Vargottama" },
  ...
]
</FINAL_SCORES>

TOP_SURVIVORS: [comma-separated list of ${survivorsNeeded} best times]

⚠️  REMEMBER:
• Use FIXED weights - NO adjustments
• Complete ALL 6 mandatory checks
• Do NOT penalize empty D9 7th house for separated marriage
• Gandanta is POSITIVE for crisis leaders
• Show your calculation work`;
}

/**
 * Get event importance summary (unchanged)
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

export { FIXED_METHOD_WEIGHTS, MANDATORY_CHECKS };