from pydantic import BaseModel


class SunriseResponse(BaseModel):
    sunriseTimestampUtc: str | None = None
    sunsetTimestampUtc: str | None = None
