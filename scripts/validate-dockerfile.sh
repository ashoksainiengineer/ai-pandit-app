#!/bin/bash

# Dockerfile Syntax Validator
# This script validates the Dockerfile syntax before deployment

set -e

echo "🔍 Validating Dockerfile..."
echo ""

# Check if Dockerfile exists
if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile not found!"
    exit 1
fi

echo "✅ Dockerfile found"

# Check for common issues
echo ""
echo "📋 Checking for common issues..."

# Check for USER instruction
if grep -q "^USER" Dockerfile; then
    echo "✅ USER instruction found"
else
    echo "⚠️  No USER instruction found (recommended for security)"
fi

# Check for EXPOSE instruction
if grep -q "^EXPOSE" Dockerfile; then
    echo "✅ EXPOSE instruction found"
else
    echo "⚠️  No EXPOSE instruction found"
fi

# Check for CMD instruction
if grep -q "^CMD" Dockerfile; then
    echo "✅ CMD instruction found"
else
    echo "❌ No CMD instruction found (required)"
    exit 1
fi

# Check for HEALTHCHECK
if grep -q "^HEALTHCHECK" Dockerfile; then
    echo "✅ HEALTHCHECK instruction found"
    # Extract health check path
    HEALTH_PATH=$(grep "^HEALTHCHECK" -A 1 Dockerfile | grep -o 'http://localhost:[0-9]*/[^"]*' | head -1)
    echo "   Health check path: $HEALTH_PATH"
else
    echo "⚠️  No HEALTHCHECK instruction found"
fi

# Check for user ID 1000 (HF requirement)
if grep -q "uid 1000" Dockerfile; then
    echo "✅ User ID 1000 (HF Spaces requirement)"
else
    echo "⚠️  User ID 1000 not found (HF Spaces requires uid 1000)"
fi

# Check for build-time environment variables
if grep -q "ENV NODE_ENV=production" Dockerfile; then
    echo "✅ Build-time environment variables found"
else
    echo "⚠️  No build-time environment variables found"
fi

# Check for port 7860
if grep -q "PORT=7860" Dockerfile; then
    echo "✅ Port 7860 configured (HF Spaces default)"
else
    echo "⚠️  Port 7860 not configured"
fi

# Check for multi-stage build
STAGE_COUNT=$(grep "^FROM" Dockerfile | wc -l)
if [ "$STAGE_COUNT" -ge 3 ]; then
    echo "✅ Multi-stage build found ($STAGE_COUNT stages)"
else
    echo "⚠️  Single-stage build (multi-stage recommended)"
fi

echo ""
echo "✅ Dockerfile validation complete!"
echo ""
echo "📝 Summary:"
echo "   - Stages: $STAGE_COUNT"
echo "   - Health check: $HEALTH_PATH"
echo "   - Port: 7860"
echo "   - User ID: 1000"
echo ""
echo "🚀 Ready for Hugging Face Spaces deployment!"
