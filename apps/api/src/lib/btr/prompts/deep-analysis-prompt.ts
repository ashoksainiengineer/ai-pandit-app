/**
 * Deep Analysis Prompt Generator
 *
 * Generates AI prompts for Stage 4 deep multi-dasha analysis.
 * Creates detailed forensic prompts for final candidate verification.
 * 
 * 🔱 AI-DRIVEN FLEXIBLE WEIGHTING SYSTEM:
 * AI has FULL FREEDOM to adjust method weights based on case context.
 */

import { CandidateDataPackage } from '@ai-pandit/shared';
import { LifeEvent, ForensicTraits } from '@ai-pandit/shared';
import { formatLifeEventForAI } from './life-event-formatter.js';
import { randomSort } from '../../utils/index.js';
import { validateCandidateDataForAI } from '@ai-pandit/shared/schemas';
import { logger } from '../../logger.js';

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
  spouseData: unknown,
  offsetMinutes: number = 30
): string {
  // 🛡️ ZERO-TRUST VALIDATION GATE
  candidates.filter(c => c.time).forEach(c => {
    try {
      validateCandidateDataForAI(c);
    } catch (err: any) {
      if (err.errors) {
        logger.error(`[VALIDATION-GATE] Candidate ${c.time} failed Zod schema validation:`, JSON.stringify(err.errors));
      } else {
        logger.error(`[VALIDATION-GATE] Candidate ${c.time} failed validation:`, err);
      }
      throw new Error(`Data Pipeline Contract Violation: Candidate ${c.time} is missing required data for AI analysis.`);
    }
  });

  const eventsText = events.map(formatLifeEventForAI).join('\n');
  const f = forensicTraits;
  const spouseText = spouseData ? JSON.stringify(spouseData, null, 2) : 'N/A';

  const forensicContext = `
    [FORENSIC DNA DOSSIER]
    - PHYSICAL: ${f?.physical?.facialStructure?.forehead ?? 'unknown'} forehead, ${f?.physical?.facialStructure?.eyeShape ?? 'unknown'} eyes, ${f?.physical?.facialStructure?.voicePitch ?? 'unknown'} voice, Marks: ${f?.physical?.skinHair?.marks?.join(', ') ?? 'none'}
    - TEMPERAMENT: ${f?.psychographic?.temperament ?? 'unknown'}, ${f?.psychographic?.speechStyle ?? 'unknown'} speech, ${f?.psychographic?.decisionMaking ?? 'unknown'} judgment
    - FAMILY: ${f?.family?.siblingPosition ?? 'unknown'} child, ${f?.family?.brotherCount ?? 0} B / ${f?.family?.sisterCount ?? 0} S, Father at birth: ${f?.family?.fatherStatusAtBirth ?? 'unknown'}
    - BIOLOGICAL: ${f?.biological?.prakriti?.toUpperCase() ?? 'Unknown'}, Heat sensitivity: ${f?.biological?.sensitivity?.heat ?? 'unknown'}, Chronic: ${f?.biological?.recurringHealthIssues?.join(', ') ?? 'none'}
    `;
  // Anti-bias: Shuffle to prevent positional bias
  const filteredCandidates = candidates.filter(c => c.time);
  const shuffledCandidates = randomSort(filteredCandidates);

  return `BIRTH TIME RECTIFICATION - STAGE 4 (Deep Multi-Dasha Analysis)

════════════════════════════════════════════════════════════════════════════════
🎯 AI-DRIVEN FLEXIBLE SCORING - DEEP ANALYSIS
════════════════════════════════════════════════════════════════════════════════

YOU HAVE FULL FREEDOM TO ADJUST WEIGHTS! Reference weights - ADJUST as needed:

┌─────────────────────────────────────────────────────────────────────────────┐
│  METHOD          │ REFERENCE │  PRECISION    │ ADJUST FOR                  │
│                  │  WEIGHT   │               │                             │
├──────────────────┼───────────┼───────────────┼─────────────────────────────┤
│  D150 Nadi       │   2.0     │  48 seconds   │ Critical events + good data │
│  KP Sub-Lord     │   2.0     │  seconds      │ Precise cuspal data         │
│  Vimshottari     │   1.8     │  hours        │ Full MD-AD-PD sequence      │
│  Varga (D60)     │   1.7     │  2 minutes    │ D60 deity clear             │
│  Transit         │   1.5     │  days         │ Double transit matches      │
│  Kalachakra      │   1.2     │  days         │ Cross-verification          │
│  Shadbala        │   1.0     │  N/A          │ Planet strength context     │
│  Yogini Dasha    │   0.9     │  months       │ Secondary verification      │
│  Chara Dasha     │   0.9     │  months       │ Jaimini cross-check         │
└─────────────────────────────────────────────────────────────────────────────┘

════════════════════════════════════════════════════════════════════════════════
📊 USER'S EVENT IMPORTANCE SELECTIONS
════════════════════════════════════════════════════════════════════════════════

${getEventImportanceSummary(events)}

════════════════════════════════════════════════════════════════════════════════
⚖️ ANALYSIS RULES (PURE VEDIC ASTROLOGY)
════════════════════════════════════════════════════════════════════════════════

1. RELY ONLY ON PROVIDED MATHEMATICAL DATA - Do not hallucinate positions.
2. NARRATIVE PRIMACY: Match event "flavor" to planetary dignity and aspects.
3. FORENSIC CORRELATION: Varga markers must align with physical/psychographic data.
4. BIO-VEDIC MAPPING: Forensic traits are "Biological Anchors".
5. PROJECT MAHAKALA:
   - TATWA SHUDDHI: Element matches biological/temperamental profile?
   - KUNDA LAGNA: 'Matches Moon' = strong structural indicator.
   - DIVISIONAL BOUNDARIES: Truth often lies at boundaries.

${offsetMinutes > 15 ? `════════════════════════════════════════════════════════════════════════════════
🪐 PHASE B: THE MESO SWEEP PROTOCOL (Offset: ±${offsetMinutes} mins)
════════════════════════════════════════════════════════════════════════════════
You are in Stage 4. The Lagna is fixed. Your objective is hunting the correct Navamsha (D9) and Dasamsha (D10).
- HEAVILY SCRUTINIZE the D9 Lagna and D9 7th house. Cross-reference with the user's spouse descriptions.
- EVALUATE D10 for career alignments and timing.
- ELIMINATE candidates where the D9 completely fails the reality of the user's marriage/relationship narrative.
- USE Vimshottari Antar Dasha for timing verification.`
      : `════════════════════════════════════════════════════════════════════════════════
🪐 PHASE C: THE MICRO SWEEP PROTOCOL (Offset: ±${offsetMinutes} mins)
════════════════════════════════════════════════════════════════════════════════
We are in the terminal varga zones. We are hunting exact D60 / D150 alignments.
- ANALYZE Vimshottari down to Pratyantar / Sookshma levels.
- USE D60 deities and configurations to map traumatic or sudden events.
- Your final judgment MUST hinge on mathematical precision in the micro-charts matching the situational narrative.`}

════════════════════════════════════════════════════════════════════════════════

    TASK: Deep multi-varga forensic audit on ${shuffledCandidates.length} finalists.
    
    For EACH candidate, your reasoning MUST explicitly quote or reference the user's "SITUATIONAL NARRATIVE & EXPERIENCE" to demonstrate exactly how the planetary conditions (D1, D9, D10, transits) manifested that specific real-world event.

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
├ ASHTAKAVARGA SAV: ${c.ashtakavarga ? `[${Object.entries(c.ashtakavarga).map(([k, v]) => `${k}:${v}`).join(', ')}]` : 'N/A'}
${c.transitData ? `├ TRANSITS & DASHAS ON ALL EVENTS (Full Planetary Matrix):
${Object.entries(c.transitData).map(([date, t]: [string, any]) =>
        `│ [${date}]: Dasha=${t.dasha}
│   Transits: ${Object.entries(t.planets || {}).map(([p, pos]) => `${p}:${pos}`).join(' | ')}
│   Signals: ${t.signatures?.join(', ') || 'Regular Period'}`).join('\n')}` : ''}
${c.vedicSignals ? `├ VEDIC HIGH-SIGNALS:
│ Vargottama: ${c.vedicSignals.vargottama?.join(', ') || 'None'}
│ Pushkar: ${c.vedicSignals.pushkar?.join(', ') || 'None'}
│ Tatwa Shuddhi: ${c.vedicSignals.tatwa?.name} (${c.vedicSignals.tatwa?.element}) | Auspicious: ${c.vedicSignals.tatwa?.isAuspicious}
│ Kunda Lagna: ${c.vedicSignals.kundaLagna?.sign} ${c.vedicSignals.kundaLagna?.degree.toFixed(2)}° | Matches Moon: ${c.vedicSignals.kundaLagna?.matchesMoon ? 'YES 🔥' : 'NO'}
│ Parivartana: ${c.vedicSignals.parivartana?.map((ex: any) => `L${ex.houses[0]}↔L${ex.houses[1]}`).join(', ') || 'None'}` : ''}
${c.kalachakraDasha ? `├ KALACHAKRA DASHA (Savya/Apasavya):
${c.kalachakraDasha.slice(0, 10).map(k => `│ ${k.sign} (${k.lord}): ${k.startDate.toISOString().split('T')[0]} to ${k.endDate.toISOString().split('T')[0]} (${k.durationYears.toFixed(1)}y) [${k.kalachakraType}]`).join('\n')}` : ''}
${c.shadbalaSummary ? `├ SHADBALA SUMMARY (6-Source Strength):
│ Strongest: ${c.shadbalaSummary.strongestPlanet?.toUpperCase()} | Weakest: ${c.shadbalaSummary.weakestPlanet?.toUpperCase()} | Avg: ${c.shadbalaSummary?.averageStrength}
│ Strong Benefics: ${c.shadbalaSummary.benifics?.strong?.join(', ') || 'None'} | Weak Benefics: ${c.shadbalaSummary.benifics?.weak?.join(', ') || 'None'}
│ Strong Malefics: ${c.shadbalaSummary.malefics?.strong?.join(', ') || 'None'} | Weak Malefics: ${c.shadbalaSummary.malefics?.weak?.join(', ') || 'None'}` : ''}
${c.nadiData ? `├ D150 NADI AMSHA (48-Second Precision DNA):
│ Ascendant: ${c.nadiData.ascendant?.nadiName} (${c.nadiData.ascendant?.deity}) | Phala: ${c.nadiData.ascendant?.phala}
│ Moon: ${c.nadiData.moon?.nadiName} (${c.nadiData.moon?.deity}) | Karmic: ${c.nadiData.moon?.karmicSignificance}
│ Sun: ${c.nadiData.sun?.nadiName} (${c.nadiData.sun?.deity}) | Resolution: ~${c.nadiData.ascendant?.timeResolution}s` : ''}
${c.nadiAnalysis?.length ? `├ D150 EVENT ANALYSIS:
${c.nadiAnalysis.slice(0, 5).map(n => `│ ${n.eventCategory}: Score ${n.overallScore}/100 (${n.confidence})`).join('\n')}` : ''}
${c.spouseD9Verification ? `├ SPOUSE D9 VERIFICATION:
│ Score: ${c.spouseD9Verification.score}/100 | Verified: ${c.spouseD9Verification.verified ? 'YES' : 'NO'} | Confidence: ${c.spouseD9Verification.confidence?.toUpperCase()}
│ Matches: ${c.spouseD9Verification.matches?.map((m: any) => m.description).join('; ') || 'None'}
│ Mismatches: ${c.spouseD9Verification.mismatches?.map((m: any) => m.description).join('; ') || 'None'}` : ''}
${c.gandantaAnalysis && c.gandantaAnalysis.severity !== 'none' ? `├ ⚠️ GANDANTA KARMIC KNOT:
│ Lagna: ${c.gandantaAnalysis.isLagnaGandanta ? 'YES' : 'NO'} | Moon: ${c.gandantaAnalysis.isMoonGandanta ? 'YES' : 'NO'}
│ Severity: ${c.gandantaAnalysis.severity.toUpperCase()} | Distance: ${c.gandantaAnalysis.distanceToGandanta.toFixed(3)}°
│ Type: ${c.gandantaAnalysis.lagnaGandantaType || c.gandantaAnalysis.moonGandantaType || 'N/A'}` : ''}
${c.pakshiAnalysis ? `├ PANCHA-PAKSHI (Five Birds):
│ Bird: ${c.pakshiAnalysis.rulingBird.name} (${c.pakshiAnalysis.rulingBird.element}) | Strength: ${c.pakshiAnalysis.birdStrength.toUpperCase()}` : ''}
${c.spouseMatch ? `├ SPOUSE SYNASTRY CORRELATION:
│ ${c.spouseMatch.reason}` : ''}
${c.lifecycleShifts?.length ? `├ LIFECYCLE CHRONOLOGY (SATURN/JUPITER INGRESS):
${c.lifecycleShifts.map(s => `│ [${s.date}]: ${s.event} (Dasha: ${s.dasha})`).join('\n')}` : ''}
└──────────────────────────────────────────────────────────────`).join('\n')
    }

════════════════════════════════════════════════════════════════════════════════
🎯 YOUR DEEP ANALYSIS OUTPUT FORMAT (REQUIRED)
════════════════════════════════════════════════════════════════════════════════

For EACH finalist candidate:

┌─────────────────────────────────────────────────────────────────────────────┐
│ CANDIDATE: [HH:MM:SS]                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ DETAILED METHOD ANALYSIS:                                                   │
│ ┌─────────────────────────────────────────────────────────────────────┐     │
│ │ METHOD        │ SCORE │ WEIGHT │ KEY FINDING                        │     │
│ ├───────────────┼───────┼────────┼────────────────────────────────────┤     │
│ │ D150 Nadi     │   XX  │  X.X   │ [Match/Mismatch description]       │     │
│ │ KP Sub-Lord   │   XX  │  X.X   │ [Cuspal analysis]                  │     │
│ │ Vimshottari   │   XX  │  X.X   │ [Dasha alignment]                  │     │
│ │ Varga (D60)   │   XX  │  X.X   │ [Karma verification]               │     │
│ │ Transit       │   XX  │  X.X   │ [Double transit status]            │     │
│ │ Kalachakra    │   XX  │  X.X   │ [Cycle verification]               │     │
│ │ Yogini        │   XX  │  X.X   │ [Secondary confirmation]           │     │
│ │ Chara         │   XX  │  X.X   │ [Jaimini check]                    │     │
│ └─────────────────────────────────────────────────────────────────────┘     │
├─────────────────────────────────────────────────────────────────────────────┤
│ WEIGHT ADJUSTMENTS: [Why you changed weights]                              │
│ FINAL WEIGHTED SCORE: [0-100]                                               │
│ VERDICT: KEEP / DROP                                                         │
│ KEY EVIDENCE: [Top 2-3 astrological reasons]                               │
└─────────────────────────────────────────────────────────────────────────────┘

At the VERY END of your response, you MUST output the final scores for ALL candidates in a structured JSON array enclosed in <FINAL_SCORES> tags. 

<FINAL_SCORES>
[
  { "time": "14:35:22", "score": 92, "reason": "Terminal D150 match with exact Dasha" },
  { "time": "10:30:00", "score": 55, "reason": "Failed D60 alignment" }
]
</FINAL_SCORES>

FINAL:
TOP_SURVIVORS: [time1], [time2], [time3]`;
}
