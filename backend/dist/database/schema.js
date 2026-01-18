"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payments = exports.calculations = exports.sessions = exports.users = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
exports.users = (0, sqlite_core_1.sqliteTable)('users', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    clerkId: (0, sqlite_core_1.text)('clerkId').notNull().unique(),
    email: (0, sqlite_core_1.text)('email').notNull(),
    fullName: (0, sqlite_core_1.text)('fullName'),
    createdAt: (0, sqlite_core_1.text)('createdAt').default('CURRENT_TIMESTAMP'),
    updatedAt: (0, sqlite_core_1.text)('updatedAt').default('CURRENT_TIMESTAMP'),
}, (table) => ({
    clerkIdIdx: (0, sqlite_core_1.index)('users_clerkId_idx').on(table.clerkId),
    emailIdx: (0, sqlite_core_1.index)('users_email_idx').on(table.email),
}));
exports.sessions = (0, sqlite_core_1.sqliteTable)('sessions', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    userId: (0, sqlite_core_1.text)('userId').notNull().references(() => exports.users.id),
    clerkId: (0, sqlite_core_1.text)('clerkId').notNull(), // Clerk user ID for decryption key
    fullName: (0, sqlite_core_1.text)('fullName').notNull(),
    dateOfBirth: (0, sqlite_core_1.text)('dateOfBirth').notNull(),
    tentativeTime: (0, sqlite_core_1.text)('tentativeTime').notNull(),
    birthPlace: (0, sqlite_core_1.text)('birthPlace').notNull(),
    latitude: (0, sqlite_core_1.real)('latitude').notNull(),
    longitude: (0, sqlite_core_1.real)('longitude').notNull(),
    timezone: (0, sqlite_core_1.text)('timezone').notNull(),
    gender: (0, sqlite_core_1.text)('gender'),
    physicalTraits: (0, sqlite_core_1.text)('physicalTraits'),
    lifeEvents: (0, sqlite_core_1.text)('lifeEvents').notNull(),
    offsetConfig: (0, sqlite_core_1.text)('offsetConfig'),
    rectifiedTime: (0, sqlite_core_1.text)('rectifiedTime'),
    accuracy: (0, sqlite_core_1.integer)('accuracy'),
    confidence: (0, sqlite_core_1.text)('confidence'),
    analysisResult: (0, sqlite_core_1.text)('analysisResult'),
    progressData: (0, sqlite_core_1.text)('progressData'), // Real-time progress for polling
    status: (0, sqlite_core_1.text)('status').default('pending'),
    errorMessage: (0, sqlite_core_1.text)('errorMessage'),
    createdAt: (0, sqlite_core_1.text)('createdAt').default('CURRENT_TIMESTAMP'),
    updatedAt: (0, sqlite_core_1.text)('updatedAt').default('CURRENT_TIMESTAMP'),
    completedAt: (0, sqlite_core_1.text)('completedAt'),
}, (table) => ({
    userIdIdx: (0, sqlite_core_1.index)('sessions_userId_idx').on(table.userId),
    statusIdx: (0, sqlite_core_1.index)('sessions_status_idx').on(table.status),
    createdAtIdx: (0, sqlite_core_1.index)('sessions_createdAt_idx').on(table.createdAt),
}));
exports.calculations = (0, sqlite_core_1.sqliteTable)('calculations', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    sessionId: (0, sqlite_core_1.text)('sessionId').notNull().references(() => exports.sessions.id),
    birthDateTime: (0, sqlite_core_1.text)('birthDateTime').notNull(),
    latitude: (0, sqlite_core_1.real)('latitude').notNull(),
    longitude: (0, sqlite_core_1.real)('longitude').notNull(),
    timezone: (0, sqlite_core_1.text)('timezone').notNull(),
    ephemerisData: (0, sqlite_core_1.text)('ephemerisData').notNull(),
    processingTime: (0, sqlite_core_1.integer)('processingTime'),
    success: (0, sqlite_core_1.integer)('success').default(1),
    createdAt: (0, sqlite_core_1.text)('createdAt').default('CURRENT_TIMESTAMP'),
}, (table) => ({
    sessionIdIdx: (0, sqlite_core_1.index)('calculations_sessionId_idx').on(table.sessionId),
    createdAtIdx: (0, sqlite_core_1.index)('calculations_createdAt_idx').on(table.createdAt),
}));
exports.payments = (0, sqlite_core_1.sqliteTable)('payments', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    userId: (0, sqlite_core_1.text)('userId').notNull().references(() => exports.users.id),
    sessionId: (0, sqlite_core_1.text)('sessionId').references(() => exports.sessions.id),
    amount: (0, sqlite_core_1.integer)('amount'),
    currency: (0, sqlite_core_1.text)('currency').default('INR'),
    status: (0, sqlite_core_1.text)('status').default('pending'),
    razorpayOrderId: (0, sqlite_core_1.text)('razorpayOrderId'),
    razorpayPaymentId: (0, sqlite_core_1.text)('razorpayPaymentId'),
    createdAt: (0, sqlite_core_1.text)('createdAt').default('CURRENT_TIMESTAMP'),
}, (table) => ({
    userIdIdx: (0, sqlite_core_1.index)('payments_userId_idx').on(table.userId),
    sessionIdIdx: (0, sqlite_core_1.index)('payments_sessionId_idx').on(table.sessionId),
    statusIdx: (0, sqlite_core_1.index)('payments_status_idx').on(table.status),
    createdAtIdx: (0, sqlite_core_1.index)('payments_createdAt_idx').on(table.createdAt),
}));
//# sourceMappingURL=schema.js.map