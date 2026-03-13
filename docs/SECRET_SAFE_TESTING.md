# Secret-Safe Testing (Real Stacks)

Date: 12 March 2026

## Rule

1. Default behavior must block accidental live Clerk keys in non-production runtime.
2. Intentional live-key tests require explicit operator override.

## Preflight Gate

1. API preflight command:
   - `npm -w @ai-pandit/api run env:preflight:safe`
2. This check is enforced inside:
   - `npm -w @ai-pandit/api run phase6:release-gate`

## Explicit Override (Only for controlled test windows)

1. Use only when you intentionally test with live credentials:
   - `ALLOW_LIVE_SECRETS_IN_DEV=true npm -w @ai-pandit/api run phase6:release-gate`
2. Keep override short-lived and scoped to one shell/session.

## Operational Hygiene

1. Never paste real keys in chat, issues, PR comments, or docs.
2. Store runtime secrets only in:
   - local `.env.local` (gitignored) for dev,
   - cloud secret manager for deployed services.
3. Rotate credentials immediately if exposed outside trusted secret stores.
