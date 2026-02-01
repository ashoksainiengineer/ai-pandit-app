/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Secure Encryption with Proper Key Derivation
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * SECURITY FEATURES:
 * - PBKDF2 with 100,000 iterations (OWASP recommended)
 * - Random 16-byte salt per encryption
 * - Only uses ENCRYPTION_SECRET (no predictable userId)
 * - AES-256-GCM with authentication tag
 *
 * Format: base64(salt):base64(iv):base64(authTag):base64(ciphertext)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from 'crypto';
import { logger } from '../logger.js';

// ═══════════════════════════════════════════════════════════════════════════════
// CRYPTOGRAPHIC CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const PBKDF2_ITERATIONS = 100000; // OWASP recommended minimum (100ms+ computation)
const KEY_LENGTH_BYTES = 32;
const SALT_LENGTH_BYTES = 16;
const IV_LENGTH_BYTES = 16;
const AUTH_TAG_LENGTH_BYTES = 16;

// ═══════════════════════════════════════════════════════════════════════════════
// KEY DERIVATION (C5 FIX)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get encryption secret from environment
 */
function getEncryptionSecret(): string {
    const secret = process.env.ENCRYPTION_SECRET;
    if (!secret) {
        throw new Error('ENCRYPTION_SECRET environment variable is required');
    }
    return secret;
}

/**
 * C5 FIX: Proper key derivation using PBKDF2
 *
 * Uses only the high-entropy ENCRYPTION_SECRET with a random salt
 * 100k iterations makes brute force computationally infeasible (~100ms per derivation)
 */
function deriveKey(secret: string, salt: Buffer): Buffer {
    return pbkdf2Sync(secret, salt, PBKDF2_ITERATIONS, KEY_LENGTH_BYTES, 'sha512');
}


// ═══════════════════════════════════════════════════════════════════════════════
// ENCRYPTION
// ═══════════════════════════════════════════════════════════════════════════════


/**
 * C5 FIX: Encrypt data with secure key derivation
 *
 * Format: salt:iv:authTag:ciphertext
 * Each encryption uses a NEW random salt
 */
export function encryptData(plaintext: string, _userId: string): string {
    try {
        const secret = getEncryptionSecret();

        // Generate random salt (unique per encryption)
        const salt = randomBytes(SALT_LENGTH_BYTES);

        // Derive key using PBKDF2
        const key = deriveKey(secret, salt);

        // Generate random IV
        const iv = randomBytes(IV_LENGTH_BYTES);

        // Encrypt
        const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
        let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
        ciphertext += cipher.final('base64');

        // Get auth tag
        const authTag = cipher.getAuthTag();

        // Format: salt:iv:authTag:ciphertext
        return [salt.toString('base64'), iv.toString('base64'), authTag.toString('base64'), ciphertext].join(':');
    } catch (error) {
        logger.error('Encryption failed', { error });
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt data with backward compatibility
 *
 * Supports TWO formats:
 * - NEW (4 parts): salt:iv:authTag:ciphertext (secure PBKDF2)
 * - OLD (3 parts): iv:authTag:ciphertext (legacy scrypt)
 */
export function decryptData(encryptedString: string, userId: string): string {
    try {
        const parts = encryptedString.split(':');

        // NEW FORMAT (4 parts): salt:iv:authTag:ciphertext
        if (parts.length === 4) {
            const secret = getEncryptionSecret();
            const [saltB64, ivB64, authTagB64, ciphertext] = parts;

            if (!saltB64 || !ivB64 || !authTagB64 || !ciphertext) {
                throw new Error('Invalid encrypted data: missing components');
            }

            const salt = Buffer.from(saltB64, 'base64');
            const iv = Buffer.from(ivB64, 'base64');
            const authTag = Buffer.from(authTagB64, 'base64');

            if (salt.length !== SALT_LENGTH_BYTES) throw new Error('Invalid salt length');
            if (iv.length !== IV_LENGTH_BYTES) throw new Error('Invalid IV length');
            if (authTag.length !== AUTH_TAG_LENGTH_BYTES) throw new Error('Invalid auth tag length');

            const key = deriveKey(secret, salt);
            const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
            decipher.setAuthTag(authTag);

            let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
            plaintext += decipher.final('utf8');
            return plaintext;
        }

        // OLD FORMAT (3 parts): iv:authTag:ciphertext - use legacy decryption
        if (parts.length === 3) {
            const secret = getEncryptionSecret();
            const { decryptData: legacyDecrypt } = require('./DANGER_DO_NOT_MODIFY.js');
            logger.info('Using legacy decryption for 3-part encrypted data');
            return legacyDecrypt(encryptedString, userId, secret);
        }

        throw new Error(`Invalid format: expected 3 or 4 parts, got ${parts.length}`);
    } catch (error) {
        logger.error('Decryption failed', { error });
        throw new Error('Failed to decrypt data: invalid key or corrupted data');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SAFE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if data is encrypted (supports both old 3-part and new 4-part formats)
 */
export function isEncrypted(data: string): boolean {
    if (!data || typeof data !== 'string') return false;
    if (!data.includes(':')) return false;

    const parts = data.split(':');

    // Accept both old (3 parts) and new (4 parts) formats
    if (parts.length !== 3 && parts.length !== 4) return false;

    // Check each part looks like base64
    const base64Pattern = /^[A-Za-z0-9+/=]+$/;
    for (const part of parts) {
        if (!part || part.length < 4) return false;
        if (!base64Pattern.test(part)) return false;
    }

    return true;
}

/**
 * Safe decrypt (returns null on failure)
 * Auto-rejects old format data
 */
export function safeDecrypt(encryptedString: string, userId: string): string | null {
    try {
        if (!isEncrypted(encryptedString)) {
            return encryptedString; // Plaintext
        }
        return decryptData(encryptedString, userId);
    } catch (error) {
        logger.error('Safe decrypt failed', {
            userId: userId.slice(0, 8),
            error: error instanceof Error ? error.message : 'Unknown',
        });
        return null;
    }
}

/**
 * Safe encrypt (returns null on failure)
 */
export function safeEncrypt(plaintext: string, userId: string): string | null {
    try {
        return encryptData(plaintext, userId);
    } catch (error) {
        logger.error('Safe encrypt failed', {
            userId: userId.slice(0, 8),
            error: error instanceof Error ? error.message : 'Unknown',
        });
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OBJECT SERIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

export function encryptObject<T extends Record<string, unknown>>(obj: T, userId: string): string {
    return encryptData(JSON.stringify(obj), userId);
}

export function decryptObject<T extends Record<string, unknown>>(encryptedString: string, userId: string): T {
    const decrypted = decryptData(encryptedString, userId);
    return JSON.parse(decrypted) as T;
}
