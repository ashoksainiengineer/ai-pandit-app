#!/usr/bin/env bash
# .env validation — exits with error if required env vars are missing
# Usage: bash scripts/validate-env.sh [--prod]

set -euo pipefail

MODE="${1:-dev}"
MISSING=()

# Required for all environments
REQUIRED=(
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
  "CLERK_SECRET_KEY"
  "NEON_DATABASE_URL"
  "REDIS_URL"
  "ENCRYPTION_SECRET"
)

# Production-only requirements
if [ "$MODE" = "--prod" ]; then
  REQUIRED+=(
    "DEEPSEEK_API_KEY"
    "AI_BASE_URL"
    "GCP_PROJECT_ID"
    "CLOUD_RUN_REGION"
  )
fi

for var in "${REQUIRED[@]}"; do
  if [ -z "${!var:-}" ]; then
    MISSING+=("$var")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "❌ Missing required environment variables:"
  for var in "${MISSING[@]}"; do
    echo "   - $var"
  done
  echo ""
  echo "Copy .env.example → .env.local and fill in the values."
  exit 1
fi

echo "✅ All required environment variables are set."
