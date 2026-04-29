/**
 * GOD-TIER GENERAL Batch Prompt - Stage 2
 * 
 * Principles-based approach for ANY birth time rectification case.
 * Teaches AI to think like a master astrologer, not follow a rigid checklist.
 * 
 * Philosophy: "Give a man a fish vs teach him to fish"
 * Old prompts: "Check this box" (gave fish)
 * This prompt: "Understand WHY to check" (teaches fishing)
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
 * ADAPTIVE WEIGHT GUIDELINES (Not rigid rules)
 * 
 * AI adjusts weights based on LIFE NARRATIVE, not arbitrary preference.
 * Guidelines ensure consistency while allowing flexibility.
 */
const WEIGHT_GUIDELINES = {
  BASELINE: {
  },
  
  ADJUSTMENT_RULES: `
    ADJUST weights ONLY when:
    
    1. CAREER-DOMINANT LIFE (PM, CEO, leader):
       → Increase D10 to 2.2-2.5
       → Decrease D9 to 1.2-1.5 (if marriage not central)
       → Rationale: Career events define the life
    
    2. RELATIONSHIP-DOMINANT LIFE (spouse central):
       → Increase D9 to 2.2-2.5
       → Increase D150 to 2.2 (relationship timing precise)
       → Rationale: Marriage defines life direction
    
    3. SPIRITUAL/YOGIC LIFE:
       → Increase D60 to 2.2-2.5 (karma/purpose critical)
       → Increase Vimshottari to 2.5 (timing of spiritual shifts)
       → Decrease D10 to 1.2 (career not primary)
       → Rationale: Spiritual purpose trumps material
    
    4. CRISIS/TRAUMA-HEAVY LIFE:
       → Increase D60 to 2.2 (karmic intensity)
       → Increase Transit to 1.5 (Saturn returns critical)
       → Rationale: Trauma timing must be exact
    
    5. CREATIVE/ARTISTIC LIFE:
       → Increase D9 to 2.0 (creative expression)
       → Increase Shadbala to 0.8 (planetary strength matters)
       → Rationale: Creativity needs strong planets
    
    NEVER adjust because "events seem critical" - that's circular logic.
    Adjust because the LIFE ARCHETYPE demands it.
  `
};

/**
 * GOD-TIER PRINCIPLES
 * 
 * These are UNIVERSAL truths of Vedic astrology.
 * AI applies these principles, not mechanical checks.
 */
const ASTROLOGICAL_PRINCIPLES = {
  GANDANTA: {
    what: 'Lagna at 0°-3°20\' or 26°40\'-29°59\' of any sign',
    meaning: 'Karmic intensity, life-defining transitions, birth/death/rebirth themes',
    interpretation: `
      NOT automatically "good" or "bad".
      
      If life shows:
      - Multiple career/identity shifts → Gandanta likely PRESENT
      - Near-death experiences → Gandanta likely PRESENT  
      - Extreme rise-fall-rise patterns → Gandanta likely PRESENT
      - Stable, gradual growth → Gandanta likely ABSENT
      
      Score: +12 to +18 if matches life pattern
      Score: Neutral if no crisis pattern
      Score: -5 if life stable but Gandanta present (mismatch)
    `
  },
  
  NEECHA_BHANGA: {
    what: 'Debilitated planet whose debilitation is cancelled',
    meaning: 'Rise from adversity, obstacles become strengths',
    conditions: [
      'Lord of debilitation sign exalted/own house',
      'Aspect from exalted planet to debilitated planet',
      'Conjunction with planet exalted in same sign'
    ],
    interpretation: `
      Each confirmed Neecha Bhanga = +10 points
      
      Look for life evidence:
      - "Overcame poverty" → Check Mars/Mercury debilitation
      - "Self-made" → Multiple Neecha Bhanga likely
      - "Crisis at birth" → Neecha planet strong after struggle
      
      No evidence = Don't force it
    `
  },
  
  VARGOTTAMA: {
    what: 'Planet in same sign in D1 and D10',
    meaning: 'Career strength amplified, consistent life purpose',
    interpretation: `
      +8 points per Vargottama planet
      +12 points if LAGNA LORD is Vargottama
      
      Special attention:
      - Sun Vargottama = Political power (regardless of sign)
      - Mars Vargottama = Military/leadership
      - Mercury Vargottama = Communication career
      - Jupiter Vargottama = Wisdom/teaching career
      
      Even "weak" sign Vargottama > strong sign non-Vargottama
    `
  },
  
  D60_SHASHTIAMSA: {
    what: 'Divisional chart for karma and life purpose (changes every 2 mins)',
    meaning: 'Soul-level purpose, not just career',
    deity_meanings: {
      DEVA: 'Spiritual, wisdom-seeking, teaching, healing',
      RAKSHASA: 'Warrior, protector, transformative, political',
      MANUSHYA: 'Service, administration, human connections'
    },
    interpretation: `
      D60 deity should RESONATE with life, not exactly "match":
      
      Deva + spiritual seeking life = Strong alignment
      Deva + political power life = Possible (spiritual politician)
      
      Rakshasa + political power = Strong alignment
      Rakshasa + peaceful spiritual life = Complex karma
      
      Manushya + service career = Strong alignment
      Manushya + dictatorial power = Misalignment
      
      Score 80-95: Deity resonates with life theme
      Score 60-79: Deity present but not central
      Score 40-59: Deity contradicts obvious life theme
    `
  },
  
  D9_NAVAMSA_7TH: {
    what: '7th house in D9 = Marriage/relationships',
    meaning: 'Quality and nature of partnerships',
    interpretation: `
      CONTEXT IS EVERYTHING:
      
      Case A: Happy marriage, spouse central
      → 7th house SHOULD have benefics (Venus, Jupiter)
      → Empty 7th = weakness
      → Saturn/Ketu in 7th = delay/separation (bad)
      
      Case B: Separated marriage, spouse absent
      → 7th house should be WEAK or have malefics
      → Empty 7th = GOOD (no attachment)
      → Ketu in 7th = GOOD (detachment)
      → Saturn in 7th = GOOD (delay/separation)
      → Venus/Jupiter in 7th = BAD (contradiction)
      
      Case C: Multiple marriages
      → 7th lord afflicted or multiple planets in 7th
      
      DON'T assume "benefic in 7th = good" blindly!
    `
  },
  
  NAKSHATRA_LAGNA: {
    what: 'Lagna nakshatra = Personality core',
    key_nakshatras: {
      MULA: 'Root-level transformation, investigative, intense, destroys and rebuilds',
      JYESHTHA: 'Eldest energy, leadership, protection, authority',
      ANURADHA: 'Devotion, following divine will, loyalty, Radha energy',
      REVATI: 'Completion, nourishment, protection, finality',
      ASHWINI: 'Healing, initiation, speed, pioneer',
      MAGHA: 'Regal, ancestral power, throne, tradition'
    },
    interpretation: `
      Nakshatra should MATCH personality:
      
      Mula + investigative personality = Strong
      Mula + stable administrator = Possible mismatch
      
      Jyeshtha + natural leader = Strong
      Jyeshtha + follower personality = Mismatch
      
      Anuradha + devotional/spiritual = Strong
      Anuradha + purely materialistic = Possible mismatch
    `
  }
};

/**
 * Generates GOD-TIER general batch prompt
 */
export function getGodTierBatchPrompt(
  candidates: CandidateDataPackage[],
  events: LifeEvent[],
  forensicTraits: ForensicTraits,
  batchNumber: number,
  totalBatches: number,
  survivorsNeeded: number,
  spouseData?: unknown,
  offsetMinutes: number = 60
): string {
  // Validation
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
  const spouseText = spouseData ? `SPOUSE DATA: ${JSON.stringify(spouseData)}` : 'SPOUSE DATA: Not provided';

  const shuffledCandidates = randomSort(candidates);
  const duplicateTimes = buildDuplicateTimeSet(shuffledCandidates);

  // Determine life archetype from events
  const careerEvents = events.filter(e => 
    e.eventType.includes('career') || 
    e.eventType.includes('job') || 
    e.eventType.includes('promotion') ||
    e.eventType.includes('business')
  ).length;
  
  const marriageEvents = events.filter(e => 
    e.eventType.includes('marriage') || 
    e.eventType.includes('spouse') ||
    e.eventType.includes('wedding')
  ).length;
  
  const spiritualEvents = events.filter(e => 
    e.eventType.includes('spiritual') || 
    e.eventType.includes('yatra') ||
    e.eventType.includes('ashram') ||
    e.eventType.includes('pilgrimage')
  ).length;
  
  const crisisEvents = events.filter(e => 
    e.eventType.includes('emergency') || 
    e.eventType.includes('crisis') ||
    e.eventType.includes('accident') ||
    e.eventType.includes('death')
  ).length;

  const dominantArchetype = 
    spiritualEvents > careerEvents && spiritualEvents > marriageEvents ? 'SPIRITUAL' :
    careerEvents > marriageEvents ? 'CAREER' :
    marriageEvents > 0 ? 'RELATIONSHIP' :
    crisisEvents > 2 ? 'CRISIS' : 'BALANCED';

  return `╔══════════════════════════════════════════════════════════════════════════════╗
║          BIRTH TIME RECTIFICATION - STAGE 2 (GOD-TIER PROTOCOL)              ║
║                         Batch ${batchNumber}/${totalBatches}                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║ 🧠 ASTROLOGICAL INTELLIGENCE REQUIRED                                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

You are a MASTER VEDIC ASTROLOGER with 40+ years experience.
You have rectified thousands of birth times.
You DON'T follow checklists - you UNDERSTAND charts.

Your job: Find the ONE time where the cosmos aligns with the life story.

╔══════════════════════════════════════════════════════════════════════════════╗
║ 📊 LIFE ARCHETYPE DETECTED                                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

Based on event analysis:
- Career/Status events: ${careerEvents}
- Marriage/Relationship events: ${marriageEvents}
- Spiritual/Seeking events: ${spiritualEvents}
- Crisis/Transformation events: ${crisisEvents}

DOMINANT ARCHETYPE: ${dominantArchetype}

WEIGHT GUIDANCE:
${dominantArchetype === 'CAREER' ? `→ Career defines this life
→ INCREASE: D10 (Dasamsa) to 2.2-2.5
→ DECREASE: D9 (Navamsa) to 1.2-1.5
→ FOCUS: Vimshottari Dasha career timing` : 
dominantArchetype === 'RELATIONSHIP' ? `→ Marriage/relationships define this life  
→ INCREASE: D9 (Navamsa) to 2.2-2.5
→ INCREASE: D150 (Nadi) to 2.2 (relationship timing)
→ FOCUS: D9 7th house quality` :
dominantArchetype === 'SPIRITUAL' ? `→ Spiritual purpose defines this life
→ INCREASE: D60 (Shashtiamsa) to 2.2-2.5
→ INCREASE: Vimshottari to 2.5
→ DECREASE: D10 to 1.2 (career secondary)
→ FOCUS: D60 deity and karma` :
dominantArchetype === 'CRISIS' ? `→ Crisis/transformation defines this life
→ INCREASE: D60 to 2.2 (karmic intensity)
→ INCREASE: Transit to 1.5 (Saturn returns)
→ FOCUS: Gandanta detection, life-death-rebirth cycles` :
`→ Balanced life with multiple themes
→ Use BASELINE weights
→ Balance all factors equally`}

╔══════════════════════════════════════════════════════════════════════════════╗
║ 📚 UNIVERSAL ASTROLOGICAL PRINCIPLES                                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PRINCIPLE 1: GANDANTA (Karmic Intensity)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
What: Lagna at 0°-3°20' or 26°40'-29°59' of any sign
Meaning: Life-defining transitions, death-rebirth themes

Interpretation:
• If life shows MULTIPLE identity shifts (career changes, near-death, extreme rises/falls) 
  → Gandanta likely PRESENT and should be detected
  → Score +12 to +18 if detected with matching life pattern

• If life shows GRADUAL, STABLE growth
  → Gandanta likely ABSENT
  → Score neutral, don't force detection

• If Gandanta detected but life is stable/conservative
  → Possible mismatch
  → Score -5 (Gandanta unused)

PRINCIPLE 2: NEECHA BHANGA (Rise from Adversity)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
What: Debilitated planet whose debilitation is cancelled
Meaning: Obstacles become strengths, self-made success

Conditions for cancellation:
1. Lord of debilitation sign is exalted or in own house
2. Exalted planet aspects the debilitated planet
3. Debilitated planet conjunct with exalted planet

Interpretation:
• Each confirmed Neecha Bhanga = +10 points
• Look for life evidence:
  - "Overcame poverty/hardship" → Check Mars/Mercury debilitation
  - "Self-made without support" → Multiple Neecha Bhanga likely
  - "Crisis early, success later" → Debilitated planet became strength

• No life evidence = Don't force it, neutral score

PRINCIPLE 3: VARGOTTAMA (Career Amplification)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
What: Planet in same sign in D1 and D10
Meaning: Career strength amplified, consistent purpose

Interpretation:
• +8 points per Vargottama planet
• +12 points if LAGNA LORD is Vargottama

Special meanings:
• Sun Vargottama = Political/authority power (any sign)
• Mars Vargottama = Military/leadership/surgery
• Mercury Vargottama = Communication/writing career
• Jupiter Vargottama = Teaching/wisdom/spiritual guidance
• Saturn Vargottama = Administration/governance

Even "weak" sign Vargottama > strong sign non-Vargottama

PRINCIPLE 4: D60 SHASHTIAMSA (Karma & Purpose)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
What: Divisional chart for soul purpose (changes every 2 minutes)
Meaning: Why this soul took birth

Deity meanings:
• DEVA (divine): Spiritual, wisdom, healing, teaching
• RAKSHASA (demonic): Warrior, protector, transformative, political
• MANUSHYA (human): Service, administration, human connections

Interpretation:
D60 should RESONATE with life, not exactly "match":

• Score 80-95: Deity deeply resonates with life theme
  (e.g., Rakshasa + political power, Deva + spiritual seeking)

• Score 60-79: Deity present but life shows mixed expression

• Score 40-59: Deity contradicts obvious life theme
  (e.g., Manushya + dictatorial absolute power)

Complexity allowed: Spiritual politician (Deva + power) = Valid

PRINCIPLE 5: D9 NAVAMSA 7TH HOUSE (Relationships)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
What: 7th house in D9 = Marriage/partnership quality
Meaning: Nature of closest relationships

INTERPRETATION DEPENDS ON LIFE CONTEXT:

Case A: Happy marriage, spouse supportive, marriage central
→ 7th SHOULD have benefics (Venus, Jupiter, well-placed)
→ Empty 7th = weakness
→ Malefics (Saturn, Ketu) in 7th = problems

Case B: Separated marriage, spouse absent, single life
→ 7th should be WEAK or have malefics
→ Empty 7th = GOOD (no attachment)
→ Ketu in 7th = GOOD (detachment)
→ Saturn in 7th = GOOD (delay/separation)
→ Venus/Jupiter in 7th = CONTRADICTION

Case C: Multiple marriages/relationships
→ 7th lord afflicted or multiple planets in 7th
→ Rahu in 7th = multiplicity

DON'T assume "benefic in 7th = good" blindly!
Analyze based on ACTUAL relationship history.

PRINCIPLE 6: NAKSHATRA (Personality Core)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
What: Lagna nakshatra = Core personality imprint

Key nakshatras:
• MULA (Ketu): Root transformation, investigative, destroys and rebuilds
• JYESHTHA (Mercury): Eldest, leadership, authority, protection
• ANURADHA (Saturn): Devotion, divine will, loyalty, Radha energy
• REVATI (Mercury): Completion, nourishment, protection
• ASHWINI (Ketu): Healing, initiation, speed, pioneer
• MAGHA (Ketu): Regal, ancestral, throne, tradition

Interpretation:
Nakshatra should MATCH personality:
• Mula + investigative/destroyer personality = Strong
• Mula + stable administrator = Possible mismatch
• Jyeshtha + natural authority = Strong
• Jyeshtha + follower personality = Mismatch

${offsetMinutes > 120 ? `╔══════════════════════════════════════════════════════════════════════════════╗
║ PHASE A: MACRO SWEEP (Offset > 2 Hours)                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
PRIORITY: Identify Lagna and Moon sign only

• IGNORE D9, D10, D60 precision (noise at this offset)
• FOCUS: Tattwa (element) vs Forensic physical traits
• MATCH: Biological markers to lagna element
• ALLOW: "Mediocre" charts if tattwa matches perfectly
• Gandanta detection OPTIONAL at this phase (too broad)` : offsetMinutes > 15 ? `╔══════════════════════════════════════════════════════════════════════════════╗
║ PHASE B: MESO SWEEP (Offset 15-120 mins)                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝
PRIORITY: Navamsa (D9) and Dasamsa (D10) hunting

• APPLY all 6 principles above
• Gandanta detection MANDATORY
• Neecha Bhanga identification MANDATORY
• Vargottama check MANDATORY
• D60 deity analysis MANDATORY
• D9 7th house analysis (context-aware)
• VERIFY: Vimshottari timing with events

ELIMINATE: Only if chart completely fails life narrative` : `╔══════════════════════════════════════════════════════════════════════════════╗
║ PHASE C: MICRO SWEEP (Offset < 15 mins)                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
PRIORITY: Exact D60/D150 alignment

• ALL 6 principles with maximum depth
• Vimshottari down to Pratyantar/Sookshma
• D150 Nadi Amsha for seconds precision
• ALL Vargottama planets identified
• Final judgment: Mathematical precision`}

╔══════════════════════════════════════════════════════════════════════════════╗
║ 📊 EVENT IMPORTANCE                                                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

${getEventImportanceSummary(events)}

CRITICAL events = 5x weight in narrative
HIGH events = 3x weight
MEDIUM events = 2x weight
LOW events = 1x weight

Use for CONTEXT, not mechanical scoring.

╔══════════════════════════════════════════════════════════════════════════════╗
║ ⚖️ ANTI-BIAS PROTOCOL                                                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

1. TOTAL NEUTRALITY: All times equally likely initially
2. ZERO TENTATIVE BIAS: No favoritism toward "known" or "original" time
3. DATA-DRIVEN: Astrological alignment is sole criterion
4. DEGREE SENSITIVITY: 0° Scorpio ≠ 15° Scorpio ≠ 29° Scorpio
5. NO SIGN BIAS: Scorpio not automatically better than Libra
6. CONTEXT MATTERS: Empty D9 7th can be GOOD or BAD depending on life

╔══════════════════════════════════════════════════════════════════════════════╗
║ 📦 CANDIDATE DATA                                                               ║
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
║ 🎯 REQUIRED OUTPUT FORMAT                                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

For EACH candidate, provide DEEP ANALYSIS:

┌─────────────────────────────────────────────────────────────────────────────┐
│ CANDIDATE: [HH:MM:SS]                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ PRINCIPLES ANALYSIS:                                                        │
│                                                                             │
│ 1. GANDANTA DETECTION                                                       │
│    Degree: [X°XX'XX"] [Sign]                                               │
│    Status: □ Gandanta present (0-3°20' or 26°40'-29°59')                   │
│            □ Not Gandanta                                                  │
│    Life Pattern Match: [Describe life crises/shifts]                       │
│    Score Impact: [+15, +12, 0, or -5]                                      │
│                                                                             │
│ 2. NEECHA BHANGA IDENTIFICATION                                             │
│    Debilitated Planets Found: [List each]                                  │
│    Cancellation Verified: [How cancelled?]                                 │
│    Life Evidence: [Overcame adversity?]                                    │
│    Score Impact: [+10 per confirmed yoga]                                  │
│                                                                             │
│ 3. VARGOTTAMA CHECK                                                         │
│    Planets Vargottama: [List with signs]                                   │
│    Lagna Lord Vargottama: □ Yes □ No                                       │
│    Career Amplification: [Which planets = career boost]                    │
│    Score Impact: [+8 per planet, +12 if lagna lord]                        │
│                                                                             │
│ 4. D60 SHASHTIAMSA KARMA                                                    │
│    D60 Ascendant: [Sign]                                                   │
│    Deity: □ Deva □ Rakshasa □ Manushya                                     │
│    Deity Meaning: [Spiritual/Warrior/Service]                              │
│    Life Resonance: [How deity matches life theme]                          │
│    Score: [80-95 = strong, 60-79 = moderate, 40-59 = weak]                 │
│                                                                             │
│ 5. D9 NAVAMSA 7TH HOUSE (Context-Aware)                                     │
│    Relationship Context: [Happy/Separated/Multiple/None]                   │
│    7th House Status: [Empty/Planets/Which planets]                         │
│    Interpretation: [Based on life context, not generic]                    │
│    Score: [0-100 based on alignment with ACTUAL life]                      │
│                                                                             │
│ 6. NAKSHATRA PERSONALITY                                                    │
│    Lagna Nakshatra: [Name]                                                 │
│    Nakshatra Lord: [Planet]                                                │
│    Personality Match: [How it fits the person]                             │
│    Score Impact: [+5 to +10 if strong match]                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ METHOD SCORES (0-100):                                                      │
│ • Vimshottari:     [score]  (base weight: 2.2)                            │
│ • D150 Nadi:       [score]  (base weight: 2.0)                            │
│ • KP Sub-Lord:     [score]  (base weight: 2.0)                            │
│ • D9 Navamsa:      [score]  (base weight: [ADJUSTED based on archetype])  │
│ • D10 Dasamsa:     [score]  (base weight: [ADJUSTED based on archetype])  │
│ • D60 Shashtiamsa: [score]  (base weight: [ADJUSTED based on archetype])  │
│ • Transit:         [score]  (base weight: 1.2)                            │
│ • Kalachakra:      [score]  (base weight: 1.2)                            │
│ • Shadbala:        [score]  (base weight: 0.5)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ WEIGHT ADJUSTMENT JUSTIFICATION:                                            │
│ [Explain why weights changed based on life archetype]                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ PRINCIPLES BONUS/PENALTY:                                                   │
│ • Gandanta match: +[points]                                                │
│ • Neecha Bhanga: +[points]                                                 │
│ • Vargottama: +[points]                                                    │
│ • Nakshatra match: +[points]                                               │
│ • Gandanta mismatch: -[points]                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ CALCULATION:                                                                │
│ Base Weighted Score = Σ(method_score × weight) / Σ(weights)                │
│ Final Score = Base Score + Principles Bonuses - Penalties                  │
│                                                                             │
│ FINAL SCORE: [0-100]                                                        │
│ VERDICT: □ KEEP (≥70)  □ ELIMINATE (<60)  □ BORDERLINE (60-69)             │
│ KEY REASON: [One profound astrological insight]                             │
└─────────────────────────────────────────────────────────────────────────────┘

DETAILED REASONING (in markdown code block):
\`\`\`
[Deep astrological analysis showing mastery]
[How principles apply to THIS specific life]
[Why score was given with specific evidence]
\`\`\`

╔══════════════════════════════════════════════════════════════════════════════╗
║ 🏆 FINAL OUTPUT                                                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

<FINAL_SCORES>
[
  { "time": "HH:MM:SS", "score": 85, "reason": "Gandanta + Neecha Bhanga + D60 Rakshasa matches warrior leader archetype" },
  { "time": "HH:MM:SS", "score": 72, "reason": "Strong D60 but missed Vargottama Sun" }
]
</FINAL_SCORES>

TOP_SURVIVORS: [${survivorsNeeded} best times, comma-separated]

⚠️  REMEMBER:
• You are a MASTER, not a checkbox ticker
• Principles > Mechanical rules
• Context determines interpretation
• Show DEEP understanding, not surface scanning`;
}

/**
 * Get event importance summary
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

export { WEIGHT_GUIDELINES, ASTROLOGICAL_PRINCIPLES };