import { describe, it, expect } from 'vitest';
import { formatCandidateVSL, EnhancedCandidate } from '../vsl-formatter.js';

describe('VSL Formatter', () => {
  const mockPackage: Partial<EnhancedCandidate> = {
    time: '12:00:05',
    aiScore: 88,
    precision: {
      consensus: {
        overallConsensus: 88.5,
        confidenceLevel: 'VERY_HIGH',
        marginOfError: 15,
        redFlags: {
          sandhiBirth: true,
          d60Instability: true
        }
      }
    },
    panchanga: {
      tithi: 'Purnima',
      yoga: 'Siddhi',
      karana: 'Kaulava',
      vara: 'Monday',
      nakshatra: 'Rohini'
    },
    vedicSignals: {
      tatwa: { element: 'Water', name: 'Varuna', isAuspicious: true },
      kundaLagna: { matchesMoon: true, sign: 'Aries', degree: 12.44 },
      vargottama: ['Moon'],
      pushkar: ['Venus'],
      charaKarakas: [
        { karakaName: 'Atmakaraka', planet: 'Jupiter', degree: 10 },
        { karakaName: 'Amatyakaraka', planet: 'Sun', degree: 12 },
        { karakaName: 'Darakaraka', planet: 'Venus', degree: 14 }
      ]
    },
    ascendant: { sign: 'Aries', degree: '12:44:00', nakshatra: 'Ashwini' },
    moonNakshatra: 'Rohini',
    houseLords: { 1: 'Mars' },
    planets: {
      sun: { sign: 'Aries', degree: '10:05:00', nakshatra: 'Ashwini', house: 1, dignity: 'Exalted', shadbala: 1.8, isRetro: false, isCombust: false, speed: 1, longitude: 10.05 },
      moon: { sign: 'Taurus', degree: '22:00:00', nakshatra: 'Rohini', house: 2, dignity: 'Moolatrikona', shadbala: 1.5, isRetro: false, isCombust: false, speed: 1, longitude: 52 }
    },
    vargaDegrees: {
      D9: { Ascendant: 'Aries 10:10:10', Sun: 'Virgo 00:10:10', Moon: 'Taurus 12:11:10' },
      D60: { Ascendant: 'Scorpio 20:20:20', Sun: 'Cancer 11:00:00' },
      D150: { Ascendant: 'Pisces 00:20:00' }
    },
    d60Sign: 'Scorpio',
    d150Sign: 'Pisces',
    nadiData: {
      ascendant: { index: 44, nadiName: 'Nadi 44', deity: 'Lakshmi', karmicSignificance: 'Present life creation', phala: 'Wealthy', nadiMode: 'movable', kala: 'Vipra', timeResolution: 48 },
      sun: { index: 12, nadiName: 'Nadi 12', deity: 'Agni', karmicSignificance: 'Past life karma dominant', phala: 'Leader', nadiMode: 'fixed', kala: 'Kshatriya', timeResolution: 48 }
    } as any,
    kpData: {
      planetSubLords: {
        sun: { starLord: 'Ketu', subLord: 'Venus', subSubLord: 'Jupiter', subSubSubLord: 'Mars' }
      },
      cuspalSubLords: {
        7: { house: 7, cusp: 189.2, sign: 'Libra', starLord: 'Venus', subLord: 'Moon', subSubLord: 'Rahu' },
        10: { house: 10, cusp: 90.1, sign: 'Cancer', starLord: 'Moon', subLord: 'Jupiter', subSubLord: 'Saturn' }
      }
    },
    vimshottariDasha: [
      { maha: 'Jupiter', antar: 'Sun', pratyantar: 'Mars', sukshma: 'Venus', prana: 'Mercury', startEnd: '2015-01-01 to 2015-01-31' },
      { maha: 'Jupiter', antar: 'Sun', pratyantar: 'Rahu', sukshma: 'Moon', prana: 'Saturn', startEnd: '2015-02-01 to 2015-02-28' }
    ],
    yoginiDasha: [{ lord: 'Moon', startEnd: '2015-01-01 to 2016-01-01' }],
    charaDasha: [{ sign: 'Aries', startEnd: '2015-01-01 to 2016-01-01' }],
    transitData: {
      '2025-05-10#m1': {
        doubleTransit: { isTriggered: true, details: [] },
        signatures: ['STRONG in D9', 'Darakaraka active'],
        dasha: 'Jupiter-Sun-Mars-Mercury',
        planets: {
          Jupiter: 'Aries 01.0000° | H1',
          Saturn: 'Pisces 29.0000° | H12'
        }
      }
    },
    spouseMatch: {
      lagnaMatch: true,
      moonMatch: true,
      score: 80,
      reason: 'Strong resonance'
    }
  };

  it('serializes all core segments with dense payload', () => {
    const vsl = formatCandidateVSL(mockPackage as EnhancedCandidate);
    const segments = ['#C', '#P', '#L', '#M', '#V', '#N', '#K', '#H', '#B', '#D', '#T', '#S'];
    segments.forEach((segment) => expect(vsl).toContain(segment));
  });

  it('encodes consensus and panchanga with new confidence code + full nakshatra', () => {
    const vsl = formatCandidateVSL(mockPackage as EnhancedCandidate);
    expect(vsl).toContain('!C|88.5|VH|15|SN,D60');
    expect(vsl).toContain('!P|Purnima|Siddhi|Kaulava|Monday|Rohini|Water|KL1');
  });

  it('keeps matrix, nadi, kp and transits information-rich', () => {
    const vsl = formatCandidateVSL(mockPackage as EnhancedCandidate);
    expect(vsl).toContain('Su[Ar|10:05:00|Ashwini|H1|Exc|SB1.80');
    expect(vsl).toContain('#N|As[44|Nadi 44|Lakshmi|PR|Wealthy|MV|V1|48s]');
    expect(vsl).toContain('#K|Su[Ke>Ve>Ju>Ma]');
    expect(vsl).toContain('#H|7[Li|Ve>Mo>Ra]|10[Cn|Mo>Ju>Sa]');
    expect(vsl).toContain('#T|2025-05-10#m1[DT1|Jupiter-Sun-Mars|STRONG in D9&Darakaraka active|');
    expect(vsl).toContain('Ju:Aries 01.00...');
  });

  it('includes multi-entry dasha sequence with windows', () => {
    const vsl = formatCandidateVSL(mockPackage as EnhancedCandidate);
    expect(vsl).toContain('VIM[Ju|Su|Ma|Ve|Me|2015-01-01 to 2015-01-31]');
    expect(vsl).toContain('VIM[Ju|Su|Ra|Mo|Sa|2015-02-01 to 2015-02-28]');
    expect(vsl).toContain('YOG[Mo]');
    expect(vsl).toContain('CHR[Ar]');
  });

  it('derives fallback consensus when precision block is absent', () => {
    const vsl = formatCandidateVSL({
      ...(mockPackage as EnhancedCandidate),
      precision: undefined
    });
    expect(vsl).toContain('!C|');
    expect(vsl).not.toContain('!C|~');
  });
});
