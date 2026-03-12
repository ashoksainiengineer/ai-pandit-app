# AI-Pandit Codebase Analysis & Test Fix Plan

## Executive Summary

This document provides a deep analysis of the AI-Pandit codebase architecture and identifies the root causes of failing tests along with concrete fix strategies.

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│   Express API    │────▶│  Python/SKyfield │
│   (apps/web)    │     │   (apps/api)     │     │  (services/ephemeris)
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │   Worker Runtime │
                        │  (apps/worker)   │
                        └──────────────────┘
```

### 1.2 Key Architectural Components

#### A. Ephemeris System (Skyfield-First)
- **File**: `apps/api/src/lib/ephemeris.ts`
- **Default Provider**: `algorithmic` (configurable via `EPHEMERIS_PROVIDER`)
- **Available Providers**: `skyfield`, `algorithmic`
- **Execution Modes**: `skyfield`, `algorithmic`, `algorithmic-fallback`
- **Key Feature**: 24-hour TTL cache for immutable ephemeris data

#### B. BTR 6-Stage Pipeline
- **Main File**: `apps/api/src/lib/seconds-precision-btr.ts`
- **Stage Files**: `apps/api/src/lib/btr/stages/stage[1-6]-*.ts`

Stages:
1. **Stage 1**: Exhaustive Data Generation
2. **Stage 2**: Batch Tournament (AI-powered)
3. **Stage 3**: Refinement Grid
4. **Stage 4**: Deep Multi-Dasha Analysis
5. **Stage 5**: Micro Precision Grid
6. **Stage 6**: Final Precision

#### C. Session Events System (SSE)
- **File**: `apps/api/src/lib/session-events.ts`
- **Key Feature**: 200ms batching window for AI thinking chunks and candidate scores
- **Buffers**:
  - Thinking buffers: Accumulate AI reasoning per candidate
  - Score buffers: Store candidate scores (50,000 limit with overwrite)
  - Event logs: Last-Event-ID protocol support (2000 max)

#### D. VSL (Vedic Shorthand Language) Formatter
- **File**: `apps/api/src/lib/btr/prompts/vsl-formatter.ts`
- **Purpose**: Compact information-dense format for AI prompts
- **Features**: DMS degree formatting, KP sub-lords, transit analysis

---

## 2. Test Failures - Root Cause Analysis

### 2.1 CRITICAL: Missing Security Guard File

**Test**: `src/lib/btr/security/__tests__/prompt-injection.test.ts`
**Error**: `Failed to load url ../security-guard.js`

**Status**: ❌ File exists as `.ts` but test imports `.js`

**Root Cause**: Test imports `../../security-guard.js` but actual file is `security-guard.ts`

**Fix Strategy**:
- Option A: Update test import to `.ts`
- Option B: Add `security-guard.js` that re-exports from `.ts`

### 2.2 HIGH: Session Events Timer Mismatch

**Tests**: 
- `session-events.test.ts` > `emitAIThinking`
- `session-events.test.ts` > `emitCandidateScore`

**Error**: `expected +0 to be 1` (listener count)

**Root Cause**:
```typescript
// Test uses fake timers
vi.useFakeTimers();
vi.advanceTimersByTime(200);

// But implementation uses real setInterval
private startBroadcastLoop(sessionId: string): void {
    const interval = setInterval(() => {
        this.flushBroadcastBuffers(sessionId);
    }, 200);
}
```

**Fix Strategy**:
Option A (Recommended): Expose synchronous flush method for tests
```typescript
// Add to SessionEventManager
flushNow(sessionId: string): void {
    this.flushBroadcastBuffers(sessionId);
}
```

Option B: Use real timers with async/await in tests

### 2.3 HIGH: Frontend Realtime Sync Event Count

**Test**: `frontend_realtime_sync.test.ts`
**Error**: `expected 1 to be 4` (event count)

**Expected Flow**:
1. `emitProgress` → immediate emission
2. `emitAIThinking` (x2) → batched after 200ms
3. `emitCandidateScore` → batched after 200ms

**Actual**: Only progress event emitted, batching events not flushed

**Root Cause**: Test waits 300ms but broadcast loop might not be started

**Fix Strategy**:
- Ensure `startBroadcastLoop()` is called before batching
- Or increase test delay to account for batching window + processing time

### 2.4 HIGH: AI Prompts undefined Leak

**Test**: `ai-prompts.test.ts`
**Error**: `Final Prompt contains leak: undefined`

**Root Cause**: Missing null checks in VSL formatter

**Location**: `apps/api/src/lib/btr/prompts/vsl-formatter.ts`

**Issues Found**:
1. Line 253: `lords.subSubSubLord || '~'` - subSubSubLord might be undefined
2. Line 267: `data.subSubLord` - might be undefined
3. Planet data might have undefined fields

**Fix Strategy**:
Add null-safe accessors:
```typescript
// Before
${getPlan(lords.subSubSubLord || '~')}

// After  
${getPlan(lords.subSubSubLord ?? '~')}
```

### 2.5 MEDIUM: Data Package Snapshot Mismatch

**Test**: `data-package.test.ts`
**Error**: Snapshot mismatch

**Root Cause**: Schema changes over time

**Fix Strategy**: Update snapshots with `npm test -- --update`

### 2.6 MEDIUM: Contract Validation Test

**Test**: `contract_validation.test.ts`
**Error**: `expected false to be true`

**Status**: Need to examine specific assertion

---

## 3. Fix Implementation Plan

### Phase 1: Critical Fixes (1-2 hours)

1. **Fix security guard import**
   - File: `apps/api/src/lib/btr/security/__tests__/prompt-injection.test.ts`
   - Change: `import { SecurityGuard } from '../../security-guard.js'` → `'../../security-guard.ts'`

2. **Add flush method to SessionEventManager**
   - File: `apps/api/src/lib/session-events.ts`
   - Add: `flushNow(sessionId: string)` method

3. **Fix test timer issues**
   - File: `apps/api/src/lib/__tests__/session-events.test.ts`
   - Change: Call `sessionEvents.flushNow(SESSION_ID)` before assertions

### Phase 2: Prompt Undefined Leaks (1-2 hours)

1. **Audit VSL formatter for undefined access**
   - File: `apps/api/src/lib/btr/prompts/vsl-formatter.ts`
   - Add null-safe accessors for all planet/lord lookups

2. **Add data validation in data-package-builder**
   - File: `apps/api/src/lib/btr/data-package-builder.ts`
   - Ensure all required fields are populated before returning package

### Phase 3: Frontend Sync Fixes (1 hour)

1. **Fix event count test**
   - File: `apps/api/src/lib/__tests__/frontend_realtime_sync.test.ts`
   - Ensure broadcast loop starts or increase delay

### Phase 4: Snapshot Updates (30 min)

1. Update data package snapshots
2. Verify no regressions

---

## 4. Key Files for Implementation

| Purpose | File Path |
|---------|-----------|
| Session Events | `apps/api/src/lib/session-events.ts` |
| BTR Pipeline | `apps/api/src/lib/seconds-precision-btr.ts` |
| Data Package Builder | `apps/api/src/lib/btr/data-package-builder.ts` |
| VSL Formatter | `apps/api/src/lib/btr/prompts/vsl-formatter.ts` |
| Ephemeris Provider | `apps/api/src/lib/ephemeris.ts` |
| Security Guard | `apps/api/src/lib/btr/security-guard.ts` |
| Test - Session Events | `apps/api/src/lib/__tests__/session-events.test.ts` |
| Test - AI Prompts | `apps/api/src/lib/btr/__tests__/ai-prompts.test.ts` |
| Test - Frontend Sync | `apps/api/src/lib/__tests__/frontend_realtime_sync.test.ts` |

---

## 5. Testing Strategy

After fixes:
1. Run individual failing tests
2. Run full API test suite
3. Verify no regressions in working tests
4. Update documentation if API changes

---

## 6. Recommendation

**Switch to Code Mode** to implement these fixes. All issues are concrete and fixable with targeted code changes. Estimated time: 4-6 hours for all fixes and verification.
