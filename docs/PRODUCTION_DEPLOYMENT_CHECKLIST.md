# Production Deployment Checklist

> **Status:** Turso→Neon migration **COMPLETED** (2026-03-13)
# Production Deployment Checklist

**Date:** 13 March 2026  
**Status:** Ready for Release Candidate  
**Deployment Sequence:** Ephemeris → API → Worker → Web

---

## Pre-Deployment Verification (Local)

### 1. Code Quality Gates

```bash
# Run all lint checks
npm run lint

# Run strict lint phase 1 (production surface)
npm -w @ai-pandit/api run lint:strict:phase1

# Run strict lint phase 2 (non-test modules)
npm -w @ai-pandit/api run lint:strict:phase2

# Run web lint
npm -w @ai-pandit/web run lint
```

**Expected:** All green, zero errors

### 2. Test Gates

```bash
# Fast gate (PR quality)
npm run test

# Full deterministic suite
npm -w @ai-pandit/api run test:full:deterministic

# Phase 3 verify (queue + stream)
npm -w @ai-pandit/api run phase3:verify

# Phase 5 verify (security + ownership)
npm -w @ai-pandit/api run phase5:verify

# Phase 6 release gate (comprehensive)
npm -w @ai-pandit/api run phase6:release-gate
```

**Expected:** All green

### 3. Ephemeris Validation

```bash
# Ensure Skyfield service is running
npm run dev:ephemeris

# Run gold dataset strict validation
npm -w @ai-pandit/api run test:ephemeris:gold:strict

# Run high precision tests
npm -w @ai-pandit/api run test:ephemeris:high-precision

# Full parity check
npm -w @ai-pandit/api run ephemeris:parity:quick
```

**Expected:** 70/70 parity tests pass, gold dataset 3/3 trusted

### 4. E2E Smoke Tests

```bash
# Run smoke tests
npm run test:e2e:smoke
```

**Expected:** All critical user flows pass

---

## Environment & Secrets Verification

### Required Environment Variables

| Variable | Service | Source | Verified |
|----------|---------|--------|----------|
| `NEON_DATABASE_URL` | All | Google Secret Manager | [ ] |
| `AI_API_KEY` | API, Worker | Google Secret Manager | [ ] |
| `CLERK_SECRET_KEY` | All | Google Secret Manager | [ ] |
| `ENCRYPTION_SECRET` | All | Google Secret Manager | [ ] |
| `NEXT_PUBLIC_BACKEND_URL` | Web | Cloud Run env var | [ ] |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Web | Cloud Run env var | [ ] |

### GCP Configuration

```bash
# Verify gcloud authentication
gcloud auth list

# Verify project
gcloud config get-value project
# Expected: ai-pandit-489913

# Verify region
gcloud config get-value run/region
# Expected: asia-southeast1
```

---

## Deployment Sequence

### Phase 1: Ephemeris Service (If Changed)

```bash
# Ephemeris service runs independently
# Ensure kernel files are present in services/ephemeris/data/
ls services/ephemeris/data/*.bsp

# Deploy only if code changes
# (Currently deployed manually or via separate flow)
```

**Health Check:**
```bash
curl https://ephemeris-service-xxx.run.app/health
# Expected: {"status":"healthy"}

curl https://ephemeris-service-xxx.run.app/ready
# Expected: {"status":"ready"}
```

### Phase 2: API Service

```bash
# Run staging preflight
npm run deploy:staging:preflight

# Deploy API
npm run deploy:cloudrun:api
```

**Configuration:**
- Memory: 8Gi
- CPU: 2
- Concurrency: 20
- Min Instances: 0
- Max Instances: 2
- Execution Mode: external_worker

**Post-Deploy Verification:**
```bash
# Ready check (deploy success signal)
curl https://api-service-xxx.run.app/ready

# Health check (liveness only)
curl https://api-service-xxx.run.app/health

# Queue status
curl https://api-service-xxx.run.app/api/queue/status
```

### Phase 3: Worker Service

```bash
# Deploy Worker
npm run deploy:cloudrun:worker
```

**Configuration:**
- Memory: 12Gi
- CPU: 4
- Concurrency: 1
- Min Instances: 0
- Max Instances: 1
- Poll Interval: 2000ms

**Post-Deploy Verification:**
```bash
# Worker ready (deploy success signal)
curl https://worker-service-xxx.run.app/ready

# Worker health (liveness only)
curl https://worker-service-xxx.run.app/health
```

### Phase 4: Web Service

```bash
# Deploy Web
npm run deploy:cloudrun:web
```

**Configuration:**
- Memory: 2Gi
- CPU: 1
- Concurrency: 80
- Min Instances: 0
- Max Instances: 2

**Post-Deploy Verification:**
```bash
# Web health
curl https://web-service-xxx.run.app/api/health

# Smoke test landing page
curl -s https://web-service-xxx.run.app | head -20
```

---

## Post-Deployment Validation

### 1. Service Mesh Verification

```bash
# Check all services are responding
echo "Checking API..."
curl -s https://api-service-xxx.run.app/health | jq .

echo "Checking Worker..."
curl -s https://worker-service-xxx.run.app/health | jq .

echo "Checking Web..."
curl -s https://web-service-xxx.run.app/api/health | jq .

echo "Checking Ephemeris..."
curl -s https://ephemeris-service-xxx.run.app/health | jq .
```

### 2. End-to-End Flow Test

```bash
# Run full E2E suite
npm run test:e2e

# Or just smoke
npm run test:e2e:smoke
```

### 3. Load Test (Optional)

```bash
# Run capacity validation
npm -w @ai-pandit/api run capacity:validate:normal

# Or burst profile
npm -w @ai-pandit/api run capacity:validate:burst
```

---

## Rollback Plan

If issues detected:

```bash
# Rollback to previous revision
gcloud run revisions list --service=api-service
gcloud run services update-traffic api-service --to-revisions=[PREV_REVISION]=100

# Same for worker and web
gcloud run revisions list --service=worker-service
gcloud run services update-traffic worker-service --to-revisions=[PREV_REVISION]=100

gcloud run revisions list --service=web-service
gcloud run services update-traffic web-service --to-revisions=[PREV_REVISION]=100
```

**Rollback Trigger Conditions:**
- Error rate > 5% for 5 minutes
- P50 latency > 10s
- Health check failures > 3 consecutive
- Any P0 incident reported

---

## Monitoring Checklist (Post-Deploy)

### 1. Cloud Run Metrics (First 30 mins)

- [ ] Request count trends normal
- [ ] Error rate < 1%
- [ ] P95 latency < 5s (API), < 2s (Web)
- [ ] Cold start duration acceptable
- [ ] Instance count within limits

### 2. Application Metrics

- [ ] Queue depth not growing unbounded
- [ ] Worker processing jobs correctly
- [ ] SSE connections stable
- [ ] Database connection pool healthy

### 3. Business Metrics

- [ ] Analysis submissions working
- [ ] Results returning correctly
- [ ] No increase in failed sessions

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Release Owner | | | |
| QA Verification | | | |
| SRE Approval | | | |
| Product Sign-off | | | |

---

## Post-Deploy Actions

1. **Update Status Page** (if applicable)
2. **Notify Stakeholders** of deployment completion
3. **Schedule 24-hour Review** for stability assessment
4. **Update Documentation** with any configuration changes
5. **Archive Deployment Notes** in release log

---

## Quick Reference

### Useful Commands

```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=api-service" --limit=50

# Stream logs
gcloud alpha logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=api-service"

# Check service details
gcloud run services describe api-service --region=asia-southeast1

# List revisions
gcloud run revisions list --service=api-service

# SSH into container (debugging)
gcloud run services proxy api-service --region=asia-southeast1 --port=8080
```

### Service URLs

| Service | URL |
|---------|-----|
| API | https://api-service-7tjuxigfoq-as.a.run.app |
| Worker | https://worker-service-624056173858.asia-southeast1.run.app |
| Web | https://aipandit.app |

---

**Last Updated:** 13 March 2026  
**Next Review:** Before each production deployment
