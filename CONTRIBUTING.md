# Contributing to AI-Pandit

> **⚠️ PROPRIETARY SOFTWARE — ALL RIGHTS RESERVED**  
> AI-Pandit is proprietary software. No license is granted to use, copy, modify, or distribute this code.  
> See [LICENSE](LICENSE) for full terms.

## Contributor License Agreement (CLA)

By submitting a contribution to this repository, you agree to the following terms:

1. You grant the project owner a perpetual, worldwide, non-exclusive, royalty-free, irrevocable license to use, reproduce, modify, display, distribute, and otherwise exploit your contribution in any manner the project owner sees fit.
2. You represent that you have the legal right to grant this license and that your contribution is your original work.
3. You understand that this project is proprietary software and your contribution will become part of proprietary code owned by the project owner.

**No contribution will be accepted without explicit agreement to these terms.** By opening a pull request, you are deemed to have accepted this CLA.

---

## How to Report Bugs

Please open a [Bug Fix issue](https://github.com/ashoksainiengineer/ai-pandit-app/issues/new/choose) using the provided template. Include:

- A one-line summary of the bug
- Exact steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, browser)
- Relevant logs or screenshots (if safe to share)

For security vulnerabilities, **do not** open a public issue. Email `app [at] aipandit [dot] gmail [dot] com` instead.

---

## Code Style Guide

AI-Pandit uses strict code quality standards. All contributions must follow these rules:

### TypeScript

- **Strict mode required** — `strict: true` in `tsconfig.json`. No exceptions.
- **No `any` types** — Use `unknown` if the type is not known, then narrow with type guards.
- **No `as` casts** — Prefer type narrowing, Zod parsing, or proper type annotations over type assertions.
- **No `// @ts-expect-error` or `// @ts-ignore`** — These are not permitted.

### Linting & Formatting

- ESLint must pass with zero warnings and zero errors.
- Prettier is used for formatting. Run `npm run format` before committing.

### Naming Conventions

- **Files**: `kebab-case.ts` — lowercase with hyphens.
- **Functions/Variables**: `camelCase`.
- **Classes/Interfaces/Types**: `PascalCase`.
- **Constants**: `UPPER_SNAKE_CASE` for truly constant values.
- **Zod schemas**: Suffix with `Schema`, e.g., `birthDataSchema`.
- **React components**: PascalCase in files matching their name.

### Error Handling

- Use the `AppError` hierarchy — never `throw new Error()`.
- All async routes must use a global error handler wrapper.
- Never `console.log` in backend code. Use the Pino logger (`req.log` or the shared logger).

### Imports

- Use `@/` path aliases (e.g., `import { x } from '@/lib/...'`).
- Avoid barrel imports that cause circular dependencies.
- Group imports: external → internal → relative.

### Testing

- Every new feature must include tests.
- Bug fixes must include a regression test.
- Test files live next to the code they test: `feature.ts` → `feature.test.ts`.

---

## Conventional Commits

All commit messages and PR titles **must** follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

### Types

| Type       | Usage                                |
|-----------|--------------------------------------|
| `feat`    | A new feature                        |
| `fix`     | A bug fix                            |
| `refactor`| Code change that neither fixes nor adds |
| `test`    | Adding or updating tests             |
| `docs`    | Documentation only                   |
| `chore`   | Maintenance, deps, config, build     |
| `perf`    | Performance improvement              |
| `style`   | Formatting, missing semicolons, etc. |

### Examples

```
feat(api): add Dasha-based rectification pipeline
fix(web): correct timezone offset in birth form
refactor(api): extract encryption helpers to shared package
test(api): add regression test for transit analysis
chore(deps): upgrade Skyfield to 1.49
```

---

## Pull Request Process

1. **Fork is not applicable** — This is a private/proprietary repository. PRs are accepted from collaborators only.
2. **Create a branch** from `main` with a descriptive name:
   - `feat/<short-description>`
   - `fix/<short-description>`
   - `refactor/<short-description>`
3. **Make focused changes** — Each PR should address exactly one behavior change or one bounded cleanup task. No unrelated refactors.
4. **Write or update tests** — Coverage must not decrease.
5. **Run verification commands** before opening the PR:
   ```bash
   npm run lint
   npm run test
   npm run build
   ```
6. **Open a PR** using the pull request template. Fill out all sections completely.
7. **Address review feedback** — Expect questions and requested changes. This is normal.
8. **Merge** — Only maintainers can merge. Squash commits are preferred.

---

## Development Setup

See [README.md](README.md#quick-start) for local development setup instructions.

---

## Code of Conduct

Be professional, respectful, and constructive. Harassment, trolling, or disrespectful behavior will result in immediate removal from the project.

---

*By contributing to AI-Pandit, you help advance the science of Vedic astrology birth time rectification. Thank you for your contribution.*
