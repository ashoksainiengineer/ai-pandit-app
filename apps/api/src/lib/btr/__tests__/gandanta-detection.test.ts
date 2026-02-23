import { describe, it, expect } from 'vitest';
import { detectGandanta } from '../../gandanta-detection.js';

describe('God-Tier BTR - Gandanta Detection (Karmic Knots)', () => {

    it('should detect Moksha Gandanta (Pisces-Aries junction) perfectly', () => {
        const piscesEnd = detectGandanta(359.9, 50.0);
        expect(piscesEnd.isLagnaGandanta).toBe(true);
        expect(piscesEnd.lagnaGandantaType).toBe('moksha');
        expect(piscesEnd.severity).toBe('critical');

        const ariesStart = detectGandanta(0.2, 50.0);
        expect(ariesStart.isLagnaGandanta).toBe(true);
        expect(ariesStart.lagnaGandantaType).toBe('moksha');

        const ariesMid = detectGandanta(15.0, 50.0);
        expect(ariesMid.isLagnaGandanta).toBe(false);
    });

    it('should detect Rajas Gandanta (Cancer-Leo)', () => {
        const cancerEnd = detectGandanta(119.5, 90.0);
        expect(cancerEnd.isLagnaGandanta).toBe(true);
        expect(cancerEnd.lagnaGandantaType).toBe('rajas');

        const leoStart = detectGandanta(50.0, 120.1);
        expect(leoStart.isMoonGandanta).toBe(true);
        expect(leoStart.moonGandantaType).toBe('rajas');
    });

    it('should detect Tamas Gandanta (Scorpio-Sagittarius)', () => {
        const doubleTamas = detectGandanta(239.8, 240.3);
        expect(doubleTamas.isLagnaGandanta).toBe(true);
        expect(doubleTamas.isMoonGandanta).toBe(true);
        expect(doubleTamas.lagnaGandantaType).toBe('tamas');
        expect(doubleTamas.moonGandantaType).toBe('tamas');
        expect(doubleTamas.severity).toBe('critical');
    });

    it('should correctly handle negative or extreme longitudes via wrap around', () => {
        const negDegree = detectGandanta(-0.5, 120);
        expect(negDegree.isLagnaGandanta).toBe(true);
        expect(negDegree.isMoonGandanta).toBe(true);
    });
});
