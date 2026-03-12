#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
SERVICE_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

"$SERVICE_DIR/.venv/bin/python" -c "from skyfield.api import Loader; Loader('$SERVICE_DIR/data')('de440s.bsp')"
