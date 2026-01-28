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

import { logger } from '../logger.js';

/**
 * 🔴 CRITICAL: ENCRYPTION_SECRET VALIDATION 🔴
 *
 * This secret is used in key derivation. If it changes, all existing
 * encrypted data becomes permanently unrecoverable.
 *
 * The secret is loaded from process.env.ENCRYPTION_SECRET and trimmed
 * to remove any accidental whitespace.
 */
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET?.trim();

/**
 * 🔴 DO NOT MODIFY THIS VALIDATION LOGIC 🔴
 *
 * The application MUST fail fast if the encryption secret is not configured.
 * Running without a secret would create unrecoverable data.
 */
if (!ENCRYPTION_SECRET) {
    logger.error('🔴 CRITICAL: ENCRYPTION_SECRET environment variable is not set');
    logger.error('   Data encryption is impossible without a secure master key');
    logger.error('   Set ENCRYPTION_SECRET to a cryptographically secure random string (64+ chars)');
    throw new Error('ENCRYPTION_SECRET is required for secure data storage');
}

/**
 * 🔴 DO NOT MODIFY THIS WARNING 🔴
 *
 * Warns if the secret is too short for security, but doesn't block.
 * Data is still recoverable with short secrets, just less secure.
 */
if (ENCRYPTION_SECRET.length < 32) {
    logger.warn('⚠️  ENCRYPTION_SECRET should be at least 32 characters for security');
}

/**
 * Export the validated encryption secret.
 * 🔴 DO NOT EXPOSE THIS OUTSIDE THE ENCRYPTION MODULE 🔴
 */
export { ENCRYPTION_SECRET };

/**
 * 🔴 CRITICAL FUNCTION - DO NOT MODIFY 🔴
 *
 * Gets the encryption secret. This is used internally by the encryption module.
 * ⚠️  Never log or expose this value.
 *
 * @returns The master encryption secret
 */
export function getEncryptionSecret(): string {
    // Type assertion is safe here because we throw if ENCRYPTION_SECRET is undefined
    return ENCRYPTION_SECRET as string;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
 *
 *                        END OF CRITICAL CONFIGURATION CODE
 *
 * ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
 * ═══════════════════════════════════════════════════════════════════════════════
 */
