/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ENCRYPTION MODULE V2 - Production-Grade Secure Implementation
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * SECURITY FEATURES:
 * - Random 32-byte salt per encryption operation
 * - Scrypt key derivation with explicit cost parameters (N=65536, r=8, p=1)
 * - AES-256-GCM with authentication tag
 * - No user-derived data in key material
 * - Format: base64(salt):base64(iv):base64(tag):base64(ciphertext)
 *
 * MIGRATION: Supports both v1 (legacy) and v2 (current) formats
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// CRYPTOGRAPHIC CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

// Scrypt cost parameters (N=65536 provides ~100ms computation on modern hardware)
const SCRYPT_PARAMS = { N: 65536, r: 8, p: 1 };

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR CLASSES
// ═══════════════════════════════════════════════════════════════════════════════

export class EncryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EncryptionError';
  }
}

export class DecryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DecryptionError';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// V2 ENCRYPTION (SECURE - RANDOM SALT)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Encrypts plaintext using AES-256-GCM with random salt.
 * Format: salt:iv:authTag:ciphertext (all base64)
 *
 * @param plaintext - Data to encrypt
 * @param secret - Master encryption secret from environment
 * @returns Encrypted string in v2 format
 * @throws EncryptionError if encryption fails
 */
export function encrypt(plaintext: string, secret: string): string {
  if (!plaintext) {
    throw new EncryptionError('Plaintext is required');
  }
  if (!secret || secret.length < 32) {
    throw new EncryptionError('Secret must be at least 32 characters');
  }

  try {
    // Generate random salt for EACH encryption operation
    const salt = randomBytes(SALT_LENGTH);

    // Derive key using scrypt with explicit cost parameters
    const key = scryptSync(secret, salt, KEY_LENGTH, SCRYPT_PARAMS);

    // Generate random IV
    const iv = randomBytes(IV_LENGTH);

    // Encrypt
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Format: salt:iv:authTag:ciphertext
    return [
      salt.toString('base64'),
      iv.toString('base64'),
      authTag.toString('base64'),
      ciphertext.toString('base64'),
    ].join(':');
  } catch (error) {
    throw new EncryptionError(`Encryption failed: ${(error as Error).message}`);
  }
}

/**
 * Decrypts v2 format encrypted data.
 * Format: salt:iv:authTag:ciphertext
 *
 * @param encryptedString - Encrypted data in v2 format
 * @param secret - Master encryption secret
 * @returns Decrypted plaintext
 * @throws DecryptionError if decryption fails
 */
export function decrypt(encryptedString: string, secret: string): string {
  if (!encryptedString) {
    throw new DecryptionError('Encrypted string is required');
  }
  if (!secret) {
    throw new DecryptionError('Secret is required');
  }

  try {
    const parts = encryptedString.split(':');

    if (parts.length !== 4) {
      throw new DecryptionError('Invalid format: expected 4 parts (salt:iv:authTag:ciphertext)');
    }

    const [saltB64, ivB64, authTagB64, ciphertextB64] = parts;

    // Decode components
    const salt = Buffer.from(saltB64, 'base64');
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const ciphertext = Buffer.from(ciphertextB64, 'base64');

    // Validate lengths
    if (salt.length !== SALT_LENGTH) {
      throw new DecryptionError(`Invalid salt length: expected ${SALT_LENGTH}, got ${salt.length}`);
    }
    if (iv.length !== IV_LENGTH) {
      throw new DecryptionError(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`);
    }
    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new DecryptionError(
        `Invalid auth tag length: expected ${AUTH_TAG_LENGTH}, got ${authTag.length}`
      );
    }

    // Derive key using stored salt
    const key = scryptSync(secret, salt, KEY_LENGTH, SCRYPT_PARAMS);

    // Decrypt
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const plaintext = decipher.update(ciphertext);
    const final = decipher.final();

    return Buffer.concat([plaintext, final]).toString('utf8');
  } catch (error) {
    if (error instanceof DecryptionError) throw error;
    throw new DecryptionError(`Decryption failed: ${(error as Error).message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SAFE OPERATIONS (RETURN NULL ON FAILURE)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Safely encrypts data, returning null on failure instead of throwing.
 */
export function safeEncrypt(plaintext: string, secret: string): string | null {
  try {
    return encrypt(plaintext, secret);
  } catch {
    return null;
  }
}

/**
 * Safely decrypts data, returning null on failure instead of throwing.
 */
export function safeDecrypt(encryptedString: string, secret: string): string | null {
  try {
    return decrypt(encryptedString, secret);
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OBJECT ENCRYPTION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Encrypts a JavaScript object (JSON-serialized).
 */
export function encryptObject<T extends Record<string, unknown>>(obj: T, secret: string): string {
  return encrypt(JSON.stringify(obj), secret);
}

/**
 * Decrypts to a JavaScript object (JSON-parsed).
 */
export function decryptObject<T extends Record<string, unknown>>(
  encryptedString: string,
  secret: string
): T {
  return JSON.parse(decrypt(encryptedString, secret)) as T;
}

/**
 * Safely decrypts to an object, returning null on failure.
 */
export function safeDecryptObject<T extends Record<string, unknown>>(
  encryptedString: string,
  secret: string
): T | null {
  try {
    return decryptObject<T>(encryptedString, secret);
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORMAT DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Checks if data is encrypted in v2 format (4 parts).
 */
export function isV2Format(data: string): boolean {
  if (!data || typeof data !== 'string') return false;
  return data.split(':').length === 4;
}

/**
 * Checks if data is encrypted in v1 format (3 parts - legacy).
 */
export function isV1Format(data: string): boolean {
  if (!data || typeof data !== 'string') return false;
  return data.split(':').length === 3;
}

/**
 * Checks if data appears to be encrypted (either v1 or v2).
 */
export function isEncrypted(data: string): boolean {
  return isV1Format(data) || isV2Format(data);
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEGACY V1 SUPPORT (FOR MIGRATION ONLY)
// ═══════════════════════════════════════════════════════════════════════════════

// V1 Constants (DO NOT CHANGE - needed for migration)
const V1_SALT = 'salt';
const V1_KEY_LENGTH = 32;

/**
 * Decrypts v1 format data (legacy - static salt).
 * WARNING: Only use for migration to v2.
 *
 * @deprecated Use decrypt() for new data
 */
export function decryptV1(encryptedString: string, userId: string, secret: string): string {
  if (!encryptedString || !userId || !secret) {
    throw new DecryptionError('All parameters are required for v1 decryption');
  }

  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new DecryptionError('Invalid v1 format: expected 3 parts (iv:authTag:ciphertext)');
  }

  const [ivB64, authTagB64, ciphertextB64] = parts;

  const keyMaterial = userId + secret;
  const key = scryptSync(keyMaterial, V1_SALT, V1_KEY_LENGTH);
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const ciphertext = Buffer.from(ciphertextB64, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return decipher.update(ciphertext) + decipher.final('utf8');
}

// ═══════════════════════════════════════════════════════════════════════════════
// MIGRATION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

export interface MigrationResult {
  success: boolean;
  oldFormat: 'v1' | 'v2' | 'plaintext';
  newFormat: 'v2';
  data: string | null;
  error?: string;
}

/**
 * Migrates data from any format to v2 format.
 * - v1 (3 parts) -> decrypt with userId -> re-encrypt with v2
 * - v2 (4 parts) -> return as-is
 * - plaintext -> encrypt with v2
 */
export function migrateToV2(
  data: string,
  secret: string,
  userId?: string
): MigrationResult {
  // Already v2
  if (isV2Format(data)) {
    return {
      success: true,
      oldFormat: 'v2',
      newFormat: 'v2',
      data,
    };
  }

  // V1 format - needs migration
  if (isV1Format(data)) {
    if (!userId) {
      return {
        success: false,
        oldFormat: 'v1',
        newFormat: 'v2',
        data: null,
        error: 'userId required for v1 migration',
      };
    }

    try {
      const decrypted = decryptV1(data, userId, secret);
      const reencrypted = encrypt(decrypted, secret);
      return {
        success: true,
        oldFormat: 'v1',
        newFormat: 'v2',
        data: reencrypted,
      };
    } catch (error) {
      return {
        success: false,
        oldFormat: 'v1',
        newFormat: 'v2',
        data: null,
        error: `Migration failed: ${(error as Error).message}`,
      };
    }
  }

  // Plaintext - encrypt it
  try {
    const encrypted = encrypt(data, secret);
    return {
      success: true,
      oldFormat: 'plaintext',
      newFormat: 'v2',
      data: encrypted,
    };
  } catch (error) {
    return {
      success: false,
      oldFormat: 'plaintext',
      newFormat: 'v2',
      data: null,
      error: `Encryption failed: ${(error as Error).message}`,
    };
  }
}
