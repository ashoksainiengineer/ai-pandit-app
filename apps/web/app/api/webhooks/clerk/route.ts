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
    const svix_id = req.headers.get('svix-id');
    const svix_timestamp = req.headers.get('svix-timestamp');
    const svix_signature = req.headers.get('svix-signature');

    // 2. If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
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
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
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
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
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
        const { id, first_name, last_name, email_addresses, image_url } = evt.data;
        const email = email_addresses[0]?.email_address;
        const fullName = `${first_name || ''} ${last_name || ''}`.trim();

        if (!id) return new Response('No user ID', { status: 400 });

        try {
            const now = new Date().toISOString();
            await db.insert(users).values({
                id: crypto.randomUUID(),
                clerkId: id,
                email: email || '',
                fullName: fullName || null,
                createdAt: now,
                updatedAt: now,
            }).onConflictDoUpdate({
                target: users.clerkId,
                set: {
                    email: email || '',
                    fullName: fullName || null,
                    updatedAt: now,
                }
            });
            logger.info('User upserted via webhook', { clerkId: id });
        } catch (error) {
            logger.error('Webhook DB error', { error, clerkId: id });
            return new Response('Database error', { status: 500 });
        }
    }

    if (eventType === 'user.deleted') {
        const { id } = evt.data;
        if (id) {
            await db.delete(users).where(eq(users.clerkId, id));
            logger.info('User deleted via webhook', { clerkId: id });
        }
    }

    return new Response('', { status: 200 });
}
