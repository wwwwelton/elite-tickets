import asyncio
import os
import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://elite_tickets:elite_tickets@localhost:5432/elite_tickets")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-with-at-least-32-bytes")
os.environ.setdefault("QR_SECRET", "different-test-qr-secret-at-least-32-bytes")
os.environ.setdefault("TMDB_API_KEY", "test-key")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from elite_tickets.auth.models import Role, User
from elite_tickets.db.base import utc_now, uuid7
from elite_tickets.events.models import Event, EventState, MovieSnapshot
from elite_tickets.events.organizer_service import cancel_owned_event
from elite_tickets.reservations.models import (
    Reservation,
    ReservationStatus,
    SimulatedPayment,
)
from elite_tickets.reservations.payment import process_simulated_payment
from elite_tickets.reservations.service import (
    create_reservation,
    expire_pending_reservation,
)
from elite_tickets.shared.errors import DomainError
from elite_tickets.tickets.models import Ticket, TicketStatus

pytestmark = pytest.mark.concurrency


async def fixture() -> tuple[AsyncEngine, async_sessionmaker[AsyncSession], Event, User, User]:
    engine = create_async_engine(os.environ["DATABASE_URL"], pool_size=6)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory.begin() as session:
        organizer = User(email=f"o-{uuid7()}@cancel.test", password_hash="x", display_name="O", role=Role.ORGANIZER)
        customer = User(email=f"c-{uuid7()}@cancel.test", password_hash="x", display_name="C", role=Role.CUSTOMER)
        event = Event(
            organizer=organizer,
            state=EventState.PUBLISHED,
            venue_name="Race",
            venue_address="Race",
            starts_at=datetime(2030, 1, 1, tzinfo=UTC),
            ends_at=datetime(2030, 1, 2, tzinfo=UTC),
            timezone="UTC",
            capacity=10,
            reserved_quantity=0,
            sold_quantity=0,
            price=Decimal("10.00"),
            currency="BRL",
            published_at=utc_now(),
            movie_snapshot=MovieSnapshot(tmdb_id=abs(hash(str(uuid7()))) % 1_000_000 + 1, title="Race", genres=[]),
        )
        session.add_all([organizer, customer, event])
        await session.flush()
    return engine, factory, event, organizer, customer


async def cleanup(
    factory: async_sessionmaker[AsyncSession],
    event: Event,
    organizer: User,
    customer: User,
) -> None:
    async with factory.begin() as session:
        reservation_ids = select(Reservation.id).where(Reservation.event_id == event.id)
        await session.execute(delete(Ticket).where(Ticket.event_id == event.id))
        await session.execute(delete(SimulatedPayment).where(SimulatedPayment.reservation_id.in_(reservation_ids)))
        await session.execute(delete(Reservation).where(Reservation.event_id == event.id))
        await session.execute(delete(MovieSnapshot).where(MovieSnapshot.event_id == event.id))
        await session.execute(delete(Event).where(Event.id == event.id))
        await session.execute(delete(User).where(User.id.in_([organizer.id, customer.id])))


async def cancel(factory: async_sessionmaker[AsyncSession], event: Event, organizer: User, now: datetime) -> str:
    async with factory.begin() as session:
        result = await cancel_owned_event(
            session,
            event_id=event.id,
            organizer_id=organizer.id,
            at=now,
        )
    return result.state.value


async def assert_cancelled_invariants(
    factory: async_sessionmaker[AsyncSession],
    event_id: uuid.UUID,
) -> tuple[Reservation | None, list[Ticket]]:
    async with factory() as session:
        event = await session.get(Event, event_id)
        reservations = (await session.scalars(select(Reservation).where(Reservation.event_id == event_id))).all()
        tickets = (await session.scalars(select(Ticket).where(Ticket.event_id == event_id))).all()
        assert event is not None
        assert event.state is EventState.CANCELLED
        assert event.reserved_quantity == 0
        assert 0 <= event.sold_quantity <= event.capacity
        assert event.available_quantity >= 0
        assert all(reservation.status is not ReservationStatus.PENDING for reservation in reservations)
        assert all(ticket.status is TicketStatus.CANCELLED for ticket in tickets)
        return (reservations[0] if reservations else None), list(tickets)


async def test_cancellation_racing_reservation_never_leaves_inventory() -> None:
    engine, factory, event, organizer, customer = await fixture()
    now = utc_now()

    async def reserve() -> str:
        try:
            async with factory.begin() as session:
                reservation = await create_reservation(
                    session,
                    event_id=event.id,
                    customer_id=customer.id,
                    quantity=3,
                    at=now,
                )
            return reservation.status.value
        except DomainError:
            return "CONFLICT"

    try:
        await asyncio.gather(cancel(factory, event, organizer, now), reserve())
        reservation, tickets = await assert_cancelled_invariants(factory, event.id)
        assert reservation is None or reservation.status is ReservationStatus.CANCELLED
        assert tickets == []
    finally:
        await cleanup(factory, event, organizer, customer)
        await engine.dispose()


@pytest.mark.parametrize("operation", ["approve", "decline", "expire"])
async def test_cancellation_racing_terminal_transition_has_one_outcome(operation: str) -> None:
    engine, factory, event, organizer, customer = await fixture()
    now = utc_now()
    async with factory.begin() as session:
        reservation = await create_reservation(
            session,
            event_id=event.id,
            customer_id=customer.id,
            quantity=2,
            at=now,
        )

    async def transition() -> str:
        try:
            async with factory.begin() as session:
                if operation == "expire":
                    changed = await expire_pending_reservation(
                        session,
                        reservation.id,
                        at=now + timedelta(minutes=16),
                    )
                    return "EXPIRED" if changed else "NO_CHANGE"
                outcome = await process_simulated_payment(
                    session,
                    reservation_id=reservation.id,
                    customer_id=customer.id,
                    idempotency_key=f"cancel-race-{operation}",
                    payment_token="tok_approved" if operation == "approve" else "tok_declined",
                    at=now + timedelta(minutes=1),
                )
                return outcome.reservation.status.value
        except DomainError:
            return "CONFLICT"

    try:
        await asyncio.gather(
            cancel(factory, event, organizer, now + timedelta(minutes=1)),
            transition(),
        )
        stored, tickets = await assert_cancelled_invariants(factory, event.id)
        assert stored is not None
        expected = {
            "approve": {ReservationStatus.APPROVED, ReservationStatus.CANCELLED},
            "decline": {ReservationStatus.DECLINED, ReservationStatus.CANCELLED},
            "expire": {ReservationStatus.EXPIRED, ReservationStatus.CANCELLED},
        }
        assert stored.status in expected[operation]
        assert len(tickets) == (1 if stored.status is ReservationStatus.APPROVED else 0) * 2
    finally:
        await cleanup(factory, event, organizer, customer)
        await engine.dispose()
