import { beforeAll } from 'vitest';

beforeAll(async () => {

    const dbModule = await import('@ai-pandit/db');

    const hasVerify = Object.prototype.hasOwnProperty.call(dbModule, 'verifyDatabaseConnection');

    const hasClient = Object.prototype.hasOwnProperty.call(dbModule, 'client');

    const verifyDatabaseConnection = hasVerify

        ? (dbModule as { verifyDatabaseConnection?: () => Promise<void> }).verifyDatabaseConnection

        : undefined;

    const client = hasClient

        ? (dbModule as { client?: { execute?: (sql: string) => Promise<unknown> } }).client

        : undefined;



    if (typeof verifyDatabaseConnection === 'function') {

        await verifyDatabaseConnection();

    }



    if (!client?.execute) {

        return;

    }

    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        clerkId TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        fullName TEXT,
        isActive INTEGER NOT NULL DEFAULT 1,
        role TEXT NOT NULL DEFAULT 'user',
        lastLoginAt TEXT,
        deletedAt TEXT,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT NOT NULL,
        clerkId TEXT NOT NULL,
        fullName TEXT NOT NULL,
        dateOfBirth TEXT NOT NULL,
        tentativeTime TEXT NOT NULL,
        birthPlace TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        timezone TEXT NOT NULL,
        gender TEXT,
        physicalTraits TEXT,
        forensicTraits TEXT,
        lifeEvents TEXT,
        spouseData TEXT,
        offsetConfig TEXT,
        rectifiedTime TEXT,
        accuracy INTEGER,
        confidence TEXT,
        analysisResult TEXT,
        progressData TEXT,
        reasoningLogs TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        errorMessage TEXT,
        errorCode TEXT,
        submittedAt TEXT,
        startedProcessingAt TEXT,
        completedAt TEXT,
        deletedAt TEXT,
        retentionUntil TEXT,
        aiConsentGiven INTEGER DEFAULT 0,
        aiConsentGivenAt TEXT,
        aiConsentIp TEXT,
        isEncrypted INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS calculations (
        id TEXT PRIMARY KEY NOT NULL,
        sessionId TEXT NOT NULL,
        birthDateTime TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        timezone TEXT NOT NULL,
        ephemerisData TEXT NOT NULL,
        algorithmVersion TEXT NOT NULL DEFAULT '2.0.0',
        ephemerisVersion TEXT NOT NULL DEFAULT 'de440',
        processingTime INTEGER,
        cacheHitCount INTEGER NOT NULL DEFAULT 0,
        expiresAt TEXT,
        success INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);

    if (process.env.SKIP_EPHEMERIS_INIT === 'true') {
        return;
    }

    try {
        // Use dynamic import to avoid static import deadlocks/hangs
        const { initEphemerisProvider } = await import('../ephemeris.js');
        const success = await initEphemerisProvider();
    } catch (error) {
        console.error('❌ [TEST SETUP] Critical error during initialization:', error);
        throw error;
    }
});
