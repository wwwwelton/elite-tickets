from functools import lru_cache
from typing import Annotated

from pydantic import (
    AnyHttpUrl,
    Field,
    PostgresDsn,
    SecretStr,
    field_validator,
    model_validator,
)
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    """Validated runtime configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    database_url: PostgresDsn
    jwt_secret: SecretStr = Field(min_length=32)
    qr_secret: SecretStr = Field(min_length=32)
    ticketmaster_api_key: SecretStr = Field(min_length=1)
    ticketmaster_base_url: str = "https://app.ticketmaster.com/discovery/v2/"
    cors_origins: Annotated[list[AnyHttpUrl], NoDecode]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            origins = [origin.strip() for origin in value.split(",") if origin.strip()]
            if not origins:
                raise ValueError("CORS_ORIGINS must contain at least one origin")
            return origins
        return value

    @model_validator(mode="after")
    def require_separate_signing_secrets(self) -> "Settings":
        if self.jwt_secret.get_secret_value() == self.qr_secret.get_secret_value():
            raise ValueError("JWT_SECRET and QR_SECRET must be different")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
