import math
import os
import time
from collections.abc import AsyncIterator, Awaitable, Callable
from datetime import UTC, datetime
from decimal import Decimal

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient, Response

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://elite_tickets:elite_tickets@localhost:5432/elite_tickets")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-with-at-least-32-bytes")
os.environ.setdefault("QR_SECRET", "different-test-qr-secret-at-least-32-bytes")
os.environ.setdefault("TMDB_API_KEY", "test-key")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")

from elite_tickets.auth.models import Role, User
from elite_tickets.db.base import utc_now, uuid7
from elite_tickets.db.session import get_session
from elite_tickets.events.models import Event, EventState, MovieSnapshot
from elite_tickets.main import app
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

pytestmark = pytest.mark.integration

SAMPLE_SIZE = 20
DEMONSTRATION_TARGET_SECONDS = 2.0


@pytest_asyncio.fixture
async def session() -> AsyncIterator[AsyncSession]:
    engine = create_async_engine(os.environ["DATABASE_URL"])
    async with engine.connect() as connection:
        transaction = await connection.begin()
        database = AsyncSession(bind=connection, expire_on_commit=False)
        try:
            yield database
        finally:
            await database.close()
            await transaction.rollback()
    await engine.dispose()


async def test_event_search_and_detail_meet_demonstration_response_target(
    session: AsyncSession,
) -> None:
    organizer = User(
        email=f"performance-{uuid7()}@test.local",
        password_hash="x",
        display_name="Performance",
        role=Role.ORGANIZER,
    )
    event = Event(
        organizer=organizer,
        state=EventState.PUBLISHED,
        venue_name="Performance Hall",
        venue_address="Performance Address",
        starts_at=datetime(2030, 1, 1, tzinfo=UTC),
        ends_at=datetime(2030, 1, 2, tzinfo=UTC),
        timezone="UTC",
        capacity=100,
        reserved_quantity=0,
        sold_quantity=0,
        price=Decimal("10.00"),
        currency="BRL",
        published_at=utc_now(),
        movie_snapshot=MovieSnapshot(
            tmdb_id=930_001,
            title="Performance Target Movie",
            genres=[],
        ),
    )
    session.add_all([organizer, event])
    await session.flush()

    async def session_override() -> AsyncIterator[AsyncSession]:
        yield session

    app.dependency_overrides[get_session] = session_override
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            assert (await client.get("/api/v1/events", params={"query": "Performance Target"})).status_code == 200
            assert (await client.get(f"/api/v1/events/{event.id}")).status_code == 200

            search_samples = await _measure(
                lambda: client.get("/api/v1/events", params={"query": "Performance Target"})
            )
            detail_samples = await _measure(lambda: client.get(f"/api/v1/events/{event.id}"))
    finally:
        app.dependency_overrides.pop(get_session, None)

    _assert_target("event search", search_samples)
    _assert_target("event detail", detail_samples)


async def _measure(request: Callable[[], Awaitable[Response]]) -> list[float]:
    samples: list[float] = []
    for _ in range(SAMPLE_SIZE):
        started = time.perf_counter()
        response = await request()
        samples.append(time.perf_counter() - started)
        assert response.status_code == 200
    return samples


def _assert_target(label: str, samples: list[float]) -> None:
    within_target = sum(sample <= DEMONSTRATION_TARGET_SECONDS for sample in samples)
    percentile_index = math.ceil(0.95 * len(samples)) - 1
    p95 = sorted(samples)[percentile_index]
    assert within_target / len(samples) >= 0.95, (
        f"{label} missed SC-006: p95={p95:.3f}s, target={DEMONSTRATION_TARGET_SECONDS:.1f}s"
    )
