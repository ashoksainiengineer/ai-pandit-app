/**
 * ============================================================================
 *  Clerk Auth Provider — Express API Backend
 * ============================================================================
 *
 * Implements the AuthProvider interface using @clerk/backend.
 * This is the ONLY file in the Express API that directly imports from
 * @clerk/backend. All other files depend on the AuthProvider interface.
 *
 * When migrating away from Clerk: implement a new provider (e.g., Auth0Provider)
 * and swap it in. No other files need to change.
 */

import { createClerkClient, verifyToken as clerkVerifyToken } from '@clerk/backend';
import { db, executeWithRetry } from '@ai-pandit/db';
import { users } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
import type {
  AuthProvider,
  AuthIdentity,
  AuthUserProfile,
  TokenVerificationResult,
} from '@ai-pandit/shared';

// ── Singleton Clerk client ───────────────────────────────────────────────────

let _clerkClient: ReturnType<typeof createClerkClient> | null = null;

function getClerkClient() {
  if (!_clerkClient) {
    _clerkClient = createClerkClient({ secretKey: config.security.clerkSecretKey });
  }
  return _clerkClient;
}

// ── Provider Implementation ──────────────────────────────────────────────────

export const clerkAuthProvider: AuthProvider = {
  provider: 'clerk',

  async verifyToken(token: string): Promise<TokenVerificationResult> {
    try {
      const session = await clerkVerifyToken(token, {
        secretKey: config.security.clerkSecretKey,
        clockSkewInMs: 900_000, // 15 minutes clock skew tolerance
      });

      if (!session?.sub) {
        return {
          identity: null,
          error: 'Token verified but missing subject (sub) claim',
        };
      }

      // Resolve internal userId from providerId (externalId → internal UUID)
      const userId = await resolveUserIdFromDb(session.sub);

      return {
        identity: {
          userId: userId ?? session.sub, // fall back to providerId if no DB mapping yet
          providerId: session.sub,
          sessionId: session.sid ?? '',
          provider: 'clerk',
        },
        error: null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn('[Auth] Clerk token verification failed', { error: message });
      return {
        identity: null,
        error: `Token verification failed: ${message}`,
      };
    }
  },

  async getUserProfile(providerId: string): Promise<AuthUserProfile | null> {
    try {
      const clerk = getClerkClient();
      const user = await clerk.users.getUser(providerId);

      if (!user) return null;

      return {
        providerId: user.id,
        email: user.emailAddresses[0]?.emailAddress ?? null,
        fullName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || null,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        imageUrl: user.imageUrl ?? null,
      };
    } catch (error) {
      logger.warn('[Auth] Failed to get Clerk user profile', {
        providerId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  },

  async resolveUserId(providerId: string): Promise<string | null> {
    return resolveUserIdFromDb(providerId);
  },
};

// ── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Resolve internal userId (UUID) from provider-specific identifier.
 * Queries the users table: users.externalId → users.id.
 */
async function resolveUserIdFromDb(providerId: string): Promise<string | null> {
  try {
    const result = await executeWithRetry(() =>
      db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.externalId, providerId))
        .limit(1),
    );

    return result[0]?.id ?? null;
  } catch (error) {
    logger.warn('[Auth] Failed to resolve userId from DB', {
      providerId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Get the Clerk client for admin operations (webhooks, user sync, etc.).
 * Only use this for Clerk-specific operations that don't fit the AuthProvider
 * interface (e.g., Clerk webhooks, user metadata management).
 */
export function getClerkAdminClient() {
  return getClerkClient();
}
