/**
 * Batch Prompt Generator
 *
 * Generates AI prompts for Stage 2 batch tournament analysis.
 * Creates comprehensive prompts with forensic context and candidate data.
 */

import { CandidateDataPackage } from '../types.js';
import { LifeEvent, ForensicTraits } from '../../../types/index.js';
import { formatLifeEventForAI } from './life-event-formatter.js';
import { buildForensicContext } from './forensic-context.js';
import { randomSort } from '../../utils/index.js';

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
⚖️ ANTI-BIAS PROTOCOL:
1. TOTAL NEUTRALITY: Treat all provided times as equally likely candidates.
2. ZERO TENTATIVE BIAS: Do not favor times just because they are closer to the "original" time.
3. DATA-DRIVEN SCORE: Your score must reflect mathematical alignment only.
4. NARRATIVE PRIMACY: The user's "SITUATIONAL NARRATIVE" is the ultimate source of truth. If a user describes a "sudden, shocking loss," prioritize candidates where Rahu/Ketu/8th house are activated in that dasha, even if raw scores are lower.
5. FORENSIC CORRELATION: For EACH candidate, verify if their Varga markers (D1, D9, D60) align with the PHYSICAL and PSYCHOGRAPHIC DNA. A "measured_soft" speaker cannot have a Mercury-Mars lagna with heavy Agni influence unless strong Saturn control exists.
════════════════════════════════════════════════════════════════════════════════

════════════════════════════════════════════════════════════════════════════════
⚠️ CRITICAL GOD-TIER RULES:
1. USE PRE-CALCULATED DATA ONLY. Do not compute positions.
2. FUNCTIONAL NATURE MATTERS: A planet ruling 6/8/12 is malefic for this Ascendant.
3. DIGNITY MATTERS: Exalted/Own planets give strong results; Debilitated giving mixed/weak.
4. HOUSE LORDSHIP IS KEY: Event X (e.g., Marriage) MUST activate relevant house lords (e.g., 7th Lord).
5. BIO-VEDIC MAPPING: Treat Forensic Traits as "Biological Anchors". If the user is an "eldest" child, the 3rd house (younger siblings) in D1/D9 must reflect this karma (e.g., 3rd lord in 12th or malefic aspect).
6. 🔱 MAHAKALA INFINITE PRECISION:
   - TATWA SHUDDHI: Verify if the Element (Earth/Water/etc.) aligns with the user's fundamental nature.
   - KUNDA LAGNA: This is a 1-second sensitive multiplier. A 'Matches Moon' status is a strong indicator of structural correctness.
   - BOUNDARY LOCKS: If a candidate's offset description says "Boundary Lock", pay special attention. These represent the EXACT moment a Lagna, Navamsha, or Shashtiamsha changes. The truth often lies exactly at these boundaries.
7. 🚨🚨🚨 FORENSIC DATA GAP AUDIT 🚨🚨🚨: At the end of your reasoning, you MUST include a summary box with this EXACT format:
============================
  METHODOLOGICAL AUDIT
----------------------------
  [Point 1]
  [Point 2]
============================
List every technical metric (e.g. D60 Degrees, Vimsopaka strength) that was missing but required for 100% mathematical certainty.

7. ️ THE TRI-PRONGED LAGNA VERIFICATION (Human Factor Safety):
   If forensic traits feel generic or "unreliable", do NOT eliminate based on looks alone. Use the "Triple Check":
   A. PHYSICAL/SOFT: Check Sign Element (Fire/Water etc.).
   B. NARRATIVE/HARD: Check family positioning (e.g., eldest sibling, parents' status). This is less subjective.
   C. LORDSHIP/MATH: The 1st Lord's placement must align with the user's primary "Vibe". A 1st Lord in the 12th house (isolation/spirituality) vs 10th house (fame/public life).
   - ONLY ELIMINATE if 2 out of 3 prongs show a CRITICAL CONTRADICTION.
   - If in doubt, KEEP the candidate for Deep Analysis. Better to have 10 finalists than to lose the truth.
════════════════════════════════════════════════════════════════════════════════

    TASK: Rank ${candidates.length} candidates using Bio-Vedic Forensic Mapping and Dasha - Event correlation.

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
${c.vimsopakaBala ? `├ VIM SOPAKA BALA (Total Shodashvarga Strength - 0-20):
│ ${Object.entries(c.vimsopakaBala).map(([n, s]) => `${n}:${s}`).join(' | ')}` : ''}
${c.chalitDiscrepancies?.length ? `├ BHAVA CHALIT DISCREPANCIES:
${c.chalitDiscrepancies.map((d: any) => `│ ${d.planet}: Rashi-H${d.rasiHouse} ↔ Chalit-H${d.chalitHouse}`).join('\n')}` : ''}
${c.spouseMatch ? `├ SPOUSE SYNASTRY MATCH:
│ ${c.spouseMatch.reason} (Synastry Score: ${c.spouseMatch.score})` : ''}
${c.lifecycleShifts?.length ? `├ LIFECYCLE CHRONOLOGY (Major Sign Ingresses):
${c.lifecycleShifts.slice(0, 15).map(s => `│ [${s.date}]: ${s.event}`).join('\n')}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`).join('')
    }

⚖️ THE MAHAKALA SCORING MATRIX (STRICT VEDIC LOGIC):
1. HIERARCHICAL WEIGHTING (Base Points per Match):
   - DEEP-KARMA EVENTS (+50): Death of Parent, Birth of Child, Life-Threatening Accident.
   - DHARMA SHIFTS (+30): Marriage, Divorce, Major Career Pivot.
   - ARTHA/KAMA EVENTS (+15): Buying Property, Casual Job Change, Short Travel.

2. SYNERGY MULTIPLIERS:
   - x2.0 Varga-Dasha Mirror: Dasha lord rules the event house in BOTH D1 and the specific Varga (D9, D10, D7 etc.).
   - x1.5 Mahakala Kunda Match: The candidate's Kunda Lagna 'Matches Moon'.
   - x1.3 Nadi Ansha Resonance: D150 Nadi name aligns with the visceral flavor of the life events.

3. FORENSIC VETOES (Immediate -50 or ELIMINATE):
   - Lagna Mismatch: physical/psychographic profile directly contradicts the Ascendant sign element/modality.
   - Structural Contradiction: e.g., Siblings exist but 3rd house in D1/D9 is utterly barren/weak.

OUTPUT FORMAT(one line per candidate):
    [TIME] | SCORE: [0 - 100] | VERDICT: KEEP / ELIMINATE | REASON: [Explicit Astrological Reason e.g. "Venus is 7th Lord"]

FINAL LINE(required):
    TOP_SURVIVORS: [comma - separated list of ${survivorsNeeded} best times]`;
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
