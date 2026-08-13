"""Read-only Ticketmaster source used to snapshot demonstration events.

The organizer flow snapshots one event at a time from a user-driven search.
The demo seed needs the same provenance for a handful of events plus the
scheduling fields the catalog DTO intentionally leaves out (start instant,
timezone, address, price), so it reads those from the same raw payload.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from decimal import Decimal, InvalidOperation
from itertools import zip_longest
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import httpx

from elite_tickets.catalog.mapping import detail_from_ticketmaster
from elite_tickets.catalog.schemas import CatalogEventDetail
from elite_tickets.shared.config import get_settings

# The pool is read wide (worldwide, no country filter) and then thinned per
# location. Any single country's upcoming listings tend to be dominated by a
# couple of major cities, so a narrow pool cannot represent the rest of the
# world.
SEED_PAGE_SIZE = 100
SEED_TIMEOUT_SECONDS = 10.0
UNKNOWN_LOCATION = "?"
DEFAULT_TIMEZONE = "America/Sao_Paulo"
DEFAULT_EVENT_DURATION = timedelta(hours=3)
DEFAULT_START_HOUR = 20


@dataclass(frozen=True)
class CatalogSeedEvent:
    """A catalog item plus the scheduling data needed to persist an event."""

    detail: CatalogEventDetail
    starts_at: datetime
    ends_at: datetime
    timezone: str
    venue_name: str
    venue_address: str
    price: Decimal | None


async def fetch_seed_events(*, limit: int, now: datetime | None = None) -> list[CatalogSeedEvent]:
    """Fetch upcoming events for the seed. Raises on any transport failure."""
    moment = now or datetime.now(UTC)
    settings = get_settings()
    api_key = settings.ticketmaster_api_key.get_secret_value()
    params: dict[str, str | int] = {
        "apikey": api_key,
        "size": SEED_PAGE_SIZE,
        "sort": "date,asc",
        "startDateTime": moment.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

    async with httpx.AsyncClient(
        base_url=settings.ticketmaster_base_url,
        headers={"Accept": "application/json"},
        timeout=SEED_TIMEOUT_SECONDS,
    ) as client:
        response = await client.get("events.json", params=params)
        response.raise_for_status()
        payload = response.json()

        embedded = payload.get("_embedded") if isinstance(payload, dict) else None
        raw_events = embedded.get("events") if isinstance(embedded, dict) else None
        if not isinstance(raw_events, list):
            return []

        seen: set[str] = set()
        by_location: dict[str, list[CatalogSeedEvent]] = {}
        for raw in raw_events:
            if not isinstance(raw, dict):
                continue
            candidate = _to_seed_event(raw, after=moment)
            if candidate is None or candidate.detail.external_id in seen:
                continue
            seen.add(candidate.detail.external_id)
            by_location.setdefault(_location_code(raw), []).append(candidate)

        # The list payload often omits the street and city that the detail
        # payload carries, so prefer the detail when it is reachable. Only the
        # events that survive selection are worth a second request.
        return [
            await _detailed(client, candidate, api_key=api_key, after=moment)
            for candidate in _spread_across_locations(by_location, limit=limit)
        ]


def _spread_across_locations(
    by_location: dict[str, list[CatalogSeedEvent]],
    *,
    limit: int,
) -> list[CatalogSeedEvent]:
    """Take one event per location before taking a second from any of them.

    Upcoming listings are dominated by whichever handful of cities have the
    most on sale, so slicing the date-sorted feed yields a demo catalog set
    almost entirely from those. Round-robin gives every country/region that
    has an event a seat before the busy ones get a second, while ordering
    locations by their earliest event keeps the soonest dates in front.
    """
    ordered = sorted(by_location.values(), key=lambda events: events[0].starts_at)
    selected: list[CatalogSeedEvent] = []
    for tier in zip_longest(*ordered):
        for candidate in tier:
            if candidate is None:
                continue
            if len(selected) >= limit:
                return selected
            selected.append(candidate)
    return selected


def _location_code(raw: dict[str, Any]) -> str:
    venue = _venue(raw)
    country = _mapping(venue.get("country"))
    state = _mapping(venue.get("state"))
    country_code = _text(country.get("countryCode")) or _text(country.get("name"))
    region = _text(state.get("stateCode")) or _text(state.get("name")) or _city_name(venue)
    parts = [part for part in (country_code, region) if part]
    return "-".join(parts) if parts else UNKNOWN_LOCATION


def _city_name(venue: dict[str, Any]) -> str | None:
    return _text(_mapping(venue.get("city")).get("name"))


async def _detailed(
    client: httpx.AsyncClient,
    candidate: CatalogSeedEvent,
    *,
    api_key: str,
    after: datetime,
) -> CatalogSeedEvent:
    try:
        response = await client.get(
            f"events/{candidate.detail.external_id}.json",
            params={"apikey": api_key},
        )
        response.raise_for_status()
        payload = response.json()
    except (httpx.HTTPError, ValueError):
        return candidate

    if not isinstance(payload, dict):
        return candidate
    return _to_seed_event(payload, after=after) or candidate


def _to_seed_event(raw: dict[str, Any], *, after: datetime) -> CatalogSeedEvent | None:
    try:
        detail = detail_from_ticketmaster(raw)
    except (TypeError, ValueError):
        return None

    timezone = _timezone(raw)
    starts_at = _starts_at(raw, timezone=timezone)
    if starts_at is None or starts_at <= after:
        return None

    venue = _venue(raw)
    venue_name = detail.venue_name or _text(venue.get("name")) or detail.title
    return CatalogSeedEvent(
        detail=detail,
        starts_at=starts_at,
        ends_at=starts_at + DEFAULT_EVENT_DURATION,
        timezone=timezone,
        venue_name=venue_name[:180],
        venue_address=_venue_address(venue, fallback=venue_name)[:300],
        price=_price(raw),
    )


def _venue(raw: dict[str, Any]) -> dict[str, Any]:
    embedded = raw.get("_embedded")
    venues = embedded.get("venues") if isinstance(embedded, dict) else None
    if isinstance(venues, list):
        for venue in venues:
            if isinstance(venue, dict):
                return venue
    return {}


def _timezone(raw: dict[str, Any]) -> str:
    dates = raw.get("dates")
    candidates = []
    if isinstance(dates, dict):
        candidates.append(dates.get("timezone"))
    candidates.append(_venue(raw).get("timezone"))

    for candidate in candidates:
        if not isinstance(candidate, str) or not candidate.strip():
            continue
        try:
            ZoneInfo(candidate.strip())
        except (ZoneInfoNotFoundError, ValueError):
            continue
        return candidate.strip()
    return DEFAULT_TIMEZONE


def _starts_at(raw: dict[str, Any], *, timezone: str) -> datetime | None:
    dates = raw.get("dates")
    start = dates.get("start") if isinstance(dates, dict) else None
    if not isinstance(start, dict):
        return None

    instant = _text(start.get("dateTime"))
    if instant:
        try:
            return datetime.fromisoformat(instant).astimezone(UTC)
        except ValueError:
            pass

    local_date = _text(start.get("localDate"))
    if not local_date:
        return None
    local_time = _text(start.get("localTime")) or f"{DEFAULT_START_HOUR:02d}:00:00"
    try:
        naive = datetime.fromisoformat(f"{local_date}T{local_time}")
        return naive.replace(tzinfo=ZoneInfo(timezone)).astimezone(UTC)
    except (ValueError, ZoneInfoNotFoundError):
        return None


def _mapping(value: object) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _venue_address(venue: dict[str, Any], *, fallback: str) -> str:
    address = _mapping(venue.get("address"))
    city = _mapping(venue.get("city"))
    state = _mapping(venue.get("state"))
    country = _mapping(venue.get("country"))

    parts = [
        _text(address.get("line1")),
        _text(city.get("name")),
        _text(state.get("stateCode")) or _text(state.get("name")),
        _text(venue.get("postalCode")),
        _text(country.get("countryCode")) or _text(country.get("name")),
    ]
    joined = ", ".join(part for part in parts if part)
    return joined or fallback


def _price(raw: dict[str, Any]) -> Decimal | None:
    ranges = raw.get("priceRanges")
    if not isinstance(ranges, list):
        return None
    for entry in ranges:
        if not isinstance(entry, dict) or entry.get("currency") != "BRL":
            continue
        for key in ("min", "max"):
            value = entry.get(key)
            if value is None:
                continue
            try:
                price = Decimal(str(value)).quantize(Decimal("0.01"))
            except (InvalidOperation, ValueError):
                continue
            if price > 0:
                return price
    return None


def _text(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    stripped = value.strip()
    return stripped or None
