/**
 * Batch Prompt Generator
 *
 * Generates AI prompts for Stage 2 batch tournament analysis.
 * Creates comprehensive prompts with forensic context and candidate data.
 * 
 * 🔱 AI-DRIVEN FLEXIBLE WEIGHTING SYSTEM:
 * AI has FULL FREEDOM to adjust method weights based on:
 * - User's event importance selections
 * - Data quality for each method
 * - Case-specific context
 */

import { CandidateDataPackage } from '../types.js';
import { LifeEvent, ForensicTraits } from '../../../types/index.js';
import { formatLifeEventForAI } from './life-event-formatter.js';
import { buildForensicContext } from './forensic-context.js';
import { randomSort } from '../../utils/index.js';

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
 * @param forensicTraits - User's forensic traits
 * @param batchNumber - Current batch number
 * @param totalBatches - Total number of batches
 * @param survivorsNeeded - Number of survivors to select
 * @param tentativeTime - Optional tentative time for blind evaluation
 * @returns Complete AI prompt string
 */
export function getBatchPrompt(
  candidates: CandidateDataPackage[],
  events: LifeEvent[],
  forensicTraits: ForensicTraits,
  batchNumber: number,
  totalBatches: number,
  survivorsNeeded: number,
  spouseData?: any
): string {
  const eventsText = events.map(formatLifeEventForAI).join('\n');
  const forensicContext = buildForensicContext(forensicTraits);
  const spouseText = spouseData ? `SPOUSE DATA: ${JSON.stringify(spouseData)}` : 'SPOUSE DATA: N/A';

  // Anti-bias: Shuffle candidate order in every batch to prevent positional bias
  const shuffledCandidates = randomSort(candidates);

  return `BIRTH TIME RECTIFICATION - STAGE 2 (Batch ${batchNumber}/${totalBatches})

════════════════════════════════════════════════════════════════════════════════
🎯 AI-DRIVEN FLEXIBLE SCORING SYSTEM
════════════════════════════════════════════════════════════════════════════════

YOU HAVE FULL FREEDOM TO ADJUST WEIGHTS! Here are REFERENCE weights - you MAY change them:

┌─────────────────────────────────────────────────────────────────────────────┐
│  METHOD          │ REFERENCE │  PRECISION    │ WHEN TO INCREASE           │
│                  │  WEIGHT   │               │                            │
├──────────────────┼───────────┼───────────────┼────────────────────────────┤
│  D150 Nadi       │   2.0     │  48 seconds   │ Critical events, good data │
│  KP Sub-Lord     │   2.0     │  seconds      │ Marriage, career events    │
│  Vimshottari     │   1.8     │  hours        │ All timing, strong match   │
│  Varga (D60)     │   1.7     │  2 minutes    │ Karma events, D60 clear    │
│  Transit         │   1.5     │  days         │ Double transit confirmed   │
│  Kalachakra      │   1.2     │  days         │ Cross-verification         │
│  Shadbala        │   1.0     │  N/A          │ Weak/strong planets        │
│  AI Judgment     │   0.5     │  N/A          │ Pattern recognition        │
└─────────────────────────────────────────────────────────────────────────────┘

WEIGHT ADJUSTMENT RULES:
• If user marked event as CRITICAL → Give MORE weight to precision methods (Nadi, KP)
• If D60 data is incomplete → REDUCE Varga weight
• If no spouse data → IGNORE spouseD9 method
• If forensic traits don't match → INCREASE forensic penalty
• YOU decide the final weights for each candidate!

════════════════════════════════════════════════════════════════════════════════
📊 USER'S EVENT IMPORTANCE SELECTIONS
════════════════════════════════════════════════════════════════════════════════

${getEventImportanceSummary(events)}

⚠️ User's importance selections MUST be respected in your scoring!
   - CRITICAL events = 5x weight in final score
   - HIGH events = 3x weight
   - MEDIUM events = 2x weight
   - LOW events = 1x weight

════════════════════════════════════════════════════════════════════════════════
⚖️ ANTI-BIAS PROTOCOL:
════════════════════════════════════════════════════════════════════════════════

1. TOTAL NEUTRALITY: Treat all provided times as equally likely candidates.
2. ZERO TENTATIVE BIAS: Do not favor times just because they are closer to the "original" time.
3. DATA-DRIVEN SCORE: Your score must reflect astrological alignment only.
4. NARRATIVE PRIMACY: The user's "SITUATIONAL NARRATIVE" is the ultimate source of truth.
5. FORENSIC CORRELATION: Verify Varga markers align with PHYSICAL and PSYCHOGRAPHIC DNA.

════════════════════════════════════════════════════════════════════════════════
⚠️ CRITICAL GOD-TIER RULES:
════════════════════════════════════════════════════════════════════════════════

1. USE PRE-CALCULATED DATA ONLY. Do not compute positions.
2. FUNCTIONAL NATURE MATTERS: A planet ruling 6/8/12 is malefic for this Ascendant.
3. DIGNITY MATTERS: Exalted/Own planets give strong results; Debilitated give mixed/weak.
4. HOUSE LORDSHIP IS KEY: Event MUST activate relevant house lords.
5. BIO-VEDIC MAPPING: Treat Forensic Traits as "Biological Anchors".
6. MAHAKALA PRECISION:
   - TATWA SHUDDHI: Verify Element aligns with user's nature.
   - KUNDA LAGNA: 'Matches Moon' = strong structural indicator.
   - BOUNDARY LOCKS: Pay special attention - truth often lies at boundaries.

════════════════════════════════════════════════════════════════════════════════

    TASK: Rank ${candidates.length} candidates using your EXPERT ASTROLOGICAL JUDGMENT.
    
    For EACH candidate, you MUST:
    1. Calculate score for EACH method (0-100)
    2. Apply YOUR chosen weights (can differ per candidate!)
    3. Provide reasoning for weight adjustments
    4. Give final weighted score

LIFE EVENTS:
${eventsText}

${forensicContext}
${spouseText}

CANDIDATES WITH ENRICHED VEDIC DATA(100 % Mathematical Matrix):
${shuffledCandidates.map(c => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CANDIDATE: ${c.time}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PANCHANGA: Day=${c.panchanga?.vara} | Tithi=${c.panchanga?.tithi} | Yoga=${c.panchanga?.yoga} | Karana=${c.panchanga?.karana}
SPECIAL POINTS: AL (Arudha Lagna)=${c.specialPoints?.AL.sign} | UL (Upapada Lagna)=${c.specialPoints?.UL.sign}
LAGNA (Ascendant): ${c.ascendant.sign} ${c.ascendant.degree} (${c.ascendant.nakshatra})
► ELEMENT: ${getSignElement(c.ascendant.sign)} | MODALITY: ${getSignModality(c.ascendant.sign)} | LORD: ${c.houseLords[1]}
${c.sandhiZones?.length ? `⚠️ SANDHI WARNING: ${c.sandhiZones.join(' | ')}\n(NOTE: If Ascendant is < 1° or > 29°, you MUST evaluate the adjacent sign as a potential candidate.)` : ''}

PLANETARY MATRIX (Verified Swiss Eph Positions):
${Object.entries(c.planets).map(([name, p]) => {
    const caps = name.charAt(0).toUpperCase() + name.slice(1);
    const sav = c.ashtakavarga?.SAVSigns?.[p.sign] || '?';
    const aspects = p.aspects?.filter((a: any) => a.isHit).map((a: any) => `${a.type}→${a.targetPlanet || 'H' + a.targetHouse}`).join(', ') || 'None';
    const avastha = p.avastha || 'Unknown';
    const deity = p.d60Deity || 'Unknown';
    const ikp = p.ishtaKashtaPhala ? `${p.ishtaKashtaPhala.ishta}/${p.ishtaKashtaPhala.kashta}` : '?';
    const sambandha = p.compoundDignity || 'Sama';
    const sh = p.shadbalaBreakdown;
    const shStr = sh ? `Sum:${sh.total} (S:${sh.sthana} D:${sh.dig} K:${sh.kaala})` : '?';
    const statusFlags: string[] = [];
    if (p.isRetro) statusFlags.push('R');
    if (p.isCombust) statusFlags.push('C');
    const statusStr = statusFlags.length > 0 ? `[${statusFlags.join(',')}]` : '';
    return `│ ${caps.padEnd(7)}: ${p.sign.padEnd(10)} | H${String(p.house).padEnd(2)} | ${avastha.padEnd(7)} | ${deity.padEnd(12)} | I/K:${ikp.padEnd(10)} | ${sambandha.padEnd(9)} | Sh:${shStr.padEnd(25)} | SAV:${String(sav).padEnd(2)} ${statusStr.padEnd(5)} | ${aspects}`;
  }).join('\n')}

${c.vargaDegrees ? `VARGA DEGREES (Forensic Resolution):
│ D9 Navamsa: Asc=${c.vargaDegrees.D9?.Ascendant} | ${Object.entries(c.vargaDegrees.D9 || {}).filter(([k]) => k !== 'Ascendant').map(([k, v]) => `${k.substring(0, 2)}=${v}`).join(' ')}
│ D10 Dasamsa: Asc=${c.vargaDegrees.D10?.Ascendant} | ${Object.entries(c.vargaDegrees.D10 || {}).filter(([k]) => k !== 'Ascendant').map(([k, v]) => `${k.substring(0, 2)}=${v}`).join(' ')}
│ D60 Shashtyamsa: Asc=${c.vargaDegrees.D60?.Ascendant}` : ''}

${c.d60Planets ? `D60 PLANETARY DEITIES (The Quantum Decision Layer):
${Object.entries(c.d60Planets).map(([name, data]) => `│ ${name.padEnd(7)}: ${data.sign} ${data.degree} | DEITY: ${data.deity}`).join('\n')}` : ''}

${c.yogas && c.yogas.length > 0 ? `YOGAS DETECTED: ${c.yogas.map((y: any) => `${y.name} (${y.level})`).join(', ')}` : ''}

VIMSHOTTARI DASHA PERIODS (MD-AD-PD):
${c.vimshottariDasha.slice(0, 100).map(d => `  • ${d.maha}/${d.antar}/${d.pratyantar} : ${d.startEnd}`).join('\n')}
${c.yoginiDasha ? `\nYOGINI DASHA: ${c.yoginiDasha.slice(0, 20).map(d => `${d.lord} (${d.startEnd})`).join(' → ')}` : ''}

${c.transitData ? `TRANSITS & DASHAS ON EVENTS (Full Matrix):
${Object.entries(c.transitData).map(([date, t]: [string, any]) =>
    `│ [${date}]: Dasha=${t.dasha}
│   Transits: ${Object.entries(t.planets || {}).map(([p, pos]) => `${p}:${pos}`).join(' | ')}
│   Signatures: ${t.signatures?.join(', ') || 'None'}`).join('\n')}` : ''}
${c.vedicSignals ? `VEDIC HIGH-SIGNALS:
│ Vargottama: ${c.vedicSignals.vargottama?.join(', ') || 'None'}
│ Pushkar: ${c.vedicSignals.pushkar?.join(', ') || 'None'}
│ Tatwa Shuddhi: ${c.vedicSignals.tatwa?.name} (${c.vedicSignals.tatwa?.element}) | Auspicious: ${c.vedicSignals.tatwa?.isAuspicious}
│ Kunda Lagna: ${c.vedicSignals.kundaLagna?.sign} ${c.vedicSignals.kundaLagna?.degree.toFixed(2)}° | Matches Moon: ${c.vedicSignals.kundaLagna?.matchesMoon ? 'YES 🔥' : 'NO'}
│ Parivartana: ${c.vedicSignals.parivartana?.map((ex: any) => `L${ex.houses[0]}↔L${ex.houses[1]}`).join(', ') || 'None'}` : ''}
${c.kalachakraDasha ? `├ KALACHAKRA DASHA (Savya/Apasavya):
${c.kalachakraDasha.slice(0, 8).map(k => `│ ${k.sign} (${k.lord}): ${k.durationYears.toFixed(1)}y [${k.kalachakraType}]`).join('\n')}` : ''}
${c.shadbalaSummary ? `├ SHADBALA SUMMARY (6-Source Strength):
│ Strongest: ${c.shadbalaSummary.strongestPlanet?.toUpperCase()} | Weakest: ${c.shadbalaSummary.weakestPlanet?.toUpperCase()} | Avg: ${c.shadbalaSummary?.averageStrength}
│ Strong Benefics: ${c.shadbalaSummary.benifics?.strong?.join(', ') || 'None'} | Strong Malefics: ${c.shadbalaSummary.malefics?.strong?.join(', ') || 'None'}` : ''}
${c.nadiData ? `├ D150 NADI AMSHA (48-Second Precision DNA):
│ Ascendant: ${c.nadiData.ascendant?.nadiName} | Deity: ${c.nadiData.ascendant?.deity} | Phala: ${c.nadiData.ascendant?.phala}
│ Moon: ${c.nadiData.moon?.nadiName} | Deity: ${c.nadiData.moon?.deity} | Karmic: ${c.nadiData.moon?.karmicSignificance}` : ''}
${c.spouseD9Verification ? `├ SPOUSE D9 VERIFICATION:
│ Score: ${c.spouseD9Verification.score}/100 | Verified: ${c.spouseD9Verification.verified ? 'YES' : 'NO'} | Confidence: ${c.spouseD9Verification.confidence?.toUpperCase()}
│ Matches: ${c.spouseD9Verification.matches?.map((m: any) => m.description).join('; ') || 'None'}` : ''}
${c.gandantaAnalysis && c.gandantaAnalysis.severity !== 'none' ? `├ ⚠️ GANDANTA DETECTION (Karmic Knot):
│ Lagna Gandanta: ${c.gandantaAnalysis.isLagnaGandanta ? 'YES' : 'NO'} | Moon Gandanta: ${c.gandantaAnalysis.isMoonGandanta ? 'YES' : 'NO'}
│ Severity: ${c.gandantaAnalysis.severity.toUpperCase()} | Distance: ${c.gandantaAnalysis.distanceToGandanta.toFixed(3)}°
│ Type: ${c.gandantaAnalysis.lagnaGandantaType || c.gandantaAnalysis.moonGandantaType || 'N/A'}
│ ${c.gandantaAnalysis.interpretation.substring(0, 150)}...` : ''}
${c.pakshiAnalysis ? `├ PANCHA-PAKSHI SHASTRA (Five Birds System):
│ Ruling Bird: ${c.pakshiAnalysis.rulingBird.name} (${c.pakshiAnalysis.rulingBird.element}) | Strength: ${c.pakshiAnalysis.birdStrength.toUpperCase()}
│ Sanskrit: ${c.pakshiAnalysis.rulingBird.sanskritName} | Quality: ${c.pakshiAnalysis.birthTimeQuality.substring(0, 60)}...
│ Dominant Activities: ${c.pakshiAnalysis.activityStrengths.slice(0, 3).join(', ')}` : ''}
${c.vimsopakaBala ? `├ VIM SOPAKA BALA (Total Shodashvarga Strength - 0-20):
│ ${Object.entries(c.vimsopakaBala).map(([n, s]) => `${n}:${s}`).join(' | ')}` : ''}
${c.chalitDiscrepancies?.length ? `├ BHAVA CHALIT DISCREPANCIES:
${c.chalitDiscrepancies.map((d: any) => `│ ${d.planet}: Rashi-H${d.rasiHouse} ↔ Chalit-H${d.chalitHouse}`).join('\n')}` : ''}
${c.spouseMatch ? `├ SPOUSE SYNASTRY MATCH:
│ ${c.spouseMatch.reason} (Synastry Score: ${c.spouseMatch.score})` : ''}
${c.lifecycleShifts?.length ? `├ LIFECYCLE CHRONOLOGY (Major Sign Ingresses):
${c.lifecycleShifts.slice(0, 15).map(s => `│ [${s.date}]: ${s.event}`).join('\n')}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`).join('')
    }

════════════════════════════════════════════════════════════════════════════════
🎯 YOUR SCORING OUTPUT FORMAT (REQUIRED)
════════════════════════════════════════════════════════════════════════════════

For EACH candidate, provide THIS EXACT FORMAT:

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

FINAL LINE (required):
TOP_SURVIVORS: [comma-separated list of ${survivorsNeeded} best times]

EXAMPLE OUTPUT:
┌─────────────────────────────────────────────────────────────────────────────┐
│ CANDIDATE: 14:35:22                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ METHOD SCORES:                                                              │
│ • D150 Nadi:    92  (weight: 2.2 - increased for critical marriage event)  │
│ • KP Sub-Lord:  88  (weight: 2.0)                                           │
│ • Vimshottari:  85  (weight: 1.9 - Venus MD matches marriage significator)  │
│ • Varga (D60):  78  (weight: 1.7)                                           │
│ • Transit:      75  (weight: 1.5)                                           │
│ • Kalachakra:   70  (weight: 1.2)                                           │
│ • Shadbala:     80  (weight: 1.0)                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ WEIGHT ADJUSTMENTS: Increased Nadi weight because marriage is CRITICAL     │
│ FINAL WEIGHTED SCORE: 82                                                    │
│ VERDICT: KEEP                                                               │
│ KEY REASON: Venus MD + KP Sub-Lord match for marriage event                 │
└─────────────────────────────────────────────────────────────────────────────┘`;
}

function getSignElement(sign: string): string {
  const fire = ['Aries', 'Leo', 'Sagittarius'];
  const earth = ['Taurus', 'Virgo', 'Capricorn'];
  const air = ['Gemini', 'Libra', 'Aquarius'];
  const water = ['Cancer', 'Scorpio', 'Pisces'];
  if (fire.includes(sign)) return 'FIRE (Agni)';
  if (earth.includes(sign)) return 'EARTH (Prithvi)';
  if (air.includes(sign)) return 'AIR (Vayu)';
  return 'WATER (Jala)';
}

function getSignModality(sign: string): string {
  const cardinal = ['Aries', 'Cancer', 'Libra', 'Capricorn'];
  const fixed = ['Taurus', 'Leo', 'Scorpio', 'Aquarius'];
  const dual = ['Gemini', 'Virgo', 'Sagittarius', 'Pisces'];
  if (cardinal.includes(sign)) return 'CARDINAL (Chara)';
  if (fixed.includes(sign)) return 'FIXED (Sthira)';
  return 'DUAL (Dwisthava)';
}
