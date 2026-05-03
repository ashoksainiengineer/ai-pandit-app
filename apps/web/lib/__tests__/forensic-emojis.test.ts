import { describe, it, expect } from 'vitest';
import { FORENSIC_EMOJIS } from '../forensic-emojis';

describe('FORENSIC_EMOJIS', () => {
  it('contains forehead type emojis', () => {
    expect(FORENSIC_EMOJIS.broad).toBeDefined();
    expect(FORENSIC_EMOJIS.narrow).toBeDefined();
    expect(FORENSIC_EMOJIS.average).toBeDefined();
    expect(FORENSIC_EMOJIS.sloping).toBeDefined();
  });

  it('contains eye type emojis', () => {
    expect(FORENSIC_EMOJIS.deep_set).toBeDefined();
    expect(FORENSIC_EMOJIS.prominent).toBeDefined();
    expect(FORENSIC_EMOJIS.almond).toBeDefined();
    expect(FORENSIC_EMOJIS.round).toBeDefined();
  });

  it('every emoji set has male, female, and neutral variants', () => {
    for (const [key, set] of Object.entries(FORENSIC_EMOJIS)) {
      expect(set.male, `${key} missing male`).toBeDefined();
      expect(set.female, `${key} missing female`).toBeDefined();
      expect(set.neutral, `${key} missing neutral`).toBeDefined();
    }
  });
});
