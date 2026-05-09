/**
 * ============================================================================
 *  Express API Encryption — Thin wrapper around @ai-pandit/shared
 * ============================================================================
 *
 * All crypto logic lives in @ai-pandit/shared/src/encryption.ts.
 * This module only:
 *   1. Retrieves the ENCRYPTION_SECRET from centralized config
 *   2. Re-exports shared functions with the secret pre-bound
 *   3. Maintains backward-compatible function signatures
 *
 * IMPORTANT: The DANGER_DO_NOT_MODIFY.ts file is NO LONGER the authority.
 * It is kept for reference only. All new code must use this module.
 */

import { config } from '../../config/index.js';
import {
  encrypt as sharedEncrypt,
  decrypt as sharedDecrypt,
  safeEncrypt as sharedSafeEncrypt,
  safeDecrypt as sharedSafeDecrypt,
  safeDecryptWithFallback as sharedSafeDecryptWithFallback,
  encryptObject as sharedEncryptObject,
  decryptObject as sharedDecryptObject,
  isEncrypted,
  parseSensitiveField as sharedParseSensitiveField,
} from '@ai-pandit/shared';

// ── Secret resolution (from centralized config) ─────────────────────────────

function getEncryptionSecret(): string {
  return config.security.encryptionSecret;
}

function getAllEncryptionSecrets(): string[] {
  return [config.security.encryptionSecret];
}

// ── Core encrypt/decrypt (backward-compatible signatures) ──────────────────

export function encryptData(plaintext: string, userId: string): string {
  return sharedEncrypt(plaintext, userId, getEncryptionSecret());
}

export function decryptData(encryptedString: string, userId: string): string {
  return sharedDecrypt(encryptedString, userId, getAllEncryptionSecrets());
}

// ── Safe wrappers ──────────────────────────────────────────────────────────

export function safeEncrypt(plaintext: string, userId: string): string | null {
  return sharedSafeEncrypt(plaintext, userId, getEncryptionSecret());
}

export function safeDecrypt(encryptedString: string, userId: string): string | null {
  return sharedSafeDecrypt(encryptedString, userId, getAllEncryptionSecrets());
}

// Wrapped safeDecryptWithFallback — pre-binds secrets for backward compat
export function safeDecryptWithFallback(
  data: string | null | undefined,
  primaryId: string,
  secondaryId?: string,
): string | null {
  return sharedSafeDecryptWithFallback(data, primaryId, secondaryId, getAllEncryptionSecrets());
}
// ── Object encryption ──────────────────────────────────────────────────────

export function encryptObject<T extends Record<string, unknown>>(
  obj: T,
  userId: string,
): string {
  return sharedEncryptObject(obj, userId, getEncryptionSecret());
}

export function decryptObject<T extends Record<string, unknown>>(
  encryptedString: string,
  userId: string,
): T {
  return sharedDecryptObject(encryptedString, userId, getAllEncryptionSecrets());
}

// ── Unified parseSensitiveField ────────────────────────────────────────────

/**
 * Parse a sensitive field.
 *
 * Decryption strategy (backward compatible):
 *   1. Try clerkId first (legacy API encryption key)
 *   2. Fall back to internalUserId / UUID (new standard, Web BFF encryption key)
 *
 * This ensures API can read data encrypted by BOTH the old API code
 * and the new shared-standard code.
 */
export function parseSensitiveField<T = unknown>(
  data: string | null | undefined,
  clerkId: string,
  internalUserId: string,
  defaultValue: T | null = null,
): T | string | null {
  // NOTE: We pass clerkId as primary and internalUserId as secondary
  // to maintain backward compatibility with existing API-encrypted data.
  // Once all data is migrated to UUID-based encryption, swap the order.
  return sharedParseSensitiveField<T>(
    data,
    clerkId,
    internalUserId,
    getAllEncryptionSecrets(),
    defaultValue,
  ) as T | string | null;
}

export { isEncrypted, sharedParseSensitiveField as sharedParseField };
