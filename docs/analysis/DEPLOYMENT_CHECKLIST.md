# AI-Pandit Deployment Checklist

> **Run `scripts/pre-flight-check.sh` BEFORE every deployment.**
> This catches 90% of issues before they reach production.

## Pre-Deployment (MANDATORY)

- [ ] Run `./scripts/pre-flight-check.sh` — all checks must pass
- [ ] Commit all changes: `git status` should be clean
- [ ] Verify `.gcloudignore` excludes: `.git/`, `node_modules/`, `.next/`, `*.log`, `.env*`, `dia-assets/`, `docs/`, `e2e/`, `scripts/`
- [ ] Verify `.dockerignore` is comprehensive
- [ ] No large files (>1MB) accidentally committed

## Environment Variables (CRITICAL)

Ensure these are set before deploying:

### For API + Worker
- `GCP_PROJECT_ID`
- `CLOUD_RUN_REGION` (default: `asia-southeast1`)
- `EPHEMERIS_SERVICE_URL` (must be live before API deploy)
- `WEB_FRONTEND_URL` / `FRONTEND_URL`
- `NEON_DATABASE_URL`
- `REDIS_URL`
- `AI_API_KEY`
- `ENCRYPTION_SECRET`
- `CLERK_SECRET_KEY`

### For Web (Vercel)
- `NEXT_PUBLIC_BACKEND_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

## Deployment Order

**ALWAYS deploy in this order:**

1. **Ephemeris Service** (if changed)
   ```bash
   scripts/deploy-cloud-run.sh ephemeris
   ```

2. **API Service** (depends on Ephemeris)
   ```bash
   scripts/deploy-cloud-run.sh api
   ```
   - Verify health: `curl $API_URL/health`

3. **Worker Service** (depends on API + DB)
   ```bash
   scripts/deploy-cloud-run.sh worker
   ```

4. **Web Frontend** (Vercel)
   ```bash
   cd apps/web && vercel deploy --prod
   ```
   - Must be deployed AFTER API is healthy
   - Uses monorepo root install via `vercel.json`

## Post-Deployment Verification

- [ ] API health check passes
- [ ] Worker health check passes
- [ ] Web frontend loads without 500 errors
- [ ] Cloud Run logs show no startup errors
- [ ] Apply idle cost guards:
  ```bash
  npm run deploy:cloudrun:idle-guards
  ```

## Common Issues & Fixes

### Issue: `@ai-pandit/db` not found during Vercel build
**Cause:** Vercel runs `npm install` from `apps/`, not monorepo root.  
**Fix:** `vercel.json` must use `"installCommand": "cd ../.. && npm install"`

### Issue: Type errors in `packages/shared`
**Cause:** Type mismatches between API and Web expectations.  
**Fix:** Run `npm --workspace @ai-pandit/shared run typecheck` locally before deploying.

### Issue: Cloud Build uploads too many files
**Cause:** Missing `.gcloudignore`.  
**Fix:** Add `.gcloudignore` with patterns from pre-flight check.

### Issue: `ALLOWED_ORIGINS` comma parsing fails
**Cause:** Cloud Run `--set-env-vars` treats comma as separator.  
**Fix:** Script now uses `--env-vars-file` for comma-containing values.

### Issue: Large git repo slowing clone
**Cause:** Downloaded reference assets (like `dia-assets/`) committed to git.  
**Fix:** Remove from git, add to `.gitignore`, use CDN or build-time download instead.

## Quick Reference

```bash
# Full pre-flight
./scripts/pre-flight-check.sh

# Deploy all backend services
scripts/deploy-cloud-run.sh api
scripts/deploy-cloud-run.sh worker

# Deploy web
cd apps/web && vercel deploy --prod

# Apply cost guards
npm run deploy:cloudrun:idle-guards

# Check service health
curl https://api-service-XXX.run.app/health
curl https://worker-service-XXX.run.app/health
```
