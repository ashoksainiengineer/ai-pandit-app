# Database Cleanup Configuration

## Overview

Automated cleanup system to manage database storage, prevent bloat, and maintain GDPR compliance.

## Components

### 1. Database Cleanup Service (`backend/src/lib/db-cleanup.ts`)

Handles cleanup of:
- **Soft-deleted sessions** (30 days retention)
- **Soft-deleted users** (90 days retention)
- **Completed session progress data** (1 day after completion)
- **Expired calculations cache** (30 days TTL)
- **Stale pending sessions** (7 days)

### 2. Calculation Cache (`backend/src/lib/calculation-cache.ts`)

Manages ephemeris calculation cache with:
- TTL-based expiration (default: 30 days)
- Cache hit tracking
- Automatic cleanup of expired entries
- Session-level cache clearing

### 3. Progress Tracker Cleanup (`backend/src/lib/progress-tracker.ts`)

Automatically clears ephemeral `progressData`:
- Cleared 5 minutes after session completion
- Prevents storage bloat from real-time progress updates

## Retention Configuration

```typescript
const RETENTION = {
  softDeletedSessions: 30,      // days
  softDeletedUsers: 90,         // days (GDPR)
  completedSessionsProgress: 1, // days
  failedSessions: 7,            // days
  expiredCalculations: 30,      // days
  stalePendingSessions: 7,      // days
};
```

## Scheduled Cleanup Job

### GitHub Actions Workflow

File: `.github/workflows/db-cleanup.yml`

Runs daily at 3 AM UTC:
```yaml
schedule:
  - cron: '0 3 * * *'
```

### Manual Execution

```bash
npx tsx backend/src/scripts/scheduled-cleanup.ts
```

## Pagination

All list queries now support pagination:

### API Usage
```typescript
// Request
GET /api/drafts?page=1&limit=20

// Response
{
  "success": true,
  "drafts": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Default Limits
- Page: 1
- Limit: 20
- Max Limit: 100

## Environment Variables

Add to `.env`:
```
# Optional: Override default retention (in days)
RETENTION_SESSIONS_DAYS=30
RETENTION_USERS_DAYS=90
RETENTION_PROGRESS_DAYS=1
RETENTION_CALCULATIONS_DAYS=30
RETENTION_PENDING_DAYS=7
```

## Monitoring

### Check Cleanup Stats
```typescript
import { getCacheStats } from './backend/src/lib/calculation-cache';

const stats = await getCacheStats();
console.log(stats);
// { totalEntries: 150, expiredEntries: 23, totalHits: 450, averageHits: 3 }
```

### Preview Cleanup (Dry Run)
```typescript
import { getCleanupPreview } from './backend/src/lib/db-cleanup';

const preview = await getCleanupPreview();
console.log(preview.wouldDelete);
```

## Storage Savings

Expected storage reduction:
- Progress data: ~90% after 24 hours
- Expired calculations: ~20% monthly
- Soft-deleted records: ~50% after retention period

## Troubleshooting

### Cleanup Not Running
1. Check GitHub Actions is enabled
2. Verify `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` secrets
3. Check Actions logs for errors

### High Storage Usage
1. Reduce retention periods in config
2. Run manual cleanup: `npx tsx backend/src/scripts/scheduled-cleanup.ts`
3. Check for missing indexes on cleanup queries

### GDPR Compliance
- User data automatically deleted after 90 days of soft delete
- Session data purged after 30 days of soft delete
- Audit trail maintained via `deletedAt` timestamps
