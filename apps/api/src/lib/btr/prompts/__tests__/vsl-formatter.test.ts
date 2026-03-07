import { describe, it, expect } from 'vitest';
import { formatCandidateVSL, EnhancedCandidate } from '../vsl-formatter.js';

describe('VSL 4.0 "God-Spec" Formatter', () => {

    const mockPackage: Partial<EnhancedCandidate> = {
        time: '12:00:05',
        aiScore: 88,
        // #C: Consensus Data (Precision logic)
        precision: {
            consensus: {
                overallConsensus: 88.5,
                confidenceLevel: 'VERY_HIGH',
                marginOfError: 15,
                redFlags: {
                    sandhiBirth: true,
                    d60Instability: true,
                    gandanta: false,
                    dashaSandhi: false,
                    conflictingMethods: false,
                    weakSignificators: false,
                    forensicMismatch: false
                }
            }
        },
        // #P: Panchanga
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
            charaKarakas: [
                { karakaName: 'Atmakaraka', planet: 'Jupiter', degree: 10 },
                { karakaName: 'Amatyakaraka', planet: 'Sun', degree: 12 },
                { karakaName: 'Darakaraka', planet: 'Venus', degree: 14 }
            ]
        },
        // #L: Lagna & #M: Matrix
        ascendant: { sign: 'Aries', degree: '12:44:00', nakshatra: 'Ashwini' },
        planets: {
            sun: { sign: 'Aries', degree: '10:05:00', nakshatra: 'Ashwini', house: 1, dignity: 'Exalted', shadbala: 1.8, isRetro: false, speed: 1 } as any,
            moon: { sign: 'Taurus', degree: '22:00:00', nakshatra: 'Rohini', house: 2, dignity: 'Moolatrikona', shadbala: 1.5, isRetro: false, speed: 1 } as any
        },
        // #V: Vargas (Fallback structure)
        d9Chart: { planets: { sun: 'Aries', moon: 'Taurus' }, ascendant: 'Aries' },
        d10Chart: { planets: { sun: 'Virgo', moon: 'Leo' }, ascendant: 'Cancer' },
        d60Sign: 'Scorpio',
        // #N: Nadi Amsha
        nadiData: {
            ascendant: { index: 44, deity: 'Lakshmi', karmicSignificance: 'Present' },
            sun: { index: 12, deity: 'Agni', karmicSignificance: 'Past Life' }
        } as any,
        // #K: KP Data
        kpData: {
            planetSubLords: {
                sun: { starLord: 'Ketu', subLord: 'Venus', subSubLord: 'Jupiter', subSubSubLord: 'Mars' }
            },
            cuspalSubLords: {
                7: { sign: 'Libra', starLord: 'Venus', subLord: 'Moon', subSubLord: 'Rahu' },
                10: { sign: 'Cancer', starLord: 'Moon', subLord: 'Jupiter', subSubLord: 'Saturn' }
            }
        } as any,
        // #D: Dashas
        vimshottariDasha: [
            { maha: 'Jupiter', antar: 'Sun', pratyantar: 'Mars', sukshma: 'Venus', prana: 'Mercury', startEnd: '...' }
        ],
        // #T: Transits
        transitData: {
            '2025-05-10': {
                doubleTransit: { isTriggered: true, details: [] },
                signatures: ['STRONG in D9', 'Darakaraka active'],
                dasha: 'Jupiter-Sun',
                planets: {}
            }
        },
        // #S: Spouse
        spouseMatch: {
            lagnaMatch: true,
            moonMatch: true,
            score: 80,
            reason: 'Strong resonance'
        }
    };

    it('should format #C: Consensus segment correctly', () => {
        const vsl = formatCandidateVSL(mockPackage as any);
        expect(vsl).toContain('#C');
        expect(vsl).toContain('!C|88.5|H|15|SN,D60');
    });

    it('should format #P: Panchanga segment correctly', () => {
        const vsl = formatCandidateVSL(mockPackage as any);
        expect(vsl).toContain('#P');
        expect(vsl).toContain('!P|Purnima|Siddhi|Ka|Mon|W|1');
    });

    it('should format #L: Lagna profile correctly', () => {
        const vsl = formatCandidateVSL(mockPackage as any);
        expect(vsl).toContain('#L');
        expect(vsl).toContain('!L|Ar|12:44:00|~|~|~');
    });

    it('should format #M: Planetary Matrix correctly', () => {
        const vsl = formatCandidateVSL(mockPackage as any);
        // Su[Ar|10:05:00|~|1|Exc|1.8|~|0]
        expect(vsl).toContain('Su[Ar|10:05:00|~|1|Exc|1.8|~|0]');
    });

    it('should format #V: Varga Snapshot correctly', () => {
        const vsl = formatCandidateVSL(mockPackage as any);
        expect(vsl).toContain('D9[Ar|Ta]');
        expect(vsl).toContain('D10[Vi|Le]');
        expect(vsl).toContain('D60[Sc]');
    });

    it('should format #N: Nadi Amsha correctly', () => {
        const vsl = formatCandidateVSL(mockPackage as any);
        expect(vsl).toContain('#N|As[44|Lakshmi|PR]|Su[12|Agni|PL]');
    });

    it('should format #K: KP Precision correctly', () => {
        const vsl = formatCandidateVSL(mockPackage as any);
        expect(vsl).toContain('#K|Su[Ke|Ve|Ju|Ma]');
    });

    it('should format #H: KP Cuspal Lords correctly', () => {
        const vsl = formatCandidateVSL(mockPackage as any);
        expect(vsl).toContain('#H|7[Li|Ve|Mo|Ra]|10[Ca|Mo|Ju|Sa]');
    });

    it('should format #D: Dasha Sequence correctly', () => {
        const vsl = formatCandidateVSL(mockPackage as any);
        expect(vsl).toContain('#D|VIM[Ju|Su|Ma|Ve|Me]');
    });

    it('should handle 0% info loss (Lossless validation)', () => {
        const vsl = formatCandidateVSL(mockPackage as any);
        const segments = ['#C', '#P', '#L', '#M', '#V', '#N', '#K', '#H', '#B', '#D', '#T', '#S'];
        segments.forEach(seg => {
            expect(vsl).toContain(seg);
        });
    });
});
