from __future__ import annotations

import os
from collections.abc import AsyncIterator

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@localhost:5432/test")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-with-at-least-32-bytes")
os.environ.setdefault("QR_SECRET", "different-test-qr-secret-at-least-32-bytes")
os.environ.setdefault("TICKETMASTER_API_KEY", "test-key")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")

from elite_tickets.auth.models import Role, User
from elite_tickets.auth.security import get_current_user
from elite_tickets.catalog.errors import CatalogAuthError, CatalogRateLimitError, CatalogUpstreamUnavailableError
from elite_tickets.catalog.router import get_ticketmaster_client
from elite_tickets.catalog.schemas import CatalogEventDetail, CatalogPage, CatalogSearchResult
from elite_tickets.db.base import uuid7
from elite_tickets.shared.errors import install_exception_handlers

pytestmark = pytest.mark.integration


class StubCatalog:
    def __init__(self, *, page: CatalogPage | None = None, detail: CatalogEventDetail | None = None) -> None:
        self.page = page
        self.detail = detail
        self.calls: list[tuple[str, dict[str, object]]] = []

    async def search_events(
        self,
        query: str,
        *,
        page: int = 1,
        size: int = 20,
        country_code: str = "BR",
        city: str | None = None,
    ) -> CatalogPage:
        self.calls.append(
            (
                "search_events",
                {
                    "query": query,
                    "page": page,
                    "size": size,
                    "country_code": country_code,
                    "city": city,
                },
            )
        )
        assert self.page is not None
        return self.page

    async def event_details(self, external_id: str) -> CatalogEventDetail:
        self.calls.append(("event_details", {"external_id": external_id}))
        assert self.detail is not None
        return self.detail


def _catalog_app(catalog: object) -> FastAPI:
    app = FastAPI()
    install_exception_handlers(app)

    from elite_tickets.catalog.router import router as catalog_router

    app.include_router(catalog_router, prefix="/api/v1")

    organizer = User(
        id=uuid7(),
        email="organizer@example.com",
        password_hash="x",
        display_name="Organizer",
        role=Role.ORGANIZER,
        is_active=True,
    )

    async def current_user_override() -> User:
        return organizer

    async def catalog_override() -> AsyncIterator[object]:
        yield catalog

    app.dependency_overrides[get_current_user] = current_user_override
    app.dependency_overrides[get_ticketmaster_client] = catalog_override
    return app


async def test_search_and_detail_return_normalized_contracts() -> None:
    stub = StubCatalog(
        page=CatalogPage(
            items=[
                CatalogSearchResult(
                    external_id="evt-1",
                    title="Festival Elite",
                    description="Evento principal",
                    image_url="https://cdn.example.com/event.jpg",
                    category="Music",
                    date=None,
                    venue_name="Arena Elite",
                    city="São Paulo",
                    country_code="BR",
                )
            ],
            page=1,
            size=20,
            total=1,
            has_more=False,
        ),
        detail=CatalogEventDetail(
            external_id="evt-1",
            title="Festival Elite",
            description="Evento principal",
            image_url="https://cdn.example.com/event.jpg",
            category="Music",
            date=None,
            venue_name="Arena Elite",
            city="São Paulo",
            country_code="BR",
        ),
    )
    app = _catalog_app(stub)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        search = await client.get(
            "/api/v1/catalog/events",
            params={"keyword": "festival", "page": 1, "size": 20, "countryCode": "BR"},
        )
        detail = await client.get("/api/v1/catalog/events/evt-1")

    assert search.status_code == 200
    assert search.json()["items"][0]["external_id"] == "evt-1"
    assert search.json()["items"][0]["source"] == "ticketmaster"
    assert search.json()["page"] == 1
    assert search.json()["size"] == 20
    assert search.json()["total"] == 1
    assert detail.status_code == 200
    assert detail.json()["external_id"] == "evt-1"
    assert detail.json()["title"] == "Festival Elite"
    assert stub.calls == [
        (
            "search_events",
            {
                "query": "festival",
                "page": 1,
                "size": 20,
                "country_code": "BR",
                "city": None,
            },
        ),
        ("event_details", {"external_id": "evt-1"}),
    ]


async def test_catalog_error_responses_are_secret_safe() -> None:
    class FailingCatalog:
        async def search_events(self, *args: object, **kwargs: object) -> CatalogPage:
            raise CatalogAuthError()

        async def event_details(self, external_id: str) -> CatalogEventDetail:
            if external_id == "rate":
                raise CatalogRateLimitError()
            raise CatalogUpstreamUnavailableError()

    app = _catalog_app(FailingCatalog())

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        auth = await client.get("/api/v1/catalog/events", params={"keyword": "festival"})
        rate = await client.get("/api/v1/catalog/events/rate")
        upstream = await client.get("/api/v1/catalog/events/down")

    assert auth.status_code == 503
    assert auth.json()["error"]["code"] == "catalog_auth_error"
    assert "test-key" not in auth.text
    assert rate.status_code == 503
    assert rate.json()["error"]["code"] == "catalog_rate_limited"
    assert upstream.status_code == 503
    assert upstream.json()["error"]["code"] == "dependency_unavailable"
