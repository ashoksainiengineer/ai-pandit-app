
import 'dotenv/config';
import { db } from './backend/src/database/drizzle';
import { sessions } from './backend/src/database/schema';
import { eq } from 'drizzle-orm';

async function inspectSession() {
    const id = '2f207ae6-0387-4039-8fc8-72128f0bf361';
    console.log(`Inspecting Session: ${id}`);

    try {
        const session = await db.select().from(sessions).where(eq(sessions.id, id)).get();
        if (!session) {
            console.log("Session not found");
        } else {
            console.log("DOB:", session.dateOfBirth);
            console.log("Time:", session.tentativeTime);
            console.log("Status:", session.status);
            console.log("Created At:", session.createdAt);
            console.log("Updated At:", session.updatedAt);
        }
    } catch (e) {
        console.error("DB Error:", e);
    }
}

inspectSession();
