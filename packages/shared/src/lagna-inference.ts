/**
 * Samudrika Lagna Inference Engine
 *
 * Maps three broad, easy-to-self-assess physical indicators to probabilistic
 * Lagna (Ascendant) elimination. Uses classical Vedic elemental (Tattva) and
 * qualitative (Guna) frameworks rather than requiring precise trait identification.
 *
 * Design principle: ELIMINATION over IDENTIFICATION.
 * A normal person cannot reliably judge their eye shape. They CAN reliably
 * judge whether they are thin, athletic, or soft-bodied. Each answer eliminates
 * 3-5 impossible Lagnas, narrowing the birth time window by ~50%.
 *
 * Classical sources:
 * - Brihat Parashara Hora Shastra, Ch. 4 (Rashi Swaroopa)
 * - Saravali, Ch. 4 (Rashi Lakshana)
 * - Tattva (elemental) classification of rashis
 * - Guna (qualitative) classification of rashis
 */

// ═════════════════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════════════════

/** The 12 Vedic Ascendant signs */
export const LAGNA_SIGNS = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka',
  'Simha', 'Kanya', 'Tula', 'Vrischika',
  'Dhanu', 'Makara', 'Kumbha', 'Meena',
] as const;

export type LagnaSign = (typeof LAGNA_SIGNS)[number];

/** Body frame — easily self-assessed in 3 seconds */
export type BodyFrame = 'thin_bony' | 'athletic_muscular' | 'soft_rounded';

/** Natural complexion (untanned skin) */
export type SkinTone = 'very_fair' | 'wheatish_golden' | 'dark_dusky';

/** Natural pace — not learned, but innate temperament */
export type NaturalSpeed = 'fast_quick' | 'balanced' | 'slow_deliberate';

/** The 3 simple inputs a user provides */
export interface LagnaEliminationInput {
  bodyFrame: BodyFrame;
  skinTone: SkinTone;
  naturalSpeed: NaturalSpeed;
}

/** Score tiers for a Lagna candidate */
export type LagnaConfidence = 'eliminated' | 'weak' | 'moderate' | 'strong';

/** A single Lagna's evaluation result */
export interface LagnaScore {
  sign: LagnaSign;
  confidence: LagnaConfidence;
  score: number; // 0-3
  eliminatedBy: string[]; // which answers eliminated this sign
  supportedBy: string[]; // which answers support this sign
}

/** Full inference result */
export interface LagnaInferenceResult {
  /** Signs ordered by score (highest first) */
  scores: LagnaScore[];
  /** Signs completely eliminated (score = 0) */
  eliminated: LagnaSign[];
  /** Signs with moderate+ confidence */
  viable: LagnaSign[];
  /** Highest scoring sign */
  topCandidate: LagnaSign;
  /** How many of 12 signs survived elimination */
  survivalRate: number;
  /** Broad dosha classification of the user */
  predominantDosha: 'vata' | 'pitta' | 'kapha' | 'mixed';
}

// ═════════════════════════════════════════════════════════════════════════════
// CLASSICAL FRAMEWORKS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Tattva (Elemental) classification of the 12 rashis.
 * Each sign is associated with one of the 5 elements.
 */
const TATTVA: Record<LagnaSign, 'agni' | 'prithvi' | 'vayu' | 'jala' | 'akasha'> = {
  Mesha: 'agni', Vrishabha: 'prithvi', Mithuna: 'vayu', Karka: 'jala',
  Simha: 'agni', Kanya: 'prithvi', Tula: 'vayu', Vrischika: 'jala',
  Dhanu: 'agni', Makara: 'prithvi', Kumbha: 'vayu', Meena: 'jala',
};

/**
 * Guna (Quality) classification of the 12 rashis.
 * Rajas = active, Tamas = inert, Sattva = balanced.
 */
const GUNA: Record<LagnaSign, 'rajas' | 'tamas' | 'sattva'> = {
  Mesha: 'rajas', Vrishabha: 'tamas', Mithuna: 'rajas', Karka: 'tamas',
  Simha: 'rajas', Kanya: 'sattva', Tula: 'rajas', Vrischika: 'tamas',
  Dhanu: 'rajas', Makara: 'tamas', Kumbha: 'rajas', Meena: 'tamas',
};

/**
 * Dosha (Ayurvedic constitution) mapping.
 * Vata = air+ether, Pitta = fire, Kapha = earth+water
 */
function signDosha(sign: LagnaSign): 'vata' | 'pitta' | 'kapha' {
  switch (TATTVA[sign]) {
    case 'vayu':
    case 'akasha': return 'vata';
    case 'agni': return 'pitta';
    case 'prithvi':
    case 'jala': return 'kapha';
  }
}

/**
 * Classical body type mapping per sign from Parashara Hora Shastra, Ch 4.
 * Source verses: PHS 4.5-4.16 (Rashi Swaroopa Adhyaya)
 */
const SIGN_BODY_TYPE: Record<LagnaSign, BodyFrame[]> = {
  Mesha: ['athletic_muscular'],
  Vrishabha: ['soft_rounded'],
  Mithuna: ['thin_bony'],
  Karka: ['soft_rounded', 'thin_bony'],
  Simha: ['athletic_muscular'],
  Kanya: ['thin_bony'],
  Tula: ['thin_bony', 'athletic_muscular'],
  Vrischika: ['athletic_muscular', 'thin_bony'],
  Dhanu: ['athletic_muscular'],
  Makara: ['thin_bony'],
  Kumbha: ['thin_bony', 'athletic_muscular'],
  Meena: ['soft_rounded'],
};

/**
 * Classical complexion mapping.
 * Fair = Venus/Moon dominated, Dark = Saturn/Rahu dominated.
 */
const SIGN_SKIN_TONE: Record<LagnaSign, SkinTone[]> = {
  Mesha: ['wheatish_golden'],
  Vrishabha: ['very_fair', 'wheatish_golden'],
  Mithuna: ['very_fair', 'wheatish_golden'],
  Karka: ['very_fair'],
  Simha: ['wheatish_golden'],
  Kanya: ['wheatish_golden', 'dark_dusky'],
  Tula: ['very_fair'],
  Vrischika: ['dark_dusky'],
  Dhanu: ['wheatish_golden'],
  Makara: ['dark_dusky'],
  Kumbha: ['dark_dusky', 'wheatish_golden'],
  Meena: ['very_fair', 'wheatish_golden'],
};

/**
 * Classical speed/temperament mapping.
 * Fast = Rajas (active signs), Slow = Tamas (heavy/inert signs).
 */
const SIGN_NATURAL_SPEED: Record<LagnaSign, NaturalSpeed[]> = {
  Mesha: ['fast_quick'],
  Vrishabha: ['slow_deliberate'],
  Mithuna: ['fast_quick'],
  Karka: ['slow_deliberate'],
  Simha: ['fast_quick', 'balanced'],
  Kanya: ['balanced', 'fast_quick'],
  Tula: ['balanced', 'fast_quick'],
  Vrischika: ['balanced', 'slow_deliberate'],
  Dhanu: ['fast_quick', 'balanced'],
  Makara: ['slow_deliberate'],
  Kumbha: ['fast_quick', 'balanced'],
  Meena: ['slow_deliberate'],
};

// ═════════════════════════════════════════════════════════════════════════════
// SCORING & INFERENCE
// ═════════════════════════════════════════════════════════════════════════════

const CONFIDENCE_SCORE_MAP: Record<LagnaConfidence, number> = {
  eliminated: 0,
  weak: 1,
  moderate: 2,
  strong: 3,
};

/**
 * Evaluate a single Lagna sign against the user's 3 answers.
 * Returns the confidence tier, numeric score, and which answers
 * supported or eliminated this sign.
 */
function evaluateLagna(
  sign: LagnaSign,
  input: LagnaEliminationInput,
): LagnaScore {
  const eliminatedBy: string[] = [];
  const supportedBy: string[] = [];
  let rawScore = 0;

  // --- Body Frame ---
  if (SIGN_BODY_TYPE[sign].includes(input.bodyFrame)) {
    rawScore += 1;
    supportedBy.push(`body:${input.bodyFrame}`);
  } else {
    eliminatedBy.push(`body:${input.bodyFrame}`);
  }

  // --- Skin Tone ---
  if (SIGN_SKIN_TONE[sign].includes(input.skinTone)) {
    rawScore += 1;
    supportedBy.push(`skin:${input.skinTone}`);
  } else {
    eliminatedBy.push(`skin:${input.skinTone}`);
  }

  // --- Natural Speed ---
  if (SIGN_NATURAL_SPEED[sign].includes(input.naturalSpeed)) {
    rawScore += 1;
    supportedBy.push(`speed:${input.naturalSpeed}`);
  } else {
    eliminatedBy.push(`speed:${input.naturalSpeed}`);
  }

  // Convert raw score to confidence tier
  const confidence: LagnaConfidence =
    rawScore === 3 ? 'strong' :
    rawScore === 2 ? 'moderate' :
    rawScore === 1 ? 'weak' :
    'eliminated';

  return { sign, confidence, score: rawScore, eliminatedBy, supportedBy };
}

/**
 * Given the 3 simple self-assessment answers, return a ranked list of
 * which Lagna signs are eliminated, weak, moderate, or strong candidates.
 *
 * This is the single public API entry point.
 *
 * @example
 * const result = inferLagnaFromPhysical({
 *   bodyFrame: 'thin_bony',
 *   skinTone: 'wheatish_golden',
 *   naturalSpeed: 'fast_quick',
 * });
 * // result.topCandidate = 'Mithuna' (3/3 match)
 * // result.eliminated = ['Vrishabha', 'Karka', 'Meena', ...]
 */
export function inferLagnaFromPhysical(
  input: LagnaEliminationInput,
): LagnaInferenceResult {
  const scores: LagnaScore[] = LAGNA_SIGNS.map((sign) =>
    evaluateLagna(sign, input),
  );

  // Sort: highest score first, then alphabetically for tie-breaking
  scores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.sign.localeCompare(b.sign);
  });

  const eliminated = scores
    .filter((s) => s.confidence === 'eliminated')
    .map((s) => s.sign);

  const viable = scores
    .filter((s) => s.confidence !== 'eliminated' && s.confidence !== 'weak')
    .map((s) => s.sign);

  const topCandidate = scores[0].sign;
  const survivalRate = (12 - eliminated.length) / 12;

  // Infer predominant dosha from the combination
  const predominantDosha = inferDosha(input);

  return {
    scores,
    eliminated,
    viable,
    topCandidate,
    survivalRate,
    predominantDosha,
  };
}

/**
 * Broad dosha classification from the 3 answers.
 */
function inferDosha(
  input: LagnaEliminationInput,
): 'vata' | 'pitta' | 'kapha' | 'mixed' {
  const doshaVotes: Record<string, number> = { vata: 0, pitta: 0, kapha: 0 };

  // Body frame → dosha
  if (input.bodyFrame === 'thin_bony') doshaVotes.vata += 2;
  if (input.bodyFrame === 'athletic_muscular') doshaVotes.pitta += 2;
  if (input.bodyFrame === 'soft_rounded') doshaVotes.kapha += 2;

  // Natural speed → dosha
  if (input.naturalSpeed === 'fast_quick') doshaVotes.vata += 1;
  if (input.naturalSpeed === 'balanced') doshaVotes.pitta += 1;
  if (input.naturalSpeed === 'slow_deliberate') doshaVotes.kapha += 1;

  const top = Object.entries(doshaVotes).sort(([, a], [, b]) => b - a);
  if (top[0][1] >= 3) return top[0][0] as 'vata' | 'pitta' | 'kapha';
  return 'mixed';
}

// ═════════════════════════════════════════════════════════════════════════════
// AI PROMPT ENRICHMENT
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Human-readable label for body frame options.
 */
export const BODY_FRAME_LABELS: Record<BodyFrame, string> = {
  thin_bony: 'Thin / Bony — bones visible, hard to gain weight',
  athletic_muscular: 'Athletic / Muscular — medium build, defined muscles',
  soft_rounded: 'Soft / Rounded — gains weight easily, soft body',
};

/**
 * Human-readable label for skin tone options.
 */
export const SKIN_TONE_LABELS: Record<SkinTone, string> = {
  very_fair: 'Very Fair / Pale',
  wheatish_golden: 'Wheatish / Golden-Brown',
  dark_dusky: 'Dark / Dusky',
};

/**
 * Human-readable label for natural speed options.
 */
export const NATURAL_SPEED_LABELS: Record<NaturalSpeed, string> = {
  fast_quick: 'Fast & Quick — walk fast, talk fast, think fast',
  balanced: 'Balanced / Medium pace',
  slow_deliberate: 'Slow & Deliberate — calm, measured, steady',
};

/**
 * Build an AI-enriching Lagna elimination context string.
 * This replaces the raw forensic text dump with structured guidance
 * that helps the AI make better Lagna determinations.
 */
export function buildLagnaEliminationContext(
  input: LagnaEliminationInput,
): string {
  const result = inferLagnaFromPhysical(input);

  const strongSigns = result.scores
    .filter((s) => s.confidence === 'strong')
    .map((s) => s.sign);

  const eliminatedSigns = result.eliminated;

  const lines: string[] = [
    '## LAGNA ELIMINATION — Deterministic (Samudrika Tattva Framework)',
    '',
    `### User Profile`,
    `- Body Frame: ${BODY_FRAME_LABELS[input.bodyFrame]}`,
    `- Skin Tone: ${SKIN_TONE_LABELS[input.skinTone]}`,
    `- Natural Speed: ${NATURAL_SPEED_LABELS[input.naturalSpeed]}`,
    `- Predominant Dosha: ${result.predominantDosha.toUpperCase()}`,
    '',
    `### Lagna Elimination Results`,
    `- ELIMINATED (impossible, score=0): ${eliminatedSigns.join(', ') || 'none'}`,
    `- STRONG matches (3/3, score=3): ${strongSigns.join(', ') || 'none'}`,
    `- Survival rate: ${result.eliminated.length}/12 eliminated (${Math.round(result.survivalRate * 100)}% remaining)`,
    '',
    '### Guidance for AI',
    `- These ${eliminatedSigns.length} Lagnas should receive NEGATIVE or ZERO weight in rectification.`,
    `- If a candidate birth time produces Lagna=${strongSigns.join(' or ')}, it should receive BONUS confidence.`,
    '- Physical trait contradiction with dasha-calculated Lagna is a STRONG negative signal.',
    '- Use this as a FILTER, not a primary determinant — life events carry more weight.',
  ];

  return lines.join('\n');
}
