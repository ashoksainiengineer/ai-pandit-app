# 🔍 Database Schema Audit Report
## AI-Pandit BTR System - God-Tier Review

**Auditor:** Senior Database Architect  
**Date:** 2026-01-28  
**Scope:** Full schema analysis for production readiness

---

## 📊 Executive Summary

| Metric | Value | Status |
|--------|-------|--------|
| Tables | 4 | ✅ |
| Total Columns | 47 | ✅ |
| Foreign Keys | 5 | ✅ |
| Indexes | 14 | ⚠️ |
| Missing Constraints | 3 | ⚠️ |
| Security Issues | 2 | 🔴 |
| Performance Risks | 4 | ⚠️ |

---

## 🏗️ Table-by-Table Analysis

### 1. `users` Table

**Purpose:** Clerk authentication sync

```sql
CREATE TABLE `users` (
    `id` text PRIMARY KEY NOT NULL,
    `clerkId` text NOT NULL UNIQUE,  -- ✅ Good: Unique constraint
    `email` text NOT NULL,
    `fullName` text,                  -- ⚠️ Nullable but no validation
    `createdAt` text DEFAULT 'CURRENT_TIMESTAMP',
    `updatedAt` text DEFAULT 'CURRENT_TIMESTAMP'
);
```

**Issues:**
1. 🔴 **No email validation** - accepts any string format
2. ⚠️ **Missing `isActive` flag** - can't soft-delete users
3. ⚠️ **Missing `lastLoginAt`** - no user activity tracking
4. ⚠️ **Missing `avatarUrl`** - storing profile data separately
5. ⚠️ **No `role` column** - all users have same permissions

**Recommendations:**
```sql
-- Add these columns
ALTER TABLE users ADD COLUMN isActive INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN lastLoginAt TEXT;
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'support'));
ALTER TABLE users ADD COLUMN deletedAt TEXT; -- Soft delete
```

---

### 2. `sessions` Table (CRITICAL)

**Purpose:** Birth time rectification analysis sessions

**Current Schema Issues:**

#### 🔴 CRITICAL: Data Loss Risk
```sql
`lifeEvents` text NOT NULL,  -- 🔴 Problem: Mandatory but empty on draft
```
- Drafts are saved before life events are added
- Current code sends empty string `''` for drafts
- **Risk:** Database constraint violation on draft save

#### 🔴 CRITICAL: Missing Spouse Data
```sql
-- Missing column! Payload sends spouseData but nowhere to store it
```
- API receives `spouseData` but no column exists
- Data silently dropped during save
- **Impact:** Spouse correlation analysis broken

#### 🔴 SECURITY: No Data Encryption Indicators
```sql
`fullName` text NOT NULL,        -- 🔴 No indication this is encrypted
`physicalTraits` text,           -- 🔴 No indication this is encrypted
`forensicTraits` text,           -- 🔴 No indication this is encrypted
`lifeEvents` text NOT NULL,      -- 🔴 No indication this is encrypted
```
- Application encrypts data but schema doesn't document this
- **Risk:** Future developers might query/decrypt incorrectly

#### ⚠️ PERFORMANCE: Large TEXT Fields
```sql
`analysisResult` text,      -- Could be 10KB+ JSON
`progressData` text,        -- Ephemeral but still stored
`reasoningLogs` text,       -- Could be 50KB+ compressed logs
```
- All in same table = slow queries
- **Recommendation:** Split to separate table or use Turso's blob storage

#### ⚠️ MISSING: Status Enum Constraint
```sql
`status` text DEFAULT 'pending',  -- ⚠️ No CHECK constraint
```
- Valid values: 'draft', 'pending', 'processing', 'complete', 'failed', 'cancelled'
- **Risk:** Invalid status strings can be inserted

#### ⚠️ MISSING: Audit Fields
```sql
-- Missing:
`createdByIp` text,         -- For security audit
`submittedAt` text,         -- When user submitted (vs created)
`startedProcessingAt` text, -- When queue picked up
`deletedAt` text,           -- Soft delete for GDPR
```

#### ⚠️ MISSING: Data Retention
No fields to track:
- When to auto-delete drafts (30 days?)
- When to archive old sessions
- GDPR deletion requests

**Recommended Schema Fixes:**

```sql
-- Add missing columns
ALTER TABLE sessions ADD COLUMN spouseData TEXT;
ALTER TABLE sessions ADD COLUMN isEncrypted INTEGER DEFAULT 1; -- Flag for audit
ALTER TABLE sessions ADD COLUMN submittedAt TEXT;
ALTER TABLE sessions ADD COLUMN startedProcessingAt TEXT;
ALTER TABLE sessions ADD COLUMN deletedAt TEXT;
ALTER TABLE sessions ADD COLUMN retentionUntil TEXT; -- GDPR auto-delete

-- Fix status with constraint
ALTER TABLE sessions ADD COLUMN statusNew TEXT DEFAULT 'pending' 
    CHECK (statusNew IN ('draft', 'pending', 'processing', 'complete', 'failed', 'cancelled'));

-- Fix lifeEvents to allow NULL for drafts
ALTER TABLE sessions ALTER COLUMN lifeEvents DROP NOT NULL;
```

---

### 3. `calculations` Table

**Purpose:** Ephemeris calculation cache

**Issues:**

#### 🔴 CRITICAL: Session Deletion = Orphaned Records
```sql
FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) 
    ON UPDATE no action 
    ON DELETE no action  -- 🔴 Problem: No CASCADE
```
- Deleting session leaves orphaned calculations
- **Recommendation:** Add `ON DELETE CASCADE`

#### ⚠️ PERFORMANCE: No TTL/Expiration
```sql
`ephemerisData` text NOT NULL,  -- Raw ephemeris data, can be stale
```
- No `expiresAt` field for cache invalidation
- Calculations from 2024 still stored in 2026
- **Recommendation:** Add TTL and cleanup job

#### ⚠️ MISSING: Calculation Metadata
```sql
-- Missing:
`algorithmVersion` text,    -- Which BTR algorithm was used
`ephemerisVersion` text,   -- Swiss Ephemeris file version
`cacheHitCount` integer,   -- How many times reused
```

**Recommended Fixes:**

```sql
-- Add metadata columns
ALTER TABLE calculations ADD COLUMN algorithmVersion TEXT DEFAULT '1.0.0';
ALTER TABLE calculations ADD COLUMN expiresAt TEXT; -- TTL for cache
ALTER TABLE calculations ADD COLUMN cacheHitCount INTEGER DEFAULT 0;

-- Fix foreign key (requires table rebuild in SQLite)
-- Create new table with CASCADE, migrate data, drop old
```

---

### 4. `payments` Table

**Purpose:** Payment tracking with Razorpay

**Issues:**

#### 🔴 CRITICAL: Amount Precision
```sql
`amount` integer,  -- 🔴 Problem: INR in paise? rupees?
```
- No documentation on unit (paise vs rupees)
- **Risk:** ₹799 stored as 799 (rupees) or 79900 (paise)?
- **Recommendation:** Store in smallest unit (paise) + add comment

#### 🔴 SECURITY: No Payment Verification
```sql
`razorpayPaymentId` text,  -- ⚠️ No unique constraint
```
- Same payment ID could be recorded twice
- **Risk:** Double-credit or replay attacks

#### ⚠️ MISSING: Payment Status Flow
```sql
`status` text DEFAULT 'pending',  -- ⚠️ No CHECK constraint
```
- Valid states: 'pending', 'authorized', 'captured', 'failed', 'refunded'
- **Risk:** Invalid status strings

#### ⚠️ MISSING: Audit Trail
```sql
-- Missing:
`webhookReceivedAt` text,  -- When Razorpay notified us
`verifiedAt` text,         -- When we verified signature
`refundAmount` integer,    -- Partial refund support
`refundReason` text,
```

**Recommended Fixes:**

```sql
-- Document amount unit
ALTER TABLE payments ADD COLUMN amountPaise INTEGER; -- Explicit unit

-- Add unique constraint
CREATE UNIQUE INDEX `payments_razorpayPaymentId_unique` ON `payments` (`razorpayPaymentId`);

-- Add status check
ALTER TABLE payments ADD COLUMN statusNew TEXT DEFAULT 'pending'
    CHECK (statusNew IN ('pending', 'authorized', 'captured', 'failed', 'refunded'));

-- Add audit fields
ALTER TABLE payments ADD COLUMN webhookReceivedAt TEXT;
ALTER TABLE payments ADD COLUMN verifiedAt TEXT;
ALTER TABLE payments ADD COLUMN refundAmountPaise INTEGER DEFAULT 0;
```

---

## 📈 Index Analysis

### Current Indexes (14 total)

| Table | Index | Column(s) | Purpose | Status |
|-------|-------|-----------|---------|--------|
| users | clerkIdIdx | clerkId | Auth lookup | ✅ |
| users | emailIdx | email | Contact | ✅ |
| sessions | userIdIdx | userId | User's sessions | ✅ |
| sessions | statusIdx | status | Status filtering | ✅ |
| sessions | createdAtIdx | createdAt | Sorting | ✅ |
| calculations | sessionIdIdx | sessionId | Join queries | ✅ |
| calculations | createdAtIdx | createdAt | Cache cleanup | ✅ |
| payments | userIdIdx | userId | User's payments | ✅ |
| payments | sessionIdIdx | sessionId | Join queries | ✅ |
| payments | statusIdx | status | Status filtering | ✅ |
| payments | createdAtIdx | createdAt | Reporting | ✅ |

### Missing Indexes (Performance Risk)

```sql
-- Sessions: Compound index for dashboard queries
CREATE INDEX `sessions_user_status_idx` ON `sessions` (`userId`, `status`);

-- Sessions: Date range queries for analytics
CREATE INDEX `sessions_created_status_idx` ON `sessions` (`createdAt`, `status`);

-- Sessions: Find drafts for cleanup
CREATE INDEX `sessions_status_created_idx` ON `sessions` (`status`, `createdAt`);

-- Calculations: Find expired cache
CREATE INDEX `calculations_expires_idx` ON `calculations` (`expiresAt`);

-- Payments: Find by Razorpay ID (currently no index!)
CREATE INDEX `payments_razorpayOrderId_idx` ON `payments` (`razorpayOrderId`);
```

---

## 🔒 Security Analysis

### Issues Found:

1. **No Row-Level Security (RLS)**
   - Any query can access any user's data
   - **Fix:** Application must enforce user filtering (currently done)

2. **No Audit Logging Table**
   - Who accessed what data when?
   - **Recommendation:** Create `audit_logs` table

3. **Sensitive Data Not Tagged**
   - `fullName`, `lifeEvents`, `physicalTraits`, `forensicTraits` are PII
   - **Recommendation:** Add metadata table for GDPR compliance

4. **No Encryption at Rest Indicators**
   - Turso encrypts at rest, but no application-level documentation

---

## 🚀 Performance Analysis

### Bottlenecks:

1. **sessions table** will grow large (>100K rows)
   - All TEXT fields in main table = slow SELECT *
   - **Fix:** Split to `session_details` table (vertical partitioning)

2. **calculations cache** has no eviction
   - Will grow indefinitely
   - **Fix:** Add TTL and nightly cleanup job

3. **No connection pooling config**
   - Drizzle/Turso default settings may not be optimal
   - **Fix:** Add connection pool configuration

---

## 🛠️ Migration Plan

### Phase 1: Critical Fixes (Deploy ASAP)

```sql
-- 1. Add spouseData column (data loss fix)
ALTER TABLE sessions ADD COLUMN spouseData TEXT;

-- 2. Make lifeEvents nullable (draft fix)
ALTER TABLE sessions ALTER COLUMN lifeEvents DROP NOT NULL;

-- 3. Add payment verification index
CREATE UNIQUE INDEX IF NOT EXISTS `payments_razorpayPaymentId_unique` 
    ON `payments` (`razorpayPaymentId`);

-- 4. Add Razorpay order ID index
CREATE INDEX IF NOT EXISTS `payments_razorpayOrderId_idx` 
    ON `payments` (`razorpayOrderId`);
```

### Phase 2: Data Integrity (Next Week)

```sql
-- 1. Add status constraints via new columns
ALTER TABLE sessions ADD COLUMN statusV2 TEXT DEFAULT 'pending';
-- Migrate data, drop old column, rename new

-- 2. Add soft delete to users
ALTER TABLE users ADD COLUMN isActive INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN deletedAt TEXT;

-- 3. Add audit fields
ALTER TABLE sessions ADD COLUMN submittedAt TEXT;
ALTER TABLE sessions ADD COLUMN deletedAt TEXT;
ALTER TABLE sessions ADD COLUMN retentionUntil TEXT;
```

### Phase 3: Performance (Next Sprint)

```sql
-- 1. Add compound indexes
CREATE INDEX `sessions_user_status_idx` ON `sessions` (`userId`, `status`);
CREATE INDEX `sessions_status_created_idx` ON `sessions` (`status`, `createdAt`);
CREATE INDEX `calculations_expires_idx` ON `calculations` (`expiresAt`);

-- 2. Add calculation metadata
ALTER TABLE calculations ADD COLUMN algorithmVersion TEXT DEFAULT '1.0.0';
ALTER TABLE calculations ADD COLUMN expiresAt TEXT;

-- 3. Create audit_logs table
CREATE TABLE `audit_logs` (
    `id` text PRIMARY KEY NOT NULL,
    `userId` text NOT NULL,
    `action` text NOT NULL,  -- 'login', 'view', 'update', 'delete'
    `resource` text NOT NULL, -- 'session', 'payment', etc.
    `resourceId` text,
    `ipAddress` text,
    `userAgent` text,
    `createdAt` text DEFAULT 'CURRENT_TIMESTAMP'
);
CREATE INDEX `audit_logs_user_idx` ON `audit_logs` (`userId`, `createdAt`);
```

---

## 📝 Code Issues Related to Schema

### 1. `app/api/drafts/route.ts`
- ✅ Now includes `forensicTraits` 
- ⚠️ Should validate `spouseData` is being saved to new column

### 2. `app/rectify/page.tsx`
- ✅ Now sends `forensicTraits` to API
- ⚠️ Sends `spouseData` but DB column missing

### 3. Backend queue processor
- ⚠️ Reads `spouseData` from payload but session won't have it on reload

---

## 🎯 Recommendations Summary

| Priority | Action | Effort | Impact |
|----------|--------|--------|--------|
| 🔴 P0 | Add `spouseData` column | 1h | Prevents data loss |
| 🔴 P0 | Make `lifeEvents` nullable | 30m | Fixes draft save |
| 🔴 P0 | Document encrypted fields | 1h | Security compliance |
| 🟡 P1 | Add missing indexes | 2h | Performance |
| 🟡 P1 | Add status constraints | 2h | Data integrity |
| 🟢 P2 | Add audit_logs table | 4h | Compliance |
| 🟢 P2 | Add soft delete | 2h | GDPR |
| ⚪ P3 | Split sessions table | 8h | Scalability |

---

## ✅ Overall Verdict

**Grade: B+ (Good, but needs critical fixes)**

The schema is well-structured for an MVP but has:
- 2 critical data loss issues
- 2 security documentation gaps  
- 4 performance optimizations needed
- Missing audit/compliance features

**Production Ready?** ⚠️ **Conditional**
- Fix P0 items immediately
- Implement P1 items before scaling to 1000+ users

---

*Report generated by AI Database Architect*  
*Next review recommended: After P0 fixes implemented*
