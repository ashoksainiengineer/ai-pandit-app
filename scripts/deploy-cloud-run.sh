#!/usr/bin/env sh
set -eu

SERVICE_KIND="${1:-}"
DEPLOY_MODE="${CLOUD_RUN_DEPLOY_MODE:-development}"

if [ -z "$SERVICE_KIND" ]; then
  echo "Usage: scripts/deploy-cloud-run.sh <api|web|worker|ephemeris>"
  exit 1
fi

PROJECT_ID="${GCP_PROJECT_ID:-${GOOGLE_CLOUD_PROJECT:-}}"
REGION="${CLOUD_RUN_REGION:-asia-southeast1}"
REPOSITORY="${ARTIFACT_REGISTRY_REPO:-ai-pandit}"
IMAGE_TAG="${IMAGE_TAG:-$(date +%Y%m%d-%H%M%S)}"

if [ -z "$PROJECT_ID" ]; then
  echo "GCP_PROJECT_ID or GOOGLE_CLOUD_PROJECT is required"
  exit 1
fi

BUILD_ARGS=""
SECRET_VARS=""

case "$SERVICE_KIND" in
  api)
    SERVICE_NAME="${API_SERVICE_NAME:-api-service}"
    DOCKERFILE="deploy/cloudrun/api.Dockerfile"
    MEMORY="${API_MEMORY:-4Gi}"
    CPU="${API_CPU:-1}"
    CONCURRENCY="${API_CONCURRENCY:-20}"
    MIN_INSTANCES="${API_MIN_INSTANCES:-0}"
    MAX_INSTANCES="${API_MAX_INSTANCES:-2}"
    CPU_THROTTLING_FLAG="--cpu-throttling"
    EXTRA_VARS="DB_POOL_MAX=3,NODE_ENV=production,APP_REGION=${REGION},CLOUD_RUN_REGION=${REGION},JOB_EXECUTION_MODE=external_worker,USE_ASYNC_JOB_PIPELINE=${USE_ASYNC_JOB_PIPELINE:-true},USE_NEW_STREAM_PATH=${USE_NEW_STREAM_PATH:-true},AI_BASE_URL=${AI_BASE_URL:-https://api.deepseek.com},AI_MODEL=${AI_MODEL:-deepseek-reasoner},AI_REASONING_MODE=${AI_REASONING_MODE:-include_reasoning},EPHEMERIS_PROVIDER=${EPHEMERIS_PROVIDER:-skyfield},EPHEMERIS_ALLOW_ALGORITHMIC_FALLBACK=${EPHEMERIS_ALLOW_ALGORITHMIC_FALLBACK:-false},EPHEMERIS_SERVICE_URL=${EPHEMERIS_SERVICE_URL:?EPHEMERIS_SERVICE_URL is required for api deploy},EPHEMERIS_SERVICE_TIMEOUT_MS=${EPHEMERIS_SERVICE_TIMEOUT_MS:-15000},EPHEMERIS_BATCH_SIZE=${EPHEMERIS_BATCH_SIZE:-250},EPHEMERIS_HOUSE_SYSTEM=${EPHEMERIS_HOUSE_SYSTEM:-whole_sign},FRONTEND_URL=${WEB_FRONTEND_URL:-${FRONTEND_URL:-}},WORKER_POLL_INTERVAL_MS=${WORKER_POLL_INTERVAL_MS:-2000},JOB_SYNC_POLL_INTERVAL_MS=${JOB_SYNC_POLL_INTERVAL_MS:-2000},REDIS_TLS=${REDIS_TLS:-true}"
    ALLOWED_ORIGINS_VAR="${ALLOWED_ORIGINS:-${WEB_FRONTEND_URL:-${FRONTEND_URL:-}}}"
    SECRET_VARS="NEON_DATABASE_URL=neon-database-url:latest,REDIS_URL=redis-url:latest,AI_API_KEY=ai-api-key:latest,ENCRYPTION_SECRET=encryption-secret:latest,CLERK_SECRET_KEY=clerk-secret-key:latest"
    ;;
  web)
    SERVICE_NAME="${WEB_SERVICE_NAME:-web-service}"
    DOCKERFILE="deploy/cloudrun/web.Dockerfile"
    MEMORY="${WEB_MEMORY:-2Gi}"
    CPU="${WEB_CPU:-1}"
    CONCURRENCY="${WEB_CONCURRENCY:-80}"
    MIN_INSTANCES="${WEB_MIN_INSTANCES:-0}"
    MAX_INSTANCES="${WEB_MAX_INSTANCES:-2}"
    CPU_THROTTLING_FLAG="--cpu-throttling"
    WEB_BACKEND_TARGET="${WEB_BACKEND_URL:-${NEXT_PUBLIC_BACKEND_URL:?WEB_BACKEND_URL or NEXT_PUBLIC_BACKEND_URL is required for web deploy}}"
    WEB_FRONTEND_TARGET="${WEB_FRONTEND_URL:-${NEXT_PUBLIC_APP_URL:-}}"
    WEB_CLERK_PUBLISHABLE="${WEB_CLERK_PUBLISHABLE_KEY:-${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:?WEB_CLERK_PUBLISHABLE_KEY or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required for web deploy}}"
    EXTRA_VARS="DB_POOL_MAX=3,NODE_ENV=production,NEXT_PUBLIC_BACKEND_URL=${WEB_BACKEND_TARGET},NEXT_PUBLIC_APP_URL=${WEB_FRONTEND_TARGET},FRONTEND_URL=${WEB_FRONTEND_TARGET},APP_REGION=${REGION},CLOUD_RUN_REGION=${REGION},NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${WEB_CLERK_PUBLISHABLE},NEXT_PUBLIC_CLERK_SIGN_IN_URL=${NEXT_PUBLIC_CLERK_SIGN_IN_URL:-/sign-in},NEXT_PUBLIC_CLERK_SIGN_UP_URL=${NEXT_PUBLIC_CLERK_SIGN_UP_URL:-/sign-up},NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=${NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL:-/dashboard},NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=${NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL:-/dashboard}"
    BUILD_ARGS="      - --build-arg\n      - NEXT_PUBLIC_BACKEND_URL=${WEB_BACKEND_TARGET}\n      - --build-arg\n      - NEXT_PUBLIC_APP_URL=${WEB_FRONTEND_TARGET:-https://app.example.com}\n      - --build-arg\n      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${WEB_CLERK_PUBLISHABLE}"
    SECRET_VARS="NEON_DATABASE_URL=neon-database-url:latest,ENCRYPTION_SECRET=encryption-secret:latest,CLERK_SECRET_KEY=clerk-secret-key:latest"
    ;;
  worker)
    SERVICE_NAME="${WORKER_SERVICE_NAME:-worker-service}"
    DOCKERFILE="deploy/cloudrun/worker.Dockerfile"
    MEMORY="${WORKER_MEMORY:-8Gi}"
    CPU="${WORKER_CPU:-2}"
    CONCURRENCY="${WORKER_CONCURRENCY:-1}"
    MIN_INSTANCES="${WORKER_MIN_INSTANCES:-0}"
    MAX_INSTANCES="${WORKER_MAX_INSTANCES:-1}"
    CPU_THROTTLING_FLAG="--cpu-throttling"
    if [ "${DEPLOY_MODE}" = "production" ] && [ "${WORKER_ALWAYS_ON:-false}" = "true" ]; then
      MIN_INSTANCES="${WORKER_MIN_INSTANCES:-1}"
      CPU_THROTTLING_FLAG="--no-cpu-throttling"
    fi
    EXTRA_VARS="DB_POOL_MAX=3,NODE_ENV=production,APP_REGION=${REGION},CLOUD_RUN_REGION=${REGION},JOB_EXECUTION_MODE=external_worker,WORKER_POLL_INTERVAL_MS=${WORKER_POLL_INTERVAL_MS:-2000},WORKER_DRAIN_TIMEOUT_MS=${WORKER_DRAIN_TIMEOUT_MS:-30000},JOB_SYNC_POLL_INTERVAL_MS=${JOB_SYNC_POLL_INTERVAL_MS:-2000},USE_ASYNC_JOB_PIPELINE=${USE_ASYNC_JOB_PIPELINE:-true},USE_NEW_STREAM_PATH=${USE_NEW_STREAM_PATH:-true},AI_BASE_URL=${AI_BASE_URL:-https://api.deepseek.com},AI_MODEL=${AI_MODEL:-deepseek-reasoner},AI_REASONING_MODE=${AI_REASONING_MODE:-include_reasoning},EPHEMERIS_PROVIDER=${EPHEMERIS_PROVIDER:-skyfield},EPHEMERIS_ALLOW_ALGORITHMIC_FALLBACK=${EPHEMERIS_ALLOW_ALGORITHMIC_FALLBACK:-false},EPHEMERIS_SERVICE_URL=${EPHEMERIS_SERVICE_URL:?EPHEMERIS_SERVICE_URL is required for worker deploy},EPHEMERIS_SERVICE_TIMEOUT_MS=${EPHEMERIS_SERVICE_TIMEOUT_MS:-15000},EPHEMERIS_BATCH_SIZE=${EPHEMERIS_BATCH_SIZE:-250},EPHEMERIS_HOUSE_SYSTEM=${EPHEMERIS_HOUSE_SYSTEM:-whole_sign},REDIS_TLS=${REDIS_TLS:-true}"
    SECRET_VARS="NEON_DATABASE_URL=neon-database-url:latest,REDIS_URL=redis-url:latest,AI_API_KEY=ai-api-key:latest,ENCRYPTION_SECRET=encryption-secret:latest,CLERK_SECRET_KEY=clerk-secret-key:latest"
    ;;
  ephemeris)
    SERVICE_NAME="${EPHEMERIS_SERVICE_NAME:-ephemeris-service}"
    DOCKERFILE="deploy/cloudrun/ephemeris.Dockerfile"
    MEMORY="${EPHEMERIS_MEMORY:-1Gi}"
    CPU="${EPHEMERIS_CPU:-1}"
    CONCURRENCY="${EPHEMERIS_CONCURRENCY:-5}"
    MIN_INSTANCES="${EPHEMERIS_MIN_INSTANCES:-0}"
    MAX_INSTANCES="${EPHEMERIS_MAX_INSTANCES:-1}"
    CPU_THROTTLING_FLAG="--cpu-throttling"
    EXTRA_VARS="EPHEMERIS_DATA_DIR=${EPHEMERIS_DATA_DIR:-/app/data},EPHEMERIS_KERNEL_FILE=${EPHEMERIS_KERNEL_FILE:-de440s.bsp},EPHEMERIS_LOAD_KERNEL_ON_STARTUP=${EPHEMERIS_LOAD_KERNEL_ON_STARTUP:-true}"
    SECRET_VARS=""
    ;;
  *)
    echo "Unsupported service kind: $SERVICE_KIND"
    exit 1
    ;;
esac

IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${SERVICE_NAME}:${IMAGE_TAG}"
LATEST_IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${SERVICE_NAME}:latest"
TMP_CLOUDBUILD_CONFIG="$(mktemp)"

cleanup() {
  rm -f "${TMP_CLOUDBUILD_CONFIG}"
}

trap cleanup EXIT

cat > "${TMP_CLOUDBUILD_CONFIG}" <<EOF
steps:
  # Pull latest image for Docker layer caching
  - name: gcr.io/cloud-builders/docker
    entrypoint: bash
    args:
      - '-c'
      - |
        docker pull ${LATEST_IMAGE_URI} || exit 0
  # Build with cache-from for fast rebuilds on unchanged layers
  - name: gcr.io/cloud-builders/docker
    args:
      - build
      - -f
      - ${DOCKERFILE}
      - --cache-from
      - ${LATEST_IMAGE_URI}
${BUILD_ARGS}
      - -t
      - ${IMAGE_URI}
      - -t
      - ${LATEST_IMAGE_URI}
      - .
images:
  - ${IMAGE_URI}
  - ${LATEST_IMAGE_URI}
EOF

echo "Building image: ${IMAGE_URI}"
# Submit build asynchronously (avoids log-streaming permission requirement)
BUILD_OUTPUT=$(gcloud builds submit \
  --project="${PROJECT_ID}" \
  --config="${TMP_CLOUDBUILD_CONFIG}" \
  --async \
  --format='value(id)' \
  . 2>&1)
BUILD_ID=$(echo "${BUILD_OUTPUT}" | grep -E '^[a-f0-9-]{36}$' | tail -1)
if [ -z "${BUILD_ID}" ]; then
  echo "ERROR: Could not extract build ID from output:"
  echo "${BUILD_OUTPUT}"
  exit 1
fi
echo "Cloud Build ID: ${BUILD_ID}"
echo "Waiting for build to complete..."
# Poll build status (only needs cloudbuild.builds.get, not logging.viewer)
TIMEOUT=600
START=$(date +%s)
while true; do
  STATUS=$(gcloud builds describe "${BUILD_ID}" \
    --project="${PROJECT_ID}" \
    --format='value(status)' 2>/dev/null || echo 'UNKNOWN')
  case "${STATUS}" in
    SUCCESS)
      echo "Build completed successfully."
      break
      ;;
    FAILURE|INTERNAL_ERROR|TIMEOUT|CANCELLED)
      echo "ERROR: Build failed with status: ${STATUS}"
      echo "Logs: https://console.cloud.google.com/cloud-build/builds/${BUILD_ID}?project=${PROJECT_ID}"
      exit 1
      ;;
    QUEUED|WORKING)
      ELAPSED=$(($(date +%s) - START))
      if [ ${ELAPSED} -gt ${TIMEOUT} ]; then
        echo "ERROR: Build timed out after ${TIMEOUT}s"
        exit 1
      fi
      sleep 10
      ;;
    *)
      sleep 5
      ;;
  esac
done

echo "Deploying Cloud Run service: ${SERVICE_NAME}"
echo "Cloud Run deploy mode: ${DEPLOY_MODE}; min instances: ${MIN_INSTANCES}; max instances: ${MAX_INSTANCES}; cpu flag: ${CPU_THROTTLING_FLAG}"
if [ -n "${SECRET_VARS}" ]; then
  gcloud run deploy "${SERVICE_NAME}" \
    --project="${PROJECT_ID}" \
    --region="${REGION}" \
    --image="${IMAGE_URI}" \
    --platform=managed \
    --allow-unauthenticated \
    --memory="${MEMORY}" \
    --cpu="${CPU}" \
    --min="${MIN_INSTANCES}" \
    --max-instances="${MAX_INSTANCES}" \
    "${CPU_THROTTLING_FLAG}" \
    --set-env-vars="${EXTRA_VARS}" \
    --set-secrets="${SECRET_VARS}"
else
  gcloud run deploy "${SERVICE_NAME}" \
    --project="${PROJECT_ID}" \
    --region="${REGION}" \
    --image="${IMAGE_URI}" \
    --platform=managed \
    --allow-unauthenticated \
    --memory="${MEMORY}" \
    --cpu="${CPU}" \
    --min="${MIN_INSTANCES}" \
    --max-instances="${MAX_INSTANCES}" \
    "${CPU_THROTTLING_FLAG}" \
    --set-env-vars="${EXTRA_VARS}"
fi
# Set ALLOWED_ORIGINS separately to avoid comma-separator conflicts
# Set ALLOWED_ORIGINS separately to avoid comma-separator conflicts
if [ "${SERVICE_KIND}" = "api" ] && [ -n "${ALLOWED_ORIGINS_VAR}" ]; then
  echo "Setting ALLOWED_ORIGINS for ${SERVICE_NAME}"
  gcloud run services update "${SERVICE_NAME}" \
    --project="${PROJECT_ID}" \
    --region="${REGION}" \
    --update-env-vars="ALLOWED_ORIGINS=${ALLOWED_ORIGINS_VAR}"
fi

echo "Deployed ${SERVICE_NAME} to ${REGION}"
# Deploy verification - 2026-05-08 14:50:35 UTC
# Verified: 2026-05-08 14:51:49 UTC
