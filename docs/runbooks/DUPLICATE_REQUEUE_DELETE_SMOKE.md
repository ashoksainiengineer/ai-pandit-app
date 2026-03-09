# Duplicate-Requeue-Delete Smoke Runbook

This smoke run validates the exact high-risk flow:

1. Clone a completed session
2. Requeue cloned draft for analysis
3. Poll progress endpoint
4. Delete cloned draft (cleanup)

It is designed to catch regressions in:
- session ownership checks (`clerkId` vs `userId`)
- duplicate -> submit/requeue transition
- progress/status visibility
- delete endpoint behavior for cloned drafts

## Command

From repo root:

```bash
cd apps/api
npm run smoke:duplicate-flow
```

Local auth-bypass smoke (recommended for rapid regression checks):

```bash
cd apps/api
npm run smoke:duplicate-flow:local
```

## Required Env

At least one auth mode:

1. Production-like auth (recommended):
```bash
export SMOKE_BACKEND_URL="https://<your-backend>"
export SMOKE_CLERK_BEARER_TOKEN="<valid-clerk-jwt>"
```

2. Test bypass (only when backend runs in test mode):
```bash
export SMOKE_BACKEND_URL="http://localhost:3001"
export SMOKE_TEST_BYPASS="true"
```

For `smoke:duplicate-flow:local`, no bearer token is required.

Optional tuning:

```bash
export SMOKE_MAX_POLLS=18
export SMOKE_POLL_INTERVAL_MS=5000
```

## Pass Criteria

- Script finds a completed session
- Clone API returns new draft session id
- Requeue API accepts cloned session
- Progress polls without ownership/session-not-found errors
- Delete API successfully removes cloned session

## Failure Handling

- If failure occurs, keep cloned session id from script output.
- Check backend logs for:
  - ownership mismatch (`Access denied` / `Unauthorized`)
  - session lookup misses (`Session not found`)
  - queue failures (`Failed to restart analysis`)
