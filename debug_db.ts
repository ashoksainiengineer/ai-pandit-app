
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

// Manual config loading to be 100% sure
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error("❌ Missing Credentials in backend/.env");
    process.exit(1);
}

const client = createClient({
    url,
    authToken,
});

async function inspect() {
    console.log("Connecting to:", url);
    try {
        const id = '2f207ae6-0387-4039-8fc8-72128f0bf361';
        const rs = await client.execute({
            sql: "UPDATE sessions SET status = 'pending', errorMessage = NULL WHERE id = ?",
            args: [id]
        });
        console.log("✅ Session status reset to PENDING");

        if (rs.rows.length === 0) {
            console.log("❌ Session NOT FOUND");
        } else {
            const row = rs.rows[0];

            console.log("\n🔍 CRITICAL FIELDS CHECK:");
            console.log("-----------------------------------------");
            console.log("ID:", row.id);
            console.log("ClerkID:", row.clerkId);
            console.log("UserID:", row.userId);
            // Check both snake_case (raw SQL) and camelCase (Drizzle) just in case
            console.log("dateOfBirth:", row.dateOfBirth);
            console.log("tentativeTime:", row.tentativeTime);
            console.log("Latitude:", row.latitude);
            console.log("Longitude:", row.longitude);
            console.log("Timezone:", row.timezone);
            console.log("Offset Config:", row.offsetConfig ? "(Present)" : "(Null)");
            console.log("Life Events:", JSON.stringify(row.lifeEvents, null, 2));

            console.log("Status:", row.status);
            console.log("errorMessage:", row.errorMessage || row.error_message);
            console.log("-----------------------------------------");
        }
    } catch (e) {
        console.error("❌ DB Query Error:", e);
    }
}

inspect();
