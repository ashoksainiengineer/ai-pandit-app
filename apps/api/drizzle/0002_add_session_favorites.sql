CREATE TABLE IF NOT EXISTS `session_favorites` (
  `id` text PRIMARY KEY NOT NULL,
  `clerkId` text NOT NULL,
  `sessionId` text NOT NULL,
  `createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS `session_favorites_clerkId_idx` ON `session_favorites` (`clerkId`);
CREATE INDEX IF NOT EXISTS `session_favorites_sessionId_idx` ON `session_favorites` (`sessionId`);
CREATE UNIQUE INDEX IF NOT EXISTS `session_favorites_clerk_session_unique` ON `session_favorites` (`clerkId`, `sessionId`);
