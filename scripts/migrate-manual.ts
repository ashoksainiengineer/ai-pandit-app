import { db } from '../database/drizzle';
import { sql } from 'drizzle-orm';

async function manualMigrate() {
    try {
        console.log('🔄 Starting manual migration...');

        // Users Table
        console.log('Creating users table...');
        await db.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        clerkId TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        fullName TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
        await db.run(sql`CREATE INDEX IF NOT EXISTS users_clerkId_idx ON users (clerkId);`);
        await db.run(sql`CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);`);

        // Sessions Table
        console.log('Creating sessions table...');
        await db.run(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL REFERENCES users(id),
        fullName TEXT NOT NULL,
        dateOfBirth TEXT NOT NULL,
        tentativeTime TEXT NOT NULL,
        birthPlace TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        timezone TEXT NOT NULL,
        gender TEXT,
        lifeEvents TEXT NOT NULL,
        offsetConfig TEXT,
        rectifiedTime TEXT,
        accuracy INTEGER,
        confidence TEXT,
        analysisResult TEXT,
        status TEXT DEFAULT 'pending',
        errorMessage TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        completedAt TEXT
      );
    `);
        await db.run(sql`CREATE INDEX IF NOT EXISTS sessions_userId_idx ON sessions (userId);`);
        await db.run(sql`CREATE INDEX IF NOT EXISTS sessions_status_idx ON sessions (status);`);
        await db.run(sql`CREATE INDEX IF NOT EXISTS sessions_createdAt_idx ON sessions (createdAt);`);

        // Calculations Table
        console.log('Creating calculations table...');
        await db.run(sql`
      CREATE TABLE IF NOT EXISTS calculations (
        id TEXT PRIMARY KEY,
        sessionId TEXT NOT NULL REFERENCES sessions(id),
        birthDateTime TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        timezone TEXT NOT NULL,
        ephemerisData TEXT NOT NULL,
        processingTime INTEGER,
        success INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
        await db.run(sql`CREATE INDEX IF NOT EXISTS calculations_sessionId_idx ON calculations (sessionId);`);
        await db.run(sql`CREATE INDEX IF NOT EXISTS calculations_createdAt_idx ON calculations (createdAt);`);

        // Payments Table
        console.log('Creating payments table...');
        await db.run(sql`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL REFERENCES users(id),
        sessionId TEXT REFERENCES sessions(id),
        amount INTEGER,
        currency TEXT DEFAULT 'INR',
        status TEXT DEFAULT 'pending',
        razorpayOrderId TEXT,
        razorpayPaymentId TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
        await db.run(sql`CREATE INDEX IF NOT EXISTS payments_userId_idx ON payments (userId);`);
        await db.run(sql`CREATE INDEX IF NOT EXISTS payments_sessionId_idx ON payments (sessionId);`);
        await db.run(sql`CREATE INDEX IF NOT EXISTS payments_status_idx ON payments (status);`);
        await db.run(sql`CREATE INDEX IF NOT EXISTS payments_createdAt_idx ON payments (createdAt);`);

        console.log('✅ Manual migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

manualMigrate();
