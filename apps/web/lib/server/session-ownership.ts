import { db } from '@ai-pandit/db';
import { sessions, users } from '@ai-pandit/db/schema';
import { and, eq, or } from 'drizzle-orm';

export interface SessionOwnershipContext {
  clerkId: string;
  internalUserId: string | null;
}

export async function resolveSessionOwnershipContext(clerkId: string): Promise<SessionOwnershipContext> {
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
    columns: { id: true },
  });

  return {
    clerkId,
    internalUserId: user?.id ?? null,
  };
}

export function buildOwnedSessionWhereClause(sessionId: string, context: SessionOwnershipContext) {
  const ownershipPredicate = context.internalUserId
    ? or(eq(sessions.clerkId, context.clerkId), eq(sessions.userId, context.internalUserId))
    : eq(sessions.clerkId, context.clerkId);

  return and(eq(sessions.id, sessionId), ownershipPredicate);
}
