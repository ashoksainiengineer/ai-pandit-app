from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    service_name: str = Field(default="ephemeris", alias="EPHEMERIS_SERVICE_NAME")
    service_version: str = Field(default="0.1.0", alias="EPHEMERIS_SERVICE_VERSION")
    host: str = Field(default="0.0.0.0", alias="EPHEMERIS_SERVICE_HOST")
    port: int = Field(default=8000, alias="EPHEMERIS_SERVICE_PORT")
    log_level: str = Field(default="INFO", alias="EPHEMERIS_LOG_LEVEL")
    data_dir: Path = Field(default=Path("./data"), alias="EPHEMERIS_DATA_DIR")
    kernel_file: str = Field(default="de440s.bsp", alias="EPHEMERIS_KERNEL_FILE")
    load_kernel_on_startup: bool = Field(default=True, alias="EPHEMERIS_LOAD_KERNEL_ON_STARTUP")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
