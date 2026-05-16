import asyncio

from fastapi import APIRouter, Depends

from app.auth import verify_ephemeris_api_key
from app.models.chart import BatchChartResponse, ChartResponse
from app.models.ephemeris import BatchEphemerisRequest, SingleEphemerisRequest, SunriseRequest
from app.models.sunrise import SunriseResponse
from app.services.calculations import calculate_batch, calculate_chart, calculate_sunrise, calculate_sunset
from app.services.runtime import runtime

router = APIRouter(prefix="/v1", tags=["ephemeris"], dependencies=[Depends(verify_ephemeris_api_key)])


@router.post("/positions", response_model=ChartResponse)
async def positions(request: SingleEphemerisRequest) -> ChartResponse:
    await runtime.ensure_loaded_async()
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(calculate_chart, request.timestampUtc, request),
            timeout=30.0,
        )
    except asyncio.TimeoutError:
        from app.errors import ServiceInitializationError
        raise ServiceInitializationError("Ephemeris calculation timed out after 30 seconds")


@router.post("/positions/batch", response_model=BatchChartResponse)
async def positions_batch(request: BatchEphemerisRequest) -> BatchChartResponse:
    await runtime.ensure_loaded_async()
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(calculate_batch, request),
            timeout=120.0,
        )
    except asyncio.TimeoutError:
        from app.errors import ServiceInitializationError
        raise ServiceInitializationError("Batch ephemeris calculation timed out after 120 seconds")


@router.post("/sunrise", response_model=SunriseResponse)
async def sunrise(request: SunriseRequest) -> SunriseResponse:
    await runtime.ensure_loaded_async()
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(calculate_sunrise, request),
            timeout=30.0,
        )
    except asyncio.TimeoutError:
        from app.errors import ServiceInitializationError
        raise ServiceInitializationError("Sunrise calculation timed out after 30 seconds")


@router.post("/sunset", response_model=SunriseResponse)
async def sunset(request: SunriseRequest) -> SunriseResponse:
    await runtime.ensure_loaded_async()
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(calculate_sunset, request),
            timeout=30.0,
        )
    except asyncio.TimeoutError:
        from app.errors import ServiceInitializationError
        raise ServiceInitializationError("Sunset calculation timed out after 30 seconds")
