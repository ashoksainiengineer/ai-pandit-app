from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from skyfield.api import Loader

from app.config import get_settings
from app.errors import ServiceInitializationError

logger = logging.getLogger(__name__)


@dataclass
class RuntimeState:
    ready: bool = False
    kernel_loaded: bool = False
    kernel_file: str = ""
    error: str | None = None


class EphemerisRuntime:
    def __init__(self) -> None:
        settings = get_settings()
        self._settings = settings
        self._loader = Loader(str(settings.data_dir))
        self._state = RuntimeState(kernel_file=settings.kernel_file)
        self._kernel = None
        self._timescale = None

    @property
    def state(self) -> RuntimeState:
        return self._state

    def _load_kernel(self) -> None:
        self._timescale = self._loader.timescale()
        self._kernel = self._loader(self._settings.kernel_file)
        self._state.ready = True
        self._state.kernel_loaded = True
        self._state.error = None
        logger.info("Ephemeris kernel loaded", extra={"kernel_file": self._settings.kernel_file})

    async def bootstrap(self) -> None:
        self._settings.data_dir.mkdir(parents=True, exist_ok=True)

        if not self._settings.load_kernel_on_startup:
            self._state.ready = False
            self._state.kernel_loaded = False
            self._state.error = None
            logger.info("Ephemeris kernel loading deferred until first request")
            return

        try:
            self._load_kernel()
        except Exception as exc:  # pragma: no cover - startup path
            self._state.ready = False
            self._state.kernel_loaded = False
            self._state.error = str(exc)
            logger.exception("Failed to load ephemeris kernel")

    def ensure_loaded(self) -> None:
        if self._kernel is not None and self._timescale is not None:
            return

        try:
            self._load_kernel()
        except Exception as exc:  # pragma: no cover - runtime path
            self._state.ready = False
            self._state.kernel_loaded = False
            self._state.error = str(exc)
            raise ServiceInitializationError(
                f"Failed to load ephemeris kernel {self._settings.kernel_file}: {exc}"
            ) from exc

    async def ensure_loaded_async(self) -> None:
        """Load kernel asynchronously — for first request, runs in thread pool."""
        if self._kernel is not None and self._timescale is not None:
            return

        import asyncio
        loop = asyncio.get_running_loop()
        try:
            await loop.run_in_executor(None, self._load_kernel)
        except Exception as exc:
            self._state.ready = False
            self._state.kernel_loaded = False
            self._state.error = str(exc)
            raise ServiceInitializationError(
                f"Failed to load ephemeris kernel {self._settings.kernel_file}: {exc}"
            ) from exc

    def get_kernel(self) -> Any:
        self.ensure_loaded()
        if self._kernel is None:
            raise ServiceInitializationError("Ephemeris kernel is not available")
        return self._kernel

    def get_timescale(self) -> Any:
        self.ensure_loaded()
        if self._timescale is None:
            raise ServiceInitializationError("Skyfield timescale is not available")
        return self._timescale

    def health_payload(self) -> dict[str, object]:
        status = "healthy" if self._state.ready else "degraded"
        if self._state.error and not self._state.kernel_loaded:
            status = "unhealthy"

        return {
            "service": self._settings.service_name,
            "status": status,
            "ready": self._state.ready,
            "kernelLoaded": self._state.kernel_loaded,
            "kernelFile": self._state.kernel_file,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "version": self._settings.service_version,
            "error": self._state.error,
        }


runtime = EphemerisRuntime()
