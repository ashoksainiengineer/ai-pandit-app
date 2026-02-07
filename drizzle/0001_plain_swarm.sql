CREATE TABLE `auditLogs` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`userRole` text NOT NULL,
	`action` text NOT NULL,
	`resource` text NOT NULL,
	`resourceId` text,
	`oldValues` text,
	`newValues` text,
	`ipAddress` text,
	`userAgent` text,
	`requestId` text,
	`success` integer DEFAULT true NOT NULL,
	`errorMessage` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `auditLogs_userId_idx` ON `auditLogs` (`userId`);--> statement-breakpoint
CREATE INDEX `auditLogs_action_idx` ON `auditLogs` (`action`);--> statement-breakpoint
CREATE INDEX `auditLogs_resource_idx` ON `auditLogs` (`resource`);--> statement-breakpoint
CREATE INDEX `auditLogs_user_created_idx` ON `auditLogs` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `auditLogs_resource_action_idx` ON `auditLogs` (`resource`,`action`);--> statement-breakpoint
CREATE INDEX `auditLogs_createdAt_idx` ON `auditLogs` (`createdAt`);--> statement-breakpoint
CREATE TABLE `dataRetention` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`sessionId` text,
	`dataType` text NOT NULL,
	`retentionDays` integer NOT NULL,
	`scheduledDeletionAt` text NOT NULL,
	`actuallyDeletedAt` text,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`errorMessage` text,
	`retryCount` integer DEFAULT 0 NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `dataRetention_userId_idx` ON `dataRetention` (`userId`);--> statement-breakpoint
CREATE INDEX `dataRetention_sessionId_idx` ON `dataRetention` (`sessionId`);--> statement-breakpoint
CREATE INDEX `dataRetention_status_idx` ON `dataRetention` (`status`);--> statement-breakpoint
CREATE INDEX `dataRetention_scheduled_idx` ON `dataRetention` (`scheduledDeletionAt`,`status`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_calculations` (
	`id` text PRIMARY KEY NOT NULL,
	`sessionId` text NOT NULL,
	`birthDateTime` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`timezone` text NOT NULL,
	`ephemerisData` text NOT NULL,
	`algorithmVersion` text DEFAULT '2.0.0' NOT NULL,
	`ephemerisVersion` text DEFAULT 'de440' NOT NULL,
	`processingTime` integer,
	`cacheHitCount` integer DEFAULT 0 NOT NULL,
	`expiresAt` text,
	`success` integer DEFAULT true NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_calculations`("id", "sessionId", "birthDateTime", "latitude", "longitude", "timezone", "ephemerisData", "algorithmVersion", "ephemerisVersion", "processingTime", "cacheHitCount", "expiresAt", "success", "createdAt") SELECT "id", "sessionId", "birthDateTime", "latitude", "longitude", "timezone", "ephemerisData", "algorithmVersion", "ephemerisVersion", "processingTime", "cacheHitCount", "expiresAt", "success", "createdAt" FROM `calculations`;--> statement-breakpoint
DROP TABLE `calculations`;--> statement-breakpoint
ALTER TABLE `__new_calculations` RENAME TO `calculations`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `calculations_sessionId_idx` ON `calculations` (`sessionId`);--> statement-breakpoint
CREATE INDEX `calculations_createdAt_idx` ON `calculations` (`createdAt`);--> statement-breakpoint
CREATE INDEX `calculations_expires_idx` ON `calculations` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `calculations_session_created_idx` ON `calculations` (`sessionId`,`createdAt`);--> statement-breakpoint
DROP INDEX "auditLogs_userId_idx";--> statement-breakpoint
DROP INDEX "auditLogs_action_idx";--> statement-breakpoint
DROP INDEX "auditLogs_resource_idx";--> statement-breakpoint
DROP INDEX "auditLogs_user_created_idx";--> statement-breakpoint
DROP INDEX "auditLogs_resource_action_idx";--> statement-breakpoint
DROP INDEX "auditLogs_createdAt_idx";--> statement-breakpoint
DROP INDEX "calculations_sessionId_idx";--> statement-breakpoint
DROP INDEX "calculations_createdAt_idx";--> statement-breakpoint
DROP INDEX "calculations_expires_idx";--> statement-breakpoint
DROP INDEX "calculations_session_created_idx";--> statement-breakpoint
DROP INDEX "dataRetention_userId_idx";--> statement-breakpoint
DROP INDEX "dataRetention_sessionId_idx";--> statement-breakpoint
DROP INDEX "dataRetention_status_idx";--> statement-breakpoint
DROP INDEX "dataRetention_scheduled_idx";--> statement-breakpoint
DROP INDEX "payments_userId_idx";--> statement-breakpoint
DROP INDEX "payments_sessionId_idx";--> statement-breakpoint
DROP INDEX "payments_status_idx";--> statement-breakpoint
DROP INDEX "payments_razorpayOrderId_unique";--> statement-breakpoint
DROP INDEX "payments_razorpayPaymentId_unique";--> statement-breakpoint
DROP INDEX "payments_createdAt_idx";--> statement-breakpoint
DROP INDEX "payments_refund_idx";--> statement-breakpoint
DROP INDEX "sessions_userId_idx";--> statement-breakpoint
DROP INDEX "sessions_status_idx";--> statement-breakpoint
DROP INDEX "sessions_user_status_idx";--> statement-breakpoint
DROP INDEX "sessions_status_created_idx";--> statement-breakpoint
DROP INDEX "sessions_createdAt_idx";--> statement-breakpoint
DROP INDEX "sessions_submittedAt_idx";--> statement-breakpoint
DROP INDEX "sessions_retention_idx";--> statement-breakpoint
DROP INDEX "sessions_deletedAt_idx";--> statement-breakpoint
DROP INDEX "users_clerkId_unique";--> statement-breakpoint
DROP INDEX "users_clerkId_idx";--> statement-breakpoint
DROP INDEX "users_email_idx";--> statement-breakpoint
DROP INDEX "users_isActive_idx";--> statement-breakpoint
DROP INDEX "users_role_idx";--> statement-breakpoint
DROP INDEX "users_deletedAt_idx";--> statement-breakpoint
ALTER TABLE `payments` ALTER COLUMN "currency" TO "currency" text NOT NULL DEFAULT 'INR';--> statement-breakpoint
CREATE INDEX `payments_userId_idx` ON `payments` (`userId`);--> statement-breakpoint
CREATE INDEX `payments_sessionId_idx` ON `payments` (`sessionId`);--> statement-breakpoint
CREATE INDEX `payments_status_idx` ON `payments` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_razorpayOrderId_unique` ON `payments` (`razorpayOrderId`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_razorpayPaymentId_unique` ON `payments` (`razorpayPaymentId`);--> statement-breakpoint
CREATE INDEX `payments_createdAt_idx` ON `payments` (`createdAt`);--> statement-breakpoint
CREATE INDEX `payments_refund_idx` ON `payments` (`status`,`refundAmountPaise`);--> statement-breakpoint
CREATE INDEX `sessions_userId_idx` ON `sessions` (`userId`);--> statement-breakpoint
CREATE INDEX `sessions_status_idx` ON `sessions` (`status`);--> statement-breakpoint
CREATE INDEX `sessions_user_status_idx` ON `sessions` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `sessions_status_created_idx` ON `sessions` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `sessions_createdAt_idx` ON `sessions` (`createdAt`);--> statement-breakpoint
CREATE INDEX `sessions_submittedAt_idx` ON `sessions` (`submittedAt`);--> statement-breakpoint
CREATE INDEX `sessions_retention_idx` ON `sessions` (`retentionUntil`);--> statement-breakpoint
CREATE INDEX `sessions_deletedAt_idx` ON `sessions` (`deletedAt`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_clerkId_unique` ON `users` (`clerkId`);--> statement-breakpoint
CREATE INDEX `users_clerkId_idx` ON `users` (`clerkId`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_isActive_idx` ON `users` (`isActive`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `users_deletedAt_idx` ON `users` (`deletedAt`);--> statement-breakpoint
ALTER TABLE `payments` ALTER COLUMN "status" TO "status" text NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `payments` ALTER COLUMN "createdAt" TO "createdAt" text NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `payments` ADD `amountPaise` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `razorpaySignature` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `webhookReceivedAt` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `verifiedAt` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `verificationMethod` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `refundAmountPaise` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `refundReason` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `refundedAt` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `errorCode` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `errorDescription` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` DROP COLUMN `amount`;--> statement-breakpoint
ALTER TABLE `sessions` ALTER COLUMN "lifeEvents" TO "lifeEvents" text;--> statement-breakpoint
ALTER TABLE `sessions` ALTER COLUMN "status" TO "status" text NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `sessions` ALTER COLUMN "createdAt" TO "createdAt" text NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `sessions` ALTER COLUMN "updatedAt" TO "updatedAt" text NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `sessions` ADD `forensicTraits` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `spouseData` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `errorCode` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `submittedAt` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `startedProcessingAt` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `deletedAt` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `retentionUntil` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `isEncrypted` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "createdAt" TO "createdAt" text NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "updatedAt" TO "updatedAt" text NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `role` text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lastLoginAt` text;--> statement-breakpoint
ALTER TABLE `users` ADD `deletedAt` text;