import { describe, it, expect } from 'vitest';
import {
    calculateCharaKarakas,
    calculateJaiminiAspects,
    calculateBhriguBindu
} from '../../jaimini-astrology.js';
import { EphemerisData } from '@ai-pandit/shared';

describe('God-Tier BTR - Jaimini Astrology', () => {

    const createMockEphemeris = (planetsData: Record<string, { longitude: number; sign: string }>): EphemerisData => {
        return {
            planets: planetsData,
            ascendant: { longitude: 15, sign: 'Aries' },
            houses: [],
            divisionalCharts: {}
        } as unknown as EphemerisData;
    };

    it('should correctly calculate Chara Karakas (AK, AmK, etc.) based on degrees', () => {
        const mockEph = createMockEphemeris({
            sun: { longitude: 29.5, sign: 'Aries' }, // 29.5
            moon: { longitude: 55.1, sign: 'Taurus' }, // 25.1
            mars: { longitude: 108.0, sign: 'Cancer' }, // 18.0
            mercury: { longitude: 134.5, sign: 'Leo' }, // 14.5
            jupiter: { longitude: 190.2, sign: 'Libra' }, // 10.2
            venus: { longitude: 215.5, sign: 'Scorpio' }, // 5.5
            saturn: { longitude: 331.1, sign: 'Pisces' } // 1.1
        });

        const karakas = calculateCharaKarakas(mockEph);

        expect(karakas.length).toBe(7);
        expect(karakas[0].karakaName).toBe('Atmakaraka');
        expect(karakas[0].planet).toBe('sun');
        expect(karakas[1].karakaName).toBe('Amatyakaraka');
        expect(karakas[1].planet).toBe('moon');
        expect(karakas[6].karakaName).toBe('Darakaraka');
        expect(karakas[6].planet).toBe('saturn');
    });

    it('should calculate Jaimini Aspects correctly (Movable -> Fixed except adjacent)', () => {
        const mockEph = createMockEphemeris({
            sun: { longitude: 15, sign: 'Aries' }, // Movable (0)
            moon: { longitude: 45, sign: 'Taurus' }, // Fixed (1)
            mars: { longitude: 135, sign: 'Leo' }, // Fixed (4)
        });

        const aspects = calculateJaiminiAspects(mockEph);

        // Aries (Movable) aspects Leo, Scorpio, Aquarius (Fixed), but NOT Taurus (adjacent)
        const ariesAspects = aspects.filter(a => a.fromSign === 'Aries');
        // It aspects Leo where Mars is
        const ariesToLeo = ariesAspects.find(a => a.toSign === 'Leo');
        expect(ariesToLeo).toBeDefined();

        // It should NOT aspect Taurus
        const ariesToTaurus = ariesAspects.find(a => a.toSign === 'Taurus');
        expect(ariesToTaurus).toBeUndefined();
    });

    it('should accurately calculate Bhrigu Bindu (Destiny Point)', () => {
        const mockEph = createMockEphemeris({
            moon: { longitude: 30, sign: 'Taurus' },
            rahu: { longitude: 90, sign: 'Cancer' },
            ketu: { longitude: 270, sign: 'Capricorn' }
        });

        const bb = calculateBhriguBindu(mockEph);

        expect(bb.bhriguBindu).toBeCloseTo(60);
        expect(bb.sign).toBe('Gemini');
        expect(bb.degree).toBeCloseTo(0);
    });

    it('should calculate Bhrigu Bindu with crossing 0/360 boundary (short arc)', () => {
        const mockEph = createMockEphemeris({
            moon: { longitude: 10, sign: 'Aries' },
            rahu: { longitude: 330, sign: 'Pisces' },
            ketu: { longitude: 150, sign: 'Virgo' }
        });

        const bb = calculateBhriguBindu(mockEph);

        expect(bb.bhriguBindu).toBeCloseTo(350);
        expect(bb.sign).toBe('Pisces');
    });
});
