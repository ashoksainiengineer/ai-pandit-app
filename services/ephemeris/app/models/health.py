from pydantic import BaseModel


class HealthResponse(BaseModel):
    service: str
    status: str
    ready: bool
    kernelLoaded: bool
    kernelFile: str
    timestamp: str
    version: str
    error: str | None = None
