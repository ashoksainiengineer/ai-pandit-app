import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    clerkId: text('clerkId').notNull().unique(),
    email: text('email').notNull(),
    fullName: text('fullName'),
    createdAt: text('createdAt').default('CURRENT_TIMESTAMP'),
    updatedAt: text('updatedAt').default('CURRENT_TIMESTAMP'),
  },
  (table) => ({
    clerkIdIdx: index('users_clerkId_idx').on(table.clerkId),
    emailIdx: index('users_email_idx').on(table.email),
  })
);

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull().references(() => users.id),
    clerkId: text('clerkId').notNull(), // Clerk user ID for decryption key
    fullName: text('fullName').notNull(),
    dateOfBirth: text('dateOfBirth').notNull(),
    tentativeTime: text('tentativeTime').notNull(),
    birthPlace: text('birthPlace').notNull(),
    latitude: real('latitude').notNull(),
    longitude: real('longitude').notNull(),
    timezone: text('timezone').notNull(),
    gender: text('gender'),
    physicalTraits: text('physicalTraits'),
    lifeEvents: text('lifeEvents').notNull(),
    offsetConfig: text('offsetConfig'),
    rectifiedTime: text('rectifiedTime'),
    accuracy: integer('accuracy'),
    confidence: text('confidence'),
    analysisResult: text('analysisResult'),
    progressData: text('progressData'), // Real-time progress for polling
    reasoningLogs: text('reasoningLogs'), // Internal AI logs
    status: text('status').default('pending'),
    errorMessage: text('errorMessage'),
    createdAt: text('createdAt').default('CURRENT_TIMESTAMP'),
    updatedAt: text('updatedAt').default('CURRENT_TIMESTAMP'),
    completedAt: text('completedAt'),
  },
  (table) => ({
    userIdIdx: index('sessions_userId_idx').on(table.userId),
    statusIdx: index('sessions_status_idx').on(table.status),
    createdAtIdx: index('sessions_createdAt_idx').on(table.createdAt),
  })
);

export const calculations = sqliteTable(
  'calculations',
  {
    id: text('id').primaryKey(),
    sessionId: text('sessionId').notNull().references(() => sessions.id),
    birthDateTime: text('birthDateTime').notNull(),
    latitude: real('latitude').notNull(),
    longitude: real('longitude').notNull(),
    timezone: text('timezone').notNull(),
    ephemerisData: text('ephemerisData').notNull(),
    processingTime: integer('processingTime'),
    success: integer('success').default(1),
    createdAt: text('createdAt').default('CURRENT_TIMESTAMP'),
  },
  (table) => ({
    sessionIdIdx: index('calculations_sessionId_idx').on(table.sessionId),
    createdAtIdx: index('calculations_createdAt_idx').on(table.createdAt),
  })
);

export const payments = sqliteTable(
  'payments',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull().references(() => users.id),
    sessionId: text('sessionId').references(() => sessions.id),
    amount: integer('amount'),
    currency: text('currency').default('INR'),
    status: text('status').default('pending'),
    razorpayOrderId: text('razorpayOrderId'),
    razorpayPaymentId: text('razorpayPaymentId'),
    createdAt: text('createdAt').default('CURRENT_TIMESTAMP'),
  },
  (table) => ({
    userIdIdx: index('payments_userId_idx').on(table.userId),
    sessionIdIdx: index('payments_sessionId_idx').on(table.sessionId),
    statusIdx: index('payments_status_idx').on(table.status),
    createdAtIdx: index('payments_createdAt_idx').on(table.createdAt),
  })
);
