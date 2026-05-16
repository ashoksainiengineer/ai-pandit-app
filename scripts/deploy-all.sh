#!/usr/bin/env bash
#
# AI-Pandit Unified Deployment Script
# Handles Cloud Run (API, Ephemeris) + Vercel (Web) deployments
#
# Usage:
#   scripts/deploy-all.sh                    # Deploy everything
#   scripts/deploy-all.sh api                # Deploy only API
#   scripts/deploy-all.sh web                # Deploy only Web (Vercel)
#   scripts/deploy-all.sh ephemeris          # Deploy only Ephemeris
#   scripts/deploy-all.sh --dry-run          # Validate without deploying
#   scripts/deploy-all.sh --skip-vercel      # Deploy backend only
#   scripts/deploy-all.sh --skip-cloudrun    # Deploy web only
#
# Prerequisites:
#   - gcloud CLI authenticated
#   - vercel CLI authenticated
#   - Required env vars set (see .env.production.example)
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$PROJECT_ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Flags
DRY_RUN=false
SKIP_VERCEL=false
SKIP_CLOUDRUN=false
DEPLOY_TARGET="all"

# Parse arguments
for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN=true
      ;;
    --skip-vercel)
      SKIP_VERCEL=true
      ;;
    --skip-cloudrun)
      SKIP_CLOUDRUN=true
      ;;
    api|web|ephemeris)
      DEPLOY_TARGET="$arg"
      ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: $0 [api|web|ephemeris] [--dry-run] [--skip-vercel] [--skip-cloudrun]"
      exit 1
      ;;
  esac
done

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_err()  { echo -e "${RED}[ERROR]${NC} $1"; }

# ─────────────────────────────────────────────────────────────
# PRE-FLIGHT CHECKS
# ─────────────────────────────────────────────────────────────
run_preflight() {
  log_info "Running pre-flight checks..."
  local failed=0

  # 1. Git clean
  if ! git diff --quiet && git diff --cached --quiet; then
    log_warn "Uncommitted changes detected. Commit before deploying:"
    git status --short
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]] || exit 1
  fi

  # 2. package-lock.json exists
  if [ ! -f "package-lock.json" ]; then
    log_err "package-lock.json missing. Run 'npm install' from root."
    failed=1
  fi

  # 3. Environment variables
  local required_vars=(GCP_PROJECT_ID CLOUD_RUN_REGION)
  for var in "${required_vars[@]}"; do
    if [ -z "${!var:-}" ]; then
      log_err "Required env var $var is not set"
      failed=1
    fi
  done

  # 4. gcloud available
  if ! command -v gcloud >/dev/null 2>&1; then
    log_err "gcloud CLI not found. Install: https://cloud.google.com/sdk/docs/install"
    failed=1
  fi

  # 5. vercel available (if deploying web)
  if [ "$SKIP_VERCEL" = false ] && [ "$DEPLOY_TARGET" != "api" ] && [ "$DEPLOY_TARGET" != "ephemeris" ]; then
    if ! command -v vercel >/dev/null 2>&1; then
      log_err "vercel CLI not found. Install: npm i -g vercel"
      failed=1
    fi
  fi

  # 6. Type checks
  log_info "Running type checks..."
  if ! npm --workspace @ai-pandit/shared run typecheck > /dev/null 2>&1; then
    log_err "packages/shared typecheck failed"
    failed=1
  else
    log_ok "packages/shared typecheck passed"
  fi

  if ! npm --workspace @ai-pandit/db run typecheck > /dev/null 2>&1; then
    log_err "packages/db typecheck failed"
    failed=1
  else
    log_ok "packages/db typecheck passed"
  fi

  if ! npm --workspace @ai-pandit/web run typecheck > /dev/null 2>&1; then
    log_err "apps/web typecheck failed"
    failed=1
  else
    log_ok "apps/web typecheck passed"
  fi

  if [ $failed -ne 0 ]; then
    log_err "Pre-flight checks failed. Fix errors before deploying."
    exit 1
  fi

  log_ok "All pre-flight checks passed"
}

# ─────────────────────────────────────────────────────────────
# CLOUD RUN DEPLOY
# ─────────────────────────────────────────────────────────────
deploy_cloudrun() {
  local service="$1"
  log_info "Deploying Cloud Run service: $service"

  if [ "$DRY_RUN" = true ]; then
    log_warn "[DRY RUN] Would deploy: scripts/deploy-cloud-run.sh $service"
    return 0
  fi

  if ! "${SCRIPT_DIR}/deploy-cloud-run.sh" "$service"; then
    log_err "Cloud Run deploy failed for $service"
    return 1
  fi

  log_ok "Cloud Run service deployed: $service"
}

# ─────────────────────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────────────────────
check_health() {
  local url="$1"
  local name="$2"
  local max_attempts=10
  local attempt=1

  log_info "Health check: $name ($url)"

  while [ $attempt -le $max_attempts ]; do
    if curl -sf "$url/health" > /dev/null 2>&1; then
      log_ok "$name is healthy"
      return 0
    fi
    log_warn "$name not ready (attempt $attempt/$max_attempts)..."
    sleep 5
    attempt=$((attempt + 1))
  done

  log_err "$name health check failed after $max_attempts attempts"
  return 1
}

# ─────────────────────────────────────────────────────────────
# VERCEL DEPLOY
# ─────────────────────────────────────────────────────────────
deploy_vercel() {
  log_info "Deploying to Vercel..."

  if [ "$DRY_RUN" = true ]; then
    log_warn "[DRY RUN] Would deploy: vercel deploy --prod"
    return 0
  fi

  # Ensure .vercel/project.json points to correct project
  if [ ! -f ".vercel/project.json" ]; then
    log_err ".vercel/project.json not found. Run 'vercel link' from repo root."
    return 1
  fi

  # Verify required env vars are set in Vercel
  local required_vercel_envs=(
    NEXT_PUBLIC_BACKEND_URL
    NEXT_PUBLIC_APP_URL
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  )

  for env_var in "${required_vercel_envs[@]}"; do
    if ! vercel env ls production 2>/dev/null | grep -q "$env_var"; then
      log_warn "Vercel env var $env_var not found in production. Set it with:"
      log_warn "  echo 'value' | vercel env add $env_var production"
    fi
  done

  # Deploy from repo root (monorepo root)
  if ! vercel deploy --prod; then
    log_err "Vercel deploy failed"
    return 1
  fi

  log_ok "Vercel deploy successful"
}

# ─────────────────────────────────────────────────────────────
# IDLE COST GUARDS
# ─────────────────────────────────────────────────────────────
apply_idle_guards() {
  log_info "Applying idle cost guards..."

  if [ "$DRY_RUN" = true ]; then
    log_warn "[DRY RUN] Would apply idle cost guards"
    return 0
  fi

  if [ -f "scripts/enforce-idle-cost-guards.sh" ]; then
    bash scripts/enforce-idle-cost-guards.sh
    log_ok "Idle cost guards applied"
  else
    log_warn "scripts/enforce-idle-cost-guards.sh not found, skipping"
  fi
}

# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────
main() {
  echo "========================================"
  echo "  AI-Pandit Deployment"
  echo "========================================"
  echo ""
  echo "  Target:    $DEPLOY_TARGET"
  echo "  Dry Run:   $DRY_RUN"
  echo "  Skip CR:   $SKIP_CLOUDRUN"
  echo "  Skip Web:  $SKIP_VERCEL"
  echo ""

  # Pre-flight
  run_preflight

  # Deploy backend services
  if [ "$SKIP_CLOUDRUN" = false ]; then
    if [ "$DEPLOY_TARGET" = "all" ] || [ "$DEPLOY_TARGET" = "ephemeris" ]; then
      deploy_cloudrun ephemeris
      # Get ephemeris URL for API deploy
      EPHEMERIS_URL=$(gcloud run services describe ephemeris-service \
        --project="${GCP_PROJECT_ID}" \
        --region="${CLOUD_RUN_REGION}" \
        --format='value(status.url)' 2>/dev/null || echo "")
      export EPHEMERIS_SERVICE_URL="${EPHEMERIS_URL}"
    fi

    if [ "$DEPLOY_TARGET" = "all" ] || [ "$DEPLOY_TARGET" = "api" ]; then
      deploy_cloudrun api
      API_URL=$(gcloud run services describe api-service \
        --project="${GCP_PROJECT_ID}" \
        --region="${CLOUD_RUN_REGION}" \
        --format='value(status.url)' 2>/dev/null || echo "")
      export WEB_BACKEND_URL="${API_URL}"
    fi

    if [ "$DEPLOY_TARGET" = "all" ] || [ "$DEPLOY_TARGET" = "api" ]; then
      API_URL=$(gcloud run services describe api-service \
        --project="${GCP_PROJECT_ID}" \
        --region="${CLOUD_RUN_REGION}" \
        --format='value(status.url)' 2>/dev/null || echo "")
      if [ -n "$API_URL" ]; then
        check_health "$API_URL" "API Service" || true
      fi
    fi

    if [ "$DEPLOY_TARGET" = "all" ] || [ "$DEPLOY_TARGET" = "ephemeris" ]; then
      EPHEMERIS_URL=$(gcloud run services describe ephemeris-service \
        --project="${GCP_PROJECT_ID}" \
        --region="${CLOUD_RUN_REGION}" \
        --format='value(status.url)' 2>/dev/null || echo "")
      if [ -n "$EPHEMERIS_URL" ]; then
        check_health "$EPHEMERIS_URL" "Ephemeris Service" || true
      fi
    fi
  fi

  # Deploy Vercel
  if [ "$SKIP_VERCEL" = false ] && [ "$DEPLOY_TARGET" != "api" ] && [ "$DEPLOY_TARGET" != "ephemeris" ]; then
    echo ""
    deploy_vercel
  fi

  # Apply cost guards
  if [ "$DEPLOY_TARGET" = "all" ] && [ "$DRY_RUN" = false ]; then
    echo ""
    apply_idle_guards
  fi

  echo ""
  echo "========================================"
  log_ok "Deployment complete!"
  echo "========================================"

  # Show URLs
  echo ""
  echo "Service URLs:"
  if [ "$SKIP_CLOUDRUN" = false ] && [ "$DEPLOY_TARGET" != "web" ]; then
    gcloud run services list \
      --project="${GCP_PROJECT_ID}" \
      --region="${CLOUD_RUN_REGION}" \
      --format="table(metadata.name,status.url)" 2>/dev/null || true
  fi
}

main "$@"
