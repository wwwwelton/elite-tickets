"""Backend-only Ticketmaster client with bounded resilience and normalization."""

from __future__ import annotations

import asyncio
from typing import Any

import httpx
from elite_tickets.catalog.errors import (
    CatalogAuthError,
    CatalogRateLimitError,
    CatalogUpstreamUnavailableError,
)
from elite_tickets.catalog.mapping import (
    detail_from_ticketmaster,
    page_from_ticketmaster,
    search_result_from_ticketmaster,
)
from elite_tickets.catalog.schemas import CatalogEventDetail, CatalogPage
from elite_tickets.shared.config import get_settings
from elite_tickets.shared.errors import DomainValidationError

TMDB_TIMEOUT_SECONDS = 3.0
TMDB_MAX_ATTEMPTS = 3


class TicketmasterClient:
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def search_events(
        self,
        query: str,
        *,
        page: int = 1,
        size: int = 20,
        country_code: str = "BR",
        city: str | None = None,
    ) -> CatalogPage:
        normalized_query = query.strip()
        if not normalized_query or page < 1 or size < 1:
            raise DomainValidationError("invalid Ticketmaster search")

        params: dict[str, Any] = {
            "keyword": normalized_query,
            "page": page - 1,
            "size": size,
            "countryCode": country_code or "BR",
        }
        if city:
            params["city"] = city.strip()
        payload = await self._request("events.json", params=params)
        embedded = payload.get("_embedded", {}) if isinstance(payload, dict) else {}
        events = embedded.get("events", []) if isinstance(embedded, dict) else []
        page_data = payload.get("page", {}) if isinstance(payload, dict) else {}
        if not isinstance(events, list):
            events = []
        if not isinstance(page_data, dict):
            page_data = {}
        total = int(page_data.get("totalElements") or len(events))
        current_page = int(page_data.get("number") or (page - 1))
        current_size = int(page_data.get("size") or size)
        return CatalogPage(
            items=[search_result_from_ticketmaster(item) for item in events if isinstance(item, dict)],
            page=current_page + 1,
            size=current_size,
            total=total,
            has_more=current_page + 1 < int(page_data.get("totalPages") or 0),
        )

    async def event_details(self, external_id: str) -> CatalogEventDetail:
        normalized_external_id = external_id.strip()
        if not normalized_external_id:
            raise DomainValidationError("invalid Ticketmaster event id")
        payload = await self._request(f"events/{normalized_external_id}.json")
        if not isinstance(payload, dict):
            raise CatalogUpstreamUnavailableError()
        return detail_from_ticketmaster(payload)

    async def _request(
        self,
        path: str,
        *,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        request_params = dict(params or {})
        request_params.setdefault("apikey", get_settings().ticketmaster_api_key.get_secret_value())
        for attempt in range(1, TMDB_MAX_ATTEMPTS + 1):
            try:
                response = await self._client.get(
                    path,
                    params=request_params,
                    timeout=TMDB_TIMEOUT_SECONDS,
                )
                if response.status_code == 401:
                    raise CatalogAuthError()
                if response.status_code == 429:
                    raise CatalogRateLimitError()
                if response.status_code >= 500:
                    raise _RetryableTicketmasterResponse
                response.raise_for_status()
                payload = response.json()
                if not isinstance(payload, dict):
                    raise CatalogUpstreamUnavailableError("invalid Ticketmaster response")
                return payload
            except httpx.TimeoutException:
                if attempt == TMDB_MAX_ATTEMPTS:
                    raise CatalogUpstreamUnavailableError("Ticketmaster request timed out") from None
                await asyncio.sleep(0.1 * attempt)
            except _RetryableTicketmasterResponse:
                if attempt == TMDB_MAX_ATTEMPTS:
                    raise CatalogUpstreamUnavailableError("Ticketmaster retry budget exhausted") from None
                await asyncio.sleep(0.1 * attempt)
            except httpx.HTTPError as exc:
                raise CatalogUpstreamUnavailableError("Ticketmaster request failed") from exc
        raise CatalogUpstreamUnavailableError("Ticketmaster retry budget exhausted")


class _RetryableTicketmasterResponse(Exception):
    pass


def create_ticketmaster_http_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        base_url=get_settings().ticketmaster_base_url,
        headers={"Accept": "application/json"},
    )
