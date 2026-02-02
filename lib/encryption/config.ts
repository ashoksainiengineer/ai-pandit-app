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

let cachedSecrets: string[] | undefined;

function loadEncryptionSecrets(): string[] {
    if (cachedSecrets !== undefined) {
        return cachedSecrets;
    }

    const secretsString = process.env.ENCRYPTION_SECRET?.trim();

    if (!secretsString) {
        console.error('🔴 CRITICAL: ENCRYPTION_SECRET environment variable is not set');
        console.error('   Data encryption is impossible without a secure master key');
        console.error('   Set ENCRYPTION_SECRET to a cryptographically secure random string (64+ chars)');
        throw new Error('ENCRYPTION_SECRET is required for secure data storage');
    }

    // Support comma-separated secrets for rotation
    const secrets = secretsString.split(',').map(s => s.trim()).filter(Boolean);

    if (secrets.length === 0) {
        throw new Error('No valid secrets found in ENCRYPTION_SECRET');
    }

    for (const secret of secrets) {
        if (secret.length < 32) {
            console.warn('⚠️  One of the ENCRYPTION_SECRETS is less than 32 characters');
        }
    }

    cachedSecrets = secrets;
    return secrets;
}

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 *
 * Gets the primary encryption secret. Used for ALL NEW encryption operations.
 * ⚠️  Never log or expose this value.
 *
 * @returns The primary master encryption secret
 */
export function getEncryptionSecret(): string {
    return loadEncryptionSecrets()[0];
}

/**
 * Gets all configured encryption secrets for rotation support.
 * @returns Array of encryption secrets
 */
export function getAllEncryptionSecrets(): string[] {
    return loadEncryptionSecrets();
}

/**
 * Validates that secrets are correctly configured on startup.
 */
export function validateSecrets(): void {
    const secrets = loadEncryptionSecrets();
    console.log(`[Encryption] Initialized with ${secrets.length} secret(s).`);
}

// For backward compatibility - export a getter that looks like a constant
// This will throw only when actually accessed, not at import/build time
const ENCRYPTION_SECRET_GETTER = {
    toString() {
        return getEncryptionSecret();
    },
    valueOf() {
        return getEncryptionSecret();
    },
    get value() {
        return getEncryptionSecret();
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
