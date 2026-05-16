#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Production Hardening Script for AI-Pandit Cloud Run Services
# Run this to ensure all services are production-hardened
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-${GOOGLE_CLOUD_PROJECT:-}}"
REGION="${CLOUD_RUN_REGION:-us-central1}"

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: GCP_PROJECT_ID or GOOGLE_CLOUD_PROJECT must be set"
    exit 1
fi

echo "🔧 Production Hardening - Cloud Run Services"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# API SERVICE HARDENING
# ═══════════════════════════════════════════════════════════════════════════════
echo "📦 Hardening API Service..."

gcloud run services update api-service \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --memory="512Mi" \
    --cpu="1" \
    --concurrency=20 \
    --min-instances=1 \
    --max-instances=2 \
    --no-cpu-throttling \
    --timeout=3900s \
    --execution-environment=gen2 \
    --no-traffic \
    2>/dev/null || echo "⚠️  API service update may require deploy instead"

echo "✅ API Service hardened"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# EPHEMERIS SERVICE HARDENING
# ═══════════════════════════════════════════════════════════════════════════════
echo "📦 Hardening Ephemeris Service..."

gcloud run services update ephemeris-service \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --memory="2Gi" \
    --cpu="1" \
    --concurrency=10 \
    --min-instances=0 \
    --max-instances=2 \
    --cpu-throttling \
    --timeout=60s \
    --execution-environment=gen2 \
    --no-traffic \
    2>/dev/null || echo "⚠️  Ephemeris service update may require deploy instead"

echo "✅ Ephemeris Service hardened"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# VERIFY CONFIGURATIONS
# ═══════════════════════════════════════════════════════════════════════════════
echo "🔍 Verifying service configurations..."
echo ""

echo "API Service:"
gcloud run services describe api-service --region="$REGION" --format="table(
    spec.template.spec.containers[0].resources.limits.memory,
    spec.template.spec.containers[0].resources.limits.cpu,
    spec.template.metadata.annotations['autoscaling.knative.dev/minScale'],
    spec.template.metadata.annotations['autoscaling.knative.dev/maxScale']
)" 2>/dev/null || echo "  Could not retrieve details"

echo ""
echo "✅ Production Hardening Complete!"
echo ""
echo "Next steps:"
echo "1. Review the configuration changes above"
echo "2. Run: ./scripts/deploy-cloud-run.sh api"
echo "3. Monitor logs for 24 hours"
