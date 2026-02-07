require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('❌ Please provide the migration file name as an argument.');
  console.error('   Example: node scripts/apply-migration.js 0001_plain_swarm.sql');
  process.exit(1);
}

const DATABASE_URL = process.env.TURSO_DATABASE_URL;
const DATABASE_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!DATABASE_URL || !DATABASE_AUTH_TOKEN) {
  console.error('❌ TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in your .env file.');
  process.exit(1);
}

async function applyMigration() {
  console.log('🔄 Connecting to Turso database...');
  const client = createClient({
    url: DATABASE_URL,
    authToken: DATABASE_AUTH_TOKEN,
  });

  try {
    const migrationPath = path.join(__dirname, '..', 'drizzle', migrationFile);
    console.log(`\n📄 Reading migration file: ${migrationPath}`);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Use batch execution for the entire file
    console.log('Executing SQL statements in batch mode...');
    await client.batch([sql], "write");
    console.log('✅ Batch execution successful.');

    console.log('\n🎉 Migration complete!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

applyMigration();
