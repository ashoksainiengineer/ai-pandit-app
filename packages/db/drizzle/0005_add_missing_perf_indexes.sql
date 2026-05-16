-- Migration: Add missing performance-critical indexes
-- These indexes address sequential scans observed in production query patterns

-- Index 1: sessions.externalId
-- Used in: dashboard listing, ownership checks, session list endpoint
-- Queries: WHERE sessions.externalId = ? OR sessions.userId = ?
-- Current: sequential scan over sessions table
CREATE INDEX CONCURRENTLY IF NOT EXISTS sessions_externalId_idx
ON sessions USING btree ("externalId");

-- Index 2: composite (status, updatedAt)
-- Used in: queue manager purgeExpiredQueueEntries + recoverOrphanedSessions
-- Queries: WHERE status = 'processing' AND updatedAt < ?
--          WHERE status = 'queued' AND updatedAt < ?
-- Current: sessions_status_idx used then range scan on updatedAt
CREATE INDEX CONCURRENTLY IF NOT EXISTS sessions_status_updated_idx
ON sessions USING btree ("status", "updatedAt");
