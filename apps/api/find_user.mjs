import { db } from '@ai-pandit/db';
import { sessions } from '@ai-pandit/db/schema';
import { desc } from 'drizzle-orm';

async function main() {
  console.log('Connecting to DB...');
  const allSessions = await db.select().from(sessions).orderBy(desc(sessions.createdAt)).limit(10);
  console.log('Recent sessions:');
  allSessions.forEach(s => {
    console.log(`  ID: ${s.id}, User: ${s.userId}, Status: ${s.status}, Created: ${s.createdAt}`);
  });
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
