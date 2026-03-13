#!/usr/bin/env sh
set -eu

# Prevent accidental use of live production secrets in local/test runtime.
# Override only when intentional:
#   ALLOW_LIVE_SECRETS_IN_DEV=true npm -w @ai-pandit/api run phase6:release-gate

NODE_ENV_VALUE="${NODE_ENV:-development}"
ALLOW_LIVE="${ALLOW_LIVE_SECRETS_IN_DEV:-false}"

if [ "$NODE_ENV_VALUE" = "production" ]; then
  echo "[env-preflight] production runtime detected, skipping live-key guard."
  exit 0
fi

if [ "$ALLOW_LIVE" = "true" ]; then
  echo "[env-preflight] live-key guard bypassed by ALLOW_LIVE_SECRETS_IN_DEV=true."
  exit 0
fi

fail=0

if [ -n "${CLERK_SECRET_KEY:-}" ] && printf "%s" "$CLERK_SECRET_KEY" | grep -q '^sk_live_'; then
  echo "[env-preflight] blocked: CLERK_SECRET_KEY appears to be a live key in NODE_ENV=$NODE_ENV_VALUE."
  fail=1
fi

if [ -n "${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-}" ] && printf "%s" "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" | grep -q '^pk_live_'; then
  echo "[env-preflight] blocked: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY appears to be a live key in NODE_ENV=$NODE_ENV_VALUE."
  fail=1
fi

if [ "$fail" -eq 1 ]; then
  echo "[env-preflight] set ALLOW_LIVE_SECRETS_IN_DEV=true only for deliberate controlled tests."
  exit 1
fi

echo "[env-preflight] passed (NODE_ENV=$NODE_ENV_VALUE)."
