# TypeScript Errors Fix List - API Package

## Current Status: 25 Errors Remaining

---

## BATCH 1: Shared Package Exports (7 errors)
**Priority: HIGH** - These types need to be exported from `@ai-pandit/shared`

### Files to Modify: `packages/shared/src/btr-types.ts`

| Error | File | Line | Issue | Fix |
|-------|------|------|-------|-----|
| TS2724 | orchestrator.ts | 23 | `_MethodScores` not exported | Add `export type _MethodScores = MethodScores;` |
| TS2724 | orchestrator.ts | 28 | `_DoshaType` not exported | Add `export type _DoshaType = DoshaType;` |
| TS2724 | orchestrator.ts | 30 | `_DEFAULT_SCAN_CONFIG` not exported | Add `export const _DEFAULT_SCAN_CONFIG = DEFAULT_SCAN_CONFIG;` |
| TS2724 | seconds-precision-btr.ts | 71 | `_CandidateDataPackage` not exported | Add `export type _CandidateDataPackage = CandidateDataPackage;` |
| TS2724 | seconds-precision-btr.ts | 73 | `_TournamentRound` not exported | Add `export type _TournamentRound = TournamentRound;` |
| TS2724 | seconds-precision-btr.ts | 74 | `_FinalVerdict` not exported | Add `export type _FinalVerdict = FinalVerdict;` |

---

## BATCH 2: Type Mismatches in BTR (6 errors)
**Priority: HIGH** - Type incompatibility issues

### File: `apps/api/src/lib/btr/data-package-builder.ts`
| Error | Line | Issue | Fix |
|-------|------|-------|-----|
| TS2352 | 575 | DivisionalChart type mismatch between advanced-btr-methods and shared types | Use type assertion or fix DivisionalChart definition |

### File: `apps/api/src/lib/btr/planet-enricher.ts`
| Error | Line | Issue | Fix |
|-------|------|-------|-----|
| TS2322 | 99 | Type 'number \| null' not assignable to 'number \| undefined' | Change `null` to `undefined` or handle null case |
| TS2352 | 99 | ShadbalaBreakdown conversion error | Fix type casting |
| TS2322 | 100 | Type 'number \| null' not assignable to 'number \| undefined' | Same as above |
| TS2345 | 103 | Argument of type 'number' not assignable to 'string' | Fix getDignity call - expects string |
| TS2345 | 104 | Argument of type 'number' not assignable to 'string' | Fix getDignity call - expects string |

### File: `apps/api/src/lib/btr/window-scanner.ts`
| Error | Line | Issue | Fix |
|-------|------|-------|-----|
| TS2345 | 393 | TransitMatchResult not assignable to ComprehensiveTransitResult | Add missing properties or fix type |

---

## BATCH 3: Logic & Interface Errors (2 errors)
**Priority: MEDIUM**

### File: `apps/api/src/lib/consensus-engine.ts`
| Error | Line | Issue | Fix |
|-------|------|-------|-----|
| TS2339 | 473 | Property '_events' does not exist on type 'ValidationInput' | Remove or fix the property access |

### File: `apps/api/src/lib/jobs/worker-runtime.ts`
| Error | Line | Issue | Fix |
|-------|------|-------|-----|
| TS2345 | 113 | WorkerStopResult not assignable to Record<string, unknown> | Cast to unknown first |

---

## BATCH 4: Routes - Null Checks & Type Assertions (10 errors)
**Priority: MEDIUM**

### File: `apps/api/src/routes/progress.ts`
| Error | Line | Issue | Fix |
|-------|------|-------|-----|
| TS2322 | 107 | Type 'string' not assignable to 'QueueStatus' | Fix type assignment |
| TS18047 | 118 | 'queueStatus' is possibly 'null' | Add null check |
| TS18047 | 126 | 'queueStatus' is possibly 'null' | Add null check |
| TS18047 | 130 | 'queueStatus' is possibly 'null' | Add null check |
| TS18047 | 131 | 'queueStatus' is possibly 'null' | Add null check |
| TS18047 | 132 | 'queueStatus' is possibly 'null' | Add null check |
| TS18047 | 148 | 'queueStatus' is possibly 'null' | Add null check |

### File: `apps/api/src/routes/stream.ts`
| Error | Line | Issue | Fix |
|-------|------|-------|-----|
| TS2352 | 347 | SessionEvent type assertion error | Use `as unknown as SessionEvent` |
| TS2352 | 384 | SessionEvent type assertion error | Use `as unknown as SessionEvent` |
| TS2352 | 400 | SessionEvent type assertion error | Use `as unknown as SessionEvent` |

---

## Fix Order

1. **Batch 1** - Fix shared package exports (enables other files to import correctly)
2. **Batch 2** - Fix type mismatches in BTR files
3. **Batch 3** - Fix logic errors
4. **Batch 4** - Fix routes null checks and type assertions
5. **Verify** - Run typecheck to confirm all errors resolved

---

## Commands to Run After Each Batch

```bash
# Check remaining errors
source ~/.nvm/nvm.sh && npm -w @ai-pandit/api run typecheck 2>&1 | grep error | wc -l

# Full typecheck
source ~/.nvm/nvm.sh && npm -w @ai-pandit/api run typecheck

# After all errors fixed, rebuild shared
source ~/.nvm/nvm.sh && npm -w @ai-pandit/shared run build

# Run tests
source ~/.nvm/nvm.sh && npm -w @ai-pandit/api run test
```
