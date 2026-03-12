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
    const queryUsers = (db as typeof db & {
        query?: {
            users?: {
                findFirst?: (input: {
                    where: unknown;
                    columns: { id: true };
                }) => Promise<{ id: string } | undefined>;
            };
        };
    }).query?.users;

    if (!queryUsers?.findFirst) {
        return {
            clerkId,
            internalUserId: null,
        };
    }

    const user = await executeWithRetry(() =>
        queryUsers.findFirst({
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
