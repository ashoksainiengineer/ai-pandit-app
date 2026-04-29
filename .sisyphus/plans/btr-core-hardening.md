# BTR Core Hardening Plan

## Goal
Fix the grounded BTR-core defects in `ai-pandit-app` without broad refactors or API drift. Changes must stay reversible and verified by targeted tests before wider validation.

## Confirmed Problem Areas
1. Candidate day shifts are encoded only in display text, not in real candidate identity.
2. `window-scanner` mixes UTC/local semantics and can feed reinterpreted times back into ephemeris calls.
3. Event precision/category contracts are inconsistent between shared types and runtime maps.
4. Dasha/lifecycle anchoring uses incomplete candidate datetime state; `rawVimshottari` is not populated.
5. Stage 3/5 refinement and some fallback flows are biased by offset proximity or batch order instead of explicit merit.
6. Shared BTR contracts still use weak `any` placeholders in core paths.

## Sequencing
### Phase 1 - Regression Guards
Add or update focused tests first for:
- cross-midnight candidate generation and refinement grids
- event precision weighting and category mapping
- Stage 3/5 ranking bias
- Stage 6 candidate-scoped dasha anchor behavior

### Phase 2 - Candidate Datetime Canonicalization
Introduce canonical candidate datetime metadata in shared/internal candidate types.
- propagate through `time-offset-manager.ts`
- preserve backward compatibility for existing `time` string consumers while adding date/day-shift fields
- update stage pipelines to carry full candidate identity instead of only `time` + `offsetMinutes`

### Phase 3 - UTC/Local Contract Repair
Unify temporal handling across:
- `apps/api/src/lib/btr/window-scanner.ts`
- `apps/api/src/lib/btr/orchestrator.ts`
- `apps/api/src/lib/btr/data-package-builder.ts`
- related ephemeris callers

Rule: local birth civil time should be converted exactly once before astronomy calculations; returned public time strings should match the chosen contract consistently.

### Phase 4 - Dasha and Lifecycle Anchoring
After canonical datetime is in place:
- anchor Vimshottari and lifecycle computations to candidate birth datetime
- populate `rawVimshottari` where Stage 6 expects exact tree access
- make Stage 6 present-day lock candidate-scoped instead of first-finalist-scoped

### Phase 5 - Ranking and Fallback Hardening
Replace proximity- or order-based fallback/ranking with deterministic explicit merit/provenance.
- Stage 2/4 fallback should not preserve arbitrary first items
- Stage 3/5 focus should use explicit ranking metadata instead of `abs(offsetMinutes)` alone
- Stage 6 fallback winner should remain deterministic but based on best known rank/provenance

### Phase 6 - Type Tightening
After runtime behavior stabilizes:
- remove core `any` placeholders from shared BTR contracts where feasible
- update tests that currently rely on invalid legacy literals such as `exact` / `year`
- keep compatibility only where it reflects real runtime expectations

## Touched Files
- `packages/shared/src/types.ts`
- `packages/shared/src/btr-types.ts`
- `packages/shared/src/schemas.ts`
- `apps/api/src/lib/time-offset-manager.ts`
- `apps/api/src/lib/btr/data-package-builder.ts`
- `apps/api/src/lib/btr/dasha-builder.ts`
- `apps/api/src/lib/btr/window-scanner.ts`
- `apps/api/src/lib/btr/orchestrator.ts`
- `apps/api/src/lib/btr/event-scorer.ts`
- `apps/api/src/lib/btr/transit-builder.ts`
- `apps/api/src/lib/seconds-precision-btr.ts`
- `apps/api/src/lib/btr/stages/stage2-batch-tournament.ts`
- `apps/api/src/lib/btr/stages/stage3-refinement-grid.ts`
- `apps/api/src/lib/btr/stages/stage4-deep-analysis.ts`
- `apps/api/src/lib/btr/stages/stage5-micro-grid.ts`
- `apps/api/src/lib/btr/stages/stage6-final-precision.ts`

## Test Files To Update/Add
- `apps/api/src/lib/__tests__/time-offset-manager.test.ts`
- `apps/api/src/lib/btr/__tests__/event-date-utils.test.ts`
- `apps/api/src/lib/btr/__tests__/transit-analyzer.test.ts`
- `apps/api/src/lib/btr/stages/__tests__/adaptive-grid-focus.test.ts`
- `apps/api/src/lib/btr/stages/__tests__/btr-model-routing.test.ts`
- `apps/api/src/lib/btr/__tests__/btr-modules.test.ts`
- `apps/api/src/lib/btr/__tests__/data-package-builder.test.ts`

## Hidden Coupling To Watch
- Candidate datetime metadata must stay aligned with stage prompts and emitted progress payloads.
- `rawVimshottari` population affects Stage 6 prompt context and transit locking.
- Precision/category fixes can break older tests that currently encode invalid values.
- Ranking hardening should not remove safety-net protection for tentative/boundary candidates without replacing it with explicit policy.

## Acceptance Checks
Run at minimum:
```bash
npm -w @ai-pandit/api run test -- src/lib/__tests__/time-offset-manager.test.ts src/lib/btr/__tests__/event-date-utils.test.ts src/lib/btr/__tests__/transit-analyzer.test.ts src/lib/btr/stages/__tests__/adaptive-grid-focus.test.ts src/lib/btr/stages/__tests__/btr-model-routing.test.ts src/lib/btr/__tests__/btr-modules.test.ts src/lib/btr/__tests__/data-package-builder.test.ts
npm -w @ai-pandit/api run lint
```
Then run broader API tests if targeted suite is green.

## Non-Goals
- No commit/push in this phase.
- No unrelated frontend or queue refactors.
- No schema churn beyond what is needed for corrected BTR contracts.
