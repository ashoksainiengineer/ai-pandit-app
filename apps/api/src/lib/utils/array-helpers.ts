/**
 * Array utility functions for common operations
 * Production-grade, type-safe implementations
 */

/**
 * Shuffles an array in place using Fisher-Yates algorithm
 * Creates a new array to avoid mutating the original
 * @template T The type of array elements
 * @param array The array to shuffle
 * @returns A new shuffled array
 * @example
 * const shuffled = shuffleArray([1, 2, 3, 4, 5]);
 */
export function shuffleArray<T>(array: readonly T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Randomly sorts an array using Fisher-Yates shuffle for unbiased randomization.
 * Suitable for anti-bias shuffling in AI analysis.
 * @template T The type of array elements
 * @param array The array to randomize
 * @returns A new randomly sorted array
 * @example
 * const randomized = randomSort(candidates);
 */
 export function randomSort<T>(array: readonly T[]): T[] {
  return shuffleArray(array);
  }


/**
 * Splits an array into chunks of specified size
 * @template T The type of array elements
 * @param array The array to chunk
 * @param size The size of each chunk
 * @returns An array of chunks
 * @example
 * const batches = chunkArray([1, 2, 3, 4, 5], 2);
 * // [[1, 2], [3, 4], [5]]
 */
export function chunkArray<T>(array: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Filters unique values from an array
 * @template T The type of array elements
 * @param array The array to filter
 * @returns Array with only unique values
 * @example
 * const unique = uniqueArray([1, 2, 2, 3, 3, 3]);
 * // [1, 2, 3]
 */
export function uniqueArray<T>(array: readonly T[]): T[] {
  return [...new Set(array)];
}

/**
 * Groups array elements by a key function
 * @template T The type of array elements
 * @template K The type of the key
 * @param array The array to group
 * @param keyFn Function to extract the key from each element
 * @returns A Map with keys and arrays of grouped elements
 * @example
 * const grouped = groupBy([{type: 'a'}, {type: 'b'}, {type: 'a'}], x => x.type);
 * // Map { 'a' => [{type: 'a'}, {type: 'a'}], 'b' => [{type: 'b'}] }
 */
export function groupBy<T, K>(array: readonly T[], keyFn: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of array) {
    const key = keyFn(item);
    const existing = groups.get(key);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return groups;
}
