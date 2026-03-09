/**
 * Database Schema - AI Pandit BTR System (Backend)
 * Production-grade schema with full audit support
 * 
 * @version 2.0.0 - Post-Audit Implementation
 * @author Database Architect
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
        deletedAtIdx: index('users_deletedAt_idx').on(table.deletedAt),
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
        clerkId: text('clerkId').notNull(),
        
        // Core Birth Data (Encrypted)
        fullName: text('fullName').notNull(),
        dateOfBirth: text('dateOfBirth').notNull(),
        tentativeTime: text('tentativeTime').notNull(),
        birthPlace: text('birthPlace').notNull(),
        latitude: real('latitude').notNull(),
        longitude: real('longitude').notNull(),
        timezone: text('timezone').notNull(),
        gender: text('gender'),
        
        // Traits Data (Encrypted)
        physicalTraits: text('physicalTraits'),
        forensicTraits: text('forensicTraits'),
        lifeEvents: text('lifeEvents'), // Nullable for drafts
        spouseData: text('spouseData'), // NEW: Optional spouse info
        
        // Configuration
        offsetConfig: text('offsetConfig'),
        
        // Results
        rectifiedTime: text('rectifiedTime'),
        accuracy: integer('accuracy'),
        confidence: text('confidence'),
        analysisResult: text('analysisResult'),
        progressData: text('progressData'),
        reasoningLogs: text('reasoningLogs'),
        
        // Status
        status: text('status').default('draft').notNull(),
        
        // Error Tracking
        errorMessage: text('errorMessage'),
        errorCode: text('errorCode'),
        
        // Audit Timeline
        submittedAt: text('submittedAt'),
        startedProcessingAt: text('startedProcessingAt'),
        completedAt: text('completedAt'),
        deletedAt: text('deletedAt'),
        retentionUntil: text('retentionUntil'),
        
        // AI Consent Tracking
        aiConsentGiven: integer('aiConsentGiven', { mode: 'boolean' }).default(false),
        aiConsentGivenAt: text('aiConsentGivenAt'),
        aiConsentIp: text('aiConsentIp'),
        
        // Data Integrity
        isEncrypted: integer('isEncrypted', { mode: 'boolean' }).default(true).notNull(),
        
        // Timestamps
        createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
        updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
    },
    (table) => ({
        userIdIdx: index('sessions_userId_idx').on(table.userId),
        statusIdx: index('sessions_status_idx').on(table.status),
        userStatusIdx: index('sessions_user_status_idx').on(table.userId, table.status),
        statusCreatedIdx: index('sessions_status_created_idx').on(table.status, table.createdAt),
        createdAtIdx: index('sessions_createdAt_idx').on(table.createdAt),
        submittedAtIdx: index('sessions_submittedAt_idx').on(table.submittedAt),
        retentionIdx: index('sessions_retention_idx').on(table.retentionUntil),
        deletedAtIdx: index('sessions_deletedAt_idx').on(table.deletedAt),
    })
);

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION_FAVORITES TABLE - User Favorites (Durable)
// ═══════════════════════════════════════════════════════════════════════════════

export const sessionFavorites = sqliteTable(
    'session_favorites',
    {
        id: text('id').primaryKey(),
        clerkId: text('clerkId').notNull(),
        sessionId: text('sessionId').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
        createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
        updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
    },
    (table) => ({
        clerkIdIdx: index('session_favorites_clerkId_idx').on(table.clerkId),
        sessionIdIdx: index('session_favorites_sessionId_idx').on(table.sessionId),
        clerkSessionUnique: uniqueIndex('session_favorites_clerk_session_unique').on(table.clerkId, table.sessionId),
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
        
        birthDateTime: text('birthDateTime').notNull(),
        latitude: real('latitude').notNull(),
        longitude: real('longitude').notNull(),
        timezone: text('timezone').notNull(),
        ephemerisData: text('ephemerisData').notNull(),
        
        // Metadata
        algorithmVersion: text('algorithmVersion').default('2.0.0').notNull(),
        ephemerisVersion: text('ephemerisVersion').default('de440').notNull(),
        processingTime: integer('processingTime'),
        
        // Cache Management
        cacheHitCount: integer('cacheHitCount').default(0).notNull(),
        expiresAt: text('expiresAt'),
        
        success: integer('success', { mode: 'boolean' }).default(true).notNull(),
        
        createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
    },
    (table) => ({
        sessionIdIdx: index('calculations_sessionId_idx').on(table.sessionId),
        createdAtIdx: index('calculations_createdAt_idx').on(table.createdAt),
        expiresAtIdx: index('calculations_expires_idx').on(table.expiresAt),
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
        
        // Amount in paise (smallest unit)
        amountPaise: integer('amountPaise').notNull(),
        currency: text('currency').default('INR').notNull(),
        
        status: text('status').default('pending').notNull(),
        
        // Razorpay
        razorpayOrderId: text('razorpayOrderId'),
        razorpayPaymentId: text('razorpayPaymentId'),
        razorpaySignature: text('razorpaySignature'),
        
        // Audit
        webhookReceivedAt: text('webhookReceivedAt'),
        verifiedAt: text('verifiedAt'),
        verificationMethod: text('verificationMethod'),
        
        // Refund
        refundAmountPaise: integer('refundAmountPaise').default(0).notNull(),
        refundReason: text('refundReason'),
        refundedAt: text('refundedAt'),
        
        // Error
        errorCode: text('errorCode'),
        errorDescription: text('errorDescription'),
        
        createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
        updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
    },
    (table) => ({
        userIdIdx: index('payments_userId_idx').on(table.userId),
        sessionIdIdx: index('payments_sessionId_idx').on(table.sessionId),
        statusIdx: index('payments_status_idx').on(table.status),
        razorpayOrderIdIdx: uniqueIndex('payments_razorpayOrderId_unique').on(table.razorpayOrderId),
        razorpayPaymentIdIdx: uniqueIndex('payments_razorpayPaymentId_unique').on(table.razorpayPaymentId),
        createdAtIdx: index('payments_createdAt_idx').on(table.createdAt),
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
        userId: text('userId').notNull().references(() => users.id),
        userRole: text('userRole').notNull(),
        action: text('action').notNull(),
        resource: text('resource').notNull(),
        resourceId: text('resourceId'),
        oldValues: text('oldValues'),
        newValues: text('newValues'),
        ipAddress: text('ipAddress'),
        userAgent: text('userAgent'),
        requestId: text('requestId'),
        success: integer('success', { mode: 'boolean' }).default(true).notNull(),
        errorMessage: text('errorMessage'),
        createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
    },
    (table) => ({
        userIdIdx: index('auditLogs_userId_idx').on(table.userId),
        actionIdx: index('auditLogs_action_idx').on(table.action),
        resourceIdx: index('auditLogs_resource_idx').on(table.resource),
        userCreatedIdx: index('auditLogs_user_created_idx').on(table.userId, table.createdAt),
        resourceActionIdx: index('auditLogs_resource_action_idx').on(table.resource, table.action),
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
        userId: text('userId').references(() => users.id),
        sessionId: text('sessionId').references(() => sessions.id),
        dataType: text('dataType').notNull(),
        retentionDays: integer('retentionDays').notNull(),
        scheduledDeletionAt: text('scheduledDeletionAt').notNull(),
        actuallyDeletedAt: text('actuallyDeletedAt'),
        status: text('status').default('scheduled').notNull(),
        errorMessage: text('errorMessage'),
        retryCount: integer('retryCount').default(0).notNull(),
        createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
        updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
    },
    (table) => ({
        userIdIdx: index('dataRetention_userId_idx').on(table.userId),
        sessionIdIdx: index('dataRetention_sessionId_idx').on(table.sessionId),
        statusIdx: index('dataRetention_status_idx').on(table.status),
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
export type SessionFavorite = typeof sessionFavorites.$inferSelect;
export type NewSessionFavorite = typeof sessionFavorites.$inferInsert;
export type Calculation = typeof calculations.$inferSelect;
export type NewCalculation = typeof calculations.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type DataRetention = typeof dataRetention.$inferSelect;
export type NewDataRetention = typeof dataRetention.$inferInsert;
