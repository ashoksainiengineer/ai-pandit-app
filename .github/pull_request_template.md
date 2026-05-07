## Description

<!-- Provide a clear, concise description of the change and why it's needed. Max 2-3 sentences. -->

## Type of Change

<!-- Delete options that do not apply. Must follow conventional commit types. -->

- `feat` — New feature
- `fix` — Bug fix
- `refactor` — Code change that neither fixes nor adds
- `test` — Adding or updating tests
- `docs` — Documentation only
- `chore` — Maintenance, deps, config, build
- `perf` — Performance improvement

## Related Issue

Closes #

## Scope Check

- [ ] This PR addresses exactly **one** behavior change (or one bounded cleanup task)
- [ ] No unrelated refactoring or scope creep
- [ ] No secret, token, or env values added to code (use env vars only)
- [ ] No schema changes without corresponding migration

## Quality Checklist

- [ ] **TypeScript strict mode** — No `strict: false` overrides
- [ ] **No `any` types** — `unknown` + type guards preferred
- [ ] **ESLint passes** — Zero warnings, zero errors (`npm run lint`)
- [ ] **Tests pass** — All tests green (`npm run test`)
- [ ] **Build passes** — Production build succeeds (`npm run build`)
- [ ] **Conventional commit format** — PR title follows `type(scope): description`
- [ ] **No `console.log`** in backend code (use Pino logger)
- [ ] **No `as` casts or `@ts-ignore`** comments

## Verification Evidence

Commands run:

```bash
npm run lint
npm run test
npm run build
```

Results:

<!-- Paste output showing all checks pass -->

## Risk and Rollback

**Risk areas:**
<!-- List what could break -->

**Rollback plan:**
<!-- How to revert if needed -->

**Is this safe to deploy independently of other changes?**
- [ ] Yes
- [ ] No (explain dependencies)

## Reviewer Notes

<!-- Anything the reviewer should pay extra attention to -->
