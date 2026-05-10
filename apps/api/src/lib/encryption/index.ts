/**
 * Express API Encryption — Clean Barrel (v2 — No Fallback)
 *
 * All crypto logic lives in @ai-pandit/shared. This module:
 *   1. Provides a pre-bound EncryptionInstance via getApiEncryption()
 *   2. Re-exports createEncryption, isEncrypted, EncryptionInstance from shared
 *   3. No backward compatibility signatures. No fallback IDs. No externalId as key.
 *
 * MIGRATION: Consumers should import { getApiEncryption } and use
 *   crypto.encrypt(data, userId) / crypto.decrypt(data, userId) / crypto.parseField(data, userId)
 */

import {
  createEncryption,
  type EncryptionInstance,
} from '@ai-pandit/shared';

// Re-export from shared for consumers
export { createEncryption } from '@ai-pandit/shared';
export type { EncryptionInstance } from '@ai-pandit/shared';
export { isEncrypted } from '@ai-pandit/shared';

let _instance: EncryptionInstance | null = null;

/** Get the API's pre-bound encryption instance (lazy-init from config). */
export function getApiEncryption(): EncryptionInstance {
  if (!_instance) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const { config } = require('../../config/index.js');
    _instance = createEncryption(config.security.encryptionSecret);
  }
  return _instance;
}
