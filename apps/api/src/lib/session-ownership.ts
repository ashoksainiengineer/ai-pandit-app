import { db, executeWithRetry } from '@ai-pandit/db';
import { users } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';

export interface SessionOwnershipContext {
    externalId: string;
    internalUserId: string | null;
}

export interface SessionOwnershipSnapshot {
    externalId: string | null;
    userId: string | null;
}

export async function resolveSessionOwnershipContext(externalId: string): Promise<SessionOwnershipContext> {
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
            externalId,
            internalUserId: null,
        };
    }

    const user = await executeWithRetry(() =>
        queryUsers.findFirst({
            where: eq(users.externalId, externalId),
            columns: { id: true },
        })
    );

    return {
        externalId,
        internalUserId: user?.id ?? null,
    };
}

export function isSessionOwnedByContext(
    session: SessionOwnershipSnapshot,
    context: SessionOwnershipContext
): boolean {
    if (session.externalId === context.externalId) {
        return true;
    }

    if (!context.internalUserId) {
        return false;
    }

    return session.userId === context.internalUserId;
}
