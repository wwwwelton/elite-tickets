import asyncio
import os
from collections.abc import AsyncIterator
from unittest.mock import AsyncMock

import httpx
import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@localhost:5432/test")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-with-at-least-32-bytes")
os.environ.setdefault("QR_SECRET", "different-test-qr-secret-at-least-32-bytes")
os.environ.setdefault("TMDB_API_KEY", "test-key")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")

from elite_tickets.auth.models import Role, User
from elite_tickets.auth.security import get_current_user
from elite_tickets.catalog.router import get_tmdb_client
from elite_tickets.catalog.tmdb import TmdbClient, TmdbUnavailableError
from elite_tickets.db.base import uuid7
from elite_tickets.db.session import get_session
from elite_tickets.events.organizer_router import router as organizer_router
from elite_tickets.shared.errors import install_exception_handlers

pytestmark = pytest.mark.integration


async def test_search_normalizes_results_and_accepts_missing_poster() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["Authorization"] == "Bearer test-key"
        return httpx.Response(
            200,
            json={
                "results": [
                    {
                        "id": 42,
                        "title": "The Answer",
                        "poster_path": None,
                        "release_date": "2026-01-02",
                    }
                ]
            },
        )

    async with httpx.AsyncClient(
        transport=httpx.MockTransport(handler),
        base_url="https://api.test/",
    ) as client:
        results = await TmdbClient(client).search_movies(" answer ")

    assert len(results) == 1
    assert results[0].tmdb_id == 42
    assert results[0].title == "The Answer"
    assert results[0].poster_path is None
    assert results[0].release_date is not None
    assert results[0].release_date.isoformat() == "2026-01-02"


@pytest.mark.parametrize("failure", ["timeout", "429", "500"])
async def test_retryable_failures_use_bounded_attempts(
    failure: str,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    attempts = 0

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        if failure == "timeout":
            raise httpx.ReadTimeout("slow", request=request)
        return httpx.Response(int(failure))

    sleep = AsyncMock()
    monkeypatch.setattr(asyncio, "sleep", sleep)
    async with httpx.AsyncClient(
        transport=httpx.MockTransport(handler),
        base_url="https://api.test/",
    ) as client:
        with pytest.raises(TmdbUnavailableError):
            await TmdbClient(client).search_movies("movie")

    assert attempts == 3
    assert sleep.await_count == 2


async def test_catalog_unavailability_returns_503_without_partial_event() -> None:
    class UnavailableCatalog:
        async def movie_details(self, _: int) -> None:
            raise TmdbUnavailableError("offline")

    class TrackingSession:
        add_calls = 0

        def add(self, _: object) -> None:
            self.add_calls += 1

    organizer = User(
        id=uuid7(),
        email="organizer@example.com",
        password_hash="x",
        display_name="Organizer",
        role=Role.ORGANIZER,
        is_active=True,
    )
    session = TrackingSession()
    app = FastAPI()
    install_exception_handlers(app)
    app.include_router(organizer_router, prefix="/api/v1")

    async def current_user_override() -> User:
        return organizer

    async def session_override() -> AsyncIterator[TrackingSession]:
        yield session

    async def catalog_override() -> AsyncIterator[UnavailableCatalog]:
        yield UnavailableCatalog()

    app.dependency_overrides[get_current_user] = current_user_override
    app.dependency_overrides[get_session] = session_override
    app.dependency_overrides[get_tmdb_client] = catalog_override
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        response = await client.post(
            "/api/v1/events",
            json={
                "tmdb_id": 42,
                "venue_name": "Cinema",
                "venue_address": "Address",
                "starts_at": "2030-01-01T10:00:00Z",
                "ends_at": "2030-01-01T12:00:00Z",
                "timezone": "America/Sao_Paulo",
                "capacity": 10,
                "price": "20.00",
            },
        )

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "dependency_unavailable"
    assert session.add_calls == 0
