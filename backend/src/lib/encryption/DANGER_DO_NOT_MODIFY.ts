/**
 * 🔴 CRITICAL - ENCRYPTION CORE - DANGER_DO_NOT_MODIFY 🔴
 * 
 * This file contains the authoritative encryption logic for the entire system.
 * It implements the 'v3' standard (AES-256-GCM + scrypt) while maintaining
 * backward compatibility for 'v1' and 'v2' data.
 * 
 * Versioning Table:
 * v1: AES-256-CBC (Legacy, insecure IV)
 * v2: AES-256-GCM (Better, but PBKDF2 with low iterations)
 * v3: AES-256-GCM (NIST-Standard: scrypt 32768/8/1 + Unique Salt/IV)
 */

import crypto from 'crypto';
import { logger } from '../logger.js';

// ═════════════════════════════════════════════════════════════════════════════
// V3 CONFIGURATION (NIST Standard)
// ═════════════════════════════════════════════════════════════════════════════

const V3_CONFIG = {
    ALGORITHM: 'aes-256-gcm',
    KEY_LENGTH: 32,
    IV_LENGTH: 12,
    SALT_LENGTH: 16,
    AUTH_TAG_LENGTH: 16,
    SCRYPT_PARAMS: { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
    PREFIX: 'v3'
};

/**
 * Derives a key synchronously using scrypt.
 */
function deriveKeyV3(secret: string, salt: Buffer): Buffer {
    return crypto.scryptSync(secret, salt, V3_CONFIG.KEY_LENGTH, V3_CONFIG.SCRYPT_PARAMS);
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN API - ENCRYPTION (v3)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Encrypt data using the v3 standard.
 */
export function encryptData(plaintext: string, _userId: string, secret: string): string {
    if (!secret) throw new Error('Encryption secret is required');

    try {
        const salt = crypto.randomBytes(V3_CONFIG.SALT_LENGTH);
        const iv = crypto.randomBytes(V3_CONFIG.IV_LENGTH);
        const derivedKey = deriveKeyV3(secret, salt);

        const cipher = crypto.createCipheriv(V3_CONFIG.ALGORITHM, derivedKey, iv, {
            authTagLength: V3_CONFIG.AUTH_TAG_LENGTH
        } as any) as any;

        const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();

        // Format: v3:salt(base64):iv(base64):authTag(base64):ciphertext(base64)
        return [
            V3_CONFIG.PREFIX,
            salt.toString('base64'),
            iv.toString('base64'),
            authTag.toString('base64'),
            encrypted.toString('base64')
        ].join(':');
    } catch (err) {
        logger.error('Encryption failed', { error: err });
        throw new Error('Encryption failed');
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN API - DECRYPTION (Compatible)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Decrypt data supporting v3, v2, and v1
 */
export function decryptData(payload: string, userId: string, secrets: string | string[]): string {
    const secretList = Array.isArray(secrets) ? secrets : [secrets];

    for (const secret of secretList) {
        try {
            // 🚀 Handle v3
            if (payload.startsWith('v3:')) {
                const parts = payload.split(':');
                if (parts.length !== 5) throw new Error('Invalid v3 format');

                const [, saltB64, ivB64, authTagB64, ciphertextB64] = parts;
                const salt = Buffer.from(saltB64, 'base64');
                const iv = Buffer.from(ivB64, 'base64');
                const authTag = Buffer.from(authTagB64, 'base64');
                const ciphertext = Buffer.from(ciphertextB64, 'base64');

                const derivedKey = deriveKeyV3(secret, salt);
                const decipher = crypto.createDecipheriv(V3_CONFIG.ALGORITHM, derivedKey, iv, {
                    authTagLength: V3_CONFIG.AUTH_TAG_LENGTH
                } as any) as any;

                decipher.setAuthTag(authTag);
                return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
            }

            // 🚀 Handle v2 (Legacy GCM but weak KDF)
            if (payload.includes(':') && payload.split(':').length >= 3) {
                const parts = payload.split(':');
                // Legacy v2 sometimes had 3 parts (iv:authTag:ciphertext) or 4 parts (prefix:iv:authTag:ciphertext)
                let ivB64, authTagB64, ciphertextB64;

                if (parts.length === 3) {
                    [ivB64, authTagB64, ciphertextB64] = parts;
                } else if (parts.length === 4) {
                    [, ivB64, authTagB64, ciphertextB64] = parts;
                } else {
                    throw new Error('Unknown legacy format');
                }

                const iv = Buffer.from(ivB64, 'base64');
                const authTag = Buffer.from(authTagB64, 'base64');
                const ciphertext = Buffer.from(ciphertextB64, 'base64');

                // Legacy v2 used simple PBKDF2 or direct key
                const key = crypto.createHash('sha256').update(secret).digest();
                const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv) as any;
                decipher.setAuthTag(authTag);
                return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
            }

            // 🚀 Handle v1 (Legacy CBC)
            const [ivHex, encryptedHex] = payload.split(':');
            if (ivHex && encryptedHex && ivHex.length === 32) {
                const iv = Buffer.from(ivHex, 'hex');
                const key = crypto.createHash('sha256').update(secret).digest();
                const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
                let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
                decrypted += decipher.final('utf8');
                return decrypted;
            }
        } catch (err) {
            // Continue trying other secrets
            continue;
        }
    }

    throw new Error('All decryption attempts failed (wrong format or incorrect secret)');
}

// ═════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═════════════════════════════════════════════════════════════════════════════

export function safeEncrypt(plaintext: string, userId: string, secret: string): string | null {
    try {
        return encryptData(plaintext, userId, secret);
    } catch (e) {
        return null;
    }
}

export function safeDecrypt(encryptedString: string, userId: string, secrets: string | string[]): string | null {
    try {
        return decryptData(encryptedString, userId, secrets);
    } catch (e) {
        return null;
    }
}

export function encryptObject<T extends Record<string, unknown>>(obj: T, userId: string, secret: string): string {
    return encryptData(JSON.stringify(obj), userId, secret);
}

export function decryptObject<T extends Record<string, unknown>>(encryptedString: string, userId: string, secrets: string | string[]): T {
    const plaintext = decryptData(encryptedString, userId, secrets);
    return JSON.parse(plaintext) as T;
}

export function isEncrypted(data: string | null | undefined): boolean {
    if (!data || typeof data !== 'string') return false;
    // v3 or v2 (3/4 parts base64) or v1 (hex iv:ciphertext)
    return data.startsWith('v3:') || (data.includes(':') && data.length > 32);
}
