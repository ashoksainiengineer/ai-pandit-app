/**
 * =====================================================================================
 *                                                                                     
 *                         ✅  PRODUCTION ENCRYPTION ✅                         
 *                                                                                     
 *    This is the single, authoritative encryption module for the entire application.  
 *    It is built on industry-best practices and replaces all legacy code.             
 *                                                                                     
 * =====================================================================================
 *
 * ENCRYPTION MODULE - v4 ONLY
 *
 * Purpose: End-to-end, secure encryption for all PII and sensitive user data.
 *
 * Architecture:
 * - v4: AES-256-GCM + scrypt with user-isolated key derivation.
 *   UserId is blended into the KDF salt and bound as AAD to ciphertext.
 *   Format: 'v4:base64(salt):base64(iv):base64(authTag):base64(ciphertext)'
 *
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
  type CipherGCM,
  type DecipherGCM,
  type CipherGCMOptions,
} from 'crypto';
import { env } from './config/env';
import { logger } from './logger';

// ═══════════════════════════════════════════════════════════════════════════════
// SECURE CRYPTOGRAPHIC CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12; // NIST recommendation for GCM
const SALT_LENGTH_BYTES = 16; // 128-bit salt
const KEY_LENGTH_BYTES = 32; // 256-bit key for AES-256
const AUTH_TAG_LENGTH_BYTES = 16; // GCM standard 128-bit tag

// scrypt parameters: N=32768, r=8, p=1 — strong modern recommendation
const SCRYPT_PARAMS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

const V4_VERSION_PREFIX = 'v4';

// This will be loaded from environment variables.
let ENCRYPTION_SECRET = env.security.encryptionSecret;

// Auto-initialize on first use
if (ENCRYPTION_SECRET) {
  if (env.app.nextPhase !== 'phase-production-build') {
    logger.info('[Crypto] Encryption secret loaded');
  }
} else {
  if (env.app.nextPhase !== 'phase-production-build') {
    logger.warn('[Crypto] WARNING: No encryption secret found!');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// KEY MANAGEMENT & INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Initializes the encryption secret. This MUST be called once on application startup.
 * @param secret The master secret from environment variables.
 */
export function initializeEncryption(secret: string | undefined) {
  if (!secret) {
    if (env.app.nextPhase !== 'phase-production-build') {
      logger.error('CRITICAL: ENCRYPTION_SECRET is not set. Encryption will fail.');
    }
    ENCRYPTION_SECRET = undefined;
  } else {
    ENCRYPTION_SECRET = secret;
  }
}

/**
 * v4 key derivation (user-isolated).
 * Derives a key using scrypt with combined ${secret}:${userId} + per-operation salt.
 * Matches the API backend's deriveKeyV4.
 */
function deriveKeyV4(secret: string, userId: string, salt: Buffer): Buffer {
  const combinedSecret = `${secret}:${userId}`;
  return scryptSync(combinedSecret, salt, KEY_LENGTH_BYTES, SCRYPT_PARAMS);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORE ENCRYPTION & DECRYPTION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Securely encrypts a plaintext string using v4 (user-isolated).
 *
 * @param plaintext The string to encrypt.
 * @param userId The user's internal ID for key isolation and AAD.
 * @returns The encrypted string in the format 'v4:base64(iv):base64(ciphertext+authTag)'.
 * @throws An error if the ENCRYPTION_SECRET is not configured or userId is missing.
 */
export function encrypt(plaintext: string, userId: string): string {
  if (!ENCRYPTION_SECRET) {
    throw new Error('Encryption failed: ENCRYPTION_SECRET is not initialized.');
  }
  if (!userId) {
    throw new Error('Encryption failed: userId is required for v4 encryption.');
  }

  const salt = randomBytes(SALT_LENGTH_BYTES);
  const key = deriveKeyV4(ENCRYPTION_SECRET, userId, salt);
  const iv = randomBytes(IV_LENGTH_BYTES);

  const cipherOptions: CipherGCMOptions = { authTagLength: AUTH_TAG_LENGTH_BYTES };
  const cipher = createCipheriv(ALGORITHM, key, iv, cipherOptions) as CipherGCM;
  cipher.setAAD(Buffer.from(userId, 'utf8'));

  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Format: v4:base64(salt):base64(iv):base64(authTag):base64(ciphertext)
  return [
    V4_VERSION_PREFIX,
    salt.toString('base64'),
    iv.toString('base64'),
    authTag.toString('base64'),
    ciphertext.toString('base64'),
  ].join(':');
}


export function decrypt(encryptedString: string, userId: string): string {
  if (!ENCRYPTION_SECRET) {
    throw new Error('Decryption failed: ENCRYPTION_SECRET is not initialized.');
  }
  if (!userId) {
    throw new Error('Decryption failed: userId is required.');
  }

  const parts = encryptedString.split(':');

  if (parts[0] !== V4_VERSION_PREFIX || parts.length !== 5) {
    throw new Error('Invalid encrypted data format. Expected v4 format.');
  }

  const [, saltB64, ivB64, authTagB64, ciphertextB64] = parts;

  try {
    const salt = Buffer.from(saltB64, 'base64');
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const ciphertext = Buffer.from(ciphertextB64, 'base64');

    if (salt.length !== SALT_LENGTH_BYTES || iv.length !== IV_LENGTH_BYTES || authTag.length !== AUTH_TAG_LENGTH_BYTES) {
      throw new Error('Encrypted data components have invalid lengths.');
    }

    const key = deriveKeyV4(ENCRYPTION_SECRET, userId, salt);
    const decipherOptions: CipherGCMOptions = { authTagLength: AUTH_TAG_LENGTH_BYTES };
    const decipher = createDecipheriv(ALGORITHM, key, iv, decipherOptions) as DecipherGCM;
    decipher.setAAD(Buffer.from(userId, 'utf8'));
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (_error) {
    throw new Error('Decryption failed. The data may be corrupt or the key may be incorrect.');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS FOR CONVENIENCE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Encrypts a JavaScript object by first serializing it to a JSON string.
 * @param data The object to encrypt.
 * @param userId The user's internal ID for key isolation.
 * @returns The v4-encrypted string.
 */
export function encryptObject<T extends object>(data: T, userId: string): string {
  return encrypt(JSON.stringify(data), userId);
}

/**
 * Decrypts an encrypted string and parses it as a JSON object.
 * @param encryptedString The encrypted string to decrypt (v4 format).
 * @param userId The user's internal ID (required).
 * @returns The decrypted object.
 * @throws An error if decryption or JSON parsing fails.
 */
export function decryptObject<T extends object>(encryptedString: string, userId: string): T {
  const decrypted = decrypt(encryptedString, userId);
  try {
    return JSON.parse(decrypted) as T;
  } catch {
    throw new Error('Decrypted data is not valid JSON');
  }
}

/**
 * Checks if a string is in valid v4 encrypted format.
 * This is a simple format check and does NOT verify cryptographic integrity.
 * @param data The string to check.
 * @returns true if the format appears to be 'v4', false otherwise.
 */
export function isEncrypted(data: string | null | undefined): boolean {
  if (typeof data !== 'string') {
    return false;
  }
  return data.startsWith(`${V4_VERSION_PREFIX}:`);
}

/**
 * 🟢 ROBUST DECRYPTION HELPER
 * Handles encrypted (v4) and non-encrypted fields, and safely parses JSON.
 *
 * @param data The field value to parse (may be encrypted v4, plain JSON, or plain string).
 * @param defaultValue Fallback if data is null/undefined.
 * @param userId Required user ID for v4 decryption.
 */
export function parseSensitiveField<T = unknown>(
  data: string | null | undefined,
  defaultValue?: T | null,
  userId: string,
): T | null {
  if (!data) return (defaultValue ?? null) as T | null;

  try {
    if (isEncrypted(data)) {
      const decrypted = decrypt(data, userId);
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted as T;
      }
    }
  } catch {
    // Decryption failed — data may be corrupt. Return default or raw.
    return (defaultValue ?? data) as T;
  }

  // Plain JSON or string (unencrypted)
  try {
    const parsed = JSON.parse(data);
    if (typeof parsed === 'object' && parsed !== null) return parsed;
    return data as T;
  } catch {
    return (data || defaultValue) as T;
  }
}
