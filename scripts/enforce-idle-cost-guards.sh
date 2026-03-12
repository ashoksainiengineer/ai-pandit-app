#!/usr/bin/env sh
set -eu

PROJECT_ID="${GCP_PROJECT_ID:-${GOOGLE_CLOUD_PROJECT:-}}"
REGION="${CLOUD_RUN_REGION:-asia-southeast1}"
API_SERVICE_NAME="${API_SERVICE_NAME:-api-service}"
WORKER_SERVICE_NAME="${WORKER_SERVICE_NAME:-worker-service}"

if [ -z "${PROJECT_ID}" ]; then
  echo "GCP_PROJECT_ID or GOOGLE_CLOUD_PROJECT is required"
  exit 1
fi

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud is required"
  exit 1
fi

echo "Applying idle-cost guards to ${API_SERVICE_NAME} and ${WORKER_SERVICE_NAME} in ${PROJECT_ID}/${REGION}"

gcloud run services update "${API_SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --min=0 \
  --max=2 \
  --cpu-throttling

gcloud run services update "${WORKER_SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --min=0 \
  --max=1 \
  --cpu-throttling

echo "Idle-cost guards applied successfully"
