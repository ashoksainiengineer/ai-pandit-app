#!/bin/bash
#
# External Warmup Script
# Run this from any free cron service (GitHub Actions, Cron-job.org, etc.)
# Keeps Vercel functions warm without requiring Pro tier
#

set -e

# Configuration
APP_URL="${APP_URL:-$1}"
TIMEOUT="${TIMEOUT:-10}"
ENDPOINTS=("/api/ping" "/api/health")

# Validate URL
if [ -z "$APP_URL" ]; then
    echo "❌ Error: APP_URL not set"
    echo "Usage: APP_URL=https://your-app.vercel.app ./scripts/external-warmup.sh"
    exit 1
fi

echo "🔥 Starting warmup for: $APP_URL"
echo "⏰ $(date)"
echo ""

# Ping each endpoint
for endpoint in "${ENDPOINTS[@]}"; do
    url="${APP_URL}${endpoint}"
    echo "📡 Pinging: $url"
    
    if curl -sSf "$url" \
        --max-time "$TIMEOUT" \
        --retry 2 \
        --retry-delay 1 \
        -H "Accept: application/json" \
        -o /dev/null; then
        echo "  ✅ Success"
    else
        echo "  ⚠️  Failed (will continue)"
    fi
done

echo ""
echo "✅ Warmup completed at $(date)"
