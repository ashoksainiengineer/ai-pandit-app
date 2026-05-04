/**
 * 🔴 CRITICAL - ENCRYPTION CORE - DANGER_DO_NOT_MODIFY 🔴
 * 
 * This file contains the authoritative encryption logic for the entire system.
 * It implements the 'v4' standard (AES-256-GCM + scrypt with user isolation).
 * 
 * Versioning Table:
 * v4: AES-256-GCM (NIST-Standard: scrypt with combined secret:userId + userId as AAD)
 */
import crypto from 'crypto';
import { logger } from '../../utils/logger.js';

// ═════════════════════════════════════════════════════════════════════════════
// V4 CONFIGURATION
// ═════════════════════════════════════════════════════════════════════════════

const V4_CONFIG = {
    ALGORITHM: 'aes-256-gcm',
    KEY_LENGTH: 32,
    IV_LENGTH: 12,
    SALT_LENGTH: 16,
    AUTH_TAG_LENGTH: 16,
    SCRYPT_PARAMS: { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
    PREFIX: 'v4'
};
/**
 * Derives a user-isolated key synchronously using scrypt.
 */
function deriveKeyV4(secret: string, userId: string, salt: Buffer): Buffer {
    const combinedSecret = `${secret}:${userId}`;
    return crypto.scryptSync(combinedSecret, salt, V4_CONFIG.KEY_LENGTH, V4_CONFIG.SCRYPT_PARAMS);
}
// ═════════════════════════════════════════════════════════════════════════════
// MAIN API - ENCRYPTION
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Encrypt data using the v4 standard (User Isolated).
 */
export function encryptData(plaintext: string, userId: string, secret: string): string {
    if (!secret) throw new Error('Encryption secret is required');
    if (!userId) throw new Error('userId is required for v4 encryption isolation');

    try {
        const salt = crypto.randomBytes(V4_CONFIG.SALT_LENGTH);
        const iv = crypto.randomBytes(V4_CONFIG.IV_LENGTH);
        const derivedKey = deriveKeyV4(secret, userId, salt);

const cipher = crypto.createCipheriv(V4_CONFIG.ALGORITHM, derivedKey, iv, {
            authTagLength: V4_CONFIG.AUTH_TAG_LENGTH
        } as crypto.CipherGCMOptions);

        // User payload is strictly verified during tag validation
        (cipher as crypto.CipherGCM).setAAD(Buffer.from(userId, 'utf8'));

        const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
        const authTag = (cipher as crypto.CipherGCM).getAuthTag();

        // Format: v4:salt(base64):iv(base64):authTag(base64):ciphertext(base64)
        return [
            V4_CONFIG.PREFIX,
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
// MAIN API - DECRYPTION
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Decrypt data supporting v4 only.
 */
export function decryptData(payload: string, userId: string, secrets: string | string[]): string {
    const secretList = Array.isArray(secrets) ? secrets : [secrets];

    for (const secret of secretList) {
        try {
            // 🚀 Handle v4 (User Isolated)
            if (payload.startsWith('v4:')) {
                const parts = payload.split(':');
                if (parts.length !== 5) throw new Error('Invalid v4 format');

                const [, saltB64, ivB64, authTagB64, ciphertextB64] = parts;
                const salt = Buffer.from(saltB64, 'base64');
                const iv = Buffer.from(ivB64, 'base64');
                const authTag = Buffer.from(authTagB64, 'base64');
                const ciphertext = Buffer.from(ciphertextB64, 'base64');

                const derivedKey = deriveKeyV4(secret, userId, salt);
                const decipher = crypto.createDecipheriv(V4_CONFIG.ALGORITHM, derivedKey, iv, {
                    authTagLength: V4_CONFIG.AUTH_TAG_LENGTH
                } as crypto.CipherGCMOptions);

                (decipher as crypto.DecipherGCM).setAAD(Buffer.from(userId, 'utf8'));
                (decipher as crypto.DecipherGCM).setAuthTag(authTag);
                return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
            }
        } catch (err) {
            logger.debug('Decryption attempt failed for this secret', { error: (err as Error)?.message || err });
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
    try {
        return JSON.parse(plaintext) as T;
    } catch (error) {
        throw new Error('Decrypted data is not valid JSON');
    }
}

export function isEncrypted(data: string | null | undefined): boolean {
    if (!data || typeof data !== 'string') return false;
    return data.startsWith('v4:');
}
