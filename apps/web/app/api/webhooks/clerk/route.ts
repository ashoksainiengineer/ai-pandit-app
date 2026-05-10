import { env } from '@/lib/config/env';
import type { WebhookEvent } from '@clerk/nextjs/server';
import { logger } from '@/lib/secure-logger';
import { getBuildPhaseRouteResponse } from '@/lib/server/build-phase-route-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const buildPhaseResponse = getBuildPhaseRouteResponse();
    if (buildPhaseResponse) return buildPhaseResponse;

    // 1. Get the headers
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    // 2. If there are no headers, error out
    if (!svixId || !svixTimestamp || !svixSignature) {
        return new Response('Error occured -- no svix headers', {
            status: 400
        });
    }

    // 3. Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // 4. Create a new Svix instance with your secret.
    const WEBHOOK_SECRET = env.clerk.webhookSecret;

    if (!WEBHOOK_SECRET) {
        // BUG-FIX: Return proper response instead of unhandled throw
        return new Response('Webhook secret not configured', { status: 500 });
    }

    const [{ Webhook }, { db }, { users }, { eq }] = await Promise.all([
        import('svix'),
        import('@ai-pandit/db'),
        import('@ai-pandit/db/schema'),
        import('drizzle-orm'),
    ]);

    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;

    // 5. Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svixId,
            "svix-timestamp": svixTimestamp,
            "svix-signature": svixSignature,
        }) as WebhookEvent;
    } catch (err) {
        logger.error('Error verifying webhook:', err);
        return new Response('Error occured', {
            status: 400
        });
    }

    // 6. Handle the webhook
    const eventType = evt.type;

    if (eventType === 'user.created' || eventType === 'user.updated') {
        const { id, first_name: firstName, last_name: lastName, email_addresses: emailAddresses } = evt.data;
        const email = emailAddresses[0]?.email_address;
        const fullName = `${firstName || ''} ${lastName || ''}`.trim();

        if (!id) return new Response('No user ID', { status: 400 });

        try {
            const now = new Date().toISOString();
            await db.insert(users).values({
                id: crypto.randomUUID(),
                externalId: id,
                email: email || '',
                fullName: fullName || null,
                createdAt: now,
                updatedAt: now,
            }).onConflictDoUpdate({
                target: users.externalId,
                set: {
                    email: email || '',
                    fullName: fullName || null,
                    updatedAt: now,
                }
            });
            logger.info('User upserted via webhook', { externalId: id });
        } catch (error) {
            logger.error('Webhook DB error', { error, externalId: id });
            return new Response('Database error', { status: 500 });
        }
    }

    if (eventType === 'user.deleted') {
        const { id } = evt.data;
        if (id) {
            try {
                // BUG-FIX: Wrap delete in try/catch to prevent unhandled errors
                await db.delete(users).where(eq(users.externalId, id));
                logger.info('User deleted via webhook', { externalId: id });
            } catch (error) {
                logger.error('Webhook user delete error', { error, externalId: id });
                return new Response('Database error during user deletion', { status: 500 });
            }
        }
    }

    return new Response('', { status: 200 });
}
