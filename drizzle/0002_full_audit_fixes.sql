-- ═══════════════════════════════════════════════════════════════════════════════
-- DATABASE AUDIT FIXES MIGRATION
-- Production-grade schema improvements for AI Pandit BTR System
-- 
-- @version 2.0.0
-- @author Database Architect
-- ═══════════════════════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ PHASE 1: CRITICAL FIXES - Data Loss Prevention & Draft Functionality        │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- 1.1 Add spouseData column to sessions table (CRITICAL: Prevent data loss)
ALTER TABLE sessions ADD COLUMN spouseData TEXT;

-- 1.2 Make lifeEvents nullable (CRITICAL: Allow drafts without life events)
-- Note: SQLite doesn't support ALTER COLUMN, so we need to recreate the table
-- This migration assumes lifeEvents is already nullable or will be handled by application

-- 1.3 Add isEncrypted flag for data integrity verification
ALTER TABLE sessions ADD COLUMN isEncrypted INTEGER DEFAULT 1 NOT NULL;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ PHASE 2: AUDIT FIELDS - Timeline Tracking                                   │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- 2.1 Add audit timeline fields to sessions
ALTER TABLE sessions ADD COLUMN submittedAt TEXT;
ALTER TABLE sessions ADD COLUMN startedProcessingAt TEXT;
ALTER TABLE sessions ADD COLUMN completedAt TEXT;
ALTER TABLE sessions ADD COLUMN deletedAt TEXT; -- Soft delete for GDPR
ALTER TABLE sessions ADD COLUMN retentionUntil TEXT; -- Auto-delete date

-- 2.2 Add error tracking fields
ALTER TABLE sessions ADD COLUMN errorCode TEXT;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ PHASE 3: INDEX OPTIMIZATION - Query Performance                             │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- 3.1 Sessions table indexes
CREATE INDEX IF NOT EXISTS sessions_status_idx ON sessions(status);
CREATE INDEX IF NOT EXISTS sessions_user_status_idx ON sessions(userId, status);
CREATE INDEX IF NOT EXISTS sessions_status_created_idx ON sessions(status, createdAt);
CREATE INDEX IF NOT EXISTS sessions_createdAt_idx ON sessions(createdAt);
CREATE INDEX IF NOT EXISTS sessions_submittedAt_idx ON sessions(submittedAt);
CREATE INDEX IF NOT EXISTS sessions_retention_idx ON sessions(retentionUntil);
CREATE INDEX IF NOT EXISTS sessions_deletedAt_idx ON sessions(deletedAt);

-- 3.2 Users table indexes
CREATE INDEX IF NOT EXISTS users_clerkId_idx ON users(clerkId);
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_isActive_idx ON users(isActive);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS users_deletedAt_idx ON users(deletedAt);

-- 3.3 Calculations table indexes
CREATE INDEX IF NOT EXISTS calculations_sessionId_idx ON calculations(sessionId);
CREATE INDEX IF NOT EXISTS calculations_createdAt_idx ON calculations(createdAt);
CREATE INDEX IF NOT EXISTS calculations_expires_idx ON calculations(expiresAt);
CREATE INDEX IF NOT EXISTS calculations_session_created_idx ON calculations(sessionId, createdAt);

-- 3.4 Payments table indexes
CREATE INDEX IF NOT EXISTS payments_userId_idx ON payments(userId);
CREATE INDEX IF NOT EXISTS payments_sessionId_idx ON payments(sessionId);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);
CREATE UNIQUE INDEX IF NOT EXISTS payments_razorpayOrderId_unique ON payments(razorpayOrderId) WHERE razorpayOrderId IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS payments_razorpayPaymentId_unique ON payments(razorpayPaymentId) WHERE razorpayPaymentId IS NOT NULL;
CREATE INDEX IF NOT EXISTS payments_createdAt_idx ON payments(createdAt);
CREATE INDEX IF NOT EXISTS payments_refund_idx ON payments(status, refundAmountPaise);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ PHASE 4: NEW TABLES - Audit & Compliance                                    │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- 4.1 Create audit_logs table for security & compliance
CREATE TABLE IF NOT EXISTS auditLogs (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id),
    userRole TEXT NOT NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resourceId TEXT,
    oldValues TEXT,
    newValues TEXT,
    ipAddress TEXT,
    userAgent TEXT,
    requestId TEXT,
    success INTEGER DEFAULT 1 NOT NULL,
    errorMessage TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4.2 Create audit_logs indexes
CREATE INDEX IF NOT EXISTS auditLogs_userId_idx ON auditLogs(userId);
CREATE INDEX IF NOT EXISTS auditLogs_action_idx ON auditLogs(action);
CREATE INDEX IF NOT EXISTS auditLogs_resource_idx ON auditLogs(resource);
CREATE INDEX IF NOT EXISTS auditLogs_user_created_idx ON auditLogs(userId, createdAt);
CREATE INDEX IF NOT EXISTS auditLogs_resource_action_idx ON auditLogs(resource, action);
CREATE INDEX IF NOT EXISTS auditLogs_createdAt_idx ON auditLogs(createdAt);

-- 4.3 Create data_retention table for GDPR compliance
CREATE TABLE IF NOT EXISTS dataRetention (
    id TEXT PRIMARY KEY,
    userId TEXT REFERENCES users(id),
    sessionId TEXT REFERENCES sessions(id),
    dataType TEXT NOT NULL,
    retentionDays INTEGER NOT NULL,
    scheduledDeletionAt TEXT NOT NULL,
    actuallyDeletedAt TEXT,
    status TEXT DEFAULT 'scheduled' NOT NULL,
    errorMessage TEXT,
    retryCount INTEGER DEFAULT 0 NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4.4 Create data_retention indexes
CREATE INDEX IF NOT EXISTS dataRetention_userId_idx ON dataRetention(userId);
CREATE INDEX IF NOT EXISTS dataRetention_sessionId_idx ON dataRetention(sessionId);
CREATE INDEX IF NOT EXISTS dataRetention_status_idx ON dataRetention(status);
CREATE INDEX IF NOT EXISTS dataRetention_scheduled_idx ON dataRetention(scheduledDeletionAt, status);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ PHASE 5: DATA MIGRATION - Backfill existing records                         │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- 5.1 Set isEncrypted flag for existing sessions
UPDATE sessions SET isEncrypted = 1 WHERE isEncrypted IS NULL;

-- 5.2 Set default status for sessions without status
UPDATE sessions SET status = 'draft' WHERE status IS NULL OR status = '';

-- 5.3 Set retention dates for existing completed sessions (7 years from completion)
UPDATE sessions 
SET retentionUntil = datetime(completedAt, '+7 years')
WHERE completedAt IS NOT NULL AND retentionUntil IS NULL;

-- 5.4 Set retention dates for existing non-completed sessions (7 years from creation)
UPDATE sessions 
SET retentionUntil = datetime(createdAt, '+7 years')
WHERE retentionUntil IS NULL;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ PHASE 6: CLEANUP - Remove deprecated columns (if any)                       │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Note: We keep physicalTraits for backward compatibility during transition
-- It can be removed in a future migration after forensicTraits is fully adopted

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ MIGRATION COMPLETE                                                          │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Verify migration
SELECT 
    'Migration Complete' as status,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='auditLogs') as audit_logs_created,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='dataRetention') as data_retention_created,
    (SELECT COUNT(*) FROM pragma_table_info('sessions') WHERE name='spouseData') as spouseData_column_added,
    (SELECT COUNT(*) FROM pragma_table_info('sessions') WHERE name='isEncrypted') as isEncrypted_column_added,
    (SELECT COUNT(*) FROM pragma_table_info('sessions') WHERE name='submittedAt') as submittedAt_column_added,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name LIKE 'sessions_%') as sessions_indexes_created;
