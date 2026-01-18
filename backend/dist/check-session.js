"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const drizzle_1 = require("./database/drizzle");
const schema_1 = require("./database/schema");
const drizzle_orm_1 = require("drizzle-orm");
async function checkSession() {
    const sessionId = process.argv[2];
    if (!sessionId) {
        console.error('Usage: tsx src/check-session.ts <sessionId>');
        process.exit(1);
    }
    console.log(`Checking session ${sessionId}...`);
    const result = await drizzle_1.db.select().from(schema_1.sessions).where((0, drizzle_orm_1.eq)(schema_1.sessions.id, sessionId));
    if (result.length === 0) {
        console.log('Session not found');
    }
    else {
        console.log('Session Status:', result[0].status);
        console.log('Error Message:', result[0].errorMessage);
        console.log('Created At:', result[0].createdAt);
        console.log('Updated At:', result[0].updatedAt);
    }
    process.exit(0);
}
checkSession();
//# sourceMappingURL=check-session.js.map