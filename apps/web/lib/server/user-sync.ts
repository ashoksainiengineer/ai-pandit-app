import crypto from 'node:crypto';
import { db } from '@ai-pandit/db';
import { users } from '@ai-pandit/db/schema';
import { eq } from 'drizzle-orm';

interface EnsureUserInput {
  clerkId: string;
  email?: string | null;
  fullName?: string | null;
}

export async function ensureUserRecord(input: EnsureUserInput): Promise<{ id: string; clerkId: string }> {
  const existing = await db.query.users.findFirst({
    where: eq(users.clerkId, input.clerkId),
  });
  if (existing) {
    return {
      id: existing.id,
      clerkId: existing.clerkId,
    };
  }

  const now = new Date().toISOString();
  await db.insert(users)
    .values({
      id: crypto.randomUUID(),
      clerkId: input.clerkId,
      email: input.email ?? '',
      fullName: input.fullName ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing({ target: users.clerkId });

  const resolved = await db.query.users.findFirst({
    where: eq(users.clerkId, input.clerkId),
  });
  if (!resolved) {
    throw new Error('Failed to resolve user after upsert');
  }

  return {
    id: resolved.id,
    clerkId: resolved.clerkId,
  };
}
