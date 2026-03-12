from typing import Literal

from pydantic import BaseModel, Field


class LocationRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    altitudeMeters: float = Field(default=0, ge=-500, le=12000)


class EphemerisBaseRequest(BaseModel):
    location: LocationRequest
    ayanamshaMode: Literal["lahiri"] = "lahiri"
    houseSystem: Literal["whole_sign", "equal", "placidus"] = "placidus"
    nodeMode: Literal["true", "mean"] = "true"


class SingleEphemerisRequest(EphemerisBaseRequest):
    timestampUtc: str


class BatchEphemerisRequest(EphemerisBaseRequest):
    timestampsUtc: list[str]


class SunriseRequest(BaseModel):
    startTimestampUtc: str
    endTimestampUtc: str
    location: LocationRequest
