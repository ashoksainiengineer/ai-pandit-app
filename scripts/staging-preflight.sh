#!/usr/bin/env sh
set -eu

echo "[preflight] checking staging deploy prerequisites..."

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[preflight] missing command: $1"
    return 1
  fi
}

require_env() {
  key="$1"
  eval "val=\${$key-}"
  if [ -z "${val}" ]; then
    echo "[preflight] missing env: $key"
    return 1
  fi
}

status=0

require_cmd gcloud || status=1
require_cmd curl || status=1

require_env GCP_PROJECT_ID || status=1
require_env CLOUD_RUN_REGION || status=1
require_env ARTIFACT_REGISTRY_REPO || status=1

if command -v gcloud >/dev/null 2>&1; then
  active_account="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null || true)"
  if [ -z "${active_account}" ]; then
    echo "[preflight] no active gcloud account. run: gcloud auth login"
    status=1
  else
    echo "[preflight] active gcloud account: ${active_account}"
  fi

  current_project="$(gcloud config get-value project 2>/dev/null || true)"
  if [ -z "${current_project}" ] || [ "${current_project}" = "(unset)" ]; then
    echo "[preflight] gcloud project is not set"
    status=1
  else
    echo "[preflight] gcloud project: ${current_project}"
  fi

  if [ -n "${GCP_PROJECT_ID-}" ] && [ -n "${current_project}" ] && [ "${current_project}" != "${GCP_PROJECT_ID}" ]; then
    echo "[preflight] gcloud project (${current_project}) != GCP_PROJECT_ID (${GCP_PROJECT_ID})"
    status=1
  fi
fi

if [ "${status}" -ne 0 ]; then
  echo "[preflight] FAILED"
  exit 1
fi

echo "[preflight] PASSED"
