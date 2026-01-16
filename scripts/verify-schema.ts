import { db } from '../database/drizzle';
import { sessions } from '../database/schema';
import { count } from 'drizzle-orm';

async function verifySchema() {
    try {
        console.log('Testing database connection...');
        const result = await db.select({ count: count() }).from(sessions);
        console.log('✅ Connection successful!');
        console.log('✅ Sessions table exists. Row count:', result[0].count);
        process.exit(0);
    } catch (error) {
        console.error('❌ Database verification failed:', error);
        process.exit(1);
    }
}

verifySchema();
