# Codex Prompt Templates

Use these templates to keep agent output predictable and production-safe.

## 1) Bugfix Template

```text
Goal:
Fix <bug> without changing public API behavior.

Scope:
Edit only <files/dirs>.

Constraints:
- No broad refactor
- No schema/env changes
- Keep backward compatibility

Acceptance:
Run:
1) <command>
2) <command>

Non-goals:
- <item>
- <item>
```

## 2) Small Feature Template

```text
Goal:
Add <feature> in <area>.

Scope:
Allowed files: <list>

Constraints:
- Preserve existing behavior for <critical flow>
- Add tests for new behavior

Acceptance:
1) <unit/integration test command>
2) <lint command>
3) <optional smoke command>
```

## 3) Refactor Template

```text
Goal:
Refactor <module> for readability/perf without behavior change.

Scope:
<files>

Constraints:
- No API contract changes
- No new dependencies
- Keep diff focused

Acceptance:
1) Existing tests remain green
2) Add/update tests only if coverage gap appears
```

## 4) Incident/Hotfix Template

```text
Goal:
Stabilize <incident> quickly and safely.

Scope:
Smallest possible patch in <files>.

Requirements:
- Add guardrails/logging
- Include rollback strategy in summary
- Include risk of false positives/negatives

Acceptance:
1) Repro test fails before fix
2) Repro test passes after fix
3) Related suite passes
```
