from pydantic import BaseModel, Field


class PlanetPositionResponse(BaseModel):
    body: str
    tropicalLongitude: float
    tropicalLatitude: float
    siderealLongitude: float | None = None
    distanceAu: float
    longitudeSpeed: float
    latitudeSpeed: float | None = None
    retrograde: bool


class HousesResponse(BaseModel):
    ascendantTropical: float
    mcTropical: float
    houseCuspsTropical: list[float] = Field(min_length=12, max_length=12)
    ascendantSidereal: float | None = None
    houseCuspsSidereal: list[float] | None = None


class ChartResponse(BaseModel):
    timestampUtc: str
    julianDayUt: float
    julianDayTt: float
    ayanamsha: float
    planets: list[PlanetPositionResponse]
    houses: HousesResponse


class BatchChartResponse(BaseModel):
    charts: list[ChartResponse]
