# Codex 5.3 Workflow (VS Code, AI-Pandit)

This is the recommended operating workflow for fast but safe iteration.

## Working Mode

- Mode A: `Speed` for small scoped edits and quick local checks.
- Mode B: `Safety` before handoff/merge with full lint + tests.

Default sequence:
1. Diagnose in read-only mode.
2. Apply minimal patch.
3. Run scoped verification.
4. Run full repo checks if shared or risky areas changed.
5. Provide summary with risks and next checks.

## VS Code Layout

Use 3 panes:
1. Agent chat (Codex)
2. Git diff
3. Terminal with active test watch

Recommended terminals:
- Terminal 1: `npm run dev`
- Terminal 2: `npm -w @ai-pandit/api run test:watch` or `npm -w @ai-pandit/web run test:watch`
- Terminal 3: one-off checks (`lint`, `build`, `e2e`)

## Task Size Rule

- One task = one behavior change.
- Avoid mixing refactor + behavior + infra in one prompt.
- Ask the agent for small diffs unless a full migration is requested.

## Safe Iteration Loop

1. Ask Codex to inspect impacted files and summarize assumptions.
2. Ask for patch with exact file list.
3. Run scoped tests first.
4. If green, run full quality gate:
   - `npm run lint`
   - `npm run test`
5. For stream/queue UX flows, run:
   - `npm run test:e2e:smoke`

## High-Risk Change Protocol

For queue/encryption/BTR-pipeline changes:
1. Add or update tests first.
2. Implement minimal code change.
3. Re-run same test and adjacent suite.
4. Share rollback plan in summary.

## Commit Hygiene

- Keep commits atomic and reviewable.
- Conventional commit examples:
  - `fix(api): prevent duplicate job enqueue`
  - `test(web): add stream reconnect coverage`
  - `docs(workflow): standardize codex prompt contract`
