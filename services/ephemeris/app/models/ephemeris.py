from typing import Literal

from pydantic import BaseModel, Field


class LocationRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    altitudeMeters: float = Field(default=0, ge=-500, le=12000)


class EphemerisBaseRequest(BaseModel):
    location: LocationRequest
    ayanamshaMode: Literal["lahiri", "krishnamurti"] = "lahiri"
    houseSystem: Literal["whole_sign", "equal", "placidus"] = "placidus"
    nodeMode: Literal["true", "mean"] = "true"
    topocentricMoon: bool = False


class SingleEphemerisRequest(EphemerisBaseRequest):
    timestampUtc: str


class BatchEphemerisRequest(EphemerisBaseRequest):
    timestampsUtc: list[str] = Field(..., min_length=1, max_length=500)


class SunriseRequest(BaseModel):
    startTimestampUtc: str
    endTimestampUtc: str
    location: LocationRequest
