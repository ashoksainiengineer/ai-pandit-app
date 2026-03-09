import { db, executeWithRetry } from '@ai-pandit/db';
import { users } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';

export interface SessionOwnershipContext {
    clerkId: string;
    internalUserId: string | null;
}

export interface SessionOwnershipSnapshot {
    clerkId: string | null;
    userId: string | null;
}

export async function resolveSessionOwnershipContext(clerkId: string): Promise<SessionOwnershipContext> {
    const user = await executeWithRetry(() =>
        db.query.users.findFirst({
            where: eq(users.clerkId, clerkId),
            columns: { id: true },
        })
    );

    return {
        clerkId,
        internalUserId: user?.id ?? null,
    };
}

export function isSessionOwnedByContext(
    session: SessionOwnershipSnapshot,
    context: SessionOwnershipContext
): boolean {
    if (session.clerkId === context.clerkId) {
        return true;
    }

    if (!context.internalUserId) {
        return false;
    }

    return session.userId === context.internalUserId;
}
