import { describe, it, expect } from 'vitest';
import { calculateD150Nadi } from '../../nadi-amsha.js';

describe('God-Tier BTR - Nadi Amsha (D150)', () => {

    it('should split signs into exact 0.2 degree (12 arc minute) spans', () => {
        const nadi1 = calculateD150Nadi(0.05);
        expect(nadi1.index).toBe(1);
        expect(nadi1.sign).toBe('Aries');

        const nadi2 = calculateD150Nadi(30.25);
        // Taurus is a fixed sign: numbering is reverse (150 -> 1)
        expect(nadi2.index).toBe(149);

        const nadiLibra = calculateD150Nadi(195.05);
        expect(nadiLibra.index).toBe(76);
        expect(nadiLibra.sign).toBe('Libra');
    });

    it('should follow canonical movable/fixed/dual counting and integer indexing', () => {
        const movable = calculateD150Nadi(0.05);    // Aries start
        const fixed = calculateD150Nadi(30.05);     // Taurus start
        const dual = calculateD150Nadi(60.05);      // Gemini start

        expect(movable.index).toBe(1);
        expect(fixed.index).toBe(150);
        expect(dual.index).toBe(76);
        expect(Number.isInteger(movable.index)).toBe(true);
        expect(Number.isInteger(fixed.index)).toBe(true);
        expect(Number.isInteger(dual.index)).toBe(true);
        expect(movable.nadiName).toBe('Nadi 1');
        expect(fixed.nadiName).toBe('Nadi 150');
        expect(dual.nadiName).toBe('Nadi 76');
    });

    it('should have exact bounds for karmic significance', () => {
        const amsha = calculateD150Nadi(8.5);
        expect(amsha.index).toBe(43);
        expect(amsha.deity).toBeDefined();
        expect(amsha.karmicSignificance).toBeDefined();
        expect(amsha.timeResolution).toBe(48);
    });

    it('should expose 3-arcminute kala quarters for sub-segment precision', () => {
        const q1 = calculateD150Nadi(0.01);
        const q2 = calculateD150Nadi(0.06);
        const q3 = calculateD150Nadi(0.11);
        const q4 = calculateD150Nadi(0.16);

        expect(q1.kala).toBe('Vipra');
        expect(q2.kala).toBe('Kshatriya');
        expect(q3.kala).toBe('Vaisya');
        expect(q4.kala).toBe('Sudra');
    });

});
