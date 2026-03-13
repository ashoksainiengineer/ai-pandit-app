/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CRYPTO ADAPTER - Backward Compatible Encryption Interface
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * PURPOSE:
 * This adapter provides a bridge between the old encryption API and the new
 * secure v2 implementation. It maintains backward compatibility while
 * enabling migration to the more secure v2 format.
 *
 * MIGRATION STRATEGY:
 * 1. Read operations: Try v2 format first, fall back to v1 (legacy) if needed
 * 2. Write operations: Always use v2 format (secure random salt)
 * 3. Background migration: Gradually re-encrypt v1 data to v2
 *
 * SECURITY IMPROVEMENTS:
 * - All new data uses random 32-byte salt per encryption
 * - v1 format (static salt) only used for reading legacy data
 * - Automatic detection of format version
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import * as v2 from './encryption/v2.js';
import { encryptionConfig } from '../config/index.js';
import { logger } from './logger.js';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

let cachedSecret: string | null = null;

function getSecret(): string {
  if (!cachedSecret) {
    cachedSecret = encryptionConfig.secret;
    if (!cachedSecret) {
      throw new Error('ENCRYPTION_SECRET not configured');
    }
  }
  return cachedSecret;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BACKWARD COMPATIBLE API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Encrypts data using the secure v2 format.
 * Always produces v2 format (salt:iv:authTag:ciphertext).
 *
 * @param plaintext - Data to encrypt
 * @param _userId - User ID (kept for API compatibility, not used in v2)
 * @returns Encrypted string in v2 format
 */
export function encryptData(plaintext: string, _userId: string): string {
  try {
    const secret = getSecret();
    return v2.encrypt(plaintext, secret);
  } catch (error) {
    logger.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts data, handling both v2 (secure) and v1 (legacy) formats.
 * Tries v2 format first, falls back to v1 for legacy data.
 *
 * @param encryptedString - Encrypted data (v1 or v2 format)
 * @param userId - User ID (required for v1 fallback)
 * @returns Decrypted plaintext
 */
export function decryptData(encryptedString: string, userId: string): string {
  const secret = getSecret();

  // Try v2 format first (secure)
  if (v2.isV2Format(encryptedString)) {
    try {
      return v2.decrypt(encryptedString, secret);
    } catch (error) {
      logger.error('V2 decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Fall back to v1 format (legacy with static salt)
  if (v2.isV1Format(encryptedString)) {
    try {
      logger.debug('Decrypting legacy v1 format data');
      return v2.decryptV1(encryptedString, userId, secret);
    } catch (error) {
      logger.error('V1 decryption failed:', error);
      throw new Error('Failed to decrypt legacy data');
    }
  }

  // Not encrypted or unknown format
  throw new Error('Invalid encrypted data format');
}

/**
 * Safely decrypts data, returning null on failure.
 * Handles both v2 and v1 formats.
 */
export function safeDecrypt(encryptedString: string | null | undefined, userId: string): string | null {
  if (!encryptedString) return null;

  try {
    return decryptData(encryptedString, userId);
  } catch (error) {
    logger.warn('Safe decrypt failed:', { error: (error as Error).message });
    return null;
  }
}

/**
 * Safely encrypts data, returning null on failure.
 */
export function safeEncrypt(plaintext: string | null | undefined, userId: string): string | null {
  if (!plaintext) return null;

  try {
    return encryptData(plaintext, userId);
  } catch (error) {
    logger.warn('Safe encrypt failed:', { error: (error as Error).message });
    return null;
  }
}

/**
 * Encrypts a JavaScript object using v2 format.
 */
export function encryptObject<T extends Record<string, unknown>>(
  obj: T,
  userId: string
): string {
  return encryptData(JSON.stringify(obj), userId);
}

/**
 * Decrypts to a JavaScript object, handling both v2 and v1 formats.
 */
export function decryptObject<T extends Record<string, unknown>>(
  encryptedString: string,
  userId: string
): T {
  return JSON.parse(decryptData(encryptedString, userId)) as T;
}

/**
 * Safely decrypts to an object, returning null on failure.
 */
export function safeDecryptObject<T extends Record<string, unknown>>(
  encryptedString: string | null | undefined,
  userId: string
): T | null {
  if (!encryptedString) return null;

  try {
    return decryptObject<T>(encryptedString, userId);
  } catch (error) {
    logger.warn('Safe decrypt object failed:', { error: (error as Error).message });
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORMAT DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Checks if data is encrypted (either v1 or v2 format).
 */
export function isEncrypted(data: string): boolean {
  return v2.isEncrypted(data);
}

/**
 * Checks if data is in v2 format (secure).
 */
export function isV2Format(data: string): boolean {
  return v2.isV2Format(data);
}

/**
 * Checks if data is in v1 format (legacy).
 */
export function isV1Format(data: string): boolean {
  return v2.isV1Format(data);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MIGRATION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

export interface MigrationResult {
  success: boolean;
  migrated: boolean;
  oldFormat?: 'v1' | 'v2' | 'plaintext';
  error?: string;
}

/**
 * Migrates encrypted data to v2 format if needed.
 * Returns the v2-encrypted data (either migrated or already v2).
 */
export function migrateIfNeeded(
  encryptedData: string,
  userId: string
): MigrationResult & { data?: string } {
  const secret = getSecret();

  // Check current format
  if (v2.isV2Format(encryptedData)) {
    return {
      success: true,
      migrated: false,
      oldFormat: 'v2',
      data: encryptedData,
    };
  }

  // Try to migrate v1 format
  if (v2.isV1Format(encryptedData)) {
    try {
      const result = v2.migrateToV2(encryptedData, secret, userId);
      return {
        success: result.success,
        migrated: true,
        oldFormat: 'v1',
        data: result.data || undefined,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        migrated: false,
        oldFormat: 'v1',
        error: `Migration failed: ${(error as Error).message}`,
      };
    }
  }

  // Treat as plaintext - encrypt it
  try {
    const encrypted = v2.encrypt(encryptedData, secret);
    return {
      success: true,
      migrated: true,
      oldFormat: 'plaintext',
      data: encrypted,
    };
  } catch (error) {
    return {
      success: false,
      migrated: false,
      oldFormat: 'plaintext',
      error: `Encryption failed: ${(error as Error).message}`,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BATCH MIGRATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface BatchMigrationResult {
  total: number;
  migrated: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

/**
 * Batch migrates multiple encrypted values.
 * Useful for background migration jobs.
 */
export async function batchMigrate(
  items: Array<{ id: string; data: string; userId: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<BatchMigrationResult> {
  const result: BatchMigrationResult = {
    total: items.length,
    migrated: 0,
    failed: 0,
    errors: [],
  };

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const migration = migrateIfNeeded(item.data, item.userId);

    if (migration.success && migration.migrated) {
      result.migrated++;
      // Here you would typically update the database
      // await db.update(...).set({ encryptedData: migration.data })
    } else if (!migration.success) {
      result.failed++;
      result.errors.push({ id: item.id, error: migration.error || 'Unknown error' });
    }

    if (onProgress) {
      onProgress(i + 1, items.length);
    }

    // Small delay to prevent event loop blocking
    if (i % 100 === 0) {
      await new Promise((resolve) => setImmediate(resolve));
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  v2,
  v2 as encryptionV2,
};
