CREATE TABLE `calculations` (
	`id` text PRIMARY KEY NOT NULL,
	`sessionId` text NOT NULL,
	`birthDateTime` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`timezone` text NOT NULL,
	`ephemerisData` text NOT NULL,
	`processingTime` integer,
	`success` integer DEFAULT 1,
	`createdAt` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `calculations_sessionId_idx` ON `calculations` (`sessionId`);--> statement-breakpoint
CREATE INDEX `calculations_createdAt_idx` ON `calculations` (`createdAt`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`sessionId` text,
	`amount` integer,
	`currency` text DEFAULT 'INR',
	`status` text DEFAULT 'pending',
	`razorpayOrderId` text,
	`razorpayPaymentId` text,
	`createdAt` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `payments_userId_idx` ON `payments` (`userId`);--> statement-breakpoint
CREATE INDEX `payments_sessionId_idx` ON `payments` (`sessionId`);--> statement-breakpoint
CREATE INDEX `payments_status_idx` ON `payments` (`status`);--> statement-breakpoint
CREATE INDEX `payments_createdAt_idx` ON `payments` (`createdAt`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`clerkId` text NOT NULL,
	`fullName` text NOT NULL,
	`dateOfBirth` text NOT NULL,
	`tentativeTime` text NOT NULL,
	`birthPlace` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`timezone` text NOT NULL,
	`gender` text,
	`physicalTraits` text,
	`lifeEvents` text NOT NULL,
	`offsetConfig` text,
	`rectifiedTime` text,
	`accuracy` integer,
	`confidence` text,
	`analysisResult` text,
	`progressData` text,
	`reasoningLogs` text,
	`status` text DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` text DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` text DEFAULT 'CURRENT_TIMESTAMP',
	`completedAt` text,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sessions_userId_idx` ON `sessions` (`userId`);--> statement-breakpoint
CREATE INDEX `sessions_status_idx` ON `sessions` (`status`);--> statement-breakpoint
CREATE INDEX `sessions_createdAt_idx` ON `sessions` (`createdAt`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`clerkId` text NOT NULL,
	`email` text NOT NULL,
	`fullName` text,
	`createdAt` text DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_clerkId_unique` ON `users` (`clerkId`);--> statement-breakpoint
CREATE INDEX `users_clerkId_idx` ON `users` (`clerkId`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);