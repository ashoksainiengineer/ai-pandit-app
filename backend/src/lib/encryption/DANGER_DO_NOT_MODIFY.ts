/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
 *                                                                               
 *                         🛑  DANGER: DO NOT MODIFY  🛑                         
 *                                                                               
 *    THIS FILE CONTAINS CRYPTOGRAPHIC CONSTANTS AND ALGORITHMS THAT ARE         
 *    CRITICAL FOR DATA DECRYPTION. ANY CHANGE TO THIS FILE WILL                 
 *    PERMANENTLY CORRUPT ALL EXISTING ENCRYPTED USER DATA.                      
 *                                                                               
 *    ⚠️  IF YOU CHANGE ANYTHING HERE, USERS WILL LOSE ACCESS TO THEIR DATA      
 *    ⚠️  THIS INCLUDES: KEY DERIVATION, SALT, IV LENGTH, CIPHER MODE            
 *    ⚠️  EVEN A SINGLE CHARACTER CHANGE = TOTAL DATA LOSS                       
 *                                                                               
 *                         🛑  DO NOT TOUCH THIS FILE  🛑                        
 *                                                                               
 * ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * ENCRYPTION MODULE - FINAL VERSION
 * Version: 1.0.0-FROZEN
 * Last Modified: NEVER (unless you want data loss)
 *
 * Purpose: End-to-end encryption for user data using AES-256-GCM
 *
 * Architecture:
 * - Key Derivation: scrypt(userId + ENCRYPTION_SECRET, salt='salt', 32)
 * - Algorithm: AES-256-GCM
 * - IV Size: 16 bytes (128 bits)
 * - Auth Tag: 16 bytes (GCM authentication tag)
 * - Output Format: base64(iv):base64(authTag):base64(ciphertext)
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { logger } from '../logger.js';

// ═══════════════════════════════════════════════════════════════════════════════
// ⚠️  CRYPTOGRAPHIC CONSTANTS - DO NOT CHANGE ⚠️
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🔴 WARNING: Changing this salt will make ALL existing data unrecoverable
 * This salt was used to derive keys for all encrypted data in the database.
 * DO NOT CHANGE - EVER.
 */
export const KEY_DERIVATION_SALT = 'salt';

/**
 * 🔴 WARNING: Changing this algorithm will make ALL existing data unrecoverable
 * All existing data is encrypted with AES-256-GCM.
 * DO NOT CHANGE - EVER.
 */
export const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

/**
 * 🔴 WARNING: Changing this IV length will make ALL existing data unrecoverable
 * All existing encrypted data uses 16-byte IVs.
 * DO NOT CHANGE - EVER.
 */
export const IV_LENGTH_BYTES = 16;

/**
 * 🔴 WARNING: Changing this key length will make ALL existing data unrecoverable
 * AES-256 requires exactly 32 bytes (256 bits).
 * DO NOT CHANGE - EVER.
 */
export const KEY_LENGTH_BYTES = 32;

/**
 * 🔴 WARNING: Changing this auth tag length will corrupt decryption
 * GCM mode produces 16-byte authentication tags.
 * DO NOT CHANGE - EVER.
 */
export const AUTH_TAG_LENGTH_BYTES = 16;

// ═══════════════════════════════════════════════════════════════════════════════
// ⚠️  KEY DERIVATION - DO NOT MODIFY ⚠️
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 *
 * Derives a unique encryption key for each user.
 *
 * Formula: scrypt(userId + ENCRYPTION_SECRET, salt='salt', 32)
 *
 * ⚠️  ANY CHANGE TO THIS FUNCTION WILL PERMANENTLY LOCK ALL USER DATA
 * ⚠️  The salt must remain 'salt'
 * ⚠️  The key length must remain 32
 * ⚠️  The scrypt parameters must not change
 *
 * @param userId - The user's unique identifier (Clerk ID)
 * @param secret - The master ENCRYPTION_SECRET from environment
 * @returns 32-byte Buffer for AES-256 key
 */
export function deriveKey(userId: string, secret: string): Buffer {
    // 🔴 DO NOT MODIFY THIS IMPLEMENTATION 🔴
    // Changing the salt, keylen, or scrypt parameters = DATA LOSS
    return scryptSync(
        userId + secret,
        KEY_DERIVATION_SALT,
        KEY_LENGTH_BYTES
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⚠️  ENCRYPTION FUNCTIONS - DO NOT MODIFY ⚠️
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 *
 * Encrypts plaintext using AES-256-GCM.
 *
 * Format: base64(iv):base64(authTag):base64(ciphertext)
 *
 * ⚠️  ANY CHANGE TO OUTPUT FORMAT WILL BREAK ALL EXISTING DATA
 * ⚠️  The colon separator must remain
 * ⚠️  All parts must remain base64 encoded
 * ⚠️  Order must remain: iv:authTag:ciphertext
 *
 * @param plaintext - Data to encrypt
 * @param userId - User identifier for key derivation
 * @param secret - Master encryption secret
 * @returns Encrypted string
 */
export function encryptData(plaintext: string, userId: string, secret: string): string {
    // 🔴 DO NOT MODIFY THIS IMPLEMENTATION 🔴
    try {
        logger.debug('Encrypting data', { userIdPrefix: userId.slice(0, 8) });

        const key = deriveKey(userId, secret);
        const iv = randomBytes(IV_LENGTH_BYTES);

        const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

        let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
        ciphertext += cipher.final('base64');

        const authTag = cipher.getAuthTag();

        // 🔴 DO NOT CHANGE OUTPUT FORMAT 🔴
        // Existing data relies on this exact format: iv:authTag:ciphertext
        return [
            iv.toString('base64'),
            authTag.toString('base64'),
            ciphertext
        ].join(':');
    } catch (error) {
        logger.error('Encryption failed', { userId: userId.slice(0, 8), error });
        throw new Error('Failed to encrypt data');
    }
}

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 *
 * Decrypts data encrypted with encryptData().
 *
 * ⚠️  ANY CHANGE TO PARSING LOGIC WILL BREAK DECRYPTION
 * ⚠️  Must handle the exact format: iv:authTag:ciphertext
 * ⚠️  Base64 decoding must use standard base64 (not base64url)
 *
 * @param encryptedString - Format: "iv:authTag:ciphertext"
 * @param userId - User identifier for key derivation
 * @param secret - Master encryption secret
 * @returns Decrypted plaintext
 * @throws Error if decryption fails
 */
export function decryptData(encryptedString: string, userId: string, secret: string): string {
    // 🔴 DO NOT MODIFY THIS IMPLEMENTATION 🔴
    try {
        logger.debug('Decrypting data', { userIdPrefix: userId.slice(0, 8) });

        const key = deriveKey(userId, secret);
        const parts = encryptedString.split(':');

        if (parts.length !== 3) {
            logger.error('Invalid encrypted format', { userId: userId.slice(0, 8), partsCount: parts.length });
            throw new Error('Invalid encrypted data format: expected 3 components');
        }

        const [ivB64, authTagB64, ciphertext] = parts;

        if (!ivB64 || !authTagB64 || !ciphertext) {
            throw new Error('Invalid encrypted data: missing components');
        }

        const iv = Buffer.from(ivB64, 'base64');
        const authTag = Buffer.from(authTagB64, 'base64');

        // 🔴 DO NOT REMOVE THESE CHECKS 🔴
        // Wrong IV/auth tag lengths indicate corrupted data
        if (iv.length !== IV_LENGTH_BYTES) {
            throw new Error('Invalid IV length');
        }
        if (authTag.length !== AUTH_TAG_LENGTH_BYTES) {
            throw new Error('Invalid auth tag length');
        }

        const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
        plaintext += decipher.final('utf8');

        return plaintext;
    } catch (error) {
        logger.error('Decryption failed', { userId: userId.slice(0, 8), error });
        throw new Error('Failed to decrypt data: invalid key or corrupted data');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⚠️  SAFE OPERATIONS - DO NOT MODIFY ⚠️
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 *
 * Checks if a string appears to be encrypted data.
 *
 * ⚠️  Changes to detection logic may cause data corruption
 * ⚠️  Must correctly identify encrypted vs plaintext data
 *
 * @param data - String to check
 * @returns true if data appears to be encrypted
 */
export function isEncrypted(data: string): boolean {
    // 🔴 DO NOT MODIFY THIS IMPLEMENTATION 🔴
    if (!data || typeof data !== 'string') return false;
    if (!data.includes(':')) return false;

    const parts = data.split(':');
    if (parts.length !== 3) return false;

    // Check each part looks like base64
    const base64Pattern = /^[A-Za-z0-9+/=]+$/;
    for (const part of parts) {
        if (!part || part.length < 4) return false;
        if (!base64Pattern.test(part)) return false;
    }

    return true;
}

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 *
 * Safely decrypts data, returning null on failure instead of throwing.
 *
 * @param encryptedString - Encrypted data
 * @param userId - User identifier
 * @param secret - Master encryption secret
 * @returns Decrypted string or null
 */
export function safeDecrypt(encryptedString: string, userId: string, secret: string): string | null {
    // 🔴 DO NOT MODIFY THIS IMPLEMENTATION 🔴
    try {
        if (!isEncrypted(encryptedString)) {
            // Data appears to be plaintext (unencrypted)
            return encryptedString;
        }
        return decryptData(encryptedString, userId, secret);
    } catch (error) {
        logger.error('Safe decrypt failed', { userId: userId.slice(0, 8), error });
        return null;
    }
}

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 *
 * Safely encrypts data, returning null on failure.
 *
 * @param plaintext - Data to encrypt
 * @param userId - User identifier
 * @param secret - Master encryption secret
 * @returns Encrypted string or null
 */
export function safeEncrypt(plaintext: string, userId: string, secret: string): string | null {
    // 🔴 DO NOT MODIFY THIS IMPLEMENTATION 🔴
    try {
        return encryptData(plaintext, userId, secret);
    } catch (error) {
        logger.error('Safe encrypt failed', { userId: userId.slice(0, 8), error });
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⚠️  OBJECT SERIALIZATION - DO NOT MODIFY ⚠️
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 *
 * Encrypts a JavaScript object.
 *
 * @param obj - Object to encrypt
 * @param userId - User identifier
 * @param secret - Master encryption secret
 * @returns Encrypted string
 */
export function encryptObject<T extends Record<string, unknown>>(
    obj: T,
    userId: string,
    secret: string
): string {
    // 🔴 DO NOT MODIFY 🔴
    return encryptData(JSON.stringify(obj), userId, secret);
}

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 *
 * Decrypts to a JavaScript object.
 *
 * @param encryptedString - Encrypted data
 * @param userId - User identifier
 * @param secret - Master encryption secret
 * @returns Decrypted object
 */
export function decryptObject<T extends Record<string, unknown>>(
    encryptedString: string,
    userId: string,
    secret: string
): T {
    // 🔴 DO NOT MODIFY 🔴
    const decrypted = decryptData(encryptedString, userId, secret);
    return JSON.parse(decrypted) as T;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
 *
 *                        END OF CRITICAL CRYPTOGRAPHIC CODE
 *
 * ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
 * ═══════════════════════════════════════════════════════════════════════════════
 */
