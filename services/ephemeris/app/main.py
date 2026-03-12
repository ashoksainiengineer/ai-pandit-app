from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.errors import register_exception_handlers
from app.logging import configure_logging
from app.routes.health import router as health_router
from app.routes.v1.ephemeris import router as ephemeris_router
from app.services.runtime import runtime


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    await runtime.bootstrap()
    yield


app = FastAPI(
    title="AI-Pandit Ephemeris Service",
    version="0.1.0",
    lifespan=lifespan,
)

register_exception_handlers(app)
app.include_router(health_router)
app.include_router(ephemeris_router)
