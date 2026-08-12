"""Normalized catalog DTOs for EliteTickets catalog responses and error state."""

from datetime import date as date_type
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


CatalogSource = Literal["ticketmaster"]
CatalogUserFacingState = Literal[
    "empty",
    "error",
    "auth_error",
    "rate_limited",
    "upstream_error",
]


class CatalogSearchResult(BaseModel):
    model_config = ConfigDict(frozen=True)

    external_id: str = Field(min_length=1, max_length=255)
    title: str = Field(min_length=1, max_length=300)
    description: str | None = Field(default=None, max_length=1000)
    image_url: str | None = Field(default=None, max_length=2048)
    category: str | None = Field(default=None, max_length=120)
    date: date_type | None = None
    venue_name: str | None = Field(default=None, max_length=200)
    city: str | None = Field(default=None, max_length=120)
    country_code: str | None = Field(default=None, min_length=2, max_length=2)
    source: CatalogSource = "ticketmaster"


class CatalogEventDetail(CatalogSearchResult):
    """Normalized detail payload; intentionally matches search result shape."""


class CatalogPage(BaseModel):
    model_config = ConfigDict(frozen=True)

    items: list[CatalogSearchResult]
    page: int = Field(ge=1)
    size: int = Field(ge=1)
    total: int = Field(ge=0)
    has_more: bool


class CatalogErrorMetadata(BaseModel):
    model_config = ConfigDict(frozen=True)

    status_code: int = Field(ge=400, le=599)
    code: str = Field(min_length=1, max_length=64)
    user_facing_state: CatalogUserFacingState
    guidance: str = Field(min_length=1, max_length=240)
