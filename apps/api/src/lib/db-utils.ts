/**
 * Shared database utility helpers.
 */

/**
 * Extract affected row count from a Drizzle mutation result.
 * Works across Drizzle drivers that may use rowCount or rowsAffected.
 */
export function getMutationRowCount(result: unknown): number {
  if (
    typeof result === 'object' &&
    result !== null &&
    'rowCount' in result &&
    typeof (result as { rowCount?: unknown }).rowCount === 'number'
  ) {
    return (result as { rowCount: number }).rowCount;
  }

  if (
    typeof result === 'object' &&
    result !== null &&
    'rowsAffected' in result &&
    typeof (result as { rowsAffected?: unknown }).rowsAffected === 'number'
  ) {
    return (result as { rowsAffected: number }).rowsAffected;
  }

  return 0;
}
