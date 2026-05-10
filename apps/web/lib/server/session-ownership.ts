import { db } from '@ai-pandit/db';
import { sessions, users } from '@ai-pandit/db/schema';
import { and, eq, or } from 'drizzle-orm';

export interface SessionOwnershipContext {
  externalId: string;
  internalUserId: string | null;
}

export async function resolveSessionOwnershipContext(externalId: string): Promise<SessionOwnershipContext> {
  const user = await db.query.users.findFirst({
    where: eq(users.externalId, externalId),
    columns: { id: true },
  });

  return {
    externalId,
    internalUserId: user?.id ?? null,
  };
}

export function buildOwnedSessionWhereClause(sessionId: string, context: SessionOwnershipContext) {
  const ownershipPredicate = context.internalUserId
    ? or(eq(sessions.externalId, context.externalId), eq(sessions.userId, context.internalUserId))
    : eq(sessions.externalId, context.externalId);

  return and(eq(sessions.id, sessionId), ownershipPredicate);
}
