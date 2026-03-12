#!/usr/bin/env sh
set -eu

PROJECT_ID="${GCP_PROJECT_ID:-${GOOGLE_CLOUD_PROJECT:-}}"
REGION="${CLOUD_RUN_REGION:-asia-southeast1}"
WORKER_SERVICE_NAME="${WORKER_SERVICE_NAME:-worker-service}"
WORKER_MIN_INSTANCES="${WORKER_MIN_INSTANCES:-1}"
WORKER_MAX_INSTANCES="${WORKER_MAX_INSTANCES:-1}"

if [ -z "${PROJECT_ID}" ]; then
  echo "GCP_PROJECT_ID or GOOGLE_CLOUD_PROJECT is required"
  exit 1
fi

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud is required"
  exit 1
fi

echo "Enabling production worker mode for ${WORKER_SERVICE_NAME}"

gcloud run services update "${WORKER_SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --min="${WORKER_MIN_INSTANCES}" \
  --max="${WORKER_MAX_INSTANCES}" \
  --no-cpu-throttling

echo "Production worker mode enabled"
