#!/usr/bin/env sh
set -eu

echo "[deploy] running staging preflight..."
sh ./scripts/staging-preflight.sh

echo "[deploy] 1/4 deploying ephemeris service (manual/independent lane)"
echo "[deploy] NOTE: ephemeris deploy is managed outside this monorepo script."
echo "[deploy] continue only after ephemeris /health and /ready are green."

echo "[deploy] 2/4 deploying api"
npm run deploy:cloudrun:api

echo "[deploy] 3/4 deploying worker"
npm run deploy:cloudrun:worker

echo "[deploy] 4/4 deploying web"
npm run deploy:cloudrun:web

echo "[deploy] applying idle cost guards"
npm run deploy:cloudrun:idle-guards

echo "[deploy] staging deploy sequence completed"
