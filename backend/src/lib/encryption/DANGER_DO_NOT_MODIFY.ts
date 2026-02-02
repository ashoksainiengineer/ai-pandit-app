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

export const KEY_DERIVATION_SALT = 'salt';
export const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
export const IV_LENGTH_BYTES = 16;
export const KEY_LENGTH_BYTES = 32;
export const AUTH_TAG_LENGTH_BYTES = 16;

export const VERSION_PREFIX = 'v1:';
const SCRYPT_PARAMS_V2 = { N: 65536, r: 8, p: 1, maxmem: 128 * 1024 * 1024 };
const SALT_LENGTH_BYTES = 32;

// Key cache to avoid expensive derivation on every call
const keyCache = new Map<string, Buffer>();

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 */
export function deriveKey(userId: string, secret: string): Buffer {
    const cacheKey = `${userId}:${secret}`;
    const cached = keyCache.get(cacheKey);
    if (cached) return cached;

    const key = scryptSync(
        userId + secret,
        KEY_DERIVATION_SALT,
        KEY_LENGTH_BYTES
    );

    keyCache.set(cacheKey, key);
    return key;
}

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 */
export function encryptData(plaintext: string, _userId: string, secret: string): string {
    logger.debug('Encrypting data (v2)', { userIdPrefix: _userId.slice(0, 8) });
    const salt = randomBytes(SALT_LENGTH_BYTES);
    const key = scryptSync(secret, salt, KEY_LENGTH_BYTES, SCRYPT_PARAMS_V2);
    const iv = randomBytes(IV_LENGTH_BYTES);
    const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return 'v2:' + [
        salt.toString('base64'),
        iv.toString('base64'),
        authTag.toString('base64'),
        ciphertext
    ].join(':');
}

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 */
function attemptV2Decryption(encryptedString: string, secret: string): string {
    let payload = encryptedString;
    if (payload.startsWith('v2:')) {
        payload = payload.substring(3);
    }

    const parts = payload.split(':');
    if (parts.length !== 4) {
        throw new Error('Invalid v2 format');
    }

    const [saltB64, ivB64, authTagB64, ciphertextB64] = parts;
    const salt = Buffer.from(saltB64, 'base64');
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const ciphertext = Buffer.from(ciphertextB64, 'base64');

    const key = scryptSync(secret, salt, KEY_LENGTH_BYTES, SCRYPT_PARAMS_V2);
    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 */
function attemptLegacyDecryption(encryptedString: string, userId: string, secret: string): string {
    const key = deriveKey(userId, secret);

    let payload = encryptedString;
    if (payload.startsWith(VERSION_PREFIX)) {
        payload = payload.substring(VERSION_PREFIX.length);
    }

    const parts = payload.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid legacy format');
    }

    const [ivB64, authTagB64, ciphertextB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');

    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return decipher.update(ciphertextB64, 'base64', 'utf8') + decipher.final('utf8');
}

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 */
export function decryptData(encryptedString: string, userId: string, secrets: string | string[]): string {
    logger.debug('Decrypting data', { userIdPrefix: userId.slice(0, 8) });
    const secretList = Array.isArray(secrets) ? secrets : [secrets];
    const parts = encryptedString.split(':');

    const isV2 = encryptedString.startsWith('v2:') || parts.length === 4;
    const isLegacy = !encryptedString.startsWith('v2:') && (parts.length === 3 || encryptedString.startsWith('v1:'));

    let lastError: Error | undefined;

    for (const secret of secretList) {
        try {
            if (isV2) {
                logger.debug('Attempting v2 decryption', { userIdPrefix: userId.slice(0, 8) });
                return attemptV2Decryption(encryptedString, secret);
            }
            if (isLegacy) {
                logger.debug('Attempting legacy decryption', { userIdPrefix: userId.slice(0, 8) });
                return attemptLegacyDecryption(encryptedString, userId, secret);
            }
        } catch (error) {
            logger.warn('Decryption attempt failed with secret', { userIdPrefix: userId.slice(0, 8), error: (error as Error).message });
            lastError = error as Error;
        }
    }

    // Phase 2: Bruteforce fallback
    logger.debug('Falling back to bruteforce decryption attempts', { userIdPrefix: userId.slice(0, 8) });
    for (const secret of secretList) {
        try { return attemptV2Decryption(encryptedString, secret); } catch (e) { /* logger.debug('Bruteforce v2 failed', { error: (e as Error).message }); */ }
        try { return attemptLegacyDecryption(encryptedString, userId, secret); } catch (e) { /* logger.debug('Bruteforce legacy failed', { error: (e as Error).message }); */ }
    }

    logger.error('Decryption failed after all attempts', { userIdPrefix: userId.slice(0, 8), lastError: lastError?.message });
    throw lastError || new Error('Decryption failed');
}

export function isEncrypted(data: string): boolean {
    if (!data || typeof data !== 'string') return false;

    if (data.startsWith('v2:')) return data.split(':').length === 5;
    const parts = data.split(':');
    return parts.length === 3 || parts.length === 4;
}

export function safeDecrypt(encryptedString: string, userId: string, secrets: string | string[]): string | null {
    try {
        if (!isEncrypted(encryptedString)) {
            logger.debug('safeDecrypt: Data not encrypted, returning as is', { userIdPrefix: userId.slice(0, 8) });
            return encryptedString;
        }
        return decryptData(encryptedString, userId, secrets);
    } catch (error) {
        logger.error('Safe decrypt failed', { userIdPrefix: userId.slice(0, 8), error });
        return null;
    }
}

export function safeEncrypt(plaintext: string, userId: string, secret: string): string | null {
    try {
        return encryptData(plaintext, userId, secret);
    } catch (error) {
        logger.error('Safe encrypt failed', { userIdPrefix: userId.slice(0, 8), error });
        return null;
    }
}

export function encryptObject<T extends Record<string, unknown>>(obj: T, userId: string, secret: string): string {
    return encryptData(JSON.stringify(obj), userId, secret);
}

export function decryptObject<T extends Record<string, unknown>>(encryptedString: string, userId: string, secrets: string | string[]): T {
    const decrypted = decryptData(encryptedString, userId, secrets);
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
