/**
 * Final Precision Prompt Generator
 *
 * Generates AI prompts for Stage 6 final seconds-level precision judgment.
 * Creates the ultimate forensic prompt for selecting the single best birth time.
 * 
 * 🔱 AI-DRIVEN FLEXIBLE WEIGHTING SYSTEM:
 * AI has FULL FREEDOM to adjust weights for SECONDS-LEVEL precision.
 */

import { CandidateDataPackage } from '../types.js';
import { LifeEvent, ForensicTraits } from '../../../types/index.js';
import { formatLifeEventForAI } from './life-event-formatter.js';
import { buildForensicDNASummary } from './forensic-context.js';
import { randomSort } from '../../utils/index.js';
import { validateCandidateDataForAI } from '../schemas.js';
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

  return `BIRTH TIME RECTIFICATION - FINAL STAGE (Seconds Precision)

════════════════════════════════════════════════════════════════════════════════
🎯 AI-DRIVEN FLEXIBLE SCORING - FINAL SECONDS PRECISION
════════════════════════════════════════════════════════════════════════════════

YOU HAVE FULL FREEDOM TO ADJUST WEIGHTS! This is the FINAL judgment - be precise:

┌─────────────────────────────────────────────────────────────────────────────┐
│  METHOD          │ REFERENCE │  PRECISION    │ FINAL STAGE FOCUS          │
│                  │  WEIGHT   │               │                            │
├──────────────────┼───────────┼───────────────┼────────────────────────────┤
│  D150 Nadi       │   2.5     │  48 seconds   │ CRITICAL for seconds!      │
│  KP Sub-Lord     │   2.3     │  seconds      │ 4-level precision          │
│  Vimshottari     │   2.0     │  hours        │ Prana Dasha level          │
│  Varga (D60)     │   1.8     │  2 minutes    │ Karma Lagna changes        │
│  Transit         │   1.5     │  days         │ Final verification         │
│  Kalachakra      │   1.3     │  days         │ Cross-check                │
│  Shadbala        │   1.0     │  N/A          │ Strength context           │
└─────────────────────────────────────────────────────────────────────────────┘

⚠️ FOR SECONDS PRECISION - FOCUS ON:
• D150 Nadi Amsha - Changes every 48 seconds!
• KP Sub-Sub-Sub-Lord - 4th level precision
• Vimshottari Prana Dasha - Hour-level refinement
• D60 Lagna - Changes every 2 minutes

════════════════════════════════════════════════════════════════════════════════
📊 USER'S EVENT IMPORTANCE SELECTIONS
════════════════════════════════════════════════════════════════════════════════

${getEventImportanceSummary(events)}

════════════════════════════════════════════════════════════════════════════════
⚖️ FINAL JUDGMENT RULES
════════════════════════════════════════════════════════════════════════════════

1. TOTAL NEUTRALITY: You are a cold, mathematical evaluator.
2. NO POSITIONAL BIAS: Candidate #1 is NOT more likely than Candidate #N.
3. MANDATORY PROOF: Every score must be backed by technical proof.
4. FOCUS ON D60: Even 10 seconds can change D60 Lagna!
5. NADI AMSHA (D150): Changes every 48 seconds - THIS IS THE KEY!
6. BIO-VEDIC LOCK: Time must match Life Events + Forensic DNA + Family Karma.

════════════════════════════════════════════════════════════════════════════════
════════════════════════════════════════════════════════════════════════════════

    TASK: Solve the Bio - Vedic Identity Matrix.Select THE SINGLE BEST birth time from ${shuffledCandidates.length} finalists.
    
    CRITICAL: In your final judgment reasoning, you MUST explicitly quote or reference the user's "SITUATIONAL NARRATIVE & EXPERIENCE" and explain how the precise micro-astrological markers (like Nadi Amsha or D60 Lagna) perfectly align with the user's described life events.

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
├ HOUSE LORDS: ${[...Array(12)].map((_, i) => `${i + 1}=${c.houseLords[i + 1]}`).join(' | ')}
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
    const statusFlags: string[] = [];
    if (p.isRetro) statusFlags.push('R');
    if (p.isCombust) statusFlags.push('C');
    const statusStr = statusFlags.length > 0 ? `[${statusFlags.join(',')}]` : '';
    return `│ ${caps.padEnd(7)}: ${p.sign.padEnd(10)} [H${String(p.house).padEnd(2)}, ${avastha}, ${deity}, I/K:${ikp}, ${sambandha}, Sh:${shStr}, SAV:${sav}] ${statusStr} | Asp: ${aspects}`;
  }).join('\n')}
├ YOGAS: ${c.yogas?.map((y: any) => y.name).join(', ') || 'N/A'}
├ DIVISIONAL CHARTS (Detailed Degrees):
│ D9 Navamsa: Asc=${c.vargaDegrees?.D9?.Ascendant} | ${Object.entries(c.vargaDegrees?.D9 || {}).filter(([k]) => k !== 'Ascendant').map(([k, v]) => `${k.substring(0, 2)}=${v}`).join(' ')}
│ D10 Dasamsa: Asc=${c.vargaDegrees?.D10?.Ascendant} | ${Object.entries(c.vargaDegrees?.D10 || {}).filter(([k]) => k !== 'Ascendant').map(([k, v]) => `${k.substring(0, 2)}=${v}`).join(' ')}
│ D60 Shashtyamsa: Asc=${c.vargaDegrees?.D60?.Ascendant} | Deities=${Object.entries(c.d60Planets || {}).map(([k, v]) => `${k.substring(0, 2)}=${v.deity}`).join(' ')}
│ D150 Nadi Ansha: Asc=${c.vargaDegrees?.D150?.Ascendant} | ${Object.entries(c.vargaDegrees?.D150 || {}).filter(([k]) => k !== 'Ascendant').map(([k, v]) => `${k.substring(0, 2)}=${v}`).join(' ')}
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
│ Tatwa Shuddhi: ${c.vedicSignals.tatwa?.name} (${c.vedicSignals.tatwa?.element}) | Auspicious: ${c.vedicSignals.tatwa?.isAuspicious}
│ Kunda Lagna: ${c.vedicSignals.kundaLagna?.sign} ${c.vedicSignals.kundaLagna?.degree.toFixed(2)}° | Matches Moon: ${c.vedicSignals.kundaLagna?.matchesMoon ? 'YES 🔥' : 'NO'}
│ Parivartana: ${c.vedicSignals.parivartana?.map((ex: any) => `L${ex.houses[0]}↔L${ex.houses[1]}`).join(', ') || 'None'}` : ''}
${c.kalachakraDasha ? `├ KALACHAKRA DASHA (Savya/Apasavya):
${c.kalachakraDasha.slice(0, 12).map(k => `│ ${k.sign} (${k.lord}): ${k.startDate.toISOString().split('T')[0]} to ${k.endDate.toISOString().split('T')[0]} (${k.durationYears.toFixed(1)}y) [${k.kalachakraType}]`).join('\n')}` : ''}
${c.shadbalaSummary ? `├ SHADBALA SUMMARY (6-Source Strength):
│ Strongest: ${c.shadbalaSummary.strongestPlanet?.toUpperCase()} | Weakest: ${c.shadbalaSummary.weakestPlanet?.toUpperCase()} | Avg: ${c.shadbalaSummary?.averageStrength}
│ Strong Benefics: ${c.shadbalaSummary.benifics?.strong?.join(', ') || 'None'} | Weak Benefics: ${c.shadbalaSummary.benifics?.weak?.join(', ') || 'None'}
│ Strong Malefics: ${c.shadbalaSummary.malefics?.strong?.join(', ') || 'None'} | Weak Malefics: ${c.shadbalaSummary.malefics?.weak?.join(', ') || 'None'}` : ''}
${c.nadiData ? `├ D150 NADI AMSHA (48-Second Precision DNA - THE SOUL SIGNATURE):
│ Ascendant: ${c.nadiData.ascendant?.nadiName} | Deity: ${c.nadiData.ascendant?.deity} | Phala: ${c.nadiData.ascendant?.phala}
│ Moon: ${c.nadiData.moon?.nadiName} | Deity: ${c.nadiData.moon?.deity} | Karmic: ${c.nadiData.moon?.karmicSignificance}
│ Sun: ${c.nadiData.sun?.nadiName} | Deity: ${c.nadiData.sun?.deity}
│ Time Resolution: ~${c.nadiData.ascendant?.timeResolution} seconds per Nadi shift` : ''}
${c.nadiAnalysis?.length ? `├ D150 EVENT CORRELATION:
${c.nadiAnalysis.map(n => `│ ${n.eventCategory}: Score ${n.overallScore}/100 (${n.confidence}) | Rec: ${n.recommendations?.join('; ')}`).join('\n')}` : ''}
${c.spouseD9Verification ? `├ FINAL SPOUSE D9 VERIFICATION:
│ Score: ${c.spouseD9Verification.score}/100 | Verified: ${c.spouseD9Verification.verified ? 'YES ✓' : 'NO ✗'} | Confidence: ${c.spouseD9Verification.confidence?.toUpperCase()}
│ Matches: ${c.spouseD9Verification.matches?.map((m: any) => m.description).join('; ') || 'None'}
│ Mismatches: ${c.spouseD9Verification.mismatches?.map((m: any) => m.description).join('; ') || 'None'}
│ Recommendations: ${c.spouseD9Verification.recommendations?.join('; ')}` : ''}
${c.gandantaAnalysis && c.gandantaAnalysis.severity !== 'none' ? `├ ⚠️ GANDANTA KARMIC KNOT (CRITICAL):
│ Lagna Gandanta: ${c.gandantaAnalysis.isLagnaGandanta ? 'YES ⚠️' : 'NO'} | Moon Gandanta: ${c.gandantaAnalysis.isMoonGandanta ? 'YES ⚠️' : 'NO'}
│ Severity: ${c.gandantaAnalysis.severity.toUpperCase()} | Distance: ${c.gandantaAnalysis.distanceToGandanta.toFixed(4)}°
│ Type: ${c.gandantaAnalysis.lagnaGandantaType || c.gandantaAnalysis.moonGandantaType || 'N/A'}
│ Interpretation: ${c.gandantaAnalysis.interpretation.substring(0, 100)}...
│ Recommendations: ${c.gandantaAnalysis.recommendations.slice(0, 2).join('; ')}` : ''}
${c.pakshiAnalysis ? `├ PANCHA-PAKSHI SHASTRA (Five Birds System):
│ Ruling Bird: ${c.pakshiAnalysis.rulingBird.name} (${c.pakshiAnalysis.rulingBird.sanskritName}) | Element: ${c.pakshiAnalysis.rulingBird.element}
│ Strength: ${c.pakshiAnalysis.birdStrength.toUpperCase()} | Quality: ${c.pakshiAnalysis.birthTimeQuality.substring(0, 50)}...
│ Dominant Activities: ${c.pakshiAnalysis.activityStrengths.slice(0, 3).join(', ')}
│ Verification: ${c.pakshiAnalysis.verificationNotes.substring(0, 80)}...` : ''}
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
BEST TIME: [HH:MM:SS]
    REASONING: [Explicitly cite D60 Lagna, Dasha Connection, Synastry Match(if any), and Lifecycle Chronology.No generic text.]
    CONFIDENCE: [0 - 100]
    ACCURACY: [0 - 100] %
        CONFIDENCE: [HIGH / MEDIUM / LOW]
    MARGIN_OF_ERROR: ±[seconds] seconds

    EVIDENCE:
    1.[D60 Justification]
    2.[Event - Dasha Link]

    RUNNER_UP: [second best time]

At the VERY END of your response, you MUST output the final verdict in a structured JSON object enclosed in <FINAL_VERDICT> tags.

<FINAL_VERDICT>
{
  "time": "14:35:22",
  "accuracy": 95,
  "confidence": "HIGH",
  "margin": 15
}
</FINAL_VERDICT>
═══════════════════════════════════════════════════════════════════════════════`;
}
