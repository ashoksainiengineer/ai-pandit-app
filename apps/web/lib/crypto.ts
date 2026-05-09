/**
 * ============================================================================
 *  Web BFF Encryption — Thin wrapper around @ai-pandit/shared
 * ============================================================================
 *
 * All crypto logic lives in @ai-pandit/shared/src/encryption.ts.
 * This module only:
 *   1. Manages the singleton ENCRYPTION_SECRET (loaded from env once at startup)
 *   2. Re-exports shared functions with the secret pre-bound for convenience
 *   3. Maintains backward-compatible function signatures
 */

import {
  encrypt as sharedEncrypt,
  decrypt as sharedDecrypt,
  safeEncrypt,
  safeDecrypt,
  safeDecryptWithFallback,
  encryptObject as sharedEncryptObject,
  decryptObject as sharedDecryptObject,
  isEncrypted,
  parseSensitiveField as sharedParseSensitiveField,
  parseSensitiveObject,
} from '@ai-pandit/shared';
import { env } from './config/env';
import { logger } from './logger';

// ── Singleton secret ────────────────────────────────────────────────────────

let ENCRYPTION_SECRET: string | undefined = env.security.encryptionSecret;

function getSecret(): string {
  if (!ENCRYPTION_SECRET) {
    throw new Error(
      'Encryption secret is not initialized. Call initializeEncryption() at startup.',
    );
  }
  return ENCRYPTION_SECRET;
}

export function initializeEncryption(secret: string | undefined) {
  if (!secret) {
    if (env.app.nextPhase !== 'phase-production-build') {
      logger.error('CRITICAL: ENCRYPTION_SECRET is not set. Encryption will fail.');
    }
    ENCRYPTION_SECRET = undefined;
  } else {
    ENCRYPTION_SECRET = secret;
    if (env.app.nextPhase !== 'phase-production-build') {
      logger.info('[Crypto] Encryption secret loaded');
    }
  }
}

// ── Backward-compatible wrappers (pre-bound secret) ────────────────────────

export function encrypt(plaintext: string, userId: string): string {
  return sharedEncrypt(plaintext, userId, getSecret());
}

export function decrypt(encryptedString: string, userId: string): string {
  return sharedDecrypt(encryptedString, userId, getSecret());
}

// ── Unified parseSensitiveField — delegates to shared ──────────────────────

/**
 * Parse a sensitive field — uses userId (UUID) as primary key,
 * clerkId as fallback for backward compatibility with API-encrypted data.
 */
export function parseSensitiveField<T = unknown>(
  data: string | null | undefined,
  userId: string,
  clerkId?: string,
  defaultValue?: T | null,
): T | null {
  return sharedParseSensitiveField<T>(
    data,
    userId,
    clerkId,
    getSecret(),
    defaultValue,
  ) as T | null;
}

// ── Wrapped exports (pre-bound secret, backward-compatible signatures) ────

export function encryptObject<T extends Record<string, unknown>>(obj: T, userId: string): string {
  return sharedEncryptObject(obj, userId, getSecret());
}

export function decryptObject<T extends Record<string, unknown>>(encryptedString: string, userId: string): T {
  return sharedDecryptObject(encryptedString, userId, getSecret());
}

function wrappedSafeEncrypt(plaintext: string, userId: string): string | null {
  return safeEncrypt(plaintext, userId, getSecret());
}

function wrappedSafeDecrypt(encryptedString: string, userId: string): string | null {
  return safeDecrypt(encryptedString, userId, getSecret());
}

function wrappedSafeDecryptWithFallback(
  data: string | null | undefined,
  primaryId: string,
  secondaryId?: string,
): string | null {
  return safeDecryptWithFallback(data, primaryId, secondaryId, getSecret());
}

export {
  wrappedSafeEncrypt as safeEncrypt,
  wrappedSafeDecrypt as safeDecrypt,
  wrappedSafeDecryptWithFallback as safeDecryptWithFallback,
  isEncrypted,
  parseSensitiveObject,
};

// ── Async key derivation (client-side) ─────────────────────────────────────

import { scrypt } from 'crypto';

export function deriveKeyV4Async(
  secret: string,
  userId: string,
  salt: Buffer,
): Promise<Buffer> {
  const combinedSecret = `${secret}:${userId}`;
  return new Promise((resolve, reject) => {
    scrypt(
      combinedSecret,
      salt,
      32,
      { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
      (err, key) => {
        if (err) reject(err);
        else resolve(key);
      },
    );
  });
}
