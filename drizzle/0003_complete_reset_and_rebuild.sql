-- ═══════════════════════════════════════════════════════════════════════════════
-- COMPLETE DATABASE RESET & REBUILD
-- WARNING: This will DELETE ALL DATA and recreate schema from scratch
-- 
-- Use this when you want a fresh start with the new audit-compliant schema
-- ═══════════════════════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ STEP 1: DROP ALL EXISTING TABLES (CASCADE)                                  │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS dataRetention;
DROP TABLE IF EXISTS auditLogs;
DROP TABLE IF EXISTS calculations;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ STEP 2: CREATE USERS TABLE                                                  │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    clerkId TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    fullName TEXT,
    
    -- Audit & Status Fields
    isActive INTEGER DEFAULT 1 NOT NULL,
    role TEXT DEFAULT 'user' NOT NULL, -- 'user', 'admin', 'support'
    lastLoginAt TEXT,
    deletedAt TEXT, -- Soft delete for GDPR
    
    -- Timestamps
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Users indexes
CREATE INDEX users_clerkId_idx ON users(clerkId);
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_isActive_idx ON users(isActive);
CREATE INDEX users_role_idx ON users(role);
CREATE INDEX users_deletedAt_idx ON users(deletedAt);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ STEP 3: CREATE SESSIONS TABLE (New Audit-Compliant Schema)                  │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id),
    clerkId TEXT NOT NULL,
    
    -- Core Birth Data (Encrypted)
    fullName TEXT NOT NULL,
    dateOfBirth TEXT NOT NULL,
    tentativeTime TEXT NOT NULL,
    birthPlace TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    timezone TEXT NOT NULL,
    gender TEXT, -- 'male', 'female', 'other'
    
    -- Traits Data (Encrypted)
    physicalTraits TEXT, -- Legacy traits
    forensicTraits TEXT, -- God-tier matrix
    lifeEvents TEXT, -- Nullable for drafts
    spouseData TEXT, -- NEW: Optional spouse info
    
    -- Configuration
    offsetConfig TEXT, -- JSON: { preset, customMinutes }
    
    -- Results (Post-Analysis)
    rectifiedTime TEXT,
    accuracy INTEGER, -- Percentage 0-100
    confidence TEXT, -- 'low', 'medium', 'high', 'god-tier'
    analysisResult TEXT, -- Full analysis JSON
    progressData TEXT, -- Ephemeral: Cleared on complete
    reasoningLogs TEXT, -- Compressed God Mode logs
    
    -- Status with CHECK constraint
    status TEXT DEFAULT 'draft' NOT NULL,
    
    -- Error Tracking
    errorMessage TEXT,
    errorCode TEXT,
    
    -- Audit Timeline
    submittedAt TEXT, -- When user clicked submit
    startedProcessingAt TEXT, -- When queue picked up
    completedAt TEXT,
    deletedAt TEXT, -- Soft delete for GDPR
    retentionUntil TEXT, -- Auto-delete date
    
    -- Data Integrity Flag
    isEncrypted INTEGER DEFAULT 1 NOT NULL,
    
    -- Timestamps
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Sessions indexes
CREATE INDEX sessions_userId_idx ON sessions(userId);
CREATE INDEX sessions_status_idx ON sessions(status);
CREATE INDEX sessions_user_status_idx ON sessions(userId, status);
CREATE INDEX sessions_status_created_idx ON sessions(status, createdAt);
CREATE INDEX sessions_createdAt_idx ON sessions(createdAt);
CREATE INDEX sessions_submittedAt_idx ON sessions(submittedAt);
CREATE INDEX sessions_retention_idx ON sessions(retentionUntil);
CREATE INDEX sessions_deletedAt_idx ON sessions(deletedAt);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ STEP 4: CREATE CALCULATIONS TABLE                                           │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE calculations (
    id TEXT PRIMARY KEY,
    sessionId TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    
    -- Calculation Input
    birthDateTime TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    timezone TEXT NOT NULL,
    
    -- Calculation Output
    ephemerisData TEXT NOT NULL,
    
    -- Metadata
    algorithmVersion TEXT DEFAULT '2.0.0' NOT NULL,
    ephemerisVersion TEXT DEFAULT 'de440' NOT NULL,
    processingTime INTEGER, -- Milliseconds
    
    -- Cache Management
    cacheHitCount INTEGER DEFAULT 0 NOT NULL,
    expiresAt TEXT, -- TTL for cache eviction
    
    -- Status
    success INTEGER DEFAULT 1 NOT NULL,
    
    -- Timestamps
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Calculations indexes
CREATE INDEX calculations_sessionId_idx ON calculations(sessionId);
CREATE INDEX calculations_createdAt_idx ON calculations(createdAt);
CREATE INDEX calculations_expires_idx ON calculations(expiresAt);
CREATE INDEX calculations_session_created_idx ON calculations(sessionId, createdAt);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ STEP 5: CREATE PAYMENTS TABLE                                               │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE payments (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id),
    sessionId TEXT REFERENCES sessions(id),
    
    -- Amount in smallest currency unit (paise for INR)
    amountPaise INTEGER NOT NULL,
    currency TEXT DEFAULT 'INR' NOT NULL,
    
    -- Status with workflow states
    status TEXT DEFAULT 'pending' NOT NULL,
    -- Valid: 'pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded'
    
    -- Razorpay Integration
    razorpayOrderId TEXT,
    razorpayPaymentId TEXT,
    razorpaySignature TEXT,
    
    -- Audit Trail
    webhookReceivedAt TEXT,
    verifiedAt TEXT,
    verificationMethod TEXT,
    
    -- Refund Support
    refundAmountPaise INTEGER DEFAULT 0 NOT NULL,
    refundReason TEXT,
    refundedAt TEXT,
    
    -- Error Tracking
    errorCode TEXT,
    errorDescription TEXT,
    
    -- Timestamps
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Payments indexes
CREATE INDEX payments_userId_idx ON payments(userId);
CREATE INDEX payments_sessionId_idx ON payments(sessionId);
CREATE INDEX payments_status_idx ON payments(status);
CREATE UNIQUE INDEX payments_razorpayOrderId_unique ON payments(razorpayOrderId) WHERE razorpayOrderId IS NOT NULL;
CREATE UNIQUE INDEX payments_razorpayPaymentId_unique ON payments(razorpayPaymentId) WHERE razorpayPaymentId IS NOT NULL;
CREATE INDEX payments_createdAt_idx ON payments(createdAt);
CREATE INDEX payments_refund_idx ON payments(status, refundAmountPaise);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ STEP 6: CREATE AUDIT_LOGS TABLE                                             │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE auditLogs (
    id TEXT PRIMARY KEY,
    
    -- Actor
    userId TEXT NOT NULL REFERENCES users(id),
    userRole TEXT NOT NULL,
    
    -- Action Details
    action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'login', 'export'
    resource TEXT NOT NULL, -- 'session', 'payment', 'user', 'calculation'
    resourceId TEXT,
    
    -- Change Tracking (for updates)
    oldValues TEXT,
    newValues TEXT,
    
    -- Context
    ipAddress TEXT,
    userAgent TEXT,
    requestId TEXT,
    
    -- Result
    success INTEGER DEFAULT 1 NOT NULL,
    errorMessage TEXT,
    
    -- Timestamps
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Audit logs indexes
CREATE INDEX auditLogs_userId_idx ON auditLogs(userId);
CREATE INDEX auditLogs_action_idx ON auditLogs(action);
CREATE INDEX auditLogs_resource_idx ON auditLogs(resource);
CREATE INDEX auditLogs_user_created_idx ON auditLogs(userId, createdAt);
CREATE INDEX auditLogs_resource_action_idx ON auditLogs(resource, action);
CREATE INDEX auditLogs_createdAt_idx ON auditLogs(createdAt);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ STEP 7: CREATE DATA_RETENTION TABLE (GDPR Compliance)                       │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE TABLE dataRetention (
    id TEXT PRIMARY KEY,
    
    -- Reference
    userId TEXT REFERENCES users(id),
    sessionId TEXT REFERENCES sessions(id),
    
    -- Retention Policy
    dataType TEXT NOT NULL, -- 'session', 'calculation', 'payment', 'audit'
    retentionDays INTEGER NOT NULL, -- e.g., 2555 for 7 years
    
    -- Dates
    scheduledDeletionAt TEXT NOT NULL,
    actuallyDeletedAt TEXT,
    
    -- Status
    status TEXT DEFAULT 'scheduled' NOT NULL, -- 'scheduled', 'processing', 'completed', 'failed'
    
    -- Error tracking
    errorMessage TEXT,
    retryCount INTEGER DEFAULT 0 NOT NULL,
    
    -- Timestamps
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Data retention indexes
CREATE INDEX dataRetention_userId_idx ON dataRetention(userId);
CREATE INDEX dataRetention_sessionId_idx ON dataRetention(sessionId);
CREATE INDEX dataRetention_status_idx ON dataRetention(status);
CREATE INDEX dataRetention_scheduled_idx ON dataRetention(scheduledDeletionAt, status);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ VERIFICATION                                                                │
-- └─────────────────────────────────────────────────────────────────────────────┘

SELECT 
    'Database Reset Complete' as status,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='table') as total_tables,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='index') as total_indexes,
    (SELECT COUNT(*) FROM pragma_table_info('sessions')) as sessions_columns,
    (SELECT COUNT(*) FROM pragma_table_info('users')) as users_columns;
