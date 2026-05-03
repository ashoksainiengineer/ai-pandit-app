import { describe, it, expect } from 'vitest';
import { CATEGORY_ICONS } from '../../components/rectify/ForensicQuizEngine/constants';

describe('CATEGORY_ICONS', () => {
  it('has all expected categories', () => {
    expect(CATEGORY_ICONS.prakriti).toBeDefined();
    expect(CATEGORY_ICONS.forehead).toBeDefined();
    expect(CATEGORY_ICONS.eyes).toBeDefined();
    expect(CATEGORY_ICONS.voice).toBeDefined();
  });

  it('each category maps to a React component', () => {
    for (const icon of Object.values(CATEGORY_ICONS)) {
      expect(typeof icon).toBe('object');
    }
  });
});
