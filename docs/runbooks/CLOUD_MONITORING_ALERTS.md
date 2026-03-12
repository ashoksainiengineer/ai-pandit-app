# Cloud Monitoring Alerts

Last updated: 2026-03-12

## Required Alerts

### Worker Crash Spike

- Signal: Cloud Run revision/container restart count for `worker-service`
- Threshold: `>= 3` restarts in `10m`
- Severity: high
- Runbook:
  - check latest worker revision logs
  - inspect `/api/health/metrics`
  - inspect `/api/admin/jobs/dead-letter`

### Queue Backlog

- Signal: `jobs.queueDepth` from `/api/health/metrics`
- Threshold: `> 20` for `15m`
- Severity: medium
- Runbook:
  - confirm worker is in production mode
  - confirm `jobExecutionMode=external_worker`
  - verify DB latency is healthy

### Retry Storm

- Signal: `jobs.retryCount` delta and repeated `job.retrying` events
- Threshold: `> 15` retries in `15m`
- Severity: high
- Runbook:
  - inspect `retryReasonCode`
  - look for upstream AI/network instability
  - sample dead-letter reports for shared failure shape

### High Memory

- Signal: RSS / heap metrics from `/api/health/metrics`
- Threshold:
  - RSS `> 85%` of container memory for `10m`
  - heap degradation state present for `10m`
- Severity: high
- Runbook:
  - reduce max concurrency if needed
  - verify stale sessions are not accumulating
  - inspect large artifact/report payloads

## Recommended Dashboards

- Queue depth and active job count
- Retry count and failed terminal jobs
- Active SSE connections
- DB latency and process memory
