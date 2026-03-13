# Ship-Ready Workflow (Messy Codebase to Production)

This workflow is optimized for AI-assisted development in VS Code with Codex.
It is based on:
- OpenAI Codex guidance (scope tasks, strong `AGENTS.md`, approval/sandbox controls)
- Karpathy-style repo discipline (small, readable, reproducible changes)
- Review and release rigor (required checks, small PRs, explicit acceptance criteria)

## 1) Operating Principles

1. One issue = one behavior change.
2. Small diffs are mandatory.
3. Every issue must have acceptance commands before coding starts.
4. No merge without quality gates.
5. High-risk modules require extra verification.

## 2) Issue Taxonomy (Triage First)

Create issues only in these buckets:
- `P0-BLOCKER`: crash, data corruption, auth/security, deploy blocker
- `P1-RELIABILITY`: flaky behavior, queue/stream failures, retries/timeouts
- `P2-CORRECTNESS`: wrong logic/output but non-catastrophic
- `P3-TECH-DEBT`: refactor/cleanup/perf improvements

Rule: clear all `P0` first, then top `P1`, then ship critical `P2`.

## 3) Mandatory Issue Lifecycle

1. `Triaged`: repro steps and owner assigned.
2. `Ready`: acceptance checks defined.
3. `In Progress`: Codex patching in small steps.
4. `In Review`: PR open with test evidence.
5. `Done`: merged + verified in target environment.

## 4) Codex Execution Loop (Per Issue)

1. Ask mode:
   - identify root cause
   - list impacted files
   - propose minimal patch
2. Code mode:
   - edit only approved files
   - keep patch focused
3. Verify scoped checks first.
4. If shared/risky code changed, run broader checks.
5. Open small PR with risk notes.

## 5) Verification Matrix (Repo-Specific)

- `apps/api/**` changed:
  - `npm -w @ai-pandit/api run lint`
  - `npm -w @ai-pandit/api run lint:strict:phase1`
  - `npm -w @ai-pandit/api run lint:strict:phase2`
  - `npm -w @ai-pandit/api run test`
- Cross-repo release evidence:
  - `npm run test:with-summary` (generates `logs/test-summary-latest.{json,md}`)
- `apps/web/**` changed:
  - `npm -w @ai-pandit/web run lint`
  - `npm -w @ai-pandit/web run test`
- `packages/**` changed:
  - `npm run lint`
  - `npm run test`
- stream/queue/job flow changed:
  - `npm run test:e2e:smoke`

## 6) Definition of Done (Strict)

An issue is done only if:
1. Repro was confirmed before fix.
2. Acceptance commands pass after fix.
3. No unrelated files changed.
4. Backward behavior remains intact.
5. PR has a rollback note for risky changes.

## 7) Weekly Release Cadence

1. Monday: freeze priorities (`P0/P1` only).
2. Tue-Thu: execute small issue batches.
3. Friday: release candidate checks and deployment decision.

## 8) Ship Gate (Final)

Ship only when all are true:
1. Zero open `P0`.
2. CI quality gate green (`lint`, `test`).
3. Critical user flows pass smoke verification.
4. Deployment scripts and env are validated.
5. Rollback path is documented.

## 9) Anti-Chaos Rules

1. Do not run large multi-feature prompts.
2. Do not mix refactor + feature + infra in one PR.
3. Do not skip tests for "quick fixes".
4. Do not allow force merge on red checks.
