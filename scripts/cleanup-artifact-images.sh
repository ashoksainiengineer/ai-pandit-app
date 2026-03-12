#!/usr/bin/env sh
set -eu

PROJECT_ID="${GCP_PROJECT_ID:-${GOOGLE_CLOUD_PROJECT:-}}"
REGION="${CLOUD_RUN_REGION:-asia-southeast1}"
REPOSITORY="${ARTIFACT_REGISTRY_REPO:-ai-pandit}"
KEEP_PER_PACKAGE="${KEEP_PER_PACKAGE:-3}"

if [ -z "${PROJECT_ID}" ]; then
  echo "GCP_PROJECT_ID or GOOGLE_CLOUD_PROJECT is required"
  exit 1
fi

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud is required"
  exit 1
fi

TMP_FILE="$(mktemp)"
trap 'rm -f "${TMP_FILE}"' EXIT

gcloud artifacts docker images list \
  "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}" \
  --include-tags \
  --sort-by='~UPDATE_TIME' \
  --format='value(PACKAGE,TAGS)' > "${TMP_FILE}"

awk -v keep="${KEEP_PER_PACKAGE}" '
  {
    package=$1;
    tag=$2;
    if (tag == "" || tag == "(none)") next;
    counts[package]++;
    if (counts[package] > keep) {
      print package ":" tag;
    }
  }
' "${TMP_FILE}" | while IFS= read -r image_ref; do
  [ -n "${image_ref}" ] || continue
  echo "Deleting old image tag ${image_ref}"
  gcloud artifacts docker images delete "${image_ref}" --quiet --delete-tags
done

echo "Artifact Registry cleanup complete"
