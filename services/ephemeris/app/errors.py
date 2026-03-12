from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class ServiceInitializationError(RuntimeError):
    """Raised when the ephemeris service cannot initialize required resources."""


class NotImplementedRouteError(RuntimeError):
    """Raised when a route shape exists but the implementation is not ready."""


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ValueError)
    async def handle_value_error(
        _request: Request,
        exc: ValueError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={
                "service": "ephemeris",
                "status": "invalid-request",
                "error": str(exc),
            },
        )

    @app.exception_handler(ServiceInitializationError)
    async def handle_initialization_error(
        _request: Request,
        exc: ServiceInitializationError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=503,
            content={
                "service": "ephemeris",
                "status": "unhealthy",
                "error": str(exc),
            },
        )

    @app.exception_handler(NotImplementedRouteError)
    async def handle_not_implemented_error(
        _request: Request,
        exc: NotImplementedRouteError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=501,
            content={
                "service": "ephemeris",
                "status": "degraded",
                "error": str(exc),
            },
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(
        _request: Request,
        exc: Exception,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content={
                "service": "ephemeris",
                "status": "error",
                "error": str(exc),
            },
        )
