/**
 * Database Schema - AI Pandit BTR System
 * Production-grade schema with full audit support
 * 
 * @version 2.1.0 - Enhanced Security Constraints
 * @author Database Architect, with God-Tier review
 */

import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ═══════════════════════════════════════════════════════════════════════════════
// USERS TABLE - Authentication & Profile
// ═══════════════════════════════════════════════════════════════════════════════

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    clerkId: text('clerkId').notNull().unique(),
    email: text('email').notNull(),
    fullName: text('fullName'),
    
    // Audit & Status Fields
    isActive: integer('isActive', { mode: 'boolean' }).default(true).notNull(),
    role: text('role').default('user').notNull(), // 'user', 'admin', 'support'
    lastLoginAt: text('lastLoginAt'),
    deletedAt: text('deletedAt'), // Soft delete for GDPR
    
    // Timestamps
    createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => ({
    clerkIdIdx: index('users_clerkId_idx').on(table.clerkId),
    emailIdx: index('users_email_idx').on(table.email),
    isActiveIdx: index('users_isActive_idx').on(table.isActive),
    roleIdx: index('users_role_idx').on(table.role),
    deletedAtIdx: index('users_deletedAt_idx').on(table.deletedAt), // For cleanup jobs
  })
);

// ═══════════════════════════════════════════════════════════════════════════════
// SESSIONS TABLE - Birth Time Rectification Analysis
// ═══════════════════════════════════════════════════════════════════════════════

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull().references(() => users.id),
    clerkId: text('clerkId').notNull(), // For decryption key reference
    
    // Core Birth Data (Encrypted)
    fullName: text('fullName').notNull(), // AES-256 encrypted
    dateOfBirth: text('dateOfBirth').notNull(),
    tentativeTime: text('tentativeTime').notNull(),
    birthPlace: text('birthPlace').notNull(),
    latitude: real('latitude').notNull(),
    longitude: real('longitude').notNull(),
    timezone: text('timezone').notNull(),
    gender: text('gender'), // 'male', 'female', 'other'
    
    // Traits Data (Encrypted)
    physicalTraits: text('physicalTraits'), // Legacy traits - encrypted
    forensicTraits: text('forensicTraits'), // God-tier matrix - encrypted
    lifeEvents: text('lifeEvents'), // Nullable for drafts - encrypted
    spouseData: text('spouseData'), // Optional spouse info - encrypted
    
    // Configuration
    offsetConfig: text('offsetConfig'), // JSON: { preset, customMinutes }
    
    // Results (Post-Analysis)
    rectifiedTime: text('rectifiedTime'),
    accuracy: integer('accuracy'), // Percentage 0-100
    confidence: text('confidence'), // 'low', 'medium', 'high', 'god-tier'
    analysisResult: text('analysisResult'), // Full analysis JSON
    progressData: text('progressData'), // Ephemeral: Cleared on complete
    reasoningLogs: text('reasoningLogs'), // Compressed God Mode logs
    
    // Status with CHECK constraint
    status: text('status').default('draft').notNull(),
    
    // Error Tracking
    errorMessage: text('errorMessage'),
    errorCode: text('errorCode'),
    
    // Audit Timeline
    submittedAt: text('submittedAt'), // When user clicked submit
    startedProcessingAt: text('startedProcessingAt'), // When queue picked up
    completedAt: text('completedAt'),
    deletedAt: text('deletedAt'), // Soft delete for GDPR
    retentionUntil: text('retentionUntil'), // Auto-delete date for GDPR
    
    // Data Integrity Flag
    isEncrypted: integer('isEncrypted', { mode: 'boolean' }).default(true).notNull(),
    
    // Timestamps
    createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => ({
    // Primary lookups
    userIdIdx: index('sessions_userId_idx').on(table.userId),
    statusIdx: index('sessions_status_idx').on(table.status),
    
    // Compound indexes for common queries
    userStatusIdx: index('sessions_user_status_idx').on(table.userId, table.status),
    statusCreatedIdx: index('sessions_status_created_idx').on(table.status, table.createdAt),
    
    // Date range queries
    createdAtIdx: index('sessions_createdAt_idx').on(table.createdAt),
    submittedAtIdx: index('sessions_submittedAt_idx').on(table.submittedAt),
    
    // Cleanup jobs
    retentionIdx: index('sessions_retention_idx').on(table.retentionUntil),
    deletedAtIdx: index('sessions_deletedAt_idx').on(table.deletedAt),
  })
);

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATIONS TABLE - Ephemeris Cache
// ═══════════════════════════════════════════════════════════════════════════════

export const calculations = sqliteTable(
  'calculations',
  {
    id: text('id').primaryKey(),
    sessionId: text('sessionId').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
    
    // Calculation Input
    birthDateTime: text('birthDateTime').notNull(),
    latitude: real('latitude').notNull(),
    longitude: real('longitude').notNull(),
    timezone: text('timezone').notNull(),
    
    // Calculation Output
    ephemerisData: text('ephemerisData').notNull(),
    
    // Metadata
    algorithmVersion: text('algorithmVersion').default('2.0.0').notNull(),
    ephemerisVersion: text('ephemerisVersion').default('de440').notNull(),
    processingTime: integer('processingTime'), // Milliseconds
    
    // Cache Management
    cacheHitCount: integer('cacheHitCount').default(0).notNull(),
    expiresAt: text('expiresAt'), // TTL for cache eviction
    
    // Status
    success: integer('success', { mode: 'boolean' }).default(true).notNull(),
    
    // Timestamps
    createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => ({
    sessionIdIdx: index('calculations_sessionId_idx').on(table.sessionId),
    createdAtIdx: index('calculations_createdAt_idx').on(table.createdAt),
    expiresAtIdx: index('calculations_expires_idx').on(table.expiresAt), // For cleanup
    sessionCreatedIdx: index('calculations_session_created_idx').on(table.sessionId, table.createdAt),
  })
);

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENTS TABLE - Payment Tracking
// ═══════════════════════════════════════════════════════════════════════════════

export const payments = sqliteTable(
  'payments',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull().references(() => users.id),
    sessionId: text('sessionId').references(() => sessions.id),
    
    // Amount in smallest currency unit (paise for INR)
    amountPaise: integer('amountPaise').notNull(), // e.g., ₹799 = 79900
    currency: text('currency').default('INR').notNull(),
    
    // Status with workflow states
    status: text('status').default('pending').notNull(),
    // Valid: 'pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded'
    
    // Razorpay Integration
    razorpayOrderId: text('razorpayOrderId'),
    razorpayPaymentId: text('razorpayPaymentId'),
    razorpaySignature: text('razorpaySignature'), // For webhook verification
    
    // Audit Trail
    webhookReceivedAt: text('webhookReceivedAt'),
    verifiedAt: text('verifiedAt'), // When we verified signature
    verificationMethod: text('verificationMethod'), // 'webhook', 'api_poll', 'manual'
    
    // Refund Support
    refundAmountPaise: integer('refundAmountPaise').default(0).notNull(),
    refundReason: text('refundReason'),
    refundedAt: text('refundedAt'),
    
    // Error Tracking
    errorCode: text('errorCode'),
    errorDescription: text('errorDescription'),
    
    // Timestamps
    createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => ({
    // Primary lookups
    userIdIdx: index('payments_userId_idx').on(table.userId),
    sessionIdIdx: index('payments_sessionId_idx').on(table.sessionId),
    statusIdx: index('payments_status_idx').on(table.status),
    
    // Razorpay lookups (UNIQUE to prevent duplicates)
    razorpayOrderIdIdx: uniqueIndex('payments_razorpayOrderId_unique').on(table.razorpayOrderId),
    razorpayPaymentIdIdx: uniqueIndex('payments_razorpayPaymentId_unique').on(table.razorpayPaymentId),
    
    // Date queries
    createdAtIdx: index('payments_createdAt_idx').on(table.createdAt),
    
    // Refund queries
    refundStatusIdx: index('payments_refund_idx').on(table.status, table.refundAmountPaise),
  })
);

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT_LOGS TABLE - Security & Compliance
// ═══════════════════════════════════════════════════════════════════════════════

export const auditLogs = sqliteTable(
  'auditLogs',
  {
    id: text('id').primaryKey(),
    
    // Actor
    userId: text('userId').notNull().references(() => users.id),
    userRole: text('userRole').notNull(), // Role at time of action
    
    // Action Details
    action: text('action').notNull(), // 'create', 'read', 'update', 'delete', 'login', 'export'
    resource: text('resource').notNull(), // 'session', 'payment', 'user', 'calculation'
    resourceId: text('resourceId'), // Specific record ID
    
    // Change Tracking (for updates)
    oldValues: text('oldValues'), // JSON of previous state
    newValues: text('newValues'), // JSON of new state
    
    // Context
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    requestId: text('requestId'), // For tracing
    
    // Result
    success: integer('success', { mode: 'boolean' }).default(true).notNull(),
    errorMessage: text('errorMessage'),
    
    // Timestamps
    createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => ({
    // Primary lookups
    userIdIdx: index('auditLogs_userId_idx').on(table.userId),
    actionIdx: index('auditLogs_action_idx').on(table.action),
    resourceIdx: index('auditLogs_resource_idx').on(table.resource),
    
    // Compound indexes
    userCreatedIdx: index('auditLogs_user_created_idx').on(table.userId, table.createdAt),
    resourceActionIdx: index('auditLogs_resource_action_idx').on(table.resource, table.action),
    
    // Date range queries
    createdAtIdx: index('auditLogs_createdAt_idx').on(table.createdAt),
  })
);

// ═══════════════════════════════════════════════════════════════════════════════
// DATA_RETENTION TABLE - GDPR Compliance
// ═══════════════════════════════════════════════════════════════════════════════

export const dataRetention = sqliteTable(
  'dataRetention',
  {
    id: text('id').primaryKey(),
    
    // Reference
    userId: text('userId').references(() => users.id),
    sessionId: text('sessionId').references(() => sessions.id),
    
    // Retention Policy
    dataType: text('dataType').notNull(), // 'session', 'calculation', 'payment', 'audit'
    retentionDays: integer('retentionDays').notNull(), // e.g., 2555 for 7 years
    
    // Dates
    scheduledDeletionAt: text('scheduledDeletionAt').notNull(),
    actuallyDeletedAt: text('actuallyDeletedAt'), // NULL until processed
    
    // Status
    status: text('status').default('scheduled').notNull(), // 'scheduled', 'processing', 'completed', 'failed'
    
    // Error tracking
    errorMessage: text('errorMessage'),
    retryCount: integer('retryCount').default(0).notNull(),
    
    // Timestamps
    createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => ({
    // Lookup indexes
    userIdIdx: index('dataRetention_userId_idx').on(table.userId),
    sessionIdIdx: index('dataRetention_sessionId_idx').on(table.sessionId),
    statusIdx: index('dataRetention_status_idx').on(table.status),
    
    // Cleanup job index
    scheduledDeletionIdx: index('dataRetention_scheduled_idx').on(table.scheduledDeletionAt, table.status),
  })
);

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Calculation = typeof calculations.$inferSelect;
export type NewCalculation = typeof calculations.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type DataRetention = typeof dataRetention.$inferSelect;
export type NewDataRetention = typeof dataRetention.$inferInsert;
