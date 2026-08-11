import asyncio
import os
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+psycopg://elite_tickets:elite_tickets@localhost:5432/elite_tickets",
)
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-with-at-least-32-bytes")
os.environ.setdefault("QR_SECRET", "different-test-qr-secret-at-least-32-bytes")
os.environ.setdefault("TMDB_API_KEY", "test-key")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")

from elite_tickets.auth.models import Role, User
from elite_tickets.db.base import utc_now, uuid7
from elite_tickets.events.models import Event, EventState, MovieSnapshot
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
from elite_tickets.shared.errors import ConflictError
from elite_tickets.tickets.models import Ticket
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

pytestmark = pytest.mark.concurrency


async def create_fixture(
    *, capacity: int
) -> tuple[AsyncEngine, async_sessionmaker[AsyncSession], Event, list[User]]:
    engine = create_async_engine(os.environ["DATABASE_URL"], pool_size=5)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory.begin() as session:
        organizer = User(
            email=f"o-{uuid7()}@race.test",
            password_hash="x",
            display_name="O",
            role=Role.ORGANIZER,
        )
        customers = [
            User(
                email=f"c-{uuid7()}@race.test",
                password_hash="x",
                display_name=f"C{i}",
                role=Role.CUSTOMER,
            )
            for i in range(2)
        ]
        event = Event(
            organizer=organizer,
            state=EventState.PUBLISHED,
            venue_name="Race",
            venue_address="Race",
            starts_at=datetime(2030, 1, 1, tzinfo=UTC),
            ends_at=datetime(2030, 1, 2, tzinfo=UTC),
            timezone="UTC",
            capacity=capacity,
            reserved_quantity=0,
            sold_quantity=0,
            price=Decimal("10.00"),
            currency="BRL",
            published_at=utc_now(),
            movie_snapshot=MovieSnapshot(
                tmdb_id=abs(hash(str(uuid7()))) % 1_000_000 + 1, title="Race", genres=[]
            ),
        )
        session.add_all([organizer, *customers, event])
        await session.flush()
    return engine, factory, event, [organizer, *customers]


async def cleanup(
    factory: async_sessionmaker[AsyncSession], event: Event, users: list[User]
) -> None:
    async with factory.begin() as session:
        reservation_ids = select(Reservation.id).where(Reservation.event_id == event.id)
        await session.execute(delete(Ticket).where(Ticket.event_id == event.id))
        await session.execute(
            delete(SimulatedPayment).where(
                SimulatedPayment.reservation_id.in_(reservation_ids)
            )
        )
        await session.execute(
            delete(Reservation).where(Reservation.event_id == event.id)
        )
        await session.execute(
            delete(MovieSnapshot).where(MovieSnapshot.event_id == event.id)
        )
        await session.execute(delete(Event).where(Event.id == event.id))
        await session.execute(
            delete(User).where(User.id.in_([user.id for user in users]))
        )


async def test_two_connections_contending_for_last_unit_have_one_winner() -> None:
    engine, factory, event, users = await create_fixture(capacity=1)

    async def reserve(customer: User) -> bool:
        try:
            async with factory.begin() as session:
                await create_reservation(
                    session, event_id=event.id, customer_id=customer.id, quantity=1
                )
            return True
        except ConflictError:
            return False

    try:
        results = await asyncio.gather(reserve(users[1]), reserve(users[2]))
        async with factory() as session:
            stored = await session.get(Event, event.id)
            assert results.count(True) == 1
            assert stored is not None
            assert (stored.reserved_quantity, stored.sold_quantity) == (1, 0)
            assert stored.available_quantity == 0
    finally:
        await cleanup(factory, event, users)
        await engine.dispose()


async def test_payment_racing_expiry_has_one_terminal_outcome_and_one_release() -> None:
    engine, factory, event, users = await create_fixture(capacity=1)
    now = utc_now()
    async with factory.begin() as session:
        reservation = await create_reservation(
            session, event_id=event.id, customer_id=users[1].id, quantity=1, at=now
        )

    async def pay() -> str:
        try:
            async with factory.begin() as session:
                outcome = await process_simulated_payment(
                    session,
                    reservation_id=reservation.id,
                    customer_id=users[1].id,
                    idempotency_key="race-payment",
                    payment_token="tok_approved",
                    at=now + timedelta(minutes=14, seconds=59),
                )
            return outcome.reservation.status.value
        except ConflictError:
            return "CONFLICT"

    async def expire() -> bool:
        async with factory.begin() as session:
            return await expire_pending_reservation(
                session, reservation.id, at=now + timedelta(minutes=16)
            )

    try:
        await asyncio.gather(pay(), expire())
        async with factory() as session:
            stored_event = await session.get(Event, event.id)
            stored_reservation = await session.get(Reservation, reservation.id)
            ticket_count = len(
                (
                    await session.scalars(
                        select(Ticket).where(Ticket.reservation_id == reservation.id)
                    )
                ).all()
            )
            assert stored_event is not None and stored_reservation is not None
            assert stored_reservation.status in {
                ReservationStatus.APPROVED,
                ReservationStatus.EXPIRED,
            }
            assert stored_event.reserved_quantity == 0
            assert 0 <= stored_event.sold_quantity <= stored_event.capacity
            assert ticket_count == (
                1 if stored_reservation.status is ReservationStatus.APPROVED else 0
            )
    finally:
        await cleanup(factory, event, users)
        await engine.dispose()
