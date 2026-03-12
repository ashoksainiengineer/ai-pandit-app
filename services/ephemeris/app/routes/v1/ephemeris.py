from fastapi import APIRouter

from app.models.chart import BatchChartResponse, ChartResponse
from app.models.ephemeris import BatchEphemerisRequest, SingleEphemerisRequest, SunriseRequest
from app.models.sunrise import SunriseResponse
from app.services.calculations import calculate_batch, calculate_chart, calculate_sunrise

router = APIRouter(prefix="/v1", tags=["ephemeris"])


@router.post("/positions", response_model=ChartResponse)
async def positions(request: SingleEphemerisRequest) -> ChartResponse:
    return calculate_chart(request.timestampUtc, request)


@router.post("/positions/batch", response_model=BatchChartResponse)
async def positions_batch(request: BatchEphemerisRequest) -> BatchChartResponse:
    return calculate_batch(request)


@router.post("/sunrise", response_model=SunriseResponse)
async def sunrise(request: SunriseRequest) -> SunriseResponse:
    return calculate_sunrise(request)
