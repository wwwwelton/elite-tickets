import os
from collections.abc import AsyncIterator
from datetime import UTC, date, datetime
from decimal import Decimal

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+psycopg://elite_tickets:elite_tickets@localhost:5432/elite_tickets",
)
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-with-at-least-32-bytes")
os.environ.setdefault("QR_SECRET", "different-test-qr-secret-at-least-32-bytes")
os.environ.setdefault("TMDB_API_KEY", "test-key")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from elite_tickets.auth.models import Role, User
from elite_tickets.catalog.router import get_ticketmaster_client
from elite_tickets.db.base import utc_now, uuid7
from elite_tickets.db.session import get_session
from elite_tickets.events.models import Event, EventState, MovieSnapshot
from elite_tickets.main import app

pytestmark = pytest.mark.integration


@pytest_asyncio.fixture
async def database_session() -> AsyncIterator[AsyncSession]:
    engine = create_async_engine(os.environ["DATABASE_URL"])
    async with engine.connect() as connection:
        transaction = await connection.begin()
        session = AsyncSession(bind=connection, expire_on_commit=False)
        try:
            yield session
        finally:
            await session.close()
            await transaction.rollback()
    await engine.dispose()


@pytest_asyncio.fixture
async def client(database_session: AsyncSession) -> AsyncIterator[AsyncClient]:
    async def session_override() -> AsyncIterator[AsyncSession]:
        yield database_session

    app.dependency_overrides[get_session] = session_override
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.pop(get_session, None)


async def seed_public_and_draft(session: AsyncSession) -> tuple[Event, Event]:
    organizer = User(
        email=f"organizer-{uuid7()}@example.com",
        password_hash="not-used",
        display_name="Organizer",
        role=Role.ORGANIZER,
        is_active=True,
    )
    published = event_fixture(
        organizer=organizer,
        state=EventState.PUBLISHED,
        title="A Viagem Escarlate",
        venue="Cinema Central",
        poster_path="/poster.jpg",
    )
    draft = event_fixture(
        organizer=organizer,
        state=EventState.DRAFT,
        title="Filme Ainda Secreto",
        venue="Sala Privada",
        poster_path=None,
    )
    session.add_all([organizer, published, draft])
    await session.flush()
    return published, draft


def event_fixture(
    *,
    organizer: User,
    state: EventState,
    title: str,
    venue: str,
    poster_path: str | None,
) -> Event:
    starts_at = datetime(2030, 6, 1, 22, 0, tzinfo=UTC)
    return Event(
        organizer=organizer,
        organizer_id=organizer.id,
        state=state,
        venue_name=venue,
        venue_address="Rua dos Testes, 10",
        starts_at=starts_at,
        ends_at=datetime(2030, 6, 2, 0, 0, tzinfo=UTC),
        timezone="America/Sao_Paulo",
        capacity=10,
        reserved_quantity=2,
        sold_quantity=3,
        price=Decimal("25.50"),
        currency="BRL",
        published_at=utc_now() if state is EventState.PUBLISHED else None,
        movie_snapshot=MovieSnapshot(
            tmdb_id=abs(hash(title)) % 1_000_000 + 1,
            title=title,
            poster_path=poster_path,
            release_date=date(2029, 1, 1),
            genres=[],
        ),
    )


async def test_anonymous_listing_exposes_only_published_contract(
    client: AsyncClient,
    database_session: AsyncSession,
) -> None:
    published, _ = await seed_public_and_draft(database_session)

    response = await client.get(
        "/api/v1/events",
        params={"query": "A Viagem Escarlate"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["page"] == 1
    assert payload["total"] == 1
    assert payload["items"] == [
        {
            "id": str(published.id),
            "state": "PUBLISHED",
            "title": "A Viagem Escarlate",
            "poster_url": "https://image.tmdb.org/t/p/w500/poster.jpg",
            "starts_at": "2030-06-01T22:00:00Z",
            "ends_at": "2030-06-02T00:00:00Z",
            "venue_name": "Cinema Central",
            "capacity": 10,
            "sold_quantity": 3,
            "available_quantity": 5,
            "price": "25.50",
        }
    ]


async def test_non_published_event_is_not_directly_visible(
    client: AsyncClient,
    database_session: AsyncSession,
) -> None:
    _, draft = await seed_public_and_draft(database_session)

    response = await client.get(f"/api/v1/events/{draft.id}")

    assert response.status_code == 404


@pytest.mark.parametrize("query", ["escarlate", "cinema central"])
async def test_search_matches_saved_title_or_venue_case_insensitively(
    query: str,
    client: AsyncClient,
    database_session: AsyncSession,
) -> None:
    published, _ = await seed_public_and_draft(database_session)

    response = await client.get("/api/v1/events", params={"query": query})

    assert response.status_code == 200
    assert [item["id"] for item in response.json()["items"]] == [str(published.id)]


async def test_published_detail_matches_public_contract(
    client: AsyncClient,
    database_session: AsyncSession,
) -> None:
    published, _ = await seed_public_and_draft(database_session)

    response = await client.get(f"/api/v1/events/{published.id}")

    assert response.status_code == 200
    assert response.json()["title"] == "A Viagem Escarlate"
    assert response.json()["available_quantity"] == 5


async def test_invalid_page_is_rejected_by_contract(client: AsyncClient) -> None:
    response = await client.get("/api/v1/events", params={"page": 0})
    assert response.status_code == 422


async def test_published_events_render_while_catalog_is_unavailable(
    client: AsyncClient,
    database_session: AsyncSession,
) -> None:
    published, _ = await seed_public_and_draft(database_session)

    class FailingCatalog:
        async def search_events(self, *args: object, **kwargs: object) -> None:
            raise AssertionError("catalog should not be used for public events")

        async def event_details(self, external_id: str) -> None:
            raise AssertionError("catalog should not be used for public events")

    async def catalog_override() -> AsyncIterator[FailingCatalog]:
        yield FailingCatalog()

    app.dependency_overrides[get_ticketmaster_client] = catalog_override
    try:
        response = await client.get(f"/api/v1/events/{published.id}")
    finally:
        app.dependency_overrides.pop(get_ticketmaster_client, None)

    assert response.status_code == 200
    assert response.json()["id"] == str(published.id)
