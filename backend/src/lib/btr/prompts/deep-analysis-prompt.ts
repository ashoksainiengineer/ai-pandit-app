/**
 * Deep Analysis Prompt Generator
 *
 * Generates AI prompts for Stage 4 deep multi-dasha analysis.
 * Creates detailed forensic prompts for final candidate verification.
 */

import { CandidateDataPackage } from '../types.js';
import { LifeEvent, ForensicTraits } from '../../../types/index.js';
import { formatLifeEventForAI } from './life-event-formatter.js';
import { randomSort } from '../../utils/index.js';

/**
 * Generates deep analysis prompt for Stage 4
 *
 * @param candidates - Finalist candidate data packages
 * @param events - User's life events
 * @param forensicTraits - User's forensic traits
 * @param spouseData - Optional spouse data for synastry
 * @returns Complete AI prompt string for deep analysis
 */
export function getDeepAnalysisPrompt(
  candidates: CandidateDataPackage[],
  events: LifeEvent[],
  forensicTraits: ForensicTraits,
  spouseData: unknown
): string {
  const eventsText = events.map(formatLifeEventForAI).join('\n');
  const f = forensicTraits;
  const spouseText = spouseData ? JSON.stringify(spouseData, null, 2) : 'N/A';

  const forensicContext = `
    [FORENSIC DNA DOSSIER]
    - PHYSICAL: ${f.physical.facialStructure.forehead} forehead, ${f.physical.facialStructure.eyeShape} eyes, ${f.physical.facialStructure.voicePitch} voice, Marks: ${f.physical.skinHair.marks.join(', ')}
    - TEMPERAMENT: ${f.psychographic.temperament}, ${f.psychographic.speechStyle} speech, ${f.psychographic.decisionMaking} judgment
        - FAMILY: ${f.family.siblingPosition} child, ${f.family.brotherCount} B / ${f.family.sisterCount} S, Father at birth: ${f.family.fatherStatusAtBirth}
    - BIOLOGICAL: ${f.biological.prakriti.toUpperCase()}, Heat sensitivity: ${f.biological.sensitivity.heat}, Chronic: ${f.biological.recurringHealthIssues.join(', ')}
    `;
  // Anti-bias: Shuffle to prevent positional bias
  const filteredCandidates = candidates.filter(c => c.time);
  const shuffledCandidates = randomSort(filteredCandidates);

  return `BIRTH TIME RECTIFICATION - STAGE 4(Deep Multi - Dasha Analysis)

════════════════════════════════════════════════════════════════════════════════
⚖️ ANTI - BIAS PROTOCOLS:
    1. BLIND EVALUATION: Treat ALL candidates as equally probable. 
2. ZERO TENTATIVE BIAS: Do not favor times closest to the "original" tentative time.
3. DATA - ONLY VERDICT: If candidates are technically equal, say so.Do not guess.
════════════════════════════════════════════════════════════════════════════════

⚠️ ANALYSIS RULES(PURE VEDIC ASTROLOGY):
    1. RELY ONLY ON THE PROVIDED MATHEMATICAL DATA.Do not hallucinate planetary positions.
2. NARRATIVE PRIMACY: Qualitative experiences(SITUATIONAL NARRATIVE) outrank generic scoring.Match the flavor of the experience(e.g. "intense struggle" vs "smooth success") to the specific planetary dignity and aspects provided.
3. FORENSIC CORRELATION: For EACH candidate, verify if their Varga markers(D1 Lagna, D60 Deity, Navamsa Lord) align with the PHYSICAL and PSYCHOGRAPHIC data provided.A "measured_soft" speaker cannot have a Mercury - Mars lagna with heavy Agni influence unless strong Saturn control exists.
4. BIO - VEDIC MAPPING: Treat Forensic Traits as "Biological Anchors". If the user is an "eldest" child, the 3rd house(younger siblings) in D1 / D9 must reflect this karma(e.g., 3rd lord in 12th or malefic aspect).
6. CORRELATE DASHAS: Match Dasha Lords(and their House ownerships) to life events.
7. EVENT SIGNATURES: Use the pre - calculated signatures(D10 strength, Double Transit) to confirm "VIGOUR".
8. ⚡⚡⚡ CRITICAL METHODOLOGICAL AUDIT ⚡⚡⚡: Group all missing technical data into a stylized ASCII box:
============================
  METHODOLOGICAL AUDIT
----------------------------
  [Metric 1]
  [Metric 2]
============================
This must be the final section of your reasoning.
════════════════════════════════════════════════════════════════════════════════

    TASK: Perform a deep multi - varga forensic audit on ${shuffledCandidates.length} finalists.

USER FORENSIC DATA:
${forensicContext}
SPOUSE DATA: ${spouseText}

LIFE EVENTS:
${eventsText}

    CANDIDATES(100 % VERIFIED MATHEMATICAL DATA):
${shuffledCandidates.map(c => `
[${c.time}]
┌ LAGNA: ${c.ascendant.sign} ${c.ascendant.degree} (${c.ascendant.nakshatra})
├ PANCHANGA: Tithi=${c.panchanga?.tithi} | Vara=${c.panchanga?.vara} | Yoga=${c.panchanga?.yoga}
├ ARUDHAS: AL=${c.specialPoints?.AL.sign} | UL=${c.specialPoints?.UL.sign}
├ HOUSE LORDS: ${[...Array(12)].map((_, i) => `${i + 1}=${c.houseLords[i + 1]}`).join(' | ')}
├ PLANETARY MATRIX (Full Vedic Metrics):
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
├ YOGAS: ${c.yogas?.map((y: any) => y.name).join(', ') || 'None'}
├ DIVISIONAL CHARTS (Detailed Degrees):
│ D9 Navamsa: Asc=${c.vargaDegrees?.D9?.Ascendant} | ${Object.entries(c.vargaDegrees?.D9 || {}).filter(([k]) => k !== 'Ascendant').map(([k, v]) => `${k.substring(0, 2)}=${v}`).join(' ')}
│ D10 Dasamsa: Asc=${c.vargaDegrees?.D10?.Ascendant} | ${Object.entries(c.vargaDegrees?.D10 || {}).filter(([k]) => k !== 'Ascendant').map(([k, v]) => `${k.substring(0, 2)}=${v}`).join(' ')}
│ D60 Shashtyamsa: Asc=${c.vargaDegrees?.D60?.Ascendant} | Deities=${Object.entries(c.d60Planets || {}).map(([k, v]) => `${k.substring(0, 2)}=${v.deity}`).join(' ')}
├ D60 PLANETARY MATRIX:
${Object.entries(c.d60Planets || {}).map(([name, data]) => `│ ${name.padEnd(7)}: ${data.sign} ${data.degree} | DEITY: ${data.deity}`).join('\n')}
├ VIMSHOTTARI DASHA SEQUENCE (Full Lifecycle, 1999-2026):
${c.vimshottariDasha.map(d => `│ ${d.maha} -> ${d.antar} -> ${d.pratyantar}${d.sukshma !== '-' ? ` -> ${d.sukshma}` : ''} : ${d.startEnd}`).join('\n')}
├ MAJOR LIFECYCLE SHIFTS (Saturn/Jupiter Chronology):
${c.lifecycleShifts?.map(s => `│ [${s.date}]: ${s.event} (Dasha: ${s.dasha})`).join('\n') || 'N/A'}
├ YOGINI DASHA (Full): ${c.yoginiDasha?.map(d => `${d.lord} [${d.startEnd}]`).join(' | ') || 'N/A'}
├ CHARA DASHA: ${c.charaDasha?.map(d => `${d.sign} [${d.startEnd}]`).join(' | ') || 'N/A'}
├ ASHTAKAVARGA SAV: ${c.ashtakavarga?.SAV ? `[${c.ashtakavarga.SAV.join(', ')}]` : 'N/A'}
${c.transitData ? `├ TRANSITS & DASHAS ON ALL EVENTS (Full Planetary Matrix):
${Object.entries(c.transitData).map(([date, t]: [string, any]) =>
        `│ [${date}]: Dasha=${t.dasha}
│   Transits: ${Object.entries(t.planets || {}).map(([p, pos]) => `${p}:${pos}`).join(' | ')}
│   Signals: ${t.signatures?.join(', ') || 'Regular Period'}`).join('\n')}` : ''}
${c.vedicSignals ? `├ VEDIC HIGH-SIGNALS:
│ Vargottama: ${c.vedicSignals.vargottama?.join(', ') || 'None'}
│ Pushkar: ${c.vedicSignals.pushkar?.join(', ') || 'None'}
│ Parivartana: ${c.vedicSignals.parivartana?.map((ex: any) => `L${ex.houses[0]}↔L${ex.houses[1]}`).join(', ') || 'None'}` : ''}
${c.spouseMatch ? `├ SPOUSE SYNASTRY CORRELATION:
│ ${c.spouseMatch.reason}` : ''}
${c.lifecycleShifts?.length ? `├ LIFECYCLE CHRONOLOGY (SATURN/JUPITER INGRESS):
${c.lifecycleShifts.map(s => `│ [${s.date}]: ${s.event} (Dasha: ${s.dasha})`).join('\n')}` : ''}
└──────────────────────────────────────────────────────────────`).join('\n')
        }

    SCORING:
    - Rate 0 - 100 based on how well the Dasha Lords + Divisional Charts explain the Events.
- Strict correlation required.

        OUTPUT(for each candidate):
            [TIME] | REASONING: [Brief 1 - liner] | VERDICT: [KEEP / DROP] | SCORE: [0 - 100]

    FINAL:
    TOP_SURVIVORS: [time1], [time2], [time3]`;
}
