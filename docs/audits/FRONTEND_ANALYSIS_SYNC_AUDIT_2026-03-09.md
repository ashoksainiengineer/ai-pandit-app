# Frontend Analysis + Backend Sync Deep Audit

Date: 2026-03-09  
Scope: Analysis UX on `apps/web/app/rectify/[id]/page.tsx` + stream/poll sync with backend (`/api/stream`, `/api/queue/progress`)  
Mode: Audit-only (no production behavior changes in this pass)

## Executive Verdict

- Current analysis flow is **not fully robust** under all real runtime modes.
- Happy-path SSE works, but critical edge paths (especially completed-session re-open and polling-only completion) can produce broken UX.
- Frontend/backend contract is **partially misaligned** on terminal/completion payloads and error schema fields.

## What Was Verified

### Code Deep-Dive (line-level)
- Frontend:
  - `apps/web/app/rectify/[id]/page.tsx`
  - `apps/web/lib/use-stream-progress.ts`
  - `apps/web/lib/store/stream-store.ts`
  - `apps/web/components/rectify/analysis/*`
  - `apps/web/components/rectify/UnifiedAIPanel/*`
  - `apps/web/lib/api-client.ts`
- Backend:
  - `apps/api/src/routes/stream.ts`
  - `apps/api/src/routes/progress.ts`
  - `apps/api/src/routes/index.ts`
  - `apps/api/src/lib/session-events.ts`
  - `apps/api/src/lib/progress-tracker.ts`
  - `apps/api/src/lib/queue-manager.ts`

### Runtime/Test Verification
- Frontend targeted suites:
  - `npm run -w apps/web test -- --run __tests__/AnalysisPage.test.tsx __tests__/AnalysisStreaming.test.tsx lib/__tests__/use-stream-progress.test.ts lib/store/__tests__/stream-store.test.ts components/rectify/analysis/__tests__/StageLeaderboard.test.tsx components/rectify/analysis/__tests__/AnalysisStatusBanner.test.tsx components/rectify/analysis/__tests__/SimplifiedPipeline.test.tsx`
  - Result: pass (`69/69`) with test warnings from mocked motion/style attributes.
- Backend route+sync suites:
  - `npm run -w @ai-pandit/api test -- --run src/routes/__tests__/stream.test.ts src/routes/__tests__/progress.test.ts src/routes/__tests__/queue.test.ts src/lib/__tests__/session-events.test.ts src/lib/__tests__/progress-tracker.test.ts src/lib/__tests__/queue-manager.test.ts src/middleware/__tests__/auth.test.ts`
  - Result: pass (`120/120`) in socket-enabled runtime.

## Key Reliability Assessment

### Strong Areas
- SSE reconnect framework exists (Last-Event-ID support, replay buffer, polling fallback).
- Store model supports high-frequency `ai_thinking` chunk batching and candidate score merges.
- Core stream/progress route tests exist and pass in unrestricted runtime.

### Critical Weak Areas
- Completed-session hydration path is broken for SSE terminal-state-only flows.
- Polling completion path does not receive final result payload required by current analysis page UI.
- Error payload schema drift (`error` vs `message`) degrades user-visible diagnostics.

## Issue Register

- Full detailed list: `docs/audits/FRONTEND_ANALYSIS_SYNC_ISSUES_2026-03-09.md`
- Highest priority IDs: `FA-001`, `FA-002`, `FA-003`, `FA-004`, `FA-005`

## Recommended Fix Order

1. Align completion contract first (`FA-001`, `FA-002`).
2. Fix state integrity/error schema (`FA-003`, `FA-004`, `FA-008`).
3. Close security/logging exposure and auth overhead (`FA-005`, `FA-006`, `FA-007`, `FA-014`).
4. Patch runtime edge resilience and tests (`FA-009` to `FA-015`).

