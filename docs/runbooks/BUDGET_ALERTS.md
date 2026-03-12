# Budget Alert Setup

Last updated: 2026-03-12

## Cloud Run

- Create budget alert thresholds at `50%`, `80%`, and `100%` of monthly spend.
- Filter to services:
  - `api-service`
  - `worker-service`
- Notify:
  - engineering email group
  - pager/on-call channel at `100%`

## Artifact Registry

- Track storage bytes and egress separately from Cloud Run compute.
- Pair budget alerts with the cleanup job:
  - `sh ./scripts/cleanup-artifact-images.sh`

## Neon

- Alert on:
  - storage growth
  - compute-hours spike
  - connection saturation
- Review retention-heavy tables first:
  - `job_events`
  - `artifacts`
  - `job_attempts`

## Upstash

- Queue architecture is currently `db_polling`, so Upstash is not an active production dependency for job execution.
- Keep cost alerts only if Upstash remains provisioned for any future or side-channel use.
- If unused, decommission to remove idle billing risk.
