import { createClerkClient } from '@clerk/backend';

const DEFAULT_TEMPLATE_NAME = 'ai-pandit-smoke';

export async function resolveSmokeBearerToken(): Promise<string> {
  const explicitToken = process.env.SMOKE_AUTH_TOKEN || process.env.SMOKE_CLERK_BEARER_TOKEN || process.env.CLERK_BEARER_TOKEN;
  if (explicitToken) {
    return explicitToken;
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  const smokeUserId = process.env.SMOKE_CLERK_USER_ID;

  if (!secretKey || !smokeUserId) {
    throw new Error('Missing auth. Set CLERK_BEARER_TOKEN/SMOKE_CLERK_BEARER_TOKEN, or configure CLERK_SECRET_KEY and SMOKE_CLERK_USER_ID for automatic token minting.');
  }

  const client = createClerkClient({ secretKey });
  const templateName = process.env.SMOKE_CLERK_TEMPLATE || DEFAULT_TEMPLATE_NAME;
  const templates = await client.jwtTemplates.list();

  if (!templates.data.some((template) => template.name === templateName)) {
    await client.jwtTemplates.create({
      name: templateName,
      claims: {},
      lifetime: 60,
      allowedClockSkew: 5,
    });
  }

  const sessions = await client.sessions.getSessionList({ userId: smokeUserId, status: 'active', limit: 10 });
  const activeSession = sessions.data[0];

  if (!activeSession) {
    throw new Error(`No active Clerk session found for smoke user ${smokeUserId}`);
  }

  const token = await client.sessions.getToken(activeSession.id, templateName);
  return token.jwt;
}
