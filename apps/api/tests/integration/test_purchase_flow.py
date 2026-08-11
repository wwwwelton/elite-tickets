import os
from collections.abc import AsyncIterator
from datetime import UTC, datetime
from decimal import Decimal

import pytest
import pytest_asyncio

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://elite_tickets:elite_tickets@localhost:5432/elite_tickets")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-with-at-least-32-bytes")
os.environ.setdefault("QR_SECRET", "different-test-qr-secret-at-least-32-bytes")
os.environ.setdefault("TMDB_API_KEY", "test-key")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")

from elite_tickets.auth.models import Role, User
from elite_tickets.db.base import utc_now, uuid7
from elite_tickets.events.models import Event, EventState, MovieSnapshot
from elite_tickets.reservations.models import PaymentDecision, ReservationStatus
from elite_tickets.reservations.payment import process_simulated_payment
from elite_tickets.reservations.service import create_reservation
from elite_tickets.shared.errors import (
    ConflictError,
    DomainValidationError,
    PermissionDeniedError,
)
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

pytestmark = pytest.mark.integration


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


async def commerce_fixture(session: AsyncSession) -> tuple[Event, User, User]:
    organizer = User(email=f"o-{uuid7()}@test.local", password_hash="x", display_name="O", role=Role.ORGANIZER)
    customer = User(email=f"c-{uuid7()}@test.local", password_hash="x", display_name="C", role=Role.CUSTOMER)
    other = User(email=f"c-{uuid7()}@test.local", password_hash="x", display_name="Other", role=Role.CUSTOMER)
    event = Event(
        organizer=organizer, state=EventState.PUBLISHED, venue_name="Venue", venue_address="Address",
        starts_at=datetime(2030, 1, 1, tzinfo=UTC), ends_at=datetime(2030, 1, 2, tzinfo=UTC),
        timezone="UTC", capacity=5, reserved_quantity=0, sold_quantity=0,
        price=Decimal("10.00"), currency="BRL", published_at=utc_now(),
        movie_snapshot=MovieSnapshot(tmdb_id=1, title="Movie", genres=[]),
    )
    session.add_all([organizer, customer, other, event])
    await session.flush()
    return event, customer, other


async def test_reservation_rejects_invalid_quantity_and_capacity(session: AsyncSession) -> None:
    event, customer, _ = await commerce_fixture(session)
    with pytest.raises(DomainValidationError):
        await create_reservation(session, event_id=event.id, customer_id=customer.id, quantity=0)
    with pytest.raises(ConflictError):
        await create_reservation(session, event_id=event.id, customer_id=customer.id, quantity=6)
    assert event.reserved_quantity == 0


async def test_payment_enforces_ownership_and_issues_exact_tickets_idempotently(session: AsyncSession) -> None:
    event, customer, other = await commerce_fixture(session)
    reservation = await create_reservation(session, event_id=event.id, customer_id=customer.id, quantity=2)
    with pytest.raises(PermissionDeniedError):
        await process_simulated_payment(session, reservation_id=reservation.id, customer_id=other.id, idempotency_key="ownership-key", payment_token="tok_approved")

    first = await process_simulated_payment(session, reservation_id=reservation.id, customer_id=customer.id, idempotency_key="approved-key", payment_token="tok_approved")
    second = await process_simulated_payment(session, reservation_id=reservation.id, customer_id=customer.id, idempotency_key="approved-key", payment_token="tok_approved")
    assert first.decision is PaymentDecision.APPROVED
    assert reservation.status is ReservationStatus.APPROVED
    assert len(first.tickets) == len(second.tickets) == 2
    assert {ticket.id for ticket in first.tickets} == {ticket.id for ticket in second.tickets}
    assert event.reserved_quantity == 0
    assert event.sold_quantity == 2


async def test_decline_is_terminal_releases_once_and_issues_nothing(session: AsyncSession) -> None:
    event, customer, _ = await commerce_fixture(session)
    reservation = await create_reservation(session, event_id=event.id, customer_id=customer.id, quantity=3)
    first = await process_simulated_payment(session, reservation_id=reservation.id, customer_id=customer.id, idempotency_key="declined-key", payment_token="tok_declined")
    second = await process_simulated_payment(session, reservation_id=reservation.id, customer_id=customer.id, idempotency_key="declined-key", payment_token="tok_declined")
    assert first.decision is PaymentDecision.DECLINED
    assert first.tickets == second.tickets == ()
    assert event.reserved_quantity == event.sold_quantity == 0
    with pytest.raises(ConflictError):
        await process_simulated_payment(session, reservation_id=reservation.id, customer_id=customer.id, idempotency_key="declined-key", payment_token="tok_approved")
