# Subsystem Audit: BTR Engine

**Audit Date:** March 2026
**Status:** 🟡 Needs Improvement
**Health Score:** 7/10

---

## 📁 Files in This Subsystem

| File | Lines | Purpose |
|------|-------|---------|
| [`seconds-precision-btr.ts`](../../apps/api/src/lib/seconds-precision-btr.ts) | 345 | Main orchestrator |
| [`btr/orchestrator.ts`](../../apps/api/src/lib/btr/orchestrator.ts) | ~200 | Class wrapper |
| [`btr/stages/stage1-exhaustive-data.ts`](../../apps/api/src/lib/btr/stages/stage1-exhaustive-data.ts) | 157 | Stage 1: Generate candidates |
| [`btr/stages/stage2-batch-tournament.ts`](../../apps/api/src/lib/btr/stages/stage2-batch-tournament.ts) | 407 | Stage 2: AI tournament |
| [`btr/stages/stage3-refinement-grid.ts`](../../apps/api/src/lib/btr/stages/stage3-refinement-grid.ts) | ~200 | Stage 3: Refine grid |
| [`btr/stages/stage4-deep-analysis.ts`](../../apps/api/src/lib/btr/stages/stage4-deep-analysis.ts) | ~250 | Stage 4: Deep analysis |
| [`btr/stages/stage5-micro-grid.ts`](../../apps/api/src/lib/btr/stages/stage5-micro-grid.ts) | ~200 | Stage 5: Micro precision |
| [`btr/stages/stage6-final-precision.ts`](../../apps/api/src/lib/btr/stages/stage6-final-precision.ts) | ~200 | Stage 6: Final verdict |
| [`btr/data-package-builder.ts`](../../apps/api/src/lib/btr/data-package-builder.ts) | 630 | Data package builder |

**Total:** ~2,789 lines across 9 files

---

## 🔴 CRITICAL ISSUES

### 1. Global Lifecycle Calculation in Main File

**File:** `seconds-precision-btr.ts`
**Lines:** 107-142

**Issue:** Global lifecycle transit calculation is embedded in main orchestrator instead of being a separate module.

```typescript
// Current: Embedded in main file
const globalLifecycle: any[] = [];
try {
    const birthDate = new Date(input.dateOfBirth);
    // ... 35 lines of transit calculation
}
```

**Problems:**
- Hard to test in isolation
- Increases main file complexity
- No reusability

**Recommendation:**
```typescript
// Extract to separate module
import { calculateGlobalLifecycle } from './btr/global-lifecycle.js';

const globalLifecycle = await calculateGlobalLifecycle(input);
```

---

### 2. Stage Functions Have Inconsistent Error Handling

**Files:** `btr/stages/*.ts`

**Issue:** Some stages catch and swallow errors, others propagate.

**Example (Stage 1):**
```typescript
// No try-catch, errors propagate
export async function stage1ExhaustiveDataGeneration(...) {
    await progress.startStep('grid', '...');
    // If this fails, entire pipeline crashes
}
```

**Example (Main file):**
```typescript
// Global lifecycle errors are silently caught
try {
    // ... global lifecycle calculation
} catch (e) {
    logger.warn('Global lifecycle calculation failed', e);
    // Continues with empty array!
}
```

**Problems:**
- Inconsistent error behavior
- Silent failures can cause incorrect results
- Hard to debug

**Recommendation:**
1. Define clear error handling strategy per stage
2. Use Result type for recoverable errors
3. Add stage-specific error types

---

### 3. Magic Numbers Without Constants

**File:** `btr/stages/stage1-exhaustive-data.ts`
**Lines:** 46-56

```typescript
let boundaryScanMinutes = 360; // Default 6 hours - WHY 6?
// ...
const presetMap: Record<string, number> = {
    '30min': 30, '1hour': 60, '2hours': 120, '4hours': 240, '6hours': 360, '12hours': 720,
    'seconds-30': 5, 'seconds-6': 1  // WHY 5 and 1?
};
```

**Problems:**
- No explanation for values
- Hard to adjust globally
- Business logic unclear

**Recommendation:**
```typescript
// Define in constants file
export const BOUNDARY_SCAN_DEFAULTS = {
    DEFAULT_MINUTES: 360, // 6 hours - covers most Ascendant sign changes
    MIN_PRECISION_SECONDS: 6, // KP sub-sub-sub lord precision
    PRESETS: {
        '30min': 30,
        // ...
    }
} as const;
```

---

## 🟠 HIGH PRIORITY ISSUES

### 4. No Dependency Injection

**File:** All stage files

**Issue:** Direct imports make testing impossible without mocking entire modules.

```typescript
// Current: Tight coupling
import { callAIWithStream } from '../../ai-client.js';
import { buildCandidateDataPackage } from '../data-package-builder.js';
```

**Problems:**
- Cannot unit test stages
- Must use real AI API in tests
- No mock implementations

**Recommendation:**
```typescript
// Define interfaces
interface StageDependencies {
    aiClient: AIClientInterface;
    dataBuilder: DataBuilderInterface;
    progressTracker: ProgressTrackerInterface;
}

// Inject via factory
export function createStage2(deps: StageDependencies) {
    return async (input, candidates, ...) => {
        // Use deps.aiClient instead of direct import
    };
}
```

---

### 5. Data Package Builder is Too Large

**File:** `btr/data-package-builder.ts`
**Lines:** 630

**Issue:** Single file handles too many responsibilities:
- Ephemeris loading
- Dasha building
- Planet enrichment
- Varga data
- Spouse matching
- Special points
- Sandhi detection

**Problems:**
- Hard to maintain
- Changes affect multiple concerns
- Complex testing

**Recommendation:**
Split into modules:
```
btr/data-package/
├── index.ts           # Main builder
├── ephemeris-loader.ts
├── dasha-builder.ts
├── planet-enricher.ts
├── varga-builder.ts
├── spouse-matcher.ts
└── special-points.ts
```

---

### 6. No Parallelization in Stage 1

**File:** `btr/stages/stage1-exhaustive-data.ts`
**Lines:** 97-131

**Issue:** Batch processing exists but with small batch size (20).

```typescript
const BATCH_LOG_SIZE = 20;
for (let i = 0; i < finalCandidates.length; i += BATCH_LOG_SIZE) {
    const batch = finalCandidates.slice(i, i + BATCH_LOG_SIZE);
    await Promise.all(batch.map(async (raw) => {
        // Process
    }));
}
```

**Problems:**
- Could be more aggressive with parallelism
- Sleep(20) between batches adds latency
- 500 candidates × 20ms = 10 seconds of just sleeping

**Recommendation:**
1. Increase batch size based on CPU cores
2. Use `p-limit` for controlled concurrency
3. Remove sleep, rely on event loop naturally

---

## 🟡 MEDIUM PRIORITY ISSUES

### 7. Type: `any` in Global Lifecycle

**File:** `seconds-precision-btr.ts`
**Line:** 108

```typescript
const globalLifecycle: any[] = [];
```

**Recommendation:** Define proper type:
```typescript
interface GlobalLifecycleEvent {
    date: string;
    event: string;
    dasha: string;
}
const globalLifecycle: GlobalLifecycleEvent[] = [];
```

---

### 8. Hardcoded Sleep Durations

**Files:** Multiple

```typescript
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
// ...
await sleep(20);  // Why 20?
await sleep(100); // Why 100?
```

**Recommendation:** Define constants with explanations:
```typescript
const GC_BREATHING_ROOM_MS = 20; // Allow V8 to cleanup WASM buffers
const EVENT_LOOP_YIELD_MS = 100; // Prevent event loop starvation
```

---

### 9. No Cancellation Propagation in Stages

**Issue:** `throwIfCancelled` is called at stage boundaries but not within long-running operations.

**Recommendation:** Add cancellation checks:
```typescript
// In tight loops
for (const candidate of candidates) {
    throwIfCancelled(sessionId); // Check every iteration
    await processCandidate(candidate);
}
```

---

## 🟢 LOW PRIORITY ISSUES

### 10. Inconsistent Logging Format

**Issue:** Some logs use emoji prefixes, some don't.

```typescript
logger.info('🔱 Stage 1: Initializing metadata...');
logger.info('[PIPELINE] Entering Stage 1...');
```

**Recommendation:** Standardize format with structured fields:
```typescript
logger.info('Stage started', { stage: 1, name: 'Exhaustive Data', candidates: 500 });
```

---

### 11. No Performance Metrics Collection

**Issue:** No timing metrics for individual stages.

**Recommendation:**
```typescript
const stageStart = Date.now();
// ... stage processing
const stageDuration = Date.now() - stageStart;
emitStageMetrics(sessionId, stage, stageDuration, candidatesProcessed);
```

---

## 📊 Test Coverage Analysis

| File | Coverage | Missing Tests |
|------|----------|---------------|
| seconds-precision-btr.ts | ~40% | Error paths, cancellation, lifecycle |
| stage1-exhaustive-data.ts | ~50% | Boundary detection, safety net |
| stage2-batch-tournament.ts | ~45% | AI failure fallback, multi-round |
| data-package-builder.ts | ~55% | Spouse match, special points |

**Target:** 80% coverage

---

## 🔧 Recommended Actions

### Immediate (Week 1)
- [ ] Extract global lifecycle to separate module
- [ ] Add proper types for `any` usages
- [ ] Define constants for magic numbers

### Short-term (Month 1)
- [ ] Implement dependency injection pattern
- [ ] Split data-package-builder.ts
- [ ] Add cancellation checks in loops

### Long-term (Quarter 1)
- [ ] Increase test coverage to 80%
- [ ] Add performance metrics
- [ ] Implement stage-level error boundaries

---

## 📈 Comparison with Industry Standards

| Aspect | Our Code | Industry Best | Gap |
|--------|----------|---------------|-----|
| Modularity | 7/10 | 9/10 | Need DI |
| Testability | 4/10 | 9/10 | Major gap |
| Error Handling | 6/10 | 9/10 | Inconsistent |
| Documentation | 7/10 | 9/10 | Minor |
| Performance | 8/10 | 9/10 | Minor |

---

*Next Review: April 2026*
