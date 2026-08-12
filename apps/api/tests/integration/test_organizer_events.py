import os
from collections.abc import AsyncIterator
from datetime import date, datetime, timedelta
from decimal import Decimal

import pytest
import pytest_asyncio

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://elite_tickets:elite_tickets@localhost:5432/elite_tickets")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-with-at-least-32-bytes")
os.environ.setdefault("QR_SECRET", "different-test-qr-secret-at-least-32-bytes")
os.environ.setdefault("TICKETMASTER_API_KEY", "test-key")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")

from elite_tickets.auth.models import Role, User
from elite_tickets.catalog.schemas import CatalogEventDetail
from elite_tickets.catalog.errors import CatalogUpstreamUnavailableError
from elite_tickets.db.base import utc_now, uuid7
from elite_tickets.events.models import EventState, MovieSnapshot
from elite_tickets.events.organizer_service import (
    OrganizerEvent,
    cancel_owned_event,
    create_event_from_tmdb,
    list_owned_events,
    publish_owned_event,
)
from elite_tickets.reservations.models import ReservationStatus
from elite_tickets.reservations.payment import PaymentOutcome, process_simulated_payment
from elite_tickets.reservations.service import create_reservation
from elite_tickets.shared.errors import (
    DomainValidationError,
    PermissionDeniedError,
)
from elite_tickets.tickets.models import TicketStatus
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

pytestmark = pytest.mark.integration


class FakeCatalog:
    def __init__(self) -> None:
        self.calls = 0

    async def event_details(self, external_id: str) -> CatalogEventDetail:
        self.calls += 1
        assert external_id == "100"
        return CatalogEventDetail(
            external_id="100",
            title="Immutable Event",
            description="Saved overview",
            image_url="https://cdn.example.com/poster.jpg",
            category="Music",
            date=date(2025, 1, 2),
            venue_name="Arena Elite",
            city="São Paulo",
            country_code="BR",
        )


class UnavailableCatalog:
    async def event_details(self, external_id: str) -> CatalogEventDetail:
        raise CatalogUpstreamUnavailableError("offline")


class TrackingSession:
    def __init__(self) -> None:
        self.add_calls = 0

    def add(self, _: object) -> None:
        self.add_calls += 1

    async def flush(self) -> None:
        return None


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


async def users(session: AsyncSession) -> tuple[User, User, User]:
    organizer = User(email=f"o-{uuid7()}@test.local", password_hash="x", display_name="Owner", role=Role.ORGANIZER)
    other = User(email=f"o-{uuid7()}@test.local", password_hash="x", display_name="Other", role=Role.ORGANIZER)
    customer = User(email=f"c-{uuid7()}@test.local", password_hash="x", display_name="Customer", role=Role.CUSTOMER)
    session.add_all([organizer, other, customer])
    await session.flush()
    return organizer, other, customer


async def draft(
    session: AsyncSession,
    organizer: User,
    *,
    now: datetime,
) -> tuple[OrganizerEvent, FakeCatalog]:
    catalog = FakeCatalog()
    created = await create_event_from_tmdb(
        session,
        organizer_id=organizer.id,
        tmdb_id=100,
        venue_name=" Cinema ",
        venue_address=" Address ",
        starts_at=now + timedelta(days=1),
        ends_at=now + timedelta(days=1, hours=2),
        timezone="America/Sao_Paulo",
        capacity=5,
        price=Decimal("20.00"),
        catalog=catalog,
    )
    return created, catalog


@pytest.mark.parametrize(
    ("timezone", "price", "end_delta"),
    [("Invalid/Zone", Decimal("20.00"), timedelta(hours=2)), ("UTC", Decimal("20.001"), timedelta(hours=2)), ("UTC", Decimal("20.00"), timedelta(hours=-1))],
)
async def test_creation_validates_timezone_money_and_time_before_catalog(
    session: AsyncSession,
    timezone: str,
    price: Decimal,
    end_delta: timedelta,
) -> None:
    organizer, _, _ = await users(session)
    catalog = FakeCatalog()
    now = utc_now()
    with pytest.raises(DomainValidationError):
        await create_event_from_tmdb(
            session,
            organizer_id=organizer.id,
            tmdb_id=100,
            venue_name="Cinema",
            venue_address="Address",
            starts_at=now,
            ends_at=now + end_delta,
            timezone=timezone,
            capacity=5,
            price=price,
            catalog=catalog,
        )
    assert catalog.calls == 0


async def test_snapshot_is_saved_as_draft_and_owned_publication_is_enforced(session: AsyncSession) -> None:
    organizer, other, _ = await users(session)
    now = utc_now()
    created, catalog = await draft(session, organizer, now=now)
    assert created.state is EventState.DRAFT
    assert created.title == "Immutable Event"
    assert catalog.calls == 1
    snapshot = await session.get(MovieSnapshot, created.id)
    assert snapshot is not None
    assert snapshot.external_source == "ticketmaster"
    assert snapshot.external_id == "100"
    assert snapshot.overview == "Saved overview"
    assert snapshot.image_url == "https://cdn.example.com/poster.jpg"
    assert snapshot.event_date == date(2025, 1, 2)
    assert snapshot.category == "Music"
    assert snapshot.venue_name == "Arena Elite"
    assert snapshot.city == "São Paulo"
    assert snapshot.country_code == "BR"
    assert snapshot.genres == []

    with pytest.raises(PermissionDeniedError):
        await publish_owned_event(session, event_id=created.id, organizer_id=other.id, at=now)
    published = await publish_owned_event(session, event_id=created.id, organizer_id=organizer.id, at=now)
    assert published.state is EventState.PUBLISHED
    assert (await list_owned_events(session, organizer_id=organizer.id, at=now))[0].title == "Immutable Event"


async def test_owned_listing_temporally_finishes_ended_event(session: AsyncSession) -> None:
    organizer, _, _ = await users(session)
    now = utc_now()
    created, _ = await draft(session, organizer, now=now)
    await publish_owned_event(session, event_id=created.id, organizer_id=organizer.id, at=now)

    listed = await list_owned_events(session, organizer_id=organizer.id, at=now + timedelta(days=2))

    assert listed[0].state is EventState.FINISHED


async def test_cancellation_atomically_releases_pending_and_cancels_ticket(session: AsyncSession) -> None:
    organizer, _, customer = await users(session)
    now = utc_now()
    created, _ = await draft(session, organizer, now=now)
    await publish_owned_event(session, event_id=created.id, organizer_id=organizer.id, at=now)
    approved = await create_reservation(session, event_id=created.id, customer_id=customer.id, quantity=1, at=now)
    payment = await process_simulated_payment(
        session,
        reservation_id=approved.id,
        customer_id=customer.id,
        idempotency_key="approved-cancel-test",
        payment_token="tok_approved",
        at=now,
    )
    assert isinstance(payment, PaymentOutcome)
    pending = await create_reservation(session, event_id=created.id, customer_id=customer.id, quantity=2, at=now)

    cancelled = await cancel_owned_event(session, event_id=created.id, organizer_id=organizer.id, at=now + timedelta(minutes=1))

    assert cancelled.state is EventState.CANCELLED
    assert cancelled.reserved_quantity == 0
    assert cancelled.sold_quantity == 1
    assert cancelled.available_quantity == 4
    assert pending.status is ReservationStatus.CANCELLED
    assert len(payment.tickets) == 1
    assert payment.tickets[0].status is TicketStatus.CANCELLED


async def test_catalog_outage_blocks_event_creation_before_persisting() -> None:
    organizer = User(
        email=f"o-{uuid7()}@test.local",
        password_hash="x",
        display_name="Owner",
        role=Role.ORGANIZER,
    )
    session = TrackingSession()
    catalog = UnavailableCatalog()
    now = utc_now()

    with pytest.raises(CatalogUpstreamUnavailableError):
        await create_event_from_tmdb(
            session,  # type: ignore[arg-type]
            organizer_id=organizer.id,
            tmdb_id=100,
            venue_name="Cinema",
            venue_address="Address",
            starts_at=now + timedelta(days=1),
            ends_at=now + timedelta(days=1, hours=2),
            timezone="America/Sao_Paulo",
            capacity=5,
            price=Decimal("20.00"),
            catalog=catalog,
        )

    assert session.add_calls == 0
