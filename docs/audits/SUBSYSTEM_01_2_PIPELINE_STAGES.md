# Subsystem Audit: 1.2 BTR Pipeline Stages

## 📋 Metadata

| Property | Value |
|----------|-------|
| **Subsystem** | BTR Pipeline Stages |
| **Category** | Core BTR Engine |
| **Files** | 8 |
| **Total Lines** | ~63,000 |
| **Last Audited** | March 2026 |
| **Status** | ✅ Production Ready |

---

## 📁 Files in this Subsystem

| File | Lines | Purpose |
|------|-------|---------|
| [`stages/index.ts`](../../apps/api/src/lib/btr/stages/index.ts) | 15 | Stage exports |
| [`stages/stage1-exhaustive-data.ts`](../../apps/api/src/lib/btr/stages/stage1-exhaustive-data.ts) | 157 | Generate all candidates |
| [`stages/stage2-batch-tournament.ts`](../../apps/api/src/lib/btr/stages/stage2-batch-tournament.ts) | 407 | AI batch elimination |
| [`stages/stage3-refinement-grid.ts`](../../apps/api/src/lib/btr/stages/stage3-refinement-grid.ts) | 100 | ±5 min grid refinement |
| [`stages/stage4-deep-analysis.ts`](../../apps/api/src/lib/btr/stages/stage4-deep-analysis.ts) | 367 | Multi-dasha deep analysis |
| [`stages/stage5-micro-grid.ts`](../../apps/api/src/lib/btr/stages/stage5-micro-grid.ts) | 71 | ±30 sec micro grid |
| [`stages/stage6-final-precision.ts`](../../apps/api/src/lib/btr/stages/stage6-final-precision.ts) | 502 | KP Sub-Lord + Consensus |
| [`stages/_utils.ts`](../../apps/api/src/lib/btr/stages/_utils.ts) | 35 | Shared utilities |

---

## 🔄 Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           6-STAGE BTR TOURNAMENT PIPELINE                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  Stage 1          Stage 2          Stage 3          Stage 4          Stage 5          Stage 6
│  ┌────────┐      ┌────────┐      ┌────────┐      ┌────────┐      ┌────────┐      ┌────────┐
│  │Generate│  →   │Tournament│  →   │ Refine │  →   │  Deep  │  →   │  Micro │  →   │  Final │
│  │  500   │      │  → 50   │      │  → 20  │      │  → 10  │      │  → 5   │      │  → 1   │
│  └────────┘      └────────┘      └────────┘      └────────┘      └────────┘      └────────┘
│      │               │               │               │               │               │
│      ▼               ▼               ▼               ▼               ▼               ▼
│  Ephemeris       AI Batch        ±5 min         Multi-Dasha      ±30 sec        KP Sub-Lord
│  Calculate       Evaluate        Grid           Analysis         Grid           Consensus
│                                                                                     │
│  Time: ~2min     Time: ~5min     Time: ~2min    Time: ~3min     Time: ~1min    Time: ~2min
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Stage Details

### Stage 1: Exhaustive Data Generation

**File:** [`stage1-exhaustive-data.ts`](../../apps/api/src/lib/btr/stages/stage1-exhaustive-data.ts)

**Purpose:** Generate all candidate birth times with ephemeris calculations

**Input → Output:**
```
Input:  tentativeTime, offsetConfig
Output: 100-500 candidates with full metadata
```

**Key Functions:**
```typescript
export async function stage1ExhaustiveDataGeneration(
  input: SecondsPrecisionInput,
  progress: ProgressTracker
): Promise<{ candidates: CandidateTime[]; stageResult: StageResult }>
```

**Features:**
- 🎯 **Safety Net Injection** - Always includes candidates around tentative time
- 🔱 **Mahakala Boundary Lock** - Injects candidates at divisional boundaries
- 📦 **Batch Processing** - Processes 20 candidates at a time
- 🧹 **Ephemeris Cleanup** - Properly cleans up WASM resources

**Boundary Types Detected:**
- Rising/Setting boundaries
- Sign changes (Rashi transitions)
- Nakshatra changes
- Dasha transitions

---

### Stage 2: Batch Tournament

**File:** [`stage2-batch-tournament.ts`](../../apps/api/src/lib/btr/stages/stage2-batch-tournament.ts)

**Purpose:** AI-powered batch elimination to reduce candidate pool

**Input → Output:**
```
Input:  100-500 candidates
Output: 20-50 survivors
```

**Key Functions:**
```typescript
export async function stage2BatchTournament(
    input: SecondsPrecisionInput,
    candidates: CandidateTime[],
    progress: ProgressTracker,
    forensicTraits: ForensicTraits,
    globalLifecycle: any[]
): Promise<{ survivors: CandidateTime[]; stageResult: StageResult; rounds: TournamentRound[] }>
```

**Dynamic Sizing:**
| Offset | Batch Size | Survivors/Batch |
|--------|------------|-----------------|
| 30 min | 10 | 3 |
| 1 hour | 12 | 3 |
| 2 hours | 15 | 4 |
| 4 hours | 18 | 5 |
| 6 hours | 20 | 5 |
| 12 hours | 25 | 6 |

**AI Integration:**
- Uses `callAIWithStream()` for real-time reasoning
- Parallel batch processing with `executeAIInParallel()`
- Emits candidate scores via SSE

**Safety Mechanisms:**
- Top-k preservation (always keeps best k candidates)
- Score-based fallback if AI fails
- Minimum survivor guarantee

---

### Stage 3: Refinement Grid

**File:** [`stage3-refinement-grid.ts`](../../apps/api/src/lib/btr/stages/stage3-refinement-grid.ts)

**Purpose:** Create ±5 minute grid around survivors for fine-tuning

**Input → Output:**
```
Input:  20-50 survivors
Output: 10-20 refined candidates
```

**Grid Configuration:**
```
For each survivor:
  ├── -5 min → -4 min → -3 min → -2 min → -1 min
  ├── 0 (original)
  └── +1 min → +2 min → +3 min → +4 min → +5 min
  
Total: 11 points per survivor
```

**Key Functions:**
```typescript
export async function stage3RefinementGrid(
    input: SecondsPrecisionInput,
    survivors: CandidateTime[],
    progress: ProgressTracker
): Promise<{ candidates: CandidateTime[]; stageResult: StageResult }>
```

---

### Stage 4: Deep Analysis

**File:** [`stage4-deep-analysis.ts`](../../apps/api/src/lib/btr/stages/stage4-deep-analysis.ts)

**Purpose:** Multi-dasha deep analysis with AI verification

**Input → Output:**
```
Input:  10-20 candidates
Output: 5-10 deep survivors
```

**Analysis Methods:**
1. **Vimshottari Dasha** (5-level: Maha → Antar → Pratyantar → Sukshma → Prana)
2. **Yogini Dasha** (8-year cycles)
3. **Chara Dasha** (Jaimini)
4. **Kalachakra Dasha** (Nakshatra-based)
5. **Divisional Charts** (D1, D9, D10, D12)

**Key Functions:**
```typescript
export async function stage4DeepAnalysis(
    input: SecondsPrecisionInput,
    candidates: CandidateTime[],
    progress: ProgressTracker,
    forensicTraits: ForensicTraits,
    globalLifecycle: any[]
): Promise<{ survivors: CandidateTime[]; stageResult: StageResult }>
```

**AI Prompt Features:**
- Full forensic context
- Life event correlation
- Multi-chart verification
- Confidence scoring

---

### Stage 5: Micro Grid

**File:** [`stage5-micro-grid.ts`](../../apps/api/src/lib/btr/stages/stage5-micro-grid.ts)

**Purpose:** ±30 second grid at 6-second intervals

**Input → Output:**
```
Input:  5-10 candidates
Output: 3-5 micro-candidates
```

**Grid Configuration:**
```
For each candidate:
  ├── -30s → -24s → -18s → -12s → -6s
  ├── 0 (original)
  └── +6s → +12s → +18s → +24s → +30s
  
Total: 11 points per candidate
Interval: 6 seconds (1/10th of a minute)
```

**Why 6 seconds?**
- Traditional Vedic astrology uses 6-second breath cycles
- Corresponds to 1/10th of a minute precision
- Aligns with Prana Dasha subdivisions

---

### Stage 6: Final Precision

**File:** [`stage6-final-precision.ts`](../../apps/api/src/lib/btr/stages/stage6-final-precision.ts)

**Purpose:** KP Sub-Lord analysis + Consensus scoring for final verdict

**Input → Output:**
```
Input:  3-5 candidates
Output: 1 final rectified time
```

**Consensus Methods:**
| Method | Weight | Description |
|--------|--------|-------------|
| Vimshottari | 25% | 5-level Dasha match |
| KP Sub-Lord | 20% | 4-level subdivision |
| Varga | 15% | Divisional chart correlation |
| Transit | 15% | Gochar (current transit) |
| Forensic | 15% | Personality/physical traits |
| Event | 10% | Life event timing |

**Key Functions:**
```typescript
export async function stage6FinalPrecision(
    input: SecondsPrecisionInput,
    candidates: CandidateTime[],
    progress: ProgressTracker,
    forensicTraits: ForensicTraits,
    globalLifecycle: any[]
): Promise<{ finalVerdict: FinalVerdict; stageResult: StageResult }>
```

**Final Verdict Structure:**
```typescript
interface FinalVerdict {
  rectifiedTime: string;        // HH:MM:SS
  confidence: number;           // 0-100
  methodScores: MethodScores;   // Per-method breakdown
  consensusLevel: 'high' | 'medium' | 'low';
  topCandidates: CandidateScore[];
  reasoning: string;            // AI explanation
}
```

---

## 🔗 Inter-Stage Communication

### Progress Updates
```typescript
// Each stage reports progress
await progress.startStep('coarse', 'Stage 2: Batch Tournament...');
await progress.updateMessage('Processing batch 3/10...');
await progress.flush("Stage 2 complete");
```

### SSE Events
```typescript
// Real-time updates to frontend
emitCandidateScore(sessionId, candidate);
emitAIContext(sessionId, { stage: 2, context: reasoning });
emitStageStats(sessionId, stageNum, candidatesOut, message);
```

### Cancellation Checks
```typescript
// Each stage checks for cancellation
await throwIfCancelled(input.sessionId, input.abortSignal);
```

---

## 📊 Performance Characteristics

| Stage | Avg Time | Memory | AI Calls |
|-------|----------|--------|----------|
| 1 | 1-2 min | ~50MB | 0 |
| 2 | 3-5 min | ~100MB | 5-15 |
| 3 | 1-2 min | ~30MB | 0 |
| 4 | 2-4 min | ~80MB | 3-8 |
| 5 | 30-60s | ~20MB | 0 |
| 6 | 1-2 min | ~40MB | 1-3 |
| **Total** | **8-15 min** | **~300MB** | **9-26** |

---

## ⚠️ Critical Considerations

### 1. Memory Management
- Stage 2 creates most objects (batch data packages)
- Cleanup ephemeris WASM after each stage
- Monitor heap with `memory-manager.ts`

### 2. AI Rate Limits
- Stage 2/4/6 make AI calls
- Use `executeAIInParallel()` for batching
- Implement backoff on 429 errors

### 3. Candidate Preservation
- Never eliminate all candidates
- Always preserve top-k as safety net
- Inject boundary candidates in Stage 1

### 4. Error Recovery
- Log stage results even on failure
- Partial results saved to `stageHistory`
- Graceful degradation to next stage

---

## 🧪 Test Coverage

| Stage | Unit Tests | Integration | Coverage |
|-------|------------|-------------|----------|
| Stage 1 | ✅ | ✅ | ~75% |
| Stage 2 | ✅ | ✅ | ~70% |
| Stage 3 | ✅ | ❌ | ~65% |
| Stage 4 | ✅ | ✅ | ~70% |
| Stage 5 | ✅ | ❌ | ~60% |
| Stage 6 | ✅ | ✅ | ~75% |

---

## 📝 Improvement Recommendations

### High Priority
1. **Add stage timeouts** - Prevent runaway processing
2. **Implement stage caching** - Resume from failed stage
3. **Add telemetry** - Track stage performance metrics

### Medium Priority
1. **Parallelize Stage 1** - Generate candidates in parallel
2. **Optimize Stage 2** - Reduce AI calls with smarter batching
3. **Add Stage 3b** - Optional intermediate refinement

### Low Priority
1. **Stage visualization** - Debug UI for stage flow
2. **A/B testing** - Compare different stage configurations
3. **Stage profiling** - Detailed performance breakdown

---

## 📚 Related Documentation

- [SUBSYSTEM_01_BTR_ENGINE.md](./SUBSYSTEM_01_BTR_ENGINE.md) - Parent overview
- [SUBSYSTEM_01_1_MAIN_ORCHESTRATOR.md](./SUBSYSTEM_01_1_MAIN_ORCHESTRATOR.md) - Main orchestrator
- [SUBSYSTEM_01_4_AI_PROMPT_SYSTEM.md](./SUBSYSTEM_01_4_AI_PROMPT_SYSTEM.md) - AI prompts used in stages

---

*Last Updated: March 2026*
