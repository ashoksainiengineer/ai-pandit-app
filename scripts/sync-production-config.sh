#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "${SCRIPT_DIR}/.." && pwd)

ENV_FILE="${REPO_ROOT}/.env.local"
TARGETS="github,gcp,vercel"
APPLY_CHANGES="false"
GITHUB_REPO=""
VERCEL_CWD="${REPO_ROOT}/apps/web"
ARTIFACT_REPO="${ARTIFACT_REGISTRY_REPO:-ai-pandit}"
REGION="${CLOUD_RUN_REGION:-asia-southeast1}"
PROJECT_ID="${GCP_PROJECT_ID:-${GOOGLE_CLOUD_PROJECT:-}}"

usage() {
  cat <<'EOF'
Usage: scripts/sync-production-config.sh [options]

Safely sync production configuration from a local env file to GitHub Actions,
Google Secret Manager, and Vercel.

Options:
  --env-file PATH           Source env file (default: .env.local)
  --targets LIST            Comma-separated targets: github,gcp,vercel
  --project-id ID           Google Cloud project id override
  --region REGION           Cloud Run region / GitHub variable value
  --artifact-repo NAME      Artifact Registry repo name (default: ai-pandit)
  --github-repo OWNER/REPO  GitHub repo override for gh commands
  --vercel-cwd PATH         Linked Vercel project directory (default: apps/web)
  --apply                   Perform writes; otherwise run in dry-run mode
  --help                    Show this message

Examples:
  sh scripts/sync-production-config.sh
  sh scripts/sync-production-config.sh --targets github,gcp --apply
  sh scripts/sync-production-config.sh --env-file /secure/prod.env --apply
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    --targets)
      TARGETS="$2"
      shift 2
      ;;
    --project-id)
      PROJECT_ID="$2"
      shift 2
      ;;
    --region)
      REGION="$2"
      shift 2
      ;;
    --artifact-repo)
      ARTIFACT_REPO="$2"
      shift 2
      ;;
    --github-repo)
      GITHUB_REPO="$2"
      shift 2
      ;;
    --vercel-cwd)
      VERCEL_CWD="$2"
      shift 2
      ;;
    --apply)
      APPLY_CHANGES="true"
      shift
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [ ! -f "$ENV_FILE" ]; then
  echo "Env file not found: $ENV_FILE" >&2
  exit 1
fi

has_target() {
  case ",${TARGETS}," in
    *",$1,"*) return 0 ;;
    *) return 1 ;;
  esac
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "$1 is required for this target" >&2
    exit 1
  fi
}

mask_value() {
  VALUE="$1" node <<'EOF'
const value = process.env.VALUE ?? '';
if (!value) {
  process.stdout.write('[missing]');
} else if (value.length <= 8) {
  process.stdout.write('*'.repeat(value.length));
} else {
  process.stdout.write(`${value.slice(0, 4)}...${value.slice(-4)}`);
}
EOF
}

log_write() {
  if [ "$APPLY_CHANGES" = "true" ]; then
    printf '[apply] %s\n' "$1"
  else
    printf '[dry-run] %s\n' "$1"
  fi
}

require_value() {
  KEY="$1"
  VALUE="$2"
  if [ -z "$VALUE" ]; then
    echo "Missing required value: ${KEY}" >&2
    exit 1
  fi
}

reject_local_production_value() {
  KEY="$1"
  VALUE="$2"
  case "$VALUE" in
    *localhost*|*127.0.0.1*|*0.0.0.0*|*://::1*|*postgres@127.0.0.1*|*redis://127.0.0.1*|*redis://localhost*)
      echo "Refusing to apply ${KEY} because it still points at a local development value" >&2
      exit 1
      ;;
    *)
      ;;
  esac
}

create_or_update_gcp_secret() {
  SECRET_NAME="$1"
  SECRET_VALUE="$2"

  if gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" >/dev/null 2>&1; then
    :
  else
    log_write "Create Google Secret Manager secret ${SECRET_NAME}"
    if [ "$APPLY_CHANGES" = "true" ]; then
      gcloud secrets create "$SECRET_NAME" --project="$PROJECT_ID" --replication-policy=automatic >/dev/null
    fi
  fi

  log_write "Add latest version for Google Secret Manager secret ${SECRET_NAME}"
  if [ "$APPLY_CHANGES" = "true" ]; then
    printf '%s' "$SECRET_VALUE" | gcloud secrets versions add "$SECRET_NAME" --project="$PROJECT_ID" --data-file=- >/dev/null
  fi
}

set_github_secret() {
  NAME="$1"
  VALUE="$2"
  log_write "Set GitHub Actions secret ${NAME}"
  if [ "$APPLY_CHANGES" = "true" ]; then
    if [ -n "$GITHUB_REPO" ]; then
      printf '%s' "$VALUE" | gh secret set "$NAME" -R "$GITHUB_REPO" >/dev/null
    else
      printf '%s' "$VALUE" | gh secret set "$NAME" >/dev/null
    fi
  fi
}

set_github_variable() {
  NAME="$1"
  VALUE="$2"
  log_write "Set GitHub Actions variable ${NAME}"
  if [ "$APPLY_CHANGES" = "true" ]; then
    if [ -n "$GITHUB_REPO" ]; then
      gh variable set "$NAME" -R "$GITHUB_REPO" --body "$VALUE" >/dev/null
    else
      gh variable set "$NAME" --body "$VALUE" >/dev/null
    fi
  fi
}

upsert_vercel_env() {
  NAME="$1"
  VALUE="$2"
  ENVIRONMENT="$3"

  if vercel env list "$ENVIRONMENT" --cwd "$VERCEL_CWD" 2>/dev/null | grep -q "^[[:space:]]*${NAME}[[:space:]]"; then
    log_write "Update Vercel env ${NAME} (${ENVIRONMENT})"
    if [ "$APPLY_CHANGES" = "true" ]; then
      printf '%s\n' "$VALUE" | vercel env update "$NAME" "$ENVIRONMENT" --cwd "$VERCEL_CWD" -y >/dev/null
    fi
  else
    log_write "Add Vercel env ${NAME} (${ENVIRONMENT})"
    if [ "$APPLY_CHANGES" = "true" ]; then
      printf '%s\n' "$VALUE" | vercel env add "$NAME" "$ENVIRONMENT" --cwd "$VERCEL_CWD" >/dev/null
    fi
  fi
}

load_env_file() {
  while IFS= read -r ASSIGNMENT; do
    if [ -n "$ASSIGNMENT" ]; then
      eval "export $ASSIGNMENT"
    fi
  done <<EOF
$(ENV_PATH="$ENV_FILE" node <<'EOF'
const fs = require('fs');

const lines = fs.readFileSync(process.env.ENV_PATH, 'utf8').split(/\r?\n/);

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    continue;
  }

  const normalized = trimmed.startsWith('export ') ? trimmed.slice(7).trim() : trimmed;
  const separatorIndex = normalized.indexOf('=');
  if (separatorIndex === -1) {
    continue;
  }

  const key = normalized.slice(0, separatorIndex).trim();
  let value = normalized.slice(separatorIndex + 1).trim();

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }

  const escapedValue = value.replace(/'/g, `'\\''`);
  process.stdout.write(`${key}='${escapedValue}'\n`);
}
EOF
)
EOF
}

load_env_file

RESOLVED_DATABASE_URL="${NEON_DATABASE_URL:-${DATABASE_URL:-${POSTGRES_URL:-}}}"
RESOLVED_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL:-${BACKEND_URL:-}}"
RESOLVED_APP_URL="${NEXT_PUBLIC_APP_URL:-${FRONTEND_URL:-}}"
RESOLVED_CLERK_PUBLISHABLE_KEY="${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-${CLERK_PUBLISHABLE_KEY:-}}"

if [ -z "$PROJECT_ID" ]; then
  PROJECT_ID="${GCP_PROJECT_ID:-${GOOGLE_CLOUD_PROJECT:-}}"
fi

if has_target github; then
  require_command gh
  require_value RESOLVED_DATABASE_URL "$RESOLVED_DATABASE_URL"
  require_value REDIS_URL "${REDIS_URL:-}"
  require_value AI_API_KEY "${AI_API_KEY:-}"
  require_value CLERK_SECRET_KEY "${CLERK_SECRET_KEY:-}"
  require_value ENCRYPTION_SECRET "${ENCRYPTION_SECRET:-}"
  require_value RESOLVED_CLERK_PUBLISHABLE_KEY "$RESOLVED_CLERK_PUBLISHABLE_KEY"
  require_value RESOLVED_APP_URL "$RESOLVED_APP_URL"
  require_value PROJECT_ID "$PROJECT_ID"
fi

if has_target gcp; then
  require_command gcloud
  require_value PROJECT_ID "$PROJECT_ID"
  require_value RESOLVED_DATABASE_URL "$RESOLVED_DATABASE_URL"
  require_value REDIS_URL "${REDIS_URL:-}"
  require_value AI_API_KEY "${AI_API_KEY:-}"
  require_value CLERK_SECRET_KEY "${CLERK_SECRET_KEY:-}"
  require_value ENCRYPTION_SECRET "${ENCRYPTION_SECRET:-}"
fi

if has_target vercel; then
  require_command vercel
  require_value RESOLVED_DATABASE_URL "$RESOLVED_DATABASE_URL"
  require_value REDIS_URL "${REDIS_URL:-}"
  require_value AI_API_KEY "${AI_API_KEY:-}"
  require_value CLERK_SECRET_KEY "${CLERK_SECRET_KEY:-}"
  require_value CLERK_WEBHOOK_SECRET "${CLERK_WEBHOOK_SECRET:-}"
  require_value ENCRYPTION_SECRET "${ENCRYPTION_SECRET:-}"
  require_value RESOLVED_CLERK_PUBLISHABLE_KEY "$RESOLVED_CLERK_PUBLISHABLE_KEY"
  require_value RESOLVED_BACKEND_URL "$RESOLVED_BACKEND_URL"
  require_value RESOLVED_APP_URL "$RESOLVED_APP_URL"
  require_value AI_BASE_URL "${AI_BASE_URL:-}"
  require_value AI_MODEL "${AI_MODEL:-}"
  require_value EPHEMERIS_SERVICE_URL "${EPHEMERIS_SERVICE_URL:-}"
fi

if [ "$APPLY_CHANGES" = "true" ]; then
  MODE="apply"
else
  MODE="dry-run"
fi

if [ "$APPLY_CHANGES" = "true" ]; then
  if has_target github || has_target gcp || has_target vercel; then
    reject_local_production_value RESOLVED_DATABASE_URL "$RESOLVED_DATABASE_URL"
    reject_local_production_value REDIS_URL "$REDIS_URL"
  fi
  if has_target github || has_target vercel; then
    reject_local_production_value RESOLVED_BACKEND_URL "$RESOLVED_BACKEND_URL"
    reject_local_production_value RESOLVED_APP_URL "$RESOLVED_APP_URL"
  fi
fi

echo "Mode: ${MODE}"
echo "Env file: ${ENV_FILE}"
echo "Targets: ${TARGETS}"
echo "Project id: ${PROJECT_ID:-[not set]}"
echo "Region: ${REGION}"
echo "Artifact repo: ${ARTIFACT_REPO}"
echo "Backend URL: $(mask_value "$RESOLVED_BACKEND_URL")"
echo "App URL: $(mask_value "$RESOLVED_APP_URL")"

if has_target github; then
  echo ""
  echo "GitHub Actions secrets and variables"
  set_github_secret NEON_DATABASE_URL "$RESOLVED_DATABASE_URL"
  set_github_secret DATABASE_URL "$RESOLVED_DATABASE_URL"
  set_github_secret REDIS_URL "$REDIS_URL"
  set_github_secret AI_API_KEY "$AI_API_KEY"
  set_github_secret CLERK_SECRET_KEY "$CLERK_SECRET_KEY"
  set_github_secret CLERK_SECRET_KEY_TEST "$CLERK_SECRET_KEY"
  set_github_secret ENCRYPTION_SECRET "$ENCRYPTION_SECRET"
  set_github_secret NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY "$RESOLVED_CLERK_PUBLISHABLE_KEY"
  set_github_secret NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_TEST "$RESOLVED_CLERK_PUBLISHABLE_KEY"
  set_github_secret GCP_PROJECT_ID "$PROJECT_ID"
  set_github_secret VERCEL_URL "$RESOLVED_APP_URL"
  set_github_variable CLOUD_RUN_REGION "$REGION"
  set_github_variable ARTIFACT_REGISTRY_REPO "$ARTIFACT_REPO"
  echo "  - GCP_SA_KEY: manual follow-up unless the workflow is migrated to Workload Identity Federation"
fi

if has_target gcp; then
  echo ""
  echo "Google Secret Manager"
  create_or_update_gcp_secret neon-database-url "$RESOLVED_DATABASE_URL"
  create_or_update_gcp_secret redis-url "$REDIS_URL"
  create_or_update_gcp_secret ai-api-key "$AI_API_KEY"
  create_or_update_gcp_secret encryption-secret "$ENCRYPTION_SECRET"
  create_or_update_gcp_secret clerk-secret-key "$CLERK_SECRET_KEY"
fi

if has_target vercel; then
  echo ""
  echo "Vercel production env vars"
  upsert_vercel_env NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY "$RESOLVED_CLERK_PUBLISHABLE_KEY" production
  upsert_vercel_env CLERK_SECRET_KEY "$CLERK_SECRET_KEY" production
  upsert_vercel_env CLERK_WEBHOOK_SECRET "$CLERK_WEBHOOK_SECRET" production
  upsert_vercel_env NEXT_PUBLIC_BACKEND_URL "$RESOLVED_BACKEND_URL" production
  upsert_vercel_env NEXT_PUBLIC_APP_URL "$RESOLVED_APP_URL" production
  upsert_vercel_env NEON_DATABASE_URL "$RESOLVED_DATABASE_URL" production
  upsert_vercel_env REDIS_URL "$REDIS_URL" production
  upsert_vercel_env ENCRYPTION_SECRET "$ENCRYPTION_SECRET" production
  upsert_vercel_env AI_API_KEY "$AI_API_KEY" production
  upsert_vercel_env AI_BASE_URL "$AI_BASE_URL" production
  upsert_vercel_env AI_MODEL "$AI_MODEL" production
  upsert_vercel_env EPHEMERIS_SERVICE_URL "$EPHEMERIS_SERVICE_URL" production
fi

echo ""
echo "Done."
