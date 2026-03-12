#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
SERVICE_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

if [ ! -d "$SERVICE_DIR/.venv" ]; then
  python3 -m venv "$SERVICE_DIR/.venv"
fi

"$SERVICE_DIR/.venv/bin/pip" install --upgrade pip
"$SERVICE_DIR/.venv/bin/pip" install -e "$SERVICE_DIR[dev]"
