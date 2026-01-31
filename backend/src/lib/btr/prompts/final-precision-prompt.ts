/**
 * Final Precision Prompt Generator
 *
 * Generates AI prompts for Stage 6 final seconds-level precision judgment.
 * Creates the ultimate forensic prompt for selecting the single best birth time.
 */

import { CandidateDataPackage } from '../types.js';
import { LifeEvent, ForensicTraits } from '../../../types/index.js';
import { formatLifeEventForAI } from './life-event-formatter.js';
import { buildForensicDNASummary } from './forensic-context.js';
import { randomSort } from '../../utils/index.js';

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

  return `BIRTH TIME RECTIFICATION - FINAL STAGE(Seconds Precision)

════════════════════════════════════════════════════════════════════════════════
⚖️ ANTI - BIAS & OBJECTIVITY RULES:
    1. TOTAL NEUTRALITY: You are a cold, mathematical evaluator.
2. NO POSITIONAL BIAS: Candidate #1 is NOT more likely than Candidate #N.
3. MANDATORY PROOF: Every point in SCORE must be backed by a Technical Proof(e.g.D60 Lagna).
════════════════════════════════════════════════════════════════════════════════

⚠️ GOD - TIER PRECISION RULES:
    1. FOCUS ON D60(SHASHTYAMSA): Even 10 seconds can change D60 Lagna.
2. NARRATIVE SYNC: The rectified time MUST explain the "NARRATIVE EXPERIENCE" describing the flavor of the life event(e.g. "sudden surgery" implies Mars / Ketu in 8th or 6th).
3. VERIFY PRANADASHAS: Use Vimshottari logic down to the finest level.
4. BIO - VEDIC IDENTITY LOCK: The chosen time must represent the ONLY logical intersection of the Life Events, Forensic DNA, and Family Karma.A "Pitta" constitution with heat sensitivity MUST have Sun / Mars influence on Lagna or Lagna Lord in D1 / D9.
5. 🚨🚨🚨 SECONDS-LEVEL FORENSIC AUDIT 🚨🚨🚨: Finalize your analysis with a summary ASCII box:
============================
  METHODOLOGICAL AUDIT
----------------------------
  [Detail 1]
  [Detail 2]
============================
List specific Varga nuances or high-precision metrics missing for "Absolute God-Tier" 100% precision.
════════════════════════════════════════════════════════════════════════════════
════════════════════════════════════════════════════════════════════════════════

    TASK: Solve the Bio - Vedic Identity Matrix.Select THE SINGLE BEST birth time from ${shuffledCandidates.length} finalists.

USER FORENSIC DOSSIER:
${forensicDNA}
SPOUSE INFO: ${spouseText}

LIFE EVENTS:
${eventsText}

FINALIST CANDIDATES(100 % COMPLETE MATHEMATICAL DATA):
${shuffledCandidates.map((c, i) => `
#${i + 1} [${c.time}]
┌ LAGNA: ${c.ascendant.sign} ${c.ascendant.degree} (${c.ascendant.nakshatra})
├ PANCHANGA: ${c.panchanga?.tithi} | ${c.panchanga?.vara}
├ ARUDHAS: AL=${c.specialPoints?.AL.sign} | UL=${c.specialPoints?.UL.sign}
├ HOUSE LORDS: 1=${c.houseLords[1]} | 7=${c.houseLords[7]} | 10=${c.houseLords[10]}
├ D60 (Karma Lagna): ${c.d60Sign || 'N/A'}
├ PLANETARY STRENGTH MATRIX (Full Forensic Data):
${Object.entries(c.planets).map(([name, p]) => {
        const caps = name.charAt(0).toUpperCase() + name.slice(1);
        const sav = c.ashtakavarga?.SAVSigns?.[p.sign] || '?';
        const avastha = p.avastha || 'Unknown';
        const deity = p.d60Deity || 'Unknown';
        const ikp = p.ishtaKashtaPhala ? `${p.ishtaKashtaPhala.ishta}/${p.ishtaKashtaPhala.kashta}` : '?';
        const sambandha = p.compoundDignity || 'Sama';
        const sh = p.shadbalaBreakdown;
        const shStr = sh ? `Sum:${sh.total} (S:${sh.sthana} D:${sh.dig} K:${sh.kaala} C:${sh.cheshta})` : '?';
        const aspects = p.aspects?.filter((a: any) => a.isHit).map((a: any) => `${a.type}`).join(', ') || 'None';
        return `│ ${caps.padEnd(7)}: ${p.sign.padEnd(10)} [H${String(p.house).padEnd(2)}, ${avastha}, ${deity}, I/K:${ikp}, ${sambandha}, Sh:${shStr}, SAV:${sav}] | Asp: ${aspects}`;
    }).join('\n')}
├ YOGAS: ${c.yogas?.map((y: any) => y.name).join(', ') || 'N/A'}
├ DIVISIONAL CHARTS (Detailed Degrees):
│ D9 Navamsa: Asc=${c.vargaDegrees?.D9?.Ascendant} | ${Object.entries(c.vargaDegrees?.D9 || {}).filter(([k]) => k !== 'Ascendant').map(([k, v]) => `${k.substring(0, 2)}=${v}`).join(' ')}
│ D10 Dasamsa: Asc=${c.vargaDegrees?.D10?.Ascendant} | ${Object.entries(c.vargaDegrees?.D10 || {}).filter(([k]) => k !== 'Ascendant').map(([k, v]) => `${k.substring(0, 2)}=${v}`).join(' ')}
│ D60 Shashtyamsa: Asc=${c.vargaDegrees?.D60?.Ascendant} | Deities=${Object.entries(c.d60Planets || {}).map(([k, v]) => `${k.substring(0, 2)}=${v.deity}`).join(' ')}
├ D60 PLANETARY MATRIX:
${Object.entries(c.d60Planets || {}).map(([name, data]) => `│ ${name.padEnd(7)}: ${data.sign} ${data.degree} | DEITY: ${data.deity}`).join('\n')}
├ VIMSHOTTARI SEQUENCE (Forensic Accuracy):
${c.vimshottariDasha.map(d => `│ ${d.maha} -> ${d.antar} -> ${d.pratyantar}${d.sukshma !== '-' ? ` -> ${d.sukshma}` : ''}${d.prana !== '-' ? ` -> ${d.prana}` : ''} : ${d.startEnd}`).join('\n')}
${c.transitData ? `├ TRANSITS & DASHAS ON ALL EVENTS (Full Forensic Matrix):
${Object.entries(c.transitData).map(([date, t]: [string, any]) =>
        `│ [${date}]: Dasha=${t.dasha}
│   Transits: ${Object.entries(t.planets || {}).map(([p, pos]) => `${p}:${pos}`).join(' | ')}
│   Signals: ${t.signatures?.join(', ') || 'Regular Period'}`).join('\n')}` : ''}
${c.vedicSignals ? `├ VEDIC HIGH-SIGNALS:
│ Vargottama: ${c.vedicSignals.vargottama?.join(', ') || 'None'}
│ Pushkar: ${c.vedicSignals.pushkar?.join(', ') || 'None'}
│ Parivartana: ${c.vedicSignals.parivartana?.map((ex: any) => `L${ex.houses[0]}↔L${ex.houses[1]}`).join(', ') || 'None'}` : ''}
${transitData ? `├ PRESENT DAY ANCHOR (2026 Transits):
│ [Dasha Now]: ${transitData.dashaAtNow}
│ [Planets Now]: Ju=${transitData.jupiter}, Sa=${transitData.saturn}, Ra=${transitData.rahu}` : ''}
${c.spouseMatch ? `├ FINAL SPOUSE SYNASTRY PROOF:
│ ${c.spouseMatch.reason} | Multiplier: ${c.spouseMatch.lagnaMatch ? 'HIGH' : 'LOW'}` : ''}
${c.lifecycleShifts?.length ? `├ FINAL CHRONOLOGY VERIFICATION:
${c.lifecycleShifts.map(s => `│ [${s.date}]: ${s.event}`).join('\n')}` : ''}
└ BOUNDARY CHECK: ${parseFloat(c.ascendant.degree) < 1 || parseFloat(c.ascendant.degree) > 29 ? '⚠️ EDGE' : 'SAFE'}`).join('\n')
        }

FINAL VERDICT(required format):
BEST TIME: [HH: MM: SS]
    REASONING: [Explicitly cite D60 Lagna, Dasha Connection, Synastry Match(if any), and Lifecycle Chronology.No generic text.]
    CONFIDENCE: [0 - 100]
    ACCURACY: [0 - 100] %
        CONFIDENCE: [HIGH / MEDIUM / LOW]
    MARGIN_OF_ERROR: ±[seconds] seconds

    EVIDENCE:
    1.[D60 Justification]
    2.[Event - Dasha Link]

    RUNNER_UP: [second best time]
═══════════════════════════════════════════════════════════════════════════════`;
}
