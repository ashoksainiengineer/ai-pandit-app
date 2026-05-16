#!/usr/bin/env bash  # BUG-FIX: bash needed for 'local' keyword
set -eu

PROJECT_ID="${GCP_PROJECT_ID:-${GOOGLE_CLOUD_PROJECT:-}}"
REGION="${CLOUD_RUN_REGION:-asia-southeast1}"
API_SERVICE_NAME="${API_SERVICE_NAME:-api-service}"
WEB_SERVICE_NAME="${WEB_SERVICE_NAME:-web-service}"
EPHEMERIS_SERVICE_NAME="${EPHEMERIS_SERVICE_NAME:-ephemeris-service}"

if [ -z "${PROJECT_ID}" ]; then
  echo "GCP_PROJECT_ID or GOOGLE_CLOUD_PROJECT is required"
  exit 1
fi

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud is required"
  exit 1
fi

echo "Applying zero-idle Cloud Run guards in ${PROJECT_ID}/${REGION}"

update_if_exists() {
  service_name="$1"
  max_instances="$2"

  if gcloud run services describe "${service_name}" \
    --project="${PROJECT_ID}" \
    --region="${REGION}" >/dev/null 2>&1; then
    echo "Setting ${service_name} to min=0, max=${max_instances}, cpu-throttling"
    gcloud run services update "${service_name}" \
      --project="${PROJECT_ID}" \
      --region="${REGION}" \
      --min=0 \
      --max="${max_instances}" \
      --cpu-throttling
  else
    echo "Skipping ${service_name}; service not found"
  fi
}

update_if_exists "${API_SERVICE_NAME}" 2
update_if_exists "${WEB_SERVICE_NAME}" 2
update_if_exists "${EPHEMERIS_SERVICE_NAME}" 1

echo "Zero-idle guards applied successfully"
