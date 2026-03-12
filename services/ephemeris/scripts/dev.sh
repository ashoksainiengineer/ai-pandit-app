#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
SERVICE_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

cd "$SERVICE_DIR"
exec .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port "${EPHEMERIS_SERVICE_PORT:-8000}" --reload
