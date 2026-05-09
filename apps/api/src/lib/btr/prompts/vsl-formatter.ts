/**
 * VSL Formatter
 * =================
 *
 * Converts CandidateDataPackage into compact but information-dense
 * Vedic Shorthand Language (VSL) blocks for AI prompts.
 */

import { CandidateDataPackage, PlanetData } from '@ai-pandit/shared';

export interface EnhancedCandidate extends CandidateDataPackage {
  precision?: CandidateDataPackage['precision'];
  kpCuspalData?: Record<number, { cusp: number; sign: string
}>;
  houses?: Record<number, number>;
}

type KPPlanetSubMap = NonNullable<NonNullable<CandidateDataPackage['kpData']>['planetSubLords']>;
type KPCuspMap = NonNullable<NonNullable<CandidateDataPackage['kpData']>['cuspalSubLords']>;

const PLANET_ORDER = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];
const VARGA_ORDER = ['D9', 'D10', 'D12', 'D60', 'D150'];
const VARGA_KEYS = ['Ascendant', 'Sun', 'Moon', 'Venus', 'Jupiter', 'Saturn', 'Rahu', 'Ketu'];

/**
 * Main entry point for VSL formatting.
 */
export function formatCandidateVSL(pkg: EnhancedCandidate): string {
  const segments: string[] = [];

  segments.push('#C');
  segments.push(formatConsensus(pkg));

  segments.push('#P');
  segments.push(formatPanchanga(pkg));

  segments.push('#L');
  segments.push(formatLagna(pkg));
  segments.push(formatAyanamsa(pkg));
  segments.push(formatHouseCusps(pkg));
  segments.push(formatSpecialPoints(pkg));
  segments.push(formatPakshi(pkg));

  segments.push('#M');
  segments.push(formatMatrix(pkg));
  segments.push(formatVimsopaka(pkg));

  segments.push(formatVargas(pkg));
  segments.push(formatD60Deities(pkg));
  segments.push(formatAshtakavarga(pkg));
  segments.push(formatNadi(pkg));
  segments.push(formatKP(pkg));
  segments.push(formatCuspal(pkg));
  segments.push(formatJaimini(pkg));
  segments.push(formatYogas(pkg));
  segments.push(formatChalit(pkg));
  segments.push(formatDashas(pkg));
  segments.push(formatTransits(pkg));

  segments.push('#S');
  segments.push(formatSpouse(pkg));

  return segments.join('\n');
}

function formatConsensus(pkg: EnhancedCandidate): string {
  const c = pkg.precision?.consensus;
  if (c) {
    const flags: string[] = [];
    if (c.redFlags?.sandhiBirth) flags.push('SN');
    if (c.redFlags?.gandanta) flags.push('GD');
    if (c.redFlags?.dashaSandhi) flags.push('DS');
    if (c.redFlags?.conflictingMethods) flags.push('CM');
    if (c.redFlags?.weakSignificators) flags.push('WS');
    if (c.redFlags?.d60Instability) flags.push('D60');


    const confMap: Record<string, string> = {
      STANDARD_PRECISION: 'SP',
      VERY_HIGH: 'VH',
      HIGH: 'H',
      MEDIUM: 'M',
      LOW: 'L'
    };

    return `!C|${toFixedSafe(c.overallConsensus, 1)}|${confMap[c.confidenceLevel] || 'L'}|${c.marginOfError}|${flags.join(',') || '~'}`;
  }

  const derivedScore = deriveConsensusScore(pkg);
  const derivedConf = derivedScore >= 85 ? 'H' : derivedScore >= 70 ? 'M' : 'L';
  const derivedMargin = derivedScore >= 85 ? 20 : derivedScore >= 70 ? 45 : 90;

  const derivedFlags: string[] = [];
  if ((pkg.sandhiZones || []).length > 0) derivedFlags.push('SN');
  if (pkg.gandantaAnalysis) derivedFlags.push('GD');
  if (!pkg.d60Sign) derivedFlags.push('D60');

  return `!C|${derivedScore}|${derivedConf}|${derivedMargin}|${derivedFlags.join(',') || '~'}`;
}

function deriveConsensusScore(pkg: EnhancedCandidate): number {
  let score = typeof pkg.aiScore === 'number' ? Math.round(pkg.aiScore) : 45;
  if (pkg.d60Sign) score += 10;
  if (pkg.d150Sign) score += 8;
  if (pkg.nadiData && Object.keys(pkg.nadiData).length > 0) score += 12;
  if (pkg.kpData?.planetSubLords && Object.keys(pkg.kpData.planetSubLords).length > 0) score += 12;
  if (pkg.transitData && Object.keys(pkg.transitData).length > 0) score += 8;
  if (pkg.spouseMatch?.score) score += Math.min(10, Math.round(pkg.spouseMatch.score / 10));
  return Math.min(99, Math.max(0, score));
}

function formatPanchanga(pkg: EnhancedCandidate): string {
  const p = pkg.panchanga;
  const s = pkg.vedicSignals;
  if (!p) return '!P|~';

  const tithi = extractNamedValue(p.tithi);
  const yoga = extractNamedValue(p.yoga);
  const karana = extractNamedValue(p.karana);
  const vara = sanitizeToken(
    String(
      ('vara' in p ? (p as Record<'vara', string>).vara : undefined) ||
      ('weekday' in p ? (p as Record<'weekday', string>).weekday : undefined) ||
      '~'
    )
  );
  const nakshatra = sanitizeToken(p.nakshatra || '~');
  const tatwa = sanitizeToken(s?.tatwa?.element || '~');
  const klBit = s?.kundaLagna?.matchesMoon ? '1' : '0';

  return `!P|${tithi}|${yoga}|${karana}|${vara}|${nakshatra}|${tatwa}|KL${klBit}`;
}

function formatLagna(pkg: EnhancedCandidate): string {
  const l = pkg.ascendant;
  if (!l) return '!L|~';

  const lord = pkg.houseLords?.[1] || pkg.houseLords?.['1'];
  const lagnaLord = lord ? getPlan(String(lord)) : '~';
  const moonNak = pkg.moonNakshatra || '~';

  return `!L|${getSgn(l.sign)}|${sanitizeToken(l.degree)}|${sanitizeToken(l.nakshatra || '~')}|L1=${lagnaLord}|MN=${sanitizeToken(moonNak)}`;
}

function formatAyanamsa(pkg: EnhancedCandidate): string {
  const ayanamsa = pkg.ayanamsa;
  return `!AY|${typeof ayanamsa === 'number' ? ayanamsa.toFixed(6) : '~'}`;
}

function formatHouseCusps(pkg: EnhancedCandidate): string {
  // Try KP cuspal data first, then houses passthrough
  const kpCusps = pkg.kpCuspalData;
  const houses = pkg.houses;

  const entries: string[] = [];
  for (let i = 1; i <= 12; i++) {
    const kpEntry = kpCusps?.[i];
    if (kpEntry) {
      entries.push(`H${i}${getSgn(kpEntry.sign)}|${Number(kpEntry.cusp).toFixed(4)}`);
    } else if (houses?.[i] !== undefined) {
      entries.push(`H${i}|${Number(houses[i]).toFixed(4)}`);
    } else {
      entries.push(`H${i}~`);
    }
  }
  return `!HC|${entries.join('|')}`;
}

// ── Special Points (!SP) ─────────────────────────────────────────────

function formatDegree(degree: unknown): string {
  if (typeof degree === 'number') return degree.toFixed(4);
  if (typeof degree === 'string') return sanitizeToken(degree, 18);
  return '~';
}

function formatSpecialPoints(pkg: EnhancedCandidate): string {
  const sp = pkg.specialPoints;
  if (!sp) return '!SP|~';

  const parts: string[] = [];
  if (sp.arudhaLagna) {
    parts.push(`AL=${getSgn(sp.arudhaLagna.sign)}|${formatDegree(sp.arudhaLagna.degree)}`);
  }
  if (sp.upapadaLagna) {
    parts.push(`UL=${getSgn(sp.upapadaLagna.sign)}|${formatDegree(sp.upapadaLagna.degree)}`);
  }
  if (sp.bhriguBindu) {
    parts.push(`BB=${getSgn(sp.bhriguBindu.sign)}|${formatDegree(sp.bhriguBindu.degree)}`);
  }
  return parts.length > 0 ? `!SP|${parts.join('|')}` : '!SP|~';
}

// ── Pakshi Analysis (!PP) ────────────────────────────────────────────

function formatPakshi(pkg: EnhancedCandidate): string {
  const pa = pkg.pakshiAnalysis;
  if (!pa) return '!PP|~';
  const bird = sanitizeToken(pa.rulingBird?.name || '~', 16);
  const phase = sanitizeToken(pa.birdStrength || '~', 12);
  const activity = sanitizeToken(pa.activityStrengths?.[0] || '~', 12);
  return `!PP|${bird}|${phase}|${activity}`;
}

// ── Planet Matrix (#M) ───────────────────────────────────────────────

function formatMatrix(pkg: EnhancedCandidate): string {
  const planets = pkg.planets;
  if (!planets || Object.keys(planets).length === 0) return '!M|~';

  const entries = sortPlanetEntries(planets).map(([name, p]) => {
    const dig = normalizeDignity(p.dignity);
    const retro = p.isRetro ? '1' : '0';
    const shad = typeof p.shadbala === 'number' ? p.shadbala.toFixed(2) : '~';
    const house = typeof p.house === 'number' ? `H${p.house}` : 'H~';
    const fn = sanitizeToken(p.functionalNature?.role || '~', 12);
    const av = sanitizeToken(p.avastha || '~', 12);
    const lon = typeof p.longitude === 'number' ? p.longitude.toFixed(4) : '~';
    const spd = typeof p.speed === 'number' ? p.speed.toFixed(4) : '~';
    const comb = p.isCombust ? '1' : '0';
    const cd = sanitizeToken(p.compoundDignity || '~', 24);
    const aspStr = formatAspects(p.aspects);

    // Ishta / Kashta Phala
    const ikp = pkg.ishtaKashtaPhala as Record<string, { ishta: number; kashta: number }> | undefined;
    const ikStr = ikp?.[name]
      ? `${ikp[name].ishta.toFixed(1)}/${ikp[name].kashta.toFixed(1)}`
      : '~';

    // Shadbala breakdown
    const sb = p.shadbalaBreakdown;
    const sbStr = sb
      ? `${(sb.sthana ?? 0).toFixed(0)}/${(sb.dig ?? 0).toFixed(0)}/${(sb.kaala ?? 0).toFixed(0)}/${(sb.cheshta ?? 0).toFixed(0)}`
      : '~';

    return `${getPlan(name)}[${getSgn(p.sign)}|${sanitizeToken(p.degree)}|${sanitizeToken(p.nakshatra || '~')}|${house}|${dig}|SB${shad}|FN${fn}|AV${av}|R${retro}|L${lon}|SP${spd}|CB${comb}|CD${cd}|AS${aspStr}|IK${ikStr}|SD${sbStr}]`;
  });

  return `!M|${entries.join('|')}`;
}

function formatAspects(aspects: unknown[] | undefined): string {
  if (!aspects || aspects.length === 0) return '~';
  return aspects.slice(0, 5).map((a) => {
    const ar = a as Record<string, unknown>;
    const planet = ar.planet ? getPlan(String(ar.planet)) : '~';
    const type = String(ar.type || ar.aspectType || '~');
    const abbr = type.length <= 4 ? type : type.slice(0, 4);
    return `${planet}>${abbr}`;
  }).join(',');
}

// ── Vimsopaka Bala (!VB) ─────────────────────────────────────────────

function formatVimsopaka(pkg: EnhancedCandidate): string {
  const vb = pkg.vimsopakaBala;
  if (!vb || Object.keys(vb).length === 0) return '!VB|~';
  const entries = Object.entries(vb)
    .sort((a, b) => planetSortWeight(a[0]) - planetSortWeight(b[0]))
    .map(([name, score]) => `${getPlan(name)}:${score}`);
  return `!VB|${entries.join('|')}`;
}

// ── Vargas (#V) ──────────────────────────────────────────────────────

function formatVargas(pkg: EnhancedCandidate): string {
  const rows: string[] = [];

  if (pkg.vargaDegrees) {
    for (const chart of VARGA_ORDER) {
      const row = pkg.vargaDegrees[chart];
      if (!row) continue;

      const values = VARGA_KEYS
        .map((key) => {
          const raw = row[key];
          if (!raw) return '';
          const { sign, degree } = parseVargaValue(raw);
          return `${shortVargaKey(key)}:${getSgn(sign)}@${degree}`;
        })
        .filter(Boolean);

      if (values.length > 0) {
        rows.push(`${chart}[${values.join('|')}]`);
      }
    }
  }

  if (rows.length === 0) {
    if (pkg.d9Chart?.ascendant) rows.push(`D9[Asc:${getSgn(pkg.d9Chart.ascendant)}]`);
    if (pkg.d10Chart?.ascendant) rows.push(`D10[Asc:${getSgn(pkg.d10Chart.ascendant)}]`);
    if (pkg.d60Sign) rows.push(`D60[Asc:${getSgn(pkg.d60Sign)}]`);
    if (pkg.d150Sign) rows.push(`D150[Asc:${getSgn(pkg.d150Sign)}]`);
  }

  return rows.length > 0 ? `#V|${rows.join('|')}` : '#V|~';
}

// ── D60 Deities (#D60D) ──────────────────────────────────────────────

function formatD60Deities(pkg: EnhancedCandidate): string {
  const dp = pkg.d60Planets;
  if (!dp || Object.keys(dp).length === 0) return '';
  const entries = Object.entries(dp)
    .sort((a, b) => planetSortWeight(a[0]) - planetSortWeight(b[0]))
    .map(([name, data]: [string, { deity?: string }]) => {
      const deity = sanitizeToken(data.deity || '~', 20);
      return `${getPlan(name)}:${deity}`;
    });
  return entries.length > 0 ? `#D60D|${entries.join('|')}` : '';
}

// ── Ashtakavarga (!AV) ───────────────────────────────────────────────

function formatAshtakavarga(pkg: EnhancedCandidate): string {
  const av = pkg.ashtakavarga;
  if (!av || Object.keys(av).length === 0) return '!AV|~';
  const entries = Object.entries(av)
    .sort((a, b) => planetSortWeight(a[0]) - planetSortWeight(b[0]))
    .map(([name, scores]: [string, number[] | number]) => {
      const total = Array.isArray(scores)
        ? scores.reduce((sum: number, s: number) => sum + s, 0)
        : (typeof scores === 'number' ? scores : '~');
      return `${getPlan(name)}:${total}`;
    });
  return `!AV|${entries.join('|')}`;
}

// ── Nadi (#N) ────────────────────────────────────────────────────────

function formatNadi(pkg: EnhancedCandidate): string {
  const n = pkg.nadiData;
  if (!n || Object.keys(n).length === 0) return '#N|~';

  const orderedKeys = Object.keys(n).sort((a, b) => nadiKeyWeight(a) - nadiKeyWeight(b));
  const entries = orderedKeys.map((key) => {
    const data = n[key] as Record<string, unknown>;
    const label = key === 'ascendant' ? 'As' : getPlan(key);
    const index = data.index ?? '~';
    const mode = encodeNadiMode(String(data.nadiMode ?? ''));
    const kala = encodeKala(String(data.kala ?? ''));
    const nadiName = sanitizeToken(String(data.nadiName ?? '~'), 16);
    const deity = sanitizeToken(String(data.deity ?? '~'), 16);
    const karmic = encodeKarmic(String(data.karmicSignificance ?? ''));
    const phala = sanitizeToken(String(data.phala ?? '~'), 16);
    const timeRes = typeof data.timeResolution === 'number' ? `${Math.round(data.timeResolution)}s` : '~';
    return `${label}[${index}|${nadiName}|${deity}|${karmic}|${phala}|${mode}|${kala}|${timeRes}]`;
  });

  return `#N|${entries.join('|')}`;
}

function nadiKeyWeight(key: string): number {
  const map: Record<string, number> = {
    ascendant: 0,
    sun: 1,
    moon: 2,
    rahu: 3,
    ketu: 4
  };
  return map[key] ?? 100;
}

function encodeKarmic(raw: string): string {
  const value = raw.toLowerCase();
  if (value.includes('past')) return 'PL';
  if (value.includes('family')) return 'FL';
  if (value.includes('relation')) return 'RE';
  if (value.includes('career')) return 'CR';
  if (value.includes('spiritual')) return 'SP';
  if (value.includes('present')) return 'PR';
  return '~';
}

function encodeNadiMode(raw: string): string {
  const value = raw.toLowerCase();
  if (value.includes('mov')) return 'MV';
  if (value.includes('fix')) return 'FX';
  if (value.includes('dual')) return 'DU';
  return '~';
}

function encodeKala(raw: string): string {
  const value = raw.toLowerCase();
  if (value.includes('vipra')) return 'V1';
  if (value.includes('kshatriya')) return 'K2';
  if (value.includes('vaisya')) return 'V3';
  if (value.includes('sudra')) return 'S4';
  return '~';
}

// ── KP & Cuspal (#K, #H) ────────────────────────────────────────────

function formatKP(pkg: EnhancedCandidate): string {
  const kp = pkg.kpData?.planetSubLords || pkg.precision?.kpSubLords as KPPlanetSubMap | undefined;
  if (!kp || Object.keys(kp).length === 0) return '#K|~';

  const entries = Object.entries(kp)
    .sort((a, b) => planetSortWeight(a[0]) - planetSortWeight(b[0]))
    .map(([name, lords]) => {
      return `${getPlan(name)}[${getPlan(lords.starLord)}>${getPlan(lords.subLord)}>${getPlan(lords.subSubLord)}>${getPlan(lords.subSubSubLord || '~')}]`;
    });

  return `#K|${entries.join('|')}`;
}

function formatCuspal(pkg: EnhancedCandidate): string {
  const h = pkg.kpData?.cuspalSubLords || pkg.precision?.cuspalSubLords as KPCuspMap | undefined;
  if (!h || Object.keys(h).length === 0) return '#H|~';

  const entries = Object.entries(h)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([num, data]) => {
      return `${num}[${getSgn(data.sign)}|${getPlan(data.starLord)}>${getPlan(data.subLord)}>${getPlan(data.subSubLord)}]`;
    });

  return `#H|${entries.join('|')}`;
}

// ── Jaimini (#B) ─────────────────────────────────────────────────────

function formatJaimini(pkg: EnhancedCandidate): string {
  const s = pkg.vedicSignals;
  const karakas = s?.charaKarakas || [];
  if (karakas.length === 0) return '#B|~';

  const ak = getPlan(karakas.find((k) => k.karakaName === 'Atmakaraka')?.planet || '~');
  const amk = getPlan(karakas.find((k) => k.karakaName === 'Amatyakaraka')?.planet || '~');
  const dk = getPlan(karakas.find((k) => k.karakaName === 'Darakaraka')?.planet || '~');
  const vgCount = s?.vargottama?.length || 0;
  const pushkarCount = s?.pushkar?.length || 0;

  return `#B|AK=${ak}|AmK=${amk}|DK=${dk}|VG=${vgCount}|PU=${pushkarCount}`;
}

// ── Yogas (!YG) ──────────────────────────────────────────────────────

function formatYogas(pkg: EnhancedCandidate): string {
  const yogas = pkg.yogas;
  if (!yogas || (Array.isArray(yogas) ? yogas.length === 0 : Object.keys(yogas).length === 0)) return '!YG|~';

  const entries = (Array.isArray(yogas) ? yogas : Object.entries(yogas))
    .slice(0, 8)
    .map((y) => {
      const entry = y as { name?: string;
    yogaName?: string;
    nature?: string };
      const name = sanitizeToken(entry.name || entry.yogaName || String(y), 28);
      const nature = entry.nature ? sanitizeToken(String(entry.nature), 12) : '~';
return `${name}:${nature}`;
});
  return `!YG|${entries.join('|')}`;
}

// ── Chalit (!BC) ─────────────────────────────────────────────────────

function formatChalit(pkg: EnhancedCandidate): string {
  const cd = pkg.chalitDiscrepancies;
  if (!cd || !Array.isArray(cd) || cd.length === 0) return '!BC|~';
  const entries = cd.slice(0, 6).map((d) => {
    const item = d as { planet?: string; rasiHouse?: number; rashiHouse?: number; chalitHouse?: number };
    const planet = item.planet ? getPlan(String(item.planet)) : '~';
    const fromHouse = item.rashiHouse ?? item.rasiHouse ?? '~';
    const toHouse = item.chalitHouse ?? '~';
    return `${planet}:H${fromHouse}>H${toHouse}`;
  });
  return `!BC|${entries.join('|')}`;
}

// ── Dashas (#D) ──────────────────────────────────────────────────────

function formatDashas(pkg: EnhancedCandidate): string {
  const ds = pkg.vimshottariDasha;
  if (!ds || ds.length === 0) return '#D|~';

  const vim = ds
    .slice(0, 8)
    .map((d) => {
      const window = sanitizeToken(d.startEnd || '~', 28);
      return `VIM[${getPlan(d.maha)}|${getPlan(d.antar)}|${getPlan(d.pratyantar)}|${getPlan(d.sukshma || '~')}|${getPlan(d.prana || '~')}|${window}]`;
    })
    .join(';');

  const extras: string[] = [vim];
  if (pkg.yoginiDasha && pkg.yoginiDasha.length > 0) {
    extras.push(`YOG[${pkg.yoginiDasha.slice(0, 5).map((y) => getPlan(y.lord)).join(',')}]`);
  }
  if (pkg.charaDasha && pkg.charaDasha.length > 0) {
    extras.push(`CHR[${pkg.charaDasha.slice(0, 5).map((c) => getSgn(c.sign)).join(',')}]`);
  }
  // Kalachakra Dasha
  if (pkg.kalachakraDasha && pkg.kalachakraDasha.length > 0) {
    const kalEntries = pkg.kalachakraDasha.slice(0, 5).map((k) => {
      const lord = getPlan(k.lord || '~');
      const sign = k.sign ? getSgn(k.sign) : '~';
      const window = k.startDate && k.endDate
        ? `${k.startDate.toISOString().slice(0, 10)}~${k.endDate.toISOString().slice(0, 10)}`
        : sanitizeToken('~', 22);
      return `KAL[${lord}|${sign}|${window}]`;
    }).join(';');
    extras.push(kalEntries);
  }

  return `#D|${extras.join('|')}`;
}

// ── Transits (#T) ────────────────────────────────────────────────────

function formatTransits(pkg: EnhancedCandidate): string {
  const t = pkg.transitData;
  if (!t || Object.keys(t).length === 0) return '#T|~';

  const entries = Object.entries(t)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => {
      const dt = data.doubleTransit?.isTriggered ? '1' : '0';
      const dasha = sanitizeToken((data.dasha || '~').split('-').slice(0, 3).join('-'), 26);
      const signatures = Array.isArray(data.signatures) && data.signatures.length > 0
        ? data.signatures.slice(0, 2).map((sig) => sanitizeToken(sig, 20)).join('&')
        : '~';
      const keyPlanets = extractKeyTransitPlanets(data.planets || {});
      return `${date}[DT${dt}|${dasha}|${signatures}|${keyPlanets}]`;
    });

  return `#T|${entries.join('|')}`;
}

function extractKeyTransitPlanets(planets: Record<string, string>): string {
  const keys = ['Jupiter', 'Saturn', 'Mars', 'Rahu', 'Ketu'];
  const tokens = keys
    .map((key) => planets[key] ? `${getPlan(key)}:${sanitizeToken(planets[key], 14)}` : '')
    .filter(Boolean);
  return tokens.length > 0 ? tokens.join(',') : '~';
}

// ── Spouse (!S) ─────────────────────────────────────────────────────

function formatSpouse(pkg: EnhancedCandidate): string {
  const s = pkg.spouseMatch;
  const spouseD9 = pkg.spouseD9Verification as Record<string, unknown> | undefined;
  if (!s && !spouseD9) return '!S|~';

  const lagna = s ? (s.lagnaMatch ? '1' : '0') : '~';
  const moon = s ? (s.moonMatch ? '1' : '0') : '~';
  const score = s?.score ?? spouseD9?.score ?? '~';
  const d9Lock = typeof spouseD9?.isMatch === 'boolean'
    ? (spouseD9.isMatch ? '1' : '0')
    : '~';
  const reason = sanitizeToken(String(s?.reason || spouseD9?.reason || '~'), 42);

  return `!S|Lag=${lagna}|Moon=${moon}|Score=${score}|D9=${d9Lock}|Why=${reason}`;
}

// ── Helpers ──────────────────────────────────────────────────────────

function sortPlanetEntries(planets: Record<string, PlanetData>): Array<[string, PlanetData]> {
  return Object.entries(planets).sort((a, b) => planetSortWeight(a[0]) - planetSortWeight(b[0]));
}

function planetSortWeight(planet: string): number {
  const key = planet.toLowerCase();
  const idx = PLANET_ORDER.indexOf(key);
  return idx >= 0 ? idx : 100;
}

function extractNamedValue(value: unknown): string {
  if (typeof value === 'string') return sanitizeToken(value);
  if (value && typeof value === 'object' && 'name' in value) {
    return sanitizeToken(String((value as { name?: string }).name || '~'));
  }
  return '~';
}

function normalizeDignity(value: string | undefined): string {
  const lower = String(value || '').toLowerCase();
  if (lower.includes('exalt')) return 'Exc';
  if (lower.includes('debil')) return 'Deb';
  if (lower.includes('own')) return 'Own';
  if (lower.includes('moola')) return 'Moo';
  if (lower.includes('friend')) return 'Fr';
  if (lower.includes('enemy')) return 'En';
  return sanitizeToken(String(value || 'Neu'), 3);
}

function parseVargaValue(raw: string): { sign: string; degree: string } {
  const trimmed = raw.trim();
  const [first = '~', ...rest] = trimmed.split(/\s+/);
  const degree = rest.join(' ') || '~';
  return { sign: first, degree: sanitizeToken(degree, 18) };
}

function shortVargaKey(key: string): string {
  if (key === 'Ascendant') return 'Asc';
  return getPlan(key);
}

function sanitizeToken(value: unknown, maxLength: number = 48): string {
  const cleaned = String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[|[\]<>]/g, '/')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '~';
  return cleaned.length > maxLength ? `${cleaned.slice(0, Math.max(0, maxLength - 3))}...` : cleaned;
}

function toFixedSafe(value: number, digits: number): string {
  return Number.isFinite(value) ? value.toFixed(digits) : '0.0';
}

/**
 * Helper to get sign abbreviation
 */
export function getSgn(sign: string): string {
  const signs: Record<string, string> = {
    Aries: 'Ar',
    Taurus: 'Ta',
    Gemini: 'Ge',
    Cancer: 'Cn',
    Leo: 'Le',
    Virgo: 'Vi',
    Libra: 'Li',
    Scorpio: 'Sc',
    Sagittarius: 'Sg',
    Capricorn: 'Cp',
    Aquarius: 'Aq',
    Pisces: 'Pi'
  };
  return signs[sign] || sanitizeToken(sign, 3);
}

/**
 * Helper to get planet abbreviation
 */
export function getPlan(planet: string): string {
  if (!planet) return '~';
  const p = planet.charAt(0).toUpperCase() + planet.slice(1).toLowerCase();
  const planets: Record<string, string> = {
    Sun: 'Su',
    Moon: 'Mo',
    Mars: 'Ma',
    Mercury: 'Me',
    Jupiter: 'Ju',
    Venus: 'Ve',
    Saturn: 'Sa',
    Rahu: 'Ra',
    Ketu: 'Ke',
    Ascendant: 'As'
  };
  return planets[p] || sanitizeToken(p, 3);
}
