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
  tentativeTime?: string
): string {
  const eventsText = events.map(formatLifeEventForAI).join('\n');
  const forensicContext = buildForensicContext(forensicTraits);

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
6. 🚨🚨🚨 FORENSIC DATA GAP AUDIT 🚨🚨🚨: At the end of your reasoning, you MUST include a summary box with this EXACT format:
============================
  METHODOLOGICAL AUDIT
----------------------------
  [Point 1]
  [Point 2]
============================
List every technical metric (e.g. D60 Degrees, Vimsopaka strength) that was missing but required for 100% mathematical certainty.
════════════════════════════════════════════════════════════════════════════════

    TASK: Rank ${candidates.length} candidates using Bio-Vedic Forensic Mapping and Dasha - Event correlation.

LIFE EVENTS:
${eventsText}

${forensicContext}

CANDIDATES WITH ENRICHED VEDIC DATA(100 % Mathematical Matrix):
${shuffledCandidates.map(c => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CANDIDATE: ${c.time}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PANCHANGA: Day=${c.panchanga?.vara} | Tithi=${c.panchanga?.tithi} | Yoga=${c.panchanga?.yoga} | Karana=${c.panchanga?.karana}
SPECIAL POINTS: AL (Arudha Lagna)=${c.specialPoints?.AL.sign} | UL (Upapada Lagna)=${c.specialPoints?.UL.sign}
LAGNA (Ascendant): ${c.ascendant.sign} ${c.ascendant.degree} (${c.ascendant.nakshatra})
HOUSE LORDS: ${[...Array(12)].map((_, i) => `${i + 1}=${c.houseLords[i + 1]}`).join(' | ')}
${c.sandhiZones?.length ? `⚠️ SANDHI WARNINGS: ${c.sandhiZones.join(' | ')}` : ''}

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

${c.transitData ? `TRANSITS & DASHAS ON EVENTS:
${Object.entries(c.transitData).map(([date, t]: [string, any]) =>
        `│ [${date}]: Dasha=${t.dasha} | ${t.signatures?.join(', ') || 'Regular Period'}`).join('\n')}` : ''}
${c.vedicSignals ? `VEDIC HIGH-SIGNALS:
│ Vargottama: ${c.vedicSignals.vargottama?.join(', ') || 'None'}
│ Pushkar: ${c.vedicSignals.pushkar?.join(', ') || 'None'}
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

SCORING ALGORITHM(STRICT VEDIC LOGIC):
    +30: PRIMARY MATCH - Dasha / Antar Lord is DIRECTLY the House Lord of the event(e.g.Marriage in 7th Lord dasha).
+ 20: SECONDARY MATCH - Dasha Lord is placed in the event house or aspects it.
+ 15: STRENGTH PROOF - Event dasha lord has high Shadbala(> 120) or high SAV points(> 28) in event house.
+ 10: NATURAL KARAKA - Dasha Lord is natural significator(Venus = Marriage, Sun = Career) even if not functional lord.
+ 10: LAGNA MATCH - Ascendant element / lord matches physical traits.
+ 15: AVASTHA PRECISION - If planet is in 'Yuva'(Youth) or 'Kumara'(Adolescent) avastha, results are 100 % manifest.If 'Mritya'(Dead), results are blocked.
+ 20: D60 DEITY FLAVOR - Match event narrative to D60 Deity(e.g. 'Amrita' for recovery, 'Ghora' for sudden accident).
- 50: CONTRADICTION - Event happened in dasha of 6 / 8 / 12 lord with NO connection to event house.

OUTPUT FORMAT(one line per candidate):
    [TIME] | SCORE: [0 - 100] | VERDICT: KEEP / ELIMINATE | REASON: [Explicit Astrological Reason e.g. "Venus is 7th Lord"]

FINAL LINE(required):
    TOP_SURVIVORS: [comma - separated list of ${survivorsNeeded} best times]`;
}
