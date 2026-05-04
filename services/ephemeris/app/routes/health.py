from fastapi import APIRouter, Response

from app.models.health import HealthResponse
from app.services.runtime import runtime

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(**runtime.health_payload())


@router.get("/ready", response_model=HealthResponse)
async def ready(response: Response) -> HealthResponse:
    payload = runtime.health_payload()
    if not payload["ready"]:
        response.status_code = 503
    return HealthResponse(**payload)


@router.get("/live", response_model=HealthResponse)
async def live() -> HealthResponse:
    """Kubernetes liveness probe — always returns healthy if process is alive."""
    payload = runtime.health_payload()
    payload["status"] = "alive"
    payload["ready"] = True  # Liveness doesn't care about kernel
    return HealthResponse(**payload)
