import { describe, it, expect } from 'vitest';
import { shuffleArray, chunkArray, uniqueArray, groupBy } from './array-helpers';

describe('shuffleArray', () => {
  it('returns same length', () => {
    expect(shuffleArray([1, 2, 3, 4, 5])).toHaveLength(5);
  });
  it('does not mutate original', () => {
    const arr = [1, 2, 3];
    shuffleArray(arr);
    expect(arr).toEqual([1, 2, 3]);
  });
});

describe('chunkArray', () => {
  it('chunks correctly', () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
});

describe('uniqueArray', () => {
  it('removes duplicates', () => {
    expect(uniqueArray([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
  });
});

describe('groupBy', () => {
  it('groups by key', () => {
    const result = groupBy([1, 2, 3, 4], (n) => n % 2 === 0 ? 'even' : 'odd');
    expect(result.get('even')).toEqual([2, 4]);
    expect(result.get('odd')).toEqual([1, 3]);
  });
});
