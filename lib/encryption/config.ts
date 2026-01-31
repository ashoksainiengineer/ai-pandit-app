/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
 *                                                                               
 *                         🛑  DANGER: DO NOT MODIFY  🛑                         
 *                                                                               
 *    THIS FILE LOADS THE ENCRYPTION SECRET. CHANGING HOW THIS IS LOADED        
 *    MAY CAUSE KEY MISMATCH AND DATA CORRUPTION.                               
 *                                                                               
 * ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * ENCRYPTION CONFIGURATION
 * Version: 1.0.0-FROZEN
 *
 * Purpose: Load and validate the ENCRYPTION_SECRET environment variable.
 *
 * ⚠️  WARNING: The ENCRYPTION_SECRET must be exactly the same value that was
 *    used to encrypt existing data. If the secret changes, ALL data becomes
 *    unrecoverable.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// LAZY LOADING PATTERN - Prevents build-time errors
// The secret is loaded and validated only when first accessed at runtime
// ═══════════════════════════════════════════════════════════════════════════════

let cachedSecret: string | undefined;

function loadEncryptionSecret(): string {
    if (cachedSecret !== undefined) {
        return cachedSecret;
    }

    const secret = process.env.ENCRYPTION_SECRET?.trim();

    if (!secret) {
        console.error('🔴 CRITICAL: ENCRYPTION_SECRET environment variable is not set');
        console.error('   Data encryption is impossible without a secure master key');
        console.error('   Set ENCRYPTION_SECRET to a cryptographically secure random string (64+ chars)');
        throw new Error('ENCRYPTION_SECRET is required for secure data storage');
    }

    if (secret.length < 32) {
        console.warn('⚠️  ENCRYPTION_SECRET should be at least 32 characters for security');
    }

    cachedSecret = secret;
    return secret;
}

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 *
 * Gets the encryption secret. This is used internally by the encryption module.
 * ⚠️  Never log or expose this value.
 *
 * This function uses lazy loading to prevent build-time errors.
 * The secret is only loaded and validated when first accessed at runtime.
 *
 * @returns The master encryption secret
 */
export function getEncryptionSecret(): string {
    return loadEncryptionSecret();
}

// For backward compatibility - export a getter that looks like a constant
// This will throw only when actually accessed, not at import/build time
const ENCRYPTION_SECRET_GETTER = {
    toString() {
        return loadEncryptionSecret();
    },
    valueOf() {
        return loadEncryptionSecret();
    },
    get value() {
        return loadEncryptionSecret();
    }
};

// Export as any to maintain backward compatibility
export { ENCRYPTION_SECRET_GETTER as ENCRYPTION_SECRET };

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
 *
 *                        END OF CRITICAL CONFIGURATION CODE
 *
 * ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
 * ═══════════════════════════════════════════════════════════════════════════════
 */
