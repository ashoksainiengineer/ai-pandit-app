import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/database/drizzle';
import { users } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
    // 1. Get the headers
    const headerPayload = headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

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
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
    }

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
        console.error('Error verifying webhook:', err);
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
            // Check if user exists
            const existing = await db.select().from(users).where(eq(users.clerkId, id)).limit(1);

            if (existing.length > 0) {
                // Update
                await db.update(users).set({
                    email: email || existing[0].email,
                    fullName: fullName || existing[0].fullName,
                    updatedAt: new Date().toISOString(),
                }).where(eq(users.clerkId, id));
                logger.info('User updated via webhook', { clerkId: id });
            } else {
                // Create
                await db.insert(users).values({
                    id: crypto.randomUUID(),
                    clerkId: id,
                    email: email || '',
                    fullName: fullName || null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });
                logger.info('User created via webhook', { clerkId: id });
            }
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
