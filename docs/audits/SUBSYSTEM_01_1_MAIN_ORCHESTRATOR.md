# Subsystem Audit: 1.1 Main BTR Orchestrator

## 📋 Metadata

| Property | Value |
|----------|-------|
| **Subsystem** | Main BTR Orchestrator |
| **Category** | Core BTR Engine |
| **Files** | 3 |
| **Total Lines** | ~1,100 |
| **Last Audited** | March 2026 |
| **Status** | ✅ Production Ready |

---

## 📁 Files in this Subsystem

| File | Lines | Purpose |
|------|-------|---------|
| [`seconds-precision-btr.ts`](../../apps/api/src/lib/seconds-precision-btr.ts) | 345 | Main 6-stage BTR pipeline orchestration |
| [`btr/orchestrator.ts`](../../apps/api/src/lib/btr/orchestrator.ts) | 467 | Professional BTR class wrapper |
| [`btr/index.ts`](../../apps/api/src/lib/btr/index.ts) | 122 | Public API exports |

---

## 🎯 Purpose

The Main BTR Orchestrator is the **heart of the Birth Time Rectification system**. It:

1. **Coordinates the 6-stage pipeline** - Manages flow between all stages
2. **Handles global lifecycle calculations** - Pre-calculates Saturn/Jupiter transits
3. **Manages progress tracking** - Real-time ETA and step updates
4. **Provides cancellation support** - AbortController integration
5. **Exports unified API** - Single entry point for BTR operations

---

## 🔄 6-Stage Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     processSecondsPrecisionBTR()                            │
│                                                                             │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│  │ Stage 1 │ → │ Stage 2 │ → │ Stage 3 │ → │ Stage 4 │ → │ Stage 5 │ → │ Stage 6 │
│  │Generate │   │Tournament│   │ Refine  │   │  Deep   │   │  Micro  │   │  Final  │
│  └────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘
│       │             │             │             │             │             │
│     500 cands    50 surv      20 cands     10 cands      5 cands      1 result
│       ↓             ↓             ↓             ↓             ↓             ↓
│   Ephemeris     AI Batch      ±5 min       Multi-Dasha   ±30 sec      KP Sub-Lord
│   Calculate     Evaluate      Grid         Analysis      Grid         Consensus
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Key Functions

### `processSecondsPrecisionBTR()` - Main Entry Point

**Location:** [`seconds-precision-btr.ts:96`](../../apps/api/src/lib/seconds-precision-btr.ts:96)

```typescript
export async function processSecondsPrecisionBTR(
    input: SecondsPrecisionInput
): Promise<SecondsPrecisionResult>
```

**Input Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `sessionId` | string | Unique session identifier |
| `dateOfBirth` | string | Birth date (YYYY-MM-DD) |
| `tentativeTime` | string | Approximate birth time |
| `latitude` | number | Birth latitude |
| `longitude` | number | Birth longitude |
| `timezone` | string | Timezone identifier |
| `lifeEvents` | BtrEvent[] | Life events for correlation |
| `forensicTraits` | ForensicProfile | Personality/physical traits |
| `abortSignal` | AbortSignal | Cancellation support |

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| `rectifiedTime` | string | Final rectified birth time |
| `confidence` | number | Confidence score (0-100) |
| `stageHistory` | Record | Results from each stage |
| `finalVerdict` | FinalVerdict | Detailed analysis results |

---

### `rectifyBirthTime()` - Professional BTR

**Location:** [`btr/orchestrator.ts:63`](../../apps/api/src/lib/btr/orchestrator.ts:63)

```typescript
export async function rectifyBirthTime(
    input: RectificationInput
): Promise<DetailedResult>
```

**Additional Features:**
- Tatwa Shuddhi integration for morning births
- Prakriti-based time narrowing
- Event scoring with confidence weights
- Transit analysis integration

---

## 📊 Global Lifecycle Calculation

The orchestrator pre-calculates planetary transits for the entire life span:

```typescript
// From seconds-precision-btr.ts:107-142
const globalLifecycle: any[] = [];
const birthDate = new Date(input.dateOfBirth);
const startYear = birthDate.getFullYear();
const endYear = new Date().getFullYear();

for (let y = startYear; y <= endYear; y++) {
    for (let m of [1, 5, 9]) { // Check Jan, May, Sep
        // Calculate Saturn/Jupiter sign changes
        // Map to Vimshottari Dasha periods
    }
}
```

**Purpose:** Provides transit context for AI analysis in later stages.

---

## 🔗 Dependencies

### Internal Dependencies
```
seconds-precision-btr.ts
├── ephemeris.js (planetary calculations)
├── vedic-astrology-engine.js (Dasha calculations)
├── advanced-btr-methods.js (Divisional charts)
├── ai-client.js (DeepSeek API)
├── time-offset-manager.js (Candidate generation)
├── progress-tracker.js (Real-time progress)
├── cancellation-manager.js (Abort support)
├── session-events.js (SSE emissions)
├── btr/prompts/index.js (AI prompts)
├── btr/extractors/index.js (Response parsing)
├── btr/data-package-builder.js (Data packaging)
└── btr/stages/index.js (Stage implementations)
```

### External Dependencies
- `@ai-pandit/shared` - Type definitions and schemas

---

## 📈 Progress Tracking Integration

```typescript
const progress = new ProgressTracker(input.sessionId);

// Update ETA
await progress.updateETA(600); // 10 minutes

// Start step
await progress.startStep('init', 'Initializing Professional BTR v7.0...');

// Flush updates
await progress.flush("Stage 2 finalized. Expanding research grid...");

// Emit stage stats
emitStageStats(input.sessionId, 1, candidates.length, "Generated 500 candidates");
```

---

## 🛡️ Cancellation Support

Every stage checks for cancellation:

```typescript
await throwIfCancelled(input.sessionId, input.abortSignal);
```

If cancelled:
- Throws `CancellationError`
- Pipeline stops immediately
- Resources cleaned up via `finally` block

---

## 📤 Public API Exports

From [`btr/index.ts`](../../apps/api/src/lib/btr/index.ts):

### Classes
```typescript
export { ProfessionalBTR } from './orchestrator.js';
export { WindowScanner } from './window-scanner.js';
export { TatwaShuddhi } from './tatwa-shuddhi.js';
export { TransitAnalyzer } from './transit-analyzer.js';
export { EventScorer } from './event-scorer.js';
export { Kalachakra } from '../kalachakra-dasha.js';
export { Shadbala } from '../shadbala.js';
export { NadiAmsha } from '../nadi-amsha.js';
export { SpouseD9Verification } from '../spouse-d9-verification.js';
```

### Functions
```typescript
export { buildCandidateDataPackage } from './data-package-builder.js';
export { buildVimshottariDasha, buildYoginiDasha, buildCharaDasha } from './dasha-builder.js';
export { buildTransitData } from './transit-builder.js';
```

### Types
```typescript
export type { 
    RectificationInput, 
    DetailedResult,
    ScannerInput,
    CandidateAnalysis,
    TatwaCorrectionResult,
    ComprehensiveTransitResult,
    ScoredEvent,
    // ... many more
} from '@ai-pandit/shared';
```

---

## ⚠️ Critical Considerations

### 1. Memory Usage
- Each candidate requires ephemeris calculation
- 500 candidates × ~2KB each = ~1MB per session
- Monitor with `memory-manager.ts`

### 2. AI Rate Limits
- Stage 2/4 make multiple AI calls
- Uses `executeAIInParallel()` for batching
- 5-minute timeout per call

### 3. Error Handling
- All errors logged with session context
- Partial results preserved in `stageHistory`
- Graceful degradation on AI failures

### 4. Performance
- Typical session: 8-15 minutes
- ETA updates every 30 seconds
- Progress flushed after each stage

---

## 🧪 Test Coverage

| Area | Coverage | Notes |
|------|----------|-------|
| Pipeline Flow | ~70% | Integration tests cover full flow |
| Cancellation | ~80% | Unit tests for abort scenarios |
| Progress Tracking | ~60% | Mock-based tests |
| Error Handling | ~75% | Edge cases covered |

---

## 📝 Improvement Recommendations

### High Priority
1. **Add circuit breaker** for AI calls in orchestrator
2. **Implement retry logic** with exponential backoff
3. **Add telemetry** for performance monitoring

### Medium Priority
1. **Cache ephemeris calculations** for repeated dates
2. **Parallelize stage 1** candidate generation
3. **Add validation** for input parameters

### Low Priority
1. **Add debug mode** with verbose logging
2. **Create visualization** of pipeline flow
3. **Document edge cases** in code comments

---

## 📚 Related Documentation

- [SUBSYSTEM_01_BTR_ENGINE.md](./SUBSYSTEM_01_BTR_ENGINE.md) - Parent overview
- [SUBSYSTEM_01_2_PIPELINE_STAGES.md](./SUBSYSTEM_01_2_PIPELINE_STAGES.md) - Stage implementations
- [SUBSYSTEM_01_3_SUPPORT_MODULES.md](./SUBSYSTEM_01_3_SUPPORT_MODULES.md) - Support utilities

---

*Last Updated: March 2026*
