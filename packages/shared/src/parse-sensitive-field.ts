/**
 * ============================================================================
 *  Unified parseSensitiveField — Single Source of Truth
 * ============================================================================
 *
 * Handles BOTH encrypted (v4) and plain JSON/string sensitive fields.
 * Used by Web BFF AND Express API with the exact same logic.
 *
 * Decryption strategy:
 *   1. Try primaryId (userId/UUID) first
 *   2. Fall back to secondaryId (clerkId) for backward compatibility
 *   3. If neither works, return the raw data or defaultValue
 *
 * Why this matters:
 *   Before this consolidation, Web BFF used only userId (UUID), Express API
 *   used clerkId first then userId. This mismatch caused sessions to be
 *   unreadable cross-boundary → 500 errors on dashboard.
 */

import {
  isEncrypted,
  safeDecryptWithFallback,
} from './encryption.js';

/**
 * Parse a sensitive field that may be encrypted (v4), plain JSON, or a raw string.
 *
 * @param data          - The field value (may be encrypted, JSON, plain string, or null/undefined).
 * @param primaryId     - Primary user ID for decryption (use internal UUID).
 * @param secondaryId   - Fallback user ID (use clerkId for backward compat with API-encrypted data).
 * @param secrets       - Master encryption secret(s) for decryption.
 * @param defaultValue  - Value to return if `data` is null/undefined.
 */
export function parseSensitiveField<T = unknown>(
  data: string | null | undefined,
  primaryId: string,
  secondaryId: string | undefined,
  secrets: string | string[],
  defaultValue: T | null = null,
): T | string | null {
  if (data == null) return defaultValue;

  // ── Try decryption first (v4 encrypted fields) ──────────────────────────
  if (isEncrypted(data)) {
    const decrypted = safeDecryptWithFallback(data, primaryId, secondaryId, secrets);
    if (decrypted) {
      try {
        return JSON.parse(decrypted) as T;
      } catch {
        // Decrypted but not JSON — return as string
        return decrypted as T;
      }
    }
    // Decryption failed — fall through to raw handling
    return (defaultValue ?? data) as T;
  }

  // ── Plain JSON or string (unencrypted) ─────────────────────────────────
  try {
    const parsed = JSON.parse(data);
    if (typeof parsed === 'object' && parsed !== null) return parsed as T;
    return data as T;
  } catch {
    return (data || defaultValue) as T;
  }
}

/**
 * Parse a sensitive field that MUST be a JSON object (throws on failure).
 */
export function parseSensitiveObject<T extends Record<string, unknown>>(
  data: string | null | undefined,
  primaryId: string,
  secondaryId: string | undefined,
  secrets: string | string[],
): T {
  const result = parseSensitiveField<T>(data, primaryId, secondaryId, secrets);
  if (result && typeof result === 'object') return result as T;
  throw new Error('Sensitive field is not a valid object');
}
