/**
 * Array utility functions for common operations
 * Production-grade, type-safe implementations
 */
export function shuffleArray<T>(array: readonly T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
export function chunkArray<T>(array: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
export function uniqueArray<T>(array: readonly T[]): T[] {
  return [...new Set(array)];
}
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
