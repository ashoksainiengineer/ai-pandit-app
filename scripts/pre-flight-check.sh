#!/usr/bin/env bash
#
# Deployment Pre-Flight Checklist for AI-Pandit
# Run this BEFORE every deployment to catch issues early
#
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0
WARN=0

check_pass() {
  echo -e "${GREEN}✓${NC} $1"
  ((PASS++))
}

check_fail() {
  echo -e "${RED}✗${NC} $1"
  ((FAIL++))
}

check_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
  ((WARN++))
}

echo "========================================"
echo "  AI-Pandit Deployment Pre-Flight Check"
echo "========================================"
echo ""

# 1. Git Status
echo "--- 1. Git Status ---"
if git diff --quiet && git diff --cached --quiet; then
  check_pass "Working tree is clean"
else
  check_warn "Uncommitted changes detected. Commit before deploying:"
  git status --short
fi

# 2. Check for large files that shouldn't be in git
echo ""
echo "--- 2. Large Files Check ---"
LARGE_FILES=$(git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | awk '$1 == "blob" && $3 > 1048576 {print $3, $4}' | sort -rn | head -10)
if [ -z "$LARGE_FILES" ]; then
  check_pass "No large files (>1MB) in git"
else
  check_warn "Large files detected (>1MB):"
  echo "$LARGE_FILES" | while read size file; do
    echo "     $(numfmt --to=iec-i $size)  $file"
  done
fi

# 3. Check .gcloudignore exists and is comprehensive
echo ""
echo "--- 3. .gcloudignore Check ---"
if [ -f ".gcloudignore" ]; then
  check_pass ".gcloudignore exists"
  MISSING_PATTERNS=()
  for pattern in ".git/" "node_modules/" ".next/" "*.log" ".env*" "dia-assets/" "docs/" "e2e/" "scripts/"; do
    if ! grep -q "$pattern" .gcloudignore 2>/dev/null; then
      MISSING_PATTERNS+=("$pattern")
    fi
  done
  if [ ${#MISSING_PATTERNS[@]} -eq 0 ]; then
    check_pass ".gcloudignore has all recommended patterns"
  else
    check_warn ".gcloudignore missing patterns: ${MISSING_PATTERNS[*]}"
  fi
else
  check_fail ".gcloudignore missing! Cloud Build will upload unnecessary files."
fi

# 4. Check .dockerignore
echo ""
echo "--- 4. .dockerignore Check ---"
if [ -f ".dockerignore" ]; then
  check_pass ".dockerignore exists"
else
  check_warn ".dockerignore missing"
fi

# 5. Type Check: packages/shared
echo ""
echo "--- 5. Type Check: packages/shared ---"
if npm --workspace @ai-pandit/shared run typecheck 2>&1 | tail -5 | grep -q "error TS"; then
  check_fail "packages/shared has TypeScript errors"
else
  check_pass "packages/shared typecheck clean"
fi

# 6. Type Check: packages/db
echo ""
echo "--- 6. Type Check: packages/db ---"
if npm --workspace @ai-pandit/db run typecheck 2>&1 | tail -5 | grep -q "error TS"; then
  check_fail "packages/db has TypeScript errors"
else
  check_pass "packages/db typecheck clean"
fi

# 7. Type Check: apps/web
echo ""
echo "--- 7. Type Check: apps/web ---"
if npm --workspace @ai-pandit/web run typecheck 2>&1 | tail -5 | grep -q "error TS"; then
  check_fail "apps/web has TypeScript errors"
else
  check_pass "apps/web typecheck clean"
fi

# 8. Build Check: apps/web (local simulation)
echo ""
echo "--- 8. Build Check: apps/web ---"
if npm --workspace @ai-pandit/web run build:app 2>&1 | tail -10 | grep -qi "error"; then
  check_fail "apps/web build failed"
else
  check_pass "apps/web build successful"
fi

# 9. Check workspace dependencies resolve
echo ""
echo "--- 9. Workspace Dependencies ---"
if [ -d "node_modules/@ai-pandit/shared" ] && [ -d "node_modules/@ai-pandit/db" ]; then
  check_pass "Workspace packages linked in node_modules"
else
  check_fail "Workspace packages NOT linked. Run 'npm install' from root."
fi

# 10. Environment Variables Check
echo ""
echo "--- 10. Production Env Variables ---"
ENV_ISSUES=0
for var in GCP_PROJECT_ID CLOUD_RUN_REGION WEB_FRONTEND_URL EPHEMERIS_SERVICE_URL; do
  if [ -z "${!var:-}" ]; then
    check_fail "Environment variable $var is not set"
    ENV_ISSUES=1
  fi
done
if [ $ENV_ISSUES -eq 0 ]; then
  check_pass "Required env variables are set"
fi

# 11. Check vercel.json configuration
echo ""
echo "--- 11. Vercel Configuration ---"
if [ -f "apps/web/vercel.json" ]; then
  if grep -q 'cd ../..' apps/web/vercel.json; then
    check_pass "vercel.json runs install/build from monorepo root"
  else
    check_warn "vercel.json may not handle monorepo workspaces correctly"
  fi
else
  check_fail "apps/web/vercel.json missing"
fi

# 12. Check for common dependency issues
echo ""
echo "--- 12. Dependency Sanity Check ---"
if npm ls @ai-pandit/db --silent 2>/dev/null | grep -q "@ai-pandit/db"; then
  check_pass "@ai-pandit/db resolves correctly"
else
  check_fail "@ai-pandit/db dependency issue detected"
fi

if npm ls @ai-pandit/shared --silent 2>/dev/null | grep -q "@ai-pandit/shared"; then
  check_pass "@ai-pandit/shared resolves correctly"
else
  check_fail "@ai-pandit/shared dependency issue detected"
fi

# 13. Check Cloud Run services health (if already deployed)
echo ""
echo "--- 13. Existing Cloud Run Services ---"
if command -v gcloud &> /dev/null; then
  PROJECT_ID="${GCP_PROJECT_ID:-${GOOGLE_CLOUD_PROJECT:-}}"
  if [ -n "$PROJECT_ID" ]; then
    SERVICES=$(gcloud run services list --project="$PROJECT_ID" --region="${CLOUD_RUN_REGION:-asia-southeast1}" --format="value(metadata.name)" 2>/dev/null || true)
    if [ -n "$SERVICES" ]; then
      check_pass "Cloud Run services found: $(echo $SERVICES | tr '\n' ' ')"
    else
      check_warn "No Cloud Run services found (first deploy?)"
    fi
  else
    check_warn "GCP_PROJECT_ID not set, skipping Cloud Run check"
  fi
else
  check_warn "gcloud CLI not available, skipping Cloud Run check"
fi

# Summary
echo ""
echo "========================================"
echo "  Pre-Flight Summary"
echo "========================================"
echo -e "${GREEN}Passed: ${PASS}${NC}"
echo -e "${YELLOW}Warnings: ${WARN}${NC}"
echo -e "${RED}Failed: ${FAIL}${NC}"
echo ""

if [ $FAIL -gt 0 ]; then
  echo -e "${RED}DEPLOYMENT BLOCKED: Fix ${FAIL} failed check(s) before deploying.${NC}"
  exit 1
elif [ $WARN -gt 0 ]; then
  echo -e "${YELLOW}DEPLOY WITH CAUTION: ${WARN} warning(s) found.${NC}"
  echo "Review warnings above before proceeding."
  exit 0
else
  echo -e "${GREEN}ALL CHECKS PASSED. Ready to deploy!${NC}"
  exit 0
fi
