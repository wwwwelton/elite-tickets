from __future__ import annotations

import asyncio
from typing import Any

import httpx
import pytest

from elite_tickets.catalog.errors import (
    CatalogAuthError,
    CatalogRateLimitError,
    CatalogUpstreamUnavailableError,
)
from elite_tickets.catalog.ticketmaster_client import TicketmasterClient
from elite_tickets.shared.config import get_settings

pytestmark = pytest.mark.unit


@pytest.fixture(autouse=True)
def _ticketmaster_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://elite_tickets:elite_tickets@localhost:5432/elite_tickets")
    monkeypatch.setenv("JWT_SECRET", "test-jwt-secret-with-at-least-32-bytes")
    monkeypatch.setenv("QR_SECRET", "different-test-qr-secret-at-least-32-bytes")
    monkeypatch.setenv("TICKETMASTER_API_KEY", "test-ticketmaster-key")
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:3000")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def _client(handler: httpx.MockTransport) -> TicketmasterClient:
    transport = httpx.MockTransport(handler)
    return TicketmasterClient(
        httpx.AsyncClient(
            base_url="https://app.ticketmaster.com/discovery/v2/",
            transport=transport,
            headers={"Accept": "application/json"},
        )
    )


@pytest.mark.asyncio
async def test_search_events_injects_api_key_and_normalizes_page(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[dict[str, Any]] = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(
            {
                "path": request.url.path,
                "params": dict(request.url.params),
            }
        )
        assert request.headers["accept"] == "application/json"
        payload = {
            "_embedded": {
                "events": [
                    {
                        "id": "evt-1",
                        "name": "Festa de teste",
                        "classifications": [{"segment": {"name": "Music"}}],
                        "dates": {"start": {"localDate": "2026-08-12"}},
                        "_embedded": {
                            "venues": [
                                {
                                    "name": "Arena Elite",
                                    "city": {"name": "São Paulo"},
                                    "country": {"countryCode": "BR"},
                                }
                            ]
                        },
                        "images": [{"url": "https://cdn.example.com/event.jpg"}],
                        "url": "https://www.ticketmaster.com/event/evt-1",
                    }
                ]
            },
            "page": {"number": 0, "size": 20, "totalElements": 1, "totalPages": 1},
        }
        return httpx.Response(200, json=payload)

    client = _client(handler)
    try:
        page = await client.search_events("  show  ")
    finally:
        await client._client.aclose()

    assert calls == [
        {
            "path": "/discovery/v2/events.json",
            "params": {
                "apikey": "test-ticketmaster-key",
                "keyword": "show",
                "page": "0",
                "size": "20",
            },
        }
    ]
    assert page.page == 1
    assert page.size == 20
    assert page.total == 1
    assert page.has_more is False
    assert len(page.items) == 1
    assert page.items[0].external_id == "evt-1"
    assert page.items[0].title == "Festa de teste"
    assert page.items[0].image_url == "https://cdn.example.com/event.jpg"
    assert page.items[0].external_url == "https://www.ticketmaster.com/event/evt-1"
    assert page.items[0].category == "Music"
    assert page.items[0].date.isoformat() == "2026-08-12"
    assert page.items[0].venue_name == "Arena Elite"
    assert page.items[0].city == "São Paulo"
    assert page.items[0].country_code == "BR"


@pytest.mark.asyncio
async def test_search_events_supports_browsing_any_country_without_a_keyword() -> None:
    calls: list[dict[str, Any]] = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(dict(request.url.params))
        return httpx.Response(
            200,
            json={"_embedded": {"events": []}, "page": {"number": 0, "size": 20, "totalElements": 0}},
        )

    client = _client(handler)
    try:
        await client.search_events(country_code="US", city="Seattle")
        await client.search_events()
    finally:
        await client._client.aclose()

    assert calls[0] == {
        "apikey": "test-ticketmaster-key",
        "page": "0",
        "size": "20",
        "countryCode": "US",
        "city": "Seattle",
    }
    assert calls[1] == {
        "apikey": "test-ticketmaster-key",
        "page": "0",
        "size": "20",
    }


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("status_code", "expected_error"),
    [
        (401, CatalogAuthError),
        (429, CatalogRateLimitError),
        (503, CatalogUpstreamUnavailableError),
    ],
)
async def test_request_classifies_upstream_failures(
    status_code: int,
    expected_error: type[Exception],
) -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code, json={"error": "boom"})

    client = _client(handler)
    try:
        with pytest.raises(expected_error):
            await client.event_details("evt-1")
    finally:
        await client._client.aclose()


@pytest.mark.asyncio
async def test_request_retries_timeout_and_5xx_bounded_attempts(monkeypatch: pytest.MonkeyPatch) -> None:
    attempts = 0
    sleeps: list[float] = []

    async def fake_sleep(delay: float) -> None:
        sleeps.append(delay)

    def handler(_: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        if attempts == 1:
            raise httpx.ReadTimeout("timed out")
        if attempts == 2:
            return httpx.Response(502, json={"error": "bad gateway"})
        return httpx.Response(
            200,
            json={
                "id": "evt-1",
                "name": "Evento com retry",
                "classifications": [{"segment": {"name": "Music"}}],
            },
        )

    monkeypatch.setattr(asyncio, "sleep", fake_sleep)
    client = _client(handler)
    try:
        detail = await client.event_details("evt-1")
    finally:
        await client._client.aclose()

    assert attempts == 3
    assert sleeps == [0.1, 0.2]
    assert detail.external_id == "evt-1"
    assert detail.title == "Evento com retry"
    assert detail.category == "Music"


@pytest.mark.asyncio
async def test_malformed_upstream_payload_is_mapped_to_safe_unavailable_error() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"id": "evt-1"})

    client = _client(handler)
    try:
        with pytest.raises(CatalogUpstreamUnavailableError):
            await client.event_details("evt-1")
    finally:
        await client._client.aclose()
