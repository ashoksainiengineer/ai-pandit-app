# Analysis Page — Known Issues & Debugging Guide

Reference doc for debugging issues on the BTR analysis page (`/rectify/[id]/page.tsx`).

---

## Architecture Overview

```
┌─────────────────┐    SSE / Polling     ┌──────────────────┐
│   Backend API   │ ──────────────────► │ useStreamProgress │
│  /api/stream/:id│                      │  (SSE connector)  │
│  /api/queue/    │                      └────────┬─────────┘
└─────────────────┘                               │ dispatchStreamEvent()
                                                  ▼
                                        ┌──────────────────┐
                                        │  Zustand Store    │
                                        │  (stream-store)   │
                                        │  + localStorage   │
                                        └────────┬─────────┘
                                                  │ useShallow selectors
                                                  ▼
                                        ┌──────────────────┐
                                        │  AnalysisPage     │
                                        │  ├ UnifiedAIPanel │
                                        │  ├ Pipeline       │
                                        │  └ Leaderboard    │
                                        └──────────────────┘
```

**Key files:**
- `apps/web/app/rectify/[id]/page.tsx` — Main analysis page
- `apps/web/lib/use-stream-progress.ts` — SSE/Polling hook
- `apps/web/lib/store/stream-store.ts` — Zustand store (persisted to localStorage)
- `apps/web/lib/store/stream-types.ts` — Type definitions
- `apps/web/components/rectify/UnifiedAIPanel.tsx` — Reasoning display component
- `apps/api/src/routes/stream.ts` — Backend SSE endpoint
- `apps/api/src/routes/queue.ts` — Queue/Requeue/Cancel endpoints
- `apps/api/src/lib/session-events.ts` — Backend event buffer/emitter

---

## Issue Log

### ISSUE-001: Empty containers after Edit & Reanalyze (Feb 2026)

**Symptom:** Backend starts correctly, but analysis page shows empty containers with no reasoning streams.

**Root cause:** `EditSessionClient.handleSubmit` did not clear the Zustand store before `router.push()`. Stale `isComplete: true` and empty `candidatesByStage` from localStorage rehydrated into the new analysis session.

**Fix:**
1. Added `useStreamStore.getState().clearStore()` in `EditSessionClient.handleSubmit` before navigation
2. Added safety guard in `page.tsx`: if `isComplete` is true but `metadata.status` is `pending/queued/processing`, force-clear the store

**Pattern to follow:** Always call `clearStore()` before navigating to the analysis page after a requeue. See `handleRestart` in `page.tsx` as the canonical reference.

---

### ISSUE-002: Empty frontend from start — SSE/Port mismatch (Feb 2026)

**Symptom:** Frontend completely blank from the start, no data loads at all.

**Root cause:** Frontend was pointing to the wrong backend URL or port, causing all SSE/API calls to fail silently.

**Fix:** Ensure `NEXT_PUBLIC_BACKEND_URL` in `.env.local` matches the actual backend port.

**Debugging steps:**
1. Check browser console for SSE connection logs (`✅ [SSE] Connection OPENED`)
2. Check Network tab for `/api/stream/:id` request status
3. Verify `env.api.backendUrl` resolves correctly

---

### ISSUE-003: "Invalid time value" crash on analysis page (Feb 2026)

**Symptom:** Page crashes with `RangeError: Invalid time value` error.

**Root cause:** Backend sent date strings in unexpected formats that `new Date()` couldn't parse.

**Fix:** Added validation guards `isNaN(date.getTime())` before using date values in `AnalysisTimer` and other components.

---

### ISSUE-004: Stage 2 cards overwriting each other (Feb 2026)

**Symptom:** Reasoning cards within Stage 2 container were being overwritten instead of showing separately.

**Root cause:** Buffer keys in `stream-store.ts` did not include stage number, causing cross-stage collision for candidates with the same time.

**Fix:** Changed buffer key format to `s${stage}_${candidateTime}` (composite stage-qualified key).

---

### ISSUE-005: Empty containers and lost timer after page refresh (Feb 2026)

**Symptom:** On page refresh during active analysis, reasoning cards appear empty, timer resets, and stage highlight disappears. SSE reconnects but data takes time to rebuild.

**Root cause:** `allCandidates`, `candidatesByStage`, `startedAt`, `persistentCandidates`, `activeAIStage`, and `displayedCandidate` were NOT included in the Zustand store's `partialize` function, so they were lost on refresh.

**Fix:** Added all missing fields to `partialize` with size-capped reasoning text (10KB per candidate via `capCandidatesForPersistence`) to stay within localStorage's 5MB limit.

**Pattern:** Use `PERSIST_MAX_CHARS = 10_000` cap for any text-heavy state. In-memory stays uncapped. SSE replay supplements on reconnect.

---

## Common Debugging Checklist

### Analysis page shows loading forever
- [ ] Is the user signed in? (`isLoaded && isSignedIn` check)
- [ ] Does the session exist in DB? (Check 404 from SSE)
- [ ] Is `connectionState.status` stuck on `idle`? → Store may have stale `sessionId`
- [ ] Is `hasData` false? → SSE may not be connected

### Empty containers (no cards, no reasoning)
- [ ] Check `candidatesByStage` in browser devtools (Zustand DevTools or `localStorage.getItem('ai-pandit-stream-store')`)
- [ ] Is `isComplete` stale from a previous analysis? → Clear store
- [ ] Is the SSE actually receiving `ai_thinking` events? → Check console logs
- [ ] Is `allCandidates` populated but `candidatesByStage` empty? → Check stage number mismatch

### Analysis stuck — no progress updates
- [ ] Check backend logs for processing errors
- [ ] Is SSE connected? Look for `✅ [SSE] Connection OPENED` in console
- [ ] Did SSE fall back to polling? Look for `🔥 [SSE] Switching to polling`
- [ ] Check for 429 rate limiting on polling endpoint

### Store rehydration issues
- [ ] Clear localStorage: `localStorage.removeItem('ai-pandit-stream-store')`
- [ ] The store persists: `sessionId`, `isComplete`, `progress`, `candidateScores`, `stageStats`, `result`, `metadata`, `advancedSignals`, `decisions`, `stageHistory`, `analyzedCount`, `totalCandidates`, `allCandidates` (capped), `candidatesByStage` (capped), `startedAt`, `persistentCandidates`, `activeAIStage`, `displayedCandidate`
- [ ] Reasoning text is capped at 10KB per candidate in localStorage (full text lives in memory)
- [ ] SSE replay supplements persisted data with fresh chunks on reconnect

### SSE vs Polling
- SSE connects to `${BACKEND_URL}/api/stream/${sessionId}?token=...`
- Polling hits `${BACKEND_URL}/api/queue/progress?sessionId=${sid}`
- SSE timeout: 10 seconds, then auto-fallback to polling
- Polling interval: 5s (backs off to 60s on errors)

---

## Critical Rules for Future Changes

1. **Always clear store before requeue navigation** — Call `useStreamStore.getState().clearStore()` before `router.push` or `window.location.reload` when starting a new analysis for the same session.

2. **Store persistence is selective** — `allCandidates` and `candidatesByStage` are NOT persisted to localStorage. They are rebuilt from SSE replay on reconnection. Don't rely on them surviving page refresh.

3. **Terminal state handling** — SSE sends a `terminal_state` event for completed/failed/cancelled sessions. The backend closes the SSE connection 2s after terminal events. The frontend handler `terminalStateReceivedRef` prevents treating the subsequent `onerror` as an actual error.

4. **Metadata reset logic** — The store resets `aiThinking`, `stageHistory`, `candidateScores`, etc. when a `metadata` event with `pending`/`queued` status arrives AND the store already has `isComplete` or `error`. This is the "soft reset" path — but it may not fire if `initial_state` arrives before `metadata`.

5. **Buffer key format** — All candidate thinking uses composite keys: `s${stage}_${candidateTime}`. Never use just `candidateTime` as it causes cross-stage collisions.
