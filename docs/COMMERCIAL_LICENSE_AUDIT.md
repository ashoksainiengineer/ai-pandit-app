# Commercial License Audit

Date: March 12, 2026
Scope: npm workspace manifests and `package-lock.json` in this repository
Purpose: identify dependencies that can block or complicate proprietary commercial use

## Executive Summary

Current hard blocker:

- `swisseph-wasm` in `apps/api` is not safe for a proprietary commercial product.

Current review item:

- `sharp` brings in `libvips` platform binaries under `LGPL-3.0-or-later`. This is not the same level of risk as `swisseph-wasm`, but it should be kept on the legal review list if you distribute packaged binaries or appliances.

No other obvious hard blockers were found from the repository's current npm manifests and lockfile scan.

## Audit Scope

Files reviewed:

- `package.json`
- `apps/api/package.json`
- `apps/web/package.json`
- `apps/worker/package.json`
- `packages/db/package.json`
- `package-lock.json`

Search focus:

- `GPL`
- `AGPL`
- `LGPL`
- `SSPL`
- `BUSL` / `BSL`
- `Commons Clause`
- other clearly restrictive or non-commercial licenses

This audit does not cover:

- third-party SaaS terms of service
- cloud vendor contract terms
- fonts, media, icons, or datasets outside npm
- Docker base images or OS packages
- future Python dependencies
- legal advice

## Findings

### 1. `swisseph-wasm`

Location:

- `apps/api/package.json`
- `package-lock.json`

License signal:

- `GPL-3.0-or-later`

Why it is risky:

- GPL is generally incompatible with keeping the application proprietary if the library is part of the shipped or deployed product.
- This package also wraps Swiss Ephemeris, whose underlying commercial use model introduces an additional licensing problem for closed-source commercial products.

Risk level:

- `High`

Recommendation:

- Remove `swisseph-wasm` from the production system.
- Replace with a permissive alternative such as `Skyfield`, `Astronomy Engine`, or another clean-room astronomy backend.

Verdict:

- `Must replace`

### 2. `sharp` / `libvips`

Location:

- `apps/web/package.json`
- transitive `@img/sharp-libvips-*` packages in `package-lock.json`

License signal:

- `LGPL-3.0-or-later` on `@img/sharp-libvips-*`

Why it is not an immediate blocker:

- `sharp` is widely used in commercial software.
- LGPL is materially different from GPL and is often workable in commercial settings, especially where the library remains separable and unmodified.

Why it still belongs on the review list:

- If you distribute bundled binaries, desktop packages, appliances, or otherwise embed the library in ways that trigger LGPL obligations, compliance details matter.
- If you modify the LGPL-covered library itself, obligations may increase.

Risk level:

- `Medium`

Recommendation:

- Usually safe to keep operationally, but note it in a legal/compliance checklist.
- If you want to minimize even review overhead, consider whether `sharp` is actually required in production or can be replaced by a hosted image pipeline.

Verdict:

- `Likely safe to keep`, but `review with counsel if you distribute packaged binaries`

## Dependencies Reviewed With No Obvious Hard Commercial Blocker

The following direct dependencies did not present an obvious proprietary-commercial licensing blocker in the current manifests:

- `next`
- `react`
- `react-dom`
- `express`
- `drizzle-orm`
- `@libsql/client`
- `@clerk/backend`
- `@clerk/nextjs`
- `@google-cloud/storage`
- `zod`
- `date-fns`
- `framer-motion`
- `leaflet`
- `react-leaflet`
- `jspdf`
- `jspdf-autotable`
- `zustand`
- `uuid`
- `pg`
- `turbo`
- `playwright`

Important note:

- This means no obvious blocker was found from package license metadata during this scan.
- It does not mean every package is guaranteed safe for every distribution model.
- Vendor terms for hosted services still need separate review.

## Risk Matrix

| Dependency | License Signal | Proprietary Commercial Risk | Action |
|---|---|---:|---|
| `swisseph-wasm` | `GPL-3.0-or-later` + Swiss commercial licensing issue | High | Replace |
| `sharp` via `libvips` binaries | `LGPL-3.0-or-later` | Medium | Keep with review |

## Recommended Actions

1. Remove `swisseph-wasm` from the backend roadmap and production dependency set.
2. Move to a permissive astronomy backend, with `Skyfield` as the primary candidate.
3. Keep `sharp` on a compliance watchlist, but do not treat it as a release blocker by default.
4. Add a recurring dependency license audit to release readiness checks.
5. Re-run the audit after any new Python or astronomy-service dependencies are introduced.

## Suggested Policy

Block these license families from production dependencies unless explicitly approved:

- `GPL`
- `AGPL`
- `SSPL`
- `BUSL` / non-open commercial source-available licenses

Escalate for review:

- `LGPL`
- `MPL`
- custom or unknown licenses

Usually acceptable, subject to normal review:

- `MIT`
- `BSD`
- `ISC`
- `Apache-2.0`

## Bottom Line

From the current JavaScript dependency set, `swisseph-wasm` is the only clear proprietary-commercial blocker.

`sharp` is the only other notable license item that deserves attention, but it is not in the same category as Swiss Ephemeris licensing risk.
