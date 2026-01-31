/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * C5 FIX: Secure Encryption v2 with Proper Key Derivation
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * IMPROVEMENTS over v1:
 * - Random salt per encryption (not static 'salt')
 * - PBKDF2 with 100k iterations (slow brute force)
 * - Only uses ENCRYPTION_SECRET (not predictable userId)
 * - Salt stored WITH ciphertext
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
const PBKDF2_ITERATIONS = 100000;  // OWASP recommended minimum
const KEY_LENGTH_BYTES = 32;
const SALT_LENGTH_BYTES = 16;
const IV_LENGTH_BYTES = 16;
const AUTH_TAG_LENGTH_BYTES = 16;

// ═══════════════════════════════════════════════════════════════════════════════
// KEY DERIVATION (C5 FIX)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * C5 FIX: Proper key derivation using PBKDF2
 * 
 * Uses only the high-entropy ENCRYPTION_SECRET with a random salt
 * 100k iterations makes brute force computationally infeasible
 */
export function deriveKey(secret: string, salt: Buffer): Buffer {
    return pbkdf2Sync(
        secret,
        salt,
        PBKDF2_ITERATIONS,
        KEY_LENGTH_BYTES,
        'sha512'
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENCRYPTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * C5 FIX: Encrypt data with secure key derivation
 * 
 * NEW Format: salt:iv:authTag:ciphertext
 * Each encryption uses a NEW random salt
 */
export function encryptData(plaintext: string, secret: string): string {
    try {
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
        return [
            salt.toString('base64'),
            iv.toString('base64'),
            authTag.toString('base64'),
            ciphertext
        ].join(':');
    } catch (error) {
        logger.error('Encryption v2 failed', { error });
        throw new Error('Failed to encrypt data');
    }
}

/**
 * C5 FIX: Decrypt data with secure key derivation
 * 
 * Expects format: salt:iv:authTag:ciphertext
 * Extracts salt and derives key for decryption
 */
export function decryptData(encryptedString: string, secret: string): string {
    try {
        const parts = encryptedString.split(':');

        if (parts.length !== 4) {
            throw new Error('Invalid format: expected salt:iv:authTag:ciphertext');
        }

        const [saltB64, ivB64, authTagB64, ciphertext] = parts;

        if (!saltB64 || !ivB64 || !authTagB64 || !ciphertext) {
            throw new Error('Invalid encrypted data: missing components');
        }

        // Decode components
        const salt = Buffer.from(saltB64, 'base64');
        const iv = Buffer.from(ivB64, 'base64');
        const authTag = Buffer.from(authTagB64, 'base64');

        // Validate lengths
        if (salt.length !== SALT_LENGTH_BYTES) {
            throw new Error('Invalid salt length');
        }
        if (iv.length !== IV_LENGTH_BYTES) {
            throw new Error('Invalid IV length');
        }
        if (authTag.length !== AUTH_TAG_LENGTH_BYTES) {
            throw new Error('Invalid auth tag length');
        }

        // Derive key using stored salt
        const key = deriveKey(secret, salt);

        // Decrypt
        const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
        plaintext += decipher.final('utf8');

        return plaintext;
    } catch (error) {
        logger.error('Decryption v2 failed', { error });
        throw new Error('Failed to decrypt data: invalid key or corrupted data');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if data is encrypted with NEW format (v2)
 * NEW format has 4 parts: salt:iv:authTag:ciphertext
 */
export function isEncrypted(data: string): boolean {
    if (!data || typeof data !== 'string') return false;
    if (!data.includes(':')) return false;

    const parts = data.split(':');
    if (parts.length !== 4) return false;  // NEW format has 4 parts

    // Check each part looks like base64
    const base64Pattern = /^[A-Za-z0-9+/=]+$/;
    for (const part of parts) {
        if (!part || part.length < 4) return false;
        if (!base64Pattern.test(part)) return false;
    }

    return true;
}

/**
 * Check if data might be OLD format (v1)
 * OLD format has 3 parts: iv:authTag:ciphertext
 */
export function isEncryptedOldFormat(data: string): boolean {
    if (!data || typeof data !== 'string') return false;
    if (!data.includes(':')) return false;

    const parts = data.split(':');
    return parts.length === 3;  // OLD format has 3 parts
}

// ═══════════════════════════════════════════════════════════════════════════════
// SAFE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function safeDecrypt(encryptedString: string, secret: string): string | null {
    try {
        if (!isEncrypted(encryptedString)) {
            return encryptedString;  // Plaintext
        }
        return decryptData(encryptedString, secret);
    } catch (error) {
        logger.error('Safe decrypt v2 failed', { error });
        return null;
    }
}

export function safeEncrypt(plaintext: string, secret: string): string | null {
    try {
        return encryptData(plaintext, secret);
    } catch (error) {
        logger.error('Safe encrypt v2 failed', { error });
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OBJECT SERIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

export function encryptObject<T extends Record<string, unknown>>(
    obj: T,
    secret: string
): string {
    return encryptData(JSON.stringify(obj), secret);
}

export function decryptObject<T extends Record<string, unknown>>(
    encryptedString: string,
    secret: string
): T {
    const decrypted = decryptData(encryptedString, secret);
    return JSON.parse(decrypted) as T;
}
