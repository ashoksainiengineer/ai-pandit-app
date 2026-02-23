import { describe, it, expect } from 'vitest';
import { calculateD150Nadi } from '../../nadi-amsha.js';

describe('God-Tier BTR - Nadi Amsha (D150)', () => {

    it('should split signs into exact 0.2 degree (12 arc minute) spans', () => {
        const nadi1 = calculateD150Nadi(0.05);
        expect(nadi1.index).toBe(1);
        expect(nadi1.sign).toBe('Aries');

        const nadi2 = calculateD150Nadi(0.25);
        expect(nadi2.index).toBe(2);

        const nadiLibra = calculateD150Nadi(195.05);
        expect(nadiLibra.index).toBe(76);
        expect(nadiLibra.sign).toBe('Libra');
    });

    it('should have exact bounds for karmic significance', () => {
        const amsha = calculateD150Nadi(8.5);
        expect(amsha.index).toBe(43);
        expect(amsha.deity).toBeDefined();
        expect(amsha.karmicSignificance).toBeDefined();
        expect(amsha.timeResolution).toBeCloseTo(4.8);
    });

});
