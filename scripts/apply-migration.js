#!/usr/bin/env node
/**
 * Database Migration Script
 * Applies 0002_full_audit_fixes.sql to Turso database
 */

const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

// Database configuration (from database/drizzle.ts)
const DATABASE_URL = 'libsql://ai-pandit-ashoksainiengineer.aws-ap-south-1.turso.io';
const DATABASE_AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg0NTA3NDQsImlkIjoiMmNiMzEzZDctODBiZC00YmQ0LWFlYjctYmIxNDM1MGRmZWQ1IiwicmlkIjoiNmU0MzE1YTQtODIwMC00ZDlhLTg1YTItNGVkZTMyYzUyYzNlIn0.DflPLPc8OFnwuivqmFi6RXD-lzghUvyXS2EoZHlqXg00qCRp-1ayoNsW5q1nNLnkjrvizn1JXJfM4Bom95Y0Bw';

async function applyMigration() {
  console.log('🔄 Connecting to Turso database...');
  console.log(`   URL: ${DATABASE_URL}`);
  
  const client = createClient({
    url: DATABASE_URL,
    authToken: DATABASE_AUTH_TOKEN,
  });

  try {
    // Test connection
    const testResult = await client.execute("SELECT 1 as test");
    console.log('✅ Database connection successful');

    // Read migration SQL
    const migrationPath = path.join(__dirname, '..', 'drizzle', '0002_full_audit_fixes.sql');
    console.log(`\n📄 Reading migration file: ${migrationPath}`);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    let successCount = 0;
    let skipCount = 0;
    let errors = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;

      // Skip comments and empty lines
      if (statement.startsWith('--') || statement.startsWith('/*') || statement.startsWith('*') || statement.startsWith('═') || statement.startsWith('┌') || statement.startsWith('┘') || statement.startsWith('│')) {
        continue;
      }

      const shortStmt = statement.substring(0, 60).replace(/\s+/g, ' ');
      process.stdout.write(`  [${i + 1}/${statements.length}] ${shortStmt}... `);

      try {
        await client.execute(statement + ';');
        console.log('✅');
        successCount++;
      } catch (err) {
        // Check if error is because column/table already exists (safe to ignore)
        const errorMsg = err.message || '';
        if (errorMsg.includes('duplicate column') || 
            errorMsg.includes('already exists') ||
            errorMsg.includes('table already exists')) {
          console.log('⏭️  (already exists)');
          skipCount++;
        } else {
          console.log('❌');
          errors.push({
            statement: shortStmt,
            error: errorMsg
          });
        }
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`⏭️  Skipped (already exists): ${skipCount}`);
    console.log(`❌ Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      errors.forEach((e, idx) => {
        console.log(`  ${idx + 1}. ${e.statement}`);
        console.log(`     Error: ${e.error}`);
      });
    }

    // Verify migration
    console.log('\n' + '═'.repeat(60));
    console.log('🔍 VERIFICATION');
    console.log('═'.repeat(60));

    // Check new columns
    const columnsResult = await client.execute(
      "SELECT name FROM pragma_table_info('sessions') WHERE name IN ('spouseData', 'isEncrypted', 'submittedAt', 'retentionUntil', 'deletedAt')"
    );
    console.log(`📋 New columns in sessions: ${columnsResult.rows.map(r => r.name).join(', ') || 'None (may already exist)'}`);

    // Check new tables
    const tablesResult = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('auditLogs', 'dataRetention')"
    );
    console.log(`📦 New tables: ${tablesResult.rows.map(r => r.name).join(', ') || 'None (may already exist)'}`);

    // Check indexes
    const indexesResult = await client.execute(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='index' AND name LIKE 'sessions_%'"
    );
    console.log(`🔍 Sessions indexes: ${indexesResult.rows[0].count}`);

    console.log('\n🎉 Migration complete!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run migration
applyMigration();
