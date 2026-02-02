/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
 *                                                                               
 *         🛑  DEPRECATED: This file is kept for backward compatibility  🛑      
 *                                                                               
 *         NEW CODE SHOULD USE: import { ... } from './encryption'               
 *                                                                               
 * ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚗️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This file re-exports from the new encryption module.
 * It exists to prevent breaking existing imports.
 *
 * @deprecated Use './encryption' instead
 */

// Re-export everything from the new encryption module
export {
    encryptData,
    decryptData,
    safeEncrypt,
    safeDecrypt,
    encryptObject,
    decryptObject,
    isEncrypted,
    safeDecryptWithFallback,
} from './encryption/index.js';

// Re-export types
export type {
    EncryptionResult,
    EncryptionSuccess,
    EncryptionFailure,
    DecryptionResult,
    DecryptionSuccess,
    DecryptionFailure,
} from './encryption/types.js';

// Log deprecation warning once
import { logger } from './logger.js';
logger.warn('[DEPRECATED] lib/crypto.ts is deprecated. Use import { ... } from "./encryption" instead.');
