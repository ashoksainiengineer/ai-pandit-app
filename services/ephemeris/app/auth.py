from fastapi import Header, HTTPException, status

from app.config import get_settings


async def verify_ephemeris_api_key(x_api_key: str = Header(None, alias="X-Api-Key")) -> None:
    settings = get_settings()
    if not settings.api_key:
        return
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Api-Key header",
        )
    if x_api_key != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key",
        )
