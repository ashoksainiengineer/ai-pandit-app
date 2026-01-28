/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
 *                                                                               
 *         🛑  DEPRECATED: This file is kept for backward compatibility  🛑      
 *                                                                               
 *         NEW CODE SHOULD USE: import { ... } from '@/lib/encryption'           
 *                                                                               
 * ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️  ⚠️
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This file re-exports from the new encryption module.
 * It exists to prevent breaking existing imports.
 *
 * @deprecated Use '@/lib/encryption' instead
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
} from './encryption';

// Re-export types
export type {
    EncryptionResult,
    EncryptionSuccess,
    EncryptionFailure,
    DecryptionResult,
    DecryptionSuccess,
    DecryptionFailure,
} from './encryption/types';

// Log deprecation warning once
if (typeof console !== 'undefined') {
    console.warn(
        '[DEPRECATED] lib/crypto.ts is deprecated. ' +
        'Use import { ... } from "@/lib/encryption" instead.'
    );
}
