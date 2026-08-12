"""Helpers to normalize Ticketmaster payloads into EliteTickets catalog DTOs."""

from __future__ import annotations

from datetime import date
from typing import Any

from elite_tickets.catalog.schemas import CatalogEventDetail, CatalogPage, CatalogSearchResult


def search_result_from_ticketmaster(payload: dict[str, Any]) -> CatalogSearchResult:
    return CatalogSearchResult(
        external_id=str(_first_non_empty(payload, "id", "external_id")),
        title=str(_first_non_empty(payload, "name", "title")),
        description=_string_or_none(payload.get("description")),
        image_url=_image_url(payload),
        category=_category(payload),
        date=_date(payload),
        venue_name=_venue_name(payload),
        city=_city(payload),
        country_code=_country_code(payload),
    )


def detail_from_ticketmaster(payload: dict[str, Any]) -> CatalogEventDetail:
    return CatalogEventDetail.model_validate(search_result_from_ticketmaster(payload))


def page_from_ticketmaster(
    items: list[dict[str, Any]],
    *,
    page: int,
    size: int,
    total: int,
) -> CatalogPage:
    return CatalogPage(
        items=[search_result_from_ticketmaster(item) for item in items],
        page=page,
        size=size,
        total=total,
        has_more=page * size < total,
    )


def _first_non_empty(payload: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        value = payload.get(key)
        if value not in (None, "", []):
            return value
    raise ValueError("ticketmaster payload is missing a required field")


def _string_or_none(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _image_url(payload: dict[str, Any]) -> str | None:
    images = payload.get("images")
    if isinstance(images, list):
        for image in images:
            if isinstance(image, dict):
                url = image.get("url")
                if isinstance(url, str) and url.strip():
                    return url.strip()
    return _string_or_none(payload.get("image_url") or payload.get("poster_path"))


def _category(payload: dict[str, Any]) -> str | None:
    classifications = payload.get("classifications")
    if isinstance(classifications, list):
        for classification in classifications:
            if not isinstance(classification, dict):
                continue
            segment = classification.get("segment") or classification.get("genre")
            if isinstance(segment, dict):
                name = segment.get("name")
                if isinstance(name, str) and name.strip():
                    return name.strip()
    return _string_or_none(payload.get("category"))


def _date(payload: dict[str, Any]) -> date | None:
    dates = payload.get("dates")
    if isinstance(dates, dict):
        start = dates.get("start")
        if isinstance(start, dict):
            for key in ("localDate", "date"):
                value = start.get(key)
                if isinstance(value, str) and value:
                    try:
                        return date.fromisoformat(value[:10])
                    except ValueError:
                        return None
    value = payload.get("date")
    if isinstance(value, str) and value:
        try:
            return date.fromisoformat(value[:10])
        except ValueError:
            return None
    return None


def _venue_name(payload: dict[str, Any]) -> str | None:
    embedded = payload.get("_embedded")
    if isinstance(embedded, dict):
        venues = embedded.get("venues")
        if isinstance(venues, list):
            for venue in venues:
                if isinstance(venue, dict):
                    name = venue.get("name")
                    if isinstance(name, str) and name.strip():
                        return name.strip()
    return _string_or_none(payload.get("venue_name"))


def _city(payload: dict[str, Any]) -> str | None:
    embedded = payload.get("_embedded")
    if isinstance(embedded, dict):
        venues = embedded.get("venues")
        if isinstance(venues, list):
            for venue in venues:
                if not isinstance(venue, dict):
                    continue
                city = venue.get("city")
                if isinstance(city, dict):
                    name = city.get("name")
                    if isinstance(name, str) and name.strip():
                        return name.strip()
    return _string_or_none(payload.get("city"))


def _country_code(payload: dict[str, Any]) -> str | None:
    embedded = payload.get("_embedded")
    if isinstance(embedded, dict):
        venues = embedded.get("venues")
        if isinstance(venues, list):
            for venue in venues:
                if not isinstance(venue, dict):
                    continue
                country = venue.get("country")
                if isinstance(country, dict):
                    code = country.get("countryCode") or country.get("code")
                    if isinstance(code, str) and len(code.strip()) == 2:
                        return code.strip().upper()
    value = payload.get("country_code")
    if isinstance(value, str) and len(value.strip()) == 2:
        return value.strip().upper()
    return None
