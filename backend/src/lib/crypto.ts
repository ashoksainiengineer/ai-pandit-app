// ═══════════════════════════════════════════════════════════════════════════════
// ENCRYPTION MODULE - AES-256-GCM with Per-User Key Derivation
// ═══════════════════════════════════════════════════════════════════════════════
//
// Security Model:
// - Each user's data is encrypted with a unique key derived from their userId
// - Master secret (ENCRYPTION_SECRET) is required at startup - no fallbacks
// - AES-256-GCM provides authenticated encryption (confidentiality + integrity)
//
// ═══════════════════════════════════════════════════════════════════════════════

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { logger } from './logger.js';

// ───────────────────────────────────────────────────────────────────────────────
// CONFIGURATION - Fail fast if encryption secret not configured
// ───────────────────────────────────────────────────────────────────────────────

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET?.trim();

if (!ENCRYPTION_SECRET) {
    logger.error('🔴 CRITICAL: ENCRYPTION_SECRET environment variable is not set');
    logger.error('   Data encryption is impossible without a secure master key');
    logger.error('   Set ENCRYPTION_SECRET to a cryptographically secure random string (64+ chars)');
    throw new Error('ENCRYPTION_SECRET is required for secure data storage');
}

if (ENCRYPTION_SECRET.length < 32) {
    logger.warn('⚠️  ENCRYPTION_SECRET should be at least 32 characters for security');
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface EncryptionResult {
    encrypted: string;
    success: true;
}

export interface EncryptionError {
    error: string;
    success: false;
}

// ═══════════════════════════════════════════════════════════════════════════════
// KEY DERIVATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Derive a unique encryption key for each user using scrypt.
 * Combines user's unique ID with master secret for per-user encryption.
 *
 * @param userId - Unique identifier for the user (clerkId)
 * @returns 32-byte Buffer for AES-256 key
 */
function deriveKey(userId: string): Buffer {
    // scrypt parameters: N=16384, r=8, p=1 (Node.js defaults)
    // Salt is deterministic per user (userId-based) for key derivation consistency
    return scryptSync(
        `${userId}:${ENCRYPTION_SECRET}`,
        `ai-pandit-salt-${userId.slice(-8)}`, // Unique salt per user
        32 // 256 bits for AES-256
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORE ENCRYPTION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Encrypt plaintext data using AES-256-GCM.
 *
 * Format: base64(iv):base64(authTag):base64(ciphertext)
 * All components are base64url-safe encoded.
 *
 * @param plaintext - Data to encrypt
 * @param userId - User identifier for key derivation
 * @returns Encrypted string in format "iv:authTag:ciphertext"
 * @throws Error if encryption fails (should never happen in normal operation)
 */
export function encryptData(plaintext: string, userId: string): string {
    try {
        const key = deriveKey(userId);
        const iv = randomBytes(16); // 128-bit IV for GCM

        const cipher = createCipheriv('aes-256-gcm', key, iv);

        let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
        ciphertext += cipher.final('base64');

        const authTag = cipher.getAuthTag();

        // Format: iv:authTag:ciphertext
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
 * Decrypt data encrypted with encryptData().
 *
 * @param encryptedString - Format: "iv:authTag:ciphertext" (base64 encoded)
 * @param userId - User identifier for key derivation
 * @returns Decrypted plaintext
 * @throws Error if decryption fails (wrong key, tampered data, etc.)
 */
export function decryptData(encryptedString: string, userId: string): string {
    try {
        const key = deriveKey(userId);
        const parts = encryptedString.split(':');

        if (parts.length !== 3) {
            throw new Error('Invalid encrypted data format: expected 3 components');
        }

        const [ivB64, authTagB64, ciphertext] = parts;

        if (!ivB64 || !authTagB64 || !ciphertext) {
            throw new Error('Invalid encrypted data: missing components');
        }

        const iv = Buffer.from(ivB64, 'base64');
        const authTag = Buffer.from(authTagB64, 'base64');

        if (iv.length !== 16) {
            throw new Error('Invalid IV length');
        }
        if (authTag.length !== 16) {
            throw new Error('Invalid auth tag length');
        }

        const decipher = createDecipheriv('aes-256-gcm', key, iv);
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
// OBJECT SERIALIZATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Encrypt a JavaScript object (JSON-serialized then encrypted).
 */
export function encryptObject<T extends Record<string, unknown>>(obj: T, userId: string): string {
    return encryptData(JSON.stringify(obj), userId);
}

/**
 * Decrypt to a JavaScript object (decrypts then JSON-parsed).
 */
export function decryptObject<T extends Record<string, unknown>>(encryptedString: string, userId: string): T {
    const decrypted = decryptData(encryptedString, userId);
    return JSON.parse(decrypted) as T;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORMAT DETECTION & SAFE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if a string appears to be in our encrypted format.
 * This is a heuristic check - returns false for plaintext, true for likely encrypted.
 */
export function isEncrypted(data: string): boolean {
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
 * Safely encrypt data. On failure, returns null instead of throwing.
 * Use for non-critical operations where encryption failure shouldn't crash the app.
 */
export function safeEncrypt(data: string, userId: string): string | null {
    try {
        return encryptData(data, userId);
    } catch (error) {
        logger.error('SafeEncrypt failed', { userId: userId.slice(0, 8), error });
        return null;
    }
}

/**
 * Safely decrypt data. On failure, returns null instead of throwing.
 * Use for read operations where decryption failure should be handled gracefully.
 */
export function safeDecrypt(encryptedString: string, userId: string): string | null {
    try {
        if (!isEncrypted(encryptedString)) {
            // Data appears to be plaintext (legacy or unencrypted)
            return encryptedString;
        }
        return decryptData(encryptedString, userId);
    } catch (error) {
        logger.error('SafeDecrypt failed', { userId: userId.slice(0, 8), error });
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default {
    encryptData,
    decryptData,
    encryptObject,
    decryptObject,
    isEncrypted,
    safeEncrypt,
    safeDecrypt,
};
