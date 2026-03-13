# Staging Canary Checklist (Skyfield Architecture)

Date reference: March 12, 2026  
Architecture reference: `docs/CURRENT_ARCHITECTURE_SNAPSHOT.md`

## 1. Deploy Order

1. Ephemeris service (external lane)  
2. API service  
3. Worker service  
4. Web service

Run helper:

```sh
sh ./scripts/deploy-staging-sequence.sh
```

## 2. Pre-Canary Health

1. Ephemeris:
   - `/health` is `200`
   - `/ready` is `200`
2. API:
   - `/health` is `200`
3. Worker:
   - process starts cleanly with no crash-loop
4. Web:
   - home/rectify pages load successfully

## 3. Canary Window (30-60 min)

Track these continuously:

1. API reliability:
   - 5xx rate < 1%
   - p95 latency stable vs pre-deploy baseline
2. Worker reliability:
   - queue backlog not monotonically increasing
   - retries/dead-letter do not spike unexpectedly
3. Streaming correctness:
   - SSE reconnect works
   - terminal events are not missing/duplicated
4. Ephemeris stability:
   - no prolonged `5xx` burst
   - request latency remains stable

## 4. Functional Smoke During Canary

1. Create one new analysis flow from web.
2. Verify job appears in queue and reaches terminal state.
3. Verify result retrieval and session history path.

## 5. Rollback Triggers

Rollback immediately if any condition is true:

1. Persistent 5xx rate spike above baseline.
2. Worker backlog keeps growing for >10 minutes without recovery.
3. SSE terminal events missing or duplicated in user-visible flow.
4. Ephemeris `/health` or `/ready` unstable for >5 minutes.

## 6. Rollback Order

1. Web
2. Worker
3. API
4. Ephemeris

## 7. Exit Criteria

Canary is successful when:

1. No rollback trigger fired.
2. Metrics remained within threshold for full window.
3. Functional smoke passed end-to-end.
