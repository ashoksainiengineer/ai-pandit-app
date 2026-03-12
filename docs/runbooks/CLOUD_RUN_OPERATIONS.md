# Cloud Run Operations Runbook

Last updated: 2026-03-12

## Services

- API: `api-service`
- Worker: `worker-service`
- Region: `asia-southeast1`
- Project: `ai-pandit-489913`

## Deploy

```bash
npm run deploy:cloudrun:api
npm run deploy:cloudrun:worker
npm --workspace apps/api run verify:worker-health
```

## Idle-Cost Mode

Use this when there is no active production traffic and you want near-zero idle compute cost.

```bash
npm run deploy:cloudrun:idle-guards
```

Expected state:
- API `min=0`
- worker `min=0`
- worker CPU throttling enabled

## Production Worker Mode

Use this when you actually want the worker to stay warm and poll continuously.

```bash
sh ./scripts/enable-production-worker-mode.sh
```

Default state:
- worker `min=1`
- worker `max=1`
- worker CPU throttling disabled

## Rollback

1. Find older image tag:

```bash
gcloud artifacts docker images list asia-southeast1-docker.pkg.dev/ai-pandit-489913/ai-pandit --include-tags
```

2. Re-deploy old image:

```bash
gcloud run deploy api-service \
  --project=ai-pandit-489913 \
  --region=asia-southeast1 \
  --image=asia-southeast1-docker.pkg.dev/ai-pandit-489913/ai-pandit/api-service:<old-tag>
```

Repeat for `worker-service` if needed.

## Health Checks

API:

```bash
curl -fsS https://api-service-7tjuxigfoq-as.a.run.app/api/health
```

Worker:

```bash
export WORKER_HEALTH_URL="https://api-service-7tjuxigfoq-as.a.run.app"
npm --workspace apps/api run verify:worker-health
```

## Artifact Registry Cleanup

```bash
sh ./scripts/cleanup-artifact-images.sh
```

## Dead-Letter Inspection

Permanent failures now write a DLQ-style artifact row with:
- `kind = dead_letter_report`
- metadata containing retry/error/checkpoint context

Inspect via:

```bash
curl -H "Authorization: Bearer <admin-token>" https://api-service-7tjuxigfoq-as.a.run.app/api/admin/jobs/dead-letter
curl -H "Authorization: Bearer <admin-token>" https://api-service-7tjuxigfoq-as.a.run.app/api/admin/jobs/<jobId>/dead-letter
```

## Artifact Retention

```bash
npm --workspace apps/api run artifacts:cleanup -- --dry-run
npm --workspace apps/api run artifacts:cleanup
```

## Queue Architecture

Accepted production queue architecture is documented in:

- `docs/runbooks/QUEUE_ARCHITECTURE_DECISION.md`
