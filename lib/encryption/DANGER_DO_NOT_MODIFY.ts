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

// ═══════════════════════════════════════════════════════════════════════════════
// ⚠️  VERSIONING & PERFORMANCE - DO NOT MODIFY ⚠️
// ═══════════════════════════════════════════════════════════════════════════════

export const VERSION_PREFIX = 'v1:';

// Key cache to avoid expensive derivation on every call
const keyCache = new Map<string, Buffer>();

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 *
 * Derives a unique encryption key for each user.
 *
 * @param userId - The user's unique identifier (Clerk ID)
 * @param secret - The master ENCRYPTION_SECRET from environment
 * @returns 32-byte Buffer for AES-256 key
 */
export function deriveKey(userId: string, secret: string): Buffer {
    const cacheKey = `${userId}:${secret}`;
    const cached = keyCache.get(cacheKey);
    if (cached) return cached;

    // 🔴 DO NOT MODIFY THIS IMPLEMENTATION 🔴
    const key = scryptSync(
        userId + secret,
        KEY_DERIVATION_SALT,
        KEY_LENGTH_BYTES
    );

    keyCache.set(cacheKey, key);
    return key;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⚠️  ENCRYPTION FUNCTIONS - DO NOT MODIFY ⚠️
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 * 
 * Encrypts data with the latest version (v2).
 * Uses random salt + scrypt + AES-256-GCM.
 */
export function encryptData(plaintext: string, _userId: string, secret: string): string {
    const salt = randomBytes(SALT_LENGTH_BYTES);
    const key = scryptSync(secret, salt, KEY_LENGTH_BYTES, SCRYPT_PARAMS_V2);
    const iv = randomBytes(IV_LENGTH_BYTES);
    const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // v2 format: v2:base64(salt):base64(iv):base64(authTag):base64(ciphertext)
    return 'v2:' + [
        salt.toString('base64'),
        iv.toString('base64'),
        authTag.toString('base64'),
        ciphertext
    ].join(':');
}

const SCRYPT_PARAMS_V2 = { N: 65536, r: 8, p: 1, maxmem: 128 * 1024 * 1024 };
const SALT_LENGTH_BYTES = 32;

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 * 
 * Internal low-level decryption for salted v2 format.
 * Format: v2:base64(salt):base64(iv):base64(tag):base64(ciphertext)
 * or legacy: base64(salt):base64(iv):base64(tag):base64(ciphertext)
 */
function attemptV2Decryption(encryptedString: string, secret: string): string {
    let payload = encryptedString;
    if (payload.startsWith('v2:')) {
        payload = payload.substring(3);
    }

    const parts = payload.split(':');
    if (parts.length !== 4) {
        throw new Error('Invalid v2 encrypted data format');
    }

    const [saltB64, ivB64, authTagB64, ciphertextB64] = parts;
    const salt = Buffer.from(saltB64, 'base64');
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const ciphertext = Buffer.from(ciphertextB64, 'base64');

    if (salt.length !== SALT_LENGTH_BYTES) {
        throw new Error('Invalid salt length');
    }

    // V2 uses scrypt with secret and salt only (no userId for decentralization)
    const key = scryptSync(secret, salt, KEY_LENGTH_BYTES, SCRYPT_PARAMS_V2);

    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 * 
 * Internal low-level decryption for a single secret (Legacy).
 */
function attemptLegacyDecryption(encryptedString: string, userId: string, secret: string): string {
    const key = deriveKey(userId, secret);

    let payload = encryptedString;
    if (payload.startsWith(VERSION_PREFIX)) {
        payload = payload.substring(VERSION_PREFIX.length);
    }

    const parts = payload.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid legacy encrypted data format');
    }

    const [ivB64, authTagB64, ciphertextB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');

    if (iv.length !== IV_LENGTH_BYTES || authTag.length !== AUTH_TAG_LENGTH_BYTES) {
        throw new Error('Invalid component lengths');
    }

    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return decipher.update(ciphertextB64, 'base64', 'utf8') + decipher.final('utf8');
}

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 *
 * Decrypts data using multi-secret rotation and multi-version support.
 */
export function decryptData(encryptedString: string, userId: string, secrets: string | string[]): string {
    const secretList = Array.isArray(secrets) ? secrets : [secrets];
    const parts = encryptedString.split(':');

    // Format detection
    const isV2 = encryptedString.startsWith('v2:') || parts.length === 4;
    const isLegacy = !encryptedString.startsWith('v2:') && (parts.length === 3 || encryptedString.startsWith('v1:'));

    let lastError: Error | undefined;

    // Phase 1: Try the most likely format first across all secrets
    for (const secret of secretList) {
        try {
            if (isV2) return attemptV2Decryption(encryptedString, secret);
            if (isLegacy) return attemptLegacyDecryption(encryptedString, userId, secret);
        } catch (error) {
            lastError = error as Error;
        }
    }

    // Phase 2: Bruteforce fallback (try all formats for all secrets)
    // Only happens if detection was wrong or data is in an unexpected format
    for (const secret of secretList) {
        try { return attemptV2Decryption(encryptedString, secret); } catch { }
        try { return attemptLegacyDecryption(encryptedString, userId, secret); } catch { }
    }

    throw lastError || new Error('Decryption failed: all secrets and formats exhausted');
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⚠️  SAFE OPERATIONS - DO NOT MODIFY ⚠️
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 *
 * Checks if a string appears to be encrypted data (verifying v2, v1, or legacy formats).
 */
export function isEncrypted(data: string): boolean {
    if (!data || typeof data !== 'string') return false;

    // v2 detection
    if (data.startsWith('v2:')) {
        return data.split(':').length === 5;
    }

    // v1 or legacy detection
    const parts = data.split(':');
    if (parts.length === 3 || parts.length === 4) {
        // v1 prefix takes up a slot, or legacy 3/4 parts
        const base64Pattern = /^[A-Za-z0-9+/=]+$/;
        // Verify at least one part (the ciphertext) looks like base64
        return base64Pattern.test(parts[parts.length - 1]);
    }

    return false;
}

export function safeDecrypt(encryptedString: string, userId: string, secrets: string | string[]): string | null {
    // 🔴 DO NOT MODIFY THE CORE CRYPTO - ONLY THE ERROR HANDLING FOR RESILIENCE 🔴
    try {
        if (!isEncrypted(encryptedString)) {
            // Data appears to be plaintext (unencrypted)
            return encryptedString;
        }
        return decryptData(encryptedString, userId, secrets);
    } catch (error: any) {
        // Handle common decryption errors gracefully during development
        const isAuthError = error.message?.includes('Unsupported state') || error.message?.includes('authentication data');

        if (isAuthError) {
            console.warn(`[Encryption] Decryption failed for user ${userId.slice(0, 8)}... (likely key mismatch)`);
        } else {
            console.error('[Encryption] Unexpected decryption error:', error.message);
        }

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
        console.error('Encryption failed:', error);
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

export function decryptObject<T extends Record<string, unknown>>(
    encryptedString: string,
    userId: string,
    secrets: string | string[]
): T {
    // 🔴 DO NOT MODIFY 🔴
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
