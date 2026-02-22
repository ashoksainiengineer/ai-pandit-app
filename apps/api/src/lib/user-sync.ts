import { db, executeWithRetry } from '@ai-pandit/db';
import { users } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from './logger.js';
import { clerk } from '../middleware/auth.js';
import crypto from 'node:crypto';

/**
 * Self-Healing User Sync
 * 
 * Ensures a user exists in the local database by syncing from Clerk if missing.
 * This prevents orphaned sessions and handles edge cases where the webhook might have failed.
 * 
 * @param clerkId The external Clerk User ID
 * @returns The internal UUID for the user
 * @throws Error if synchronization fails
 */
export async function syncUser(clerkId: string): Promise<string> {
    const dbUser = await executeWithRetry(() =>
        db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
    );

    if (dbUser.length > 0) {
        return dbUser[0].id;
    }

    logger.info('🔄 [Self-Healing] User missing from DB. Syncing from Clerk...', { clerkId });

    try {
        const clerkUser = await clerk.users.getUser(clerkId);
        const email = clerkUser.emailAddresses[0]?.emailAddress || '';
        const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null;

        const internalUserId = crypto.randomUUID();

        await executeWithRetry(() =>
            db.insert(users).values({
                id: internalUserId,
                clerkId: clerkId,
                email: email,
                fullName: fullName,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
        );

        logger.info('✅ [Self-Healing] User record recreated successfully', { clerkId, internalUserId });
        return internalUserId;
    } catch (error) {
        logger.error('❌ [Self-Healing] Failed to fetch/create user from Clerk', {
            clerkId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw new Error('User synchronization failed');
    }
}
