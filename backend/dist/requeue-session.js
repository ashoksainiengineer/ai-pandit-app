"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const drizzle_1 = require("./database/drizzle");
const schema_1 = require("./database/schema");
const drizzle_orm_1 = require("drizzle-orm");
async function requeueSession() {
    const sessionId = process.argv[2];
    if (!sessionId) {
        console.error('Usage: tsx src/requeue-session.ts <sessionId>');
        process.exit(1);
    }
    console.log(`Requeueing session ${sessionId}...`);
    // Reset status to 'queued' and update timestamp to now so it's not stale
    await drizzle_1.db.update(schema_1.sessions)
        .set({
        status: 'queued',
        errorMessage: null,
        updatedAt: new Date().toISOString()
    })
        .where((0, drizzle_orm_1.eq)(schema_1.sessions.id, sessionId));
    console.log('Session requeued successfully.');
    process.exit(0);
}
requeueSession();
//# sourceMappingURL=requeue-session.js.map