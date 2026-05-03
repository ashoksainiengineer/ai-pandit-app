/**
 * Safe JSON parse that returns fallback instead of throwing.
 * Use when parsing untrusted/optional JSON where malformed data
 * should be treated as "not present" rather than a fatal error.
 */
export function safeJsonParse<T>(input: string, fallback: T): T {
  try {
    return JSON.parse(input) as T;
  } catch {
    return fallback;
  }
}
