// Thin wrapper around the shared user-sync implementation in @ai-pandit/db.
// Injects the app-specific Clerk client and Pino logger.

import { syncUser as syncUserShared } from '@ai-pandit/db';
import { logger } from '../utils/logger.js';
import { getClerk } from '../middleware/auth.js';

export async function syncUser(externalId: string): Promise<string> {
  return syncUserShared(externalId, {
    getProviderUser: async (id) => {
      const user = await getClerk().users.getUser(id);
      return {
        emailAddresses: user.emailAddresses,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    },
    log: (level, message, meta) => {
      const prefix =
        level === 'error' ? '❌ [Self-Healing]' :
        level === 'warn' ? '⚠️ [Self-Healing]' :
        '🔄 [Self-Healing]';
      // BUG-FIX: Pass undefined as error for error-level to avoid meta being cast as Error
      if (level === 'error') {
        logger.error(`${prefix} ${message}`, undefined, meta);
      } else {
        logger[level]?.(`${prefix} ${message}`, meta);
      }
    },
    testBypass: externalId === 'TEST_SCRIPT',
  });
}
