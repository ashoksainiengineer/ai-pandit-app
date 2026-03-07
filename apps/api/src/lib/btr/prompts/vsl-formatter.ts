/**
 * VSL 4.0 Formatter (God-Spec)
 * ===========================
 * 
 * Specialized library for transforming exhaustive CandidateDataPackages 
 * into compact, lossless Vedic Shorthand Language (VSL) 4.0.
 */

import { CandidateDataPackage, PlanetData, VimshottariDashaEntry } from '@ai-pandit/shared';

// Type for enhanced candidate containing precision logic
export interface EnhancedCandidate extends CandidateDataPackage {
    precision?: any;
    kpData?: any;
}

/**
 * Main entry point for VSL formatting.
 */
export function formatCandidateVSL(pkg: EnhancedCandidate): string {
    const segments: string[] = [];

    // #C: Consensus & Quality
    segments.push('#C');
    segments.push(formatConsensus(pkg));

    // #P: Panchanga & Elementals
    segments.push('#P');
    segments.push(formatPanchanga(pkg));

    // #L: Lagna Profile
    segments.push('#L');
    segments.push(formatLagna(pkg));

    // #M: Planetary Matrix
    segments.push('#M');
    segments.push(formatMatrix(pkg));

    // #V: Varga Snapshot
    segments.push(formatVargas(pkg));

    // #N: Nadi Amsha
    segments.push(formatNadi(pkg));

    // #K: KP Precision
    segments.push(formatKP(pkg));

    // #H: KP Cuspal Lords
    segments.push(formatCuspal(pkg));

    // #B: Jaimini Indicators
    segments.push(formatJaimini(pkg));

    // #D: Dasha Sequence
    segments.push(formatDashas(pkg));

    // #T: Transit Signatures
    segments.push(formatTransits(pkg));

    // #S: Spouse Resonance
    segments.push('#S');
    segments.push(formatSpouse(pkg));

    return segments.join('\n');
}

function formatConsensus(pkg: EnhancedCandidate): string {
    const c = pkg.precision?.consensus;
    if (!c) return '!C|~';

    const flags: string[] = [];
    if (c.redFlags?.sandhiBirth) flags.push('SN');
    if (c.redFlags?.gandanta) flags.push('GD');
    if (c.redFlags?.dashaSandhi) flags.push('DS');
    if (c.redFlags?.conflictingMethods) flags.push('CM');
    if (c.redFlags?.weakSignificators) flags.push('WS');
    if (c.redFlags?.d60Instability) flags.push('D60');
    if (c.redFlags?.forensicMismatch) flags.push('FM');

    const confMap: Record<string, string> = { 'STANDARD_PRECISION': 'H', 'VERY_HIGH': 'H', 'HIGH': 'M', 'MEDIUM': 'M', 'LOW': 'L' };
    const conf = confMap[c.confidenceLevel] || 'L';

    return `!C|${c.overallConsensus}|${conf}|${c.marginOfError}|${flags.join(',') || '~'}`;
}

function formatPanchanga(pkg: EnhancedCandidate): string {
    const p = pkg.panchanga;
    const s = pkg.vedicSignals;
    if (!p) return '!P|~';

    // Handle extraction from objects or strings (resilience)
    const tithi = typeof (p as any).tithi === 'object' ? (p as any).tithi.name : p.tithi;
    const yoga = typeof (p as any).yoga === 'object' ? (p as any).yoga.name : p.yoga;
    const karana = typeof (p as any).karana === 'object' ? (p as any).karana.name : p.karana;
    const vara = (p as any).vara || (p as any).weekday || '~';

    const tsChar = s?.tatwa?.element ? s.tatwa.element[0] : '~';
    const klBit = s?.kundaLagna?.matchesMoon ? '1' : '0';

    return `!P|${tithi}|${yoga}|${String(karana || '').slice(0, 2)}|${String(vara || '').slice(0, 3)}|${tsChar}|${klBit}`;
}

function formatLagna(pkg: EnhancedCandidate): string {
    const l = pkg.ascendant;
    if (!l) return '!L|~';
    // Ascendant degree is a string in shared package
    return `!L|${getSgn(l.sign)}|${l.degree}|~|~|~`;
}

function formatMatrix(pkg: EnhancedCandidate): string {
    const planets = pkg.planets;
    if (!planets) return '!M|~';

    const entries = Object.entries(planets).map(([name, p]: [string, PlanetData]) => {
        let dig = String(p.dignity || '').slice(0, 3) || 'Neu';
        if (dig === 'Exa') dig = 'Exc';
        const retro = p.isRetro ? '1' : '0';
        return `${getPlan(name)}[${getSgn(p.sign)}|${p.degree}|~|${p.house}|${dig}|${p.shadbala?.toFixed(1) || '~'}|~|${retro}]`;
    });

    return `!M|${entries.join('|')}`;
}

function formatVargas(pkg: EnhancedCandidate): string {
    if (pkg.vargaDegrees) {
        // Stage 4/6 uses vargaDegrees mapping
        const entries = Object.entries(pkg.vargaDegrees).map(([chart, data]) => {
            const signList = Object.values(data).map((deg) => {
                // Simple extraction of sign from "Sign Deg:Min:Sec" or similar if possible
                return deg.split(' ')[0].slice(0, 2);
            }).join('|');
            return `${chart}[${signList}]`;
        });
        return `#V|${entries.join('|')}`;
    }

    // Fallback to DivisionalChartData structure
    const formatVargaRow = (name: string, data: any) => {
        if (!data?.planets) return '';
        const signList = Object.values(data.planets).map((p: any) => typeof p === 'string' ? getSgn(p) : getSgn(p.sign)).join('|');
        return `${name}[${signList}]`;
    };

    const d9Row = formatVargaRow('D9', pkg.d9Chart);
    const d10Row = formatVargaRow('D10', pkg.d10Chart);
    const d60Row = pkg.d60Sign ? `D60[${getSgn(pkg.d60Sign)}]` : '';

    return `#V|${d9Row}|${d10Row}|${d60Row}`;
}

function formatNadi(pkg: EnhancedCandidate): string {
    const n = pkg.nadiData;
    if (!n) return '#N|~';

    const entries = Object.entries(n).map(([key, data]: [string, any]) => {
        const karmicMap: Record<string, string> = { 'Present': 'PR', 'Past Life': 'PL', 'Family': 'FL', 'Relation': 'RE' };
        const k = karmicMap[data.karmicSignificance] || '~';
        const label = key === 'ascendant' ? 'As' : getPlan(key);
        return `${label}[${data.index}|${data.deity}|${k}]`;
    });

    return `#N|${entries.join('|')}`;
}

function formatKP(pkg: EnhancedCandidate): string {
    const kp = pkg.kpData?.planetSubLords;
    if (!kp) return '#K|~';

    const entries = Object.entries(kp).map(([name, lords]: [string, any]) => {
        return `${getPlan(name)}[${getPlan(lords.starLord)}|${getPlan(lords.subLord)}|${getPlan(lords.subSubLord)}|${getPlan(lords.subSubSubLord)}]`;
    });

    return `#K|${entries.join('|')}`;
}

function formatCuspal(pkg: EnhancedCandidate): string {
    const h = pkg.kpData?.cuspalSubLords;
    if (!h) return '#H|~';

    const entries = Object.entries(h).map(([num, data]: [string, any]) => {
        return `${num}[${getSgn(data.sign)}|${getPlan(data.starLord)}|${getPlan(data.subLord)}|${getPlan(data.subSubLord)}]`;
    });

    return `#H|${entries.join('|')}`;
}

function formatJaimini(pkg: EnhancedCandidate): string {
    const s = pkg.vedicSignals;
    if (!s?.charaKarakas) return '#B|~';

    const ak = getPlan(s.charaKarakas.find((k: any) => k.karakaName === 'Atmakaraka')?.planet || '~');
    const amk = getPlan(s.charaKarakas.find((k: any) => k.karakaName === 'Amatyakaraka')?.planet || '~');
    const dk = getPlan(s.charaKarakas.find((k: any) => k.karakaName === 'Darakaraka')?.planet || '~');

    return `#B|${ak}|${amk}|${dk}|~|~`;
}

function formatDashas(pkg: EnhancedCandidate): string {
    const ds = pkg.vimshottariDasha;
    if (!ds || ds.length === 0) return '#D|~';

    // Current dasha is usually the first one or we pick based on date
    const d = ds[0];
    const vim = `VIM[${getPlan(d.maha)}|${getPlan(d.antar)}|${getPlan(d.pratyantar)}|${getPlan(d.sukshma)}|${getPlan(d.prana)}]`;

    return `#D|${vim}`;
}

function formatTransits(pkg: EnhancedCandidate): string {
    const t = pkg.transitData;
    if (!t) return '#T|~';

    const entries = Object.entries(t).map(([date, data]: [string, any]) => {
        const dt = data.doubleTransit?.isTriggered ? '1' : '0';
        return `${date}[${dt}|~|~|~]`;
    });

    return `#T|${entries.join('|')}`;
}

function formatSpouse(pkg: EnhancedCandidate): string {
    const s = pkg.spouseMatch;
    if (!s) return '!S|~';

    const m = (val: boolean) => val ? '1' : 'X';

    return `!S|Lagna[${m(s.lagnaMatch)}]|Moon[${m(s.moonMatch)}]|Venus[~]|D9Lag[~]`;
}

/**
 * Helper to get sign abbreviation
 */
export function getSgn(sign: string): string {
    const signs: Record<string, string> = {
        'Aries': 'Ar', 'Taurus': 'Ta', 'Gemini': 'Ge', 'Cancer': 'Ca',
        'Leo': 'Le', 'Virgo': 'Vi', 'Libra': 'Li', 'Scorpio': 'Sc',
        'Sagittarius': 'Sg', 'Capricorn': 'Cp', 'Aquarius': 'Aq', 'Pisces': 'Pi'
    };
    return signs[sign] || sign;
}

/**
 * Helper to get planet abbreviation
 */
export function getPlan(planet: string): string {
    if (!planet) return '~';
    const p = planet.charAt(0).toUpperCase() + planet.slice(1).toLowerCase();
    const planets: Record<string, string> = {
        'Sun': 'Su', 'Moon': 'Mo', 'Mars': 'Ma', 'Mercury': 'Me',
        'Jupiter': 'Ju', 'Venus': 'Ve', 'Saturn': 'Sa', 'Rahu': 'Ra', 'Ketu': 'Ke'
    };
    return planets[p] || p;
}
