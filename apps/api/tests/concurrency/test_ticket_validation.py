import asyncio
import os
import time
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
from elite_tickets.reservations.models import Reservation, ReservationStatus
from elite_tickets.shared.errors import ConflictError
from elite_tickets.tickets.credentials import issue_qr_credential
from elite_tickets.tickets.models import Ticket, TicketStatus
from elite_tickets.tickets.validation_models import (
    TicketValidation,
    TicketValidationResult,
)
from elite_tickets.tickets.validation_service import validate_ticket

pytestmark = pytest.mark.concurrency


async def validation_fixture() -> tuple[
    AsyncEngine,
    async_sessionmaker[AsyncSession],
    Event,
    User,
    User,
    User,
    Ticket,
]:
    engine = create_async_engine(
        os.environ["DATABASE_URL"],
        pool_size=30,
        max_overflow=0,
    )
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory.begin() as session:
        organizer = User(email=f"o-{uuid7()}@validation-race.test", password_hash="x", display_name="O", role=Role.ORGANIZER)
        customer = User(email=f"c-{uuid7()}@validation-race.test", password_hash="x", display_name="C", role=Role.CUSTOMER)
        gate = User(email=f"g-{uuid7()}@validation-race.test", password_hash="x", display_name="G", role=Role.GATE)
        event = Event(
            organizer=organizer,
            state=EventState.PUBLISHED,
            venue_name="Race Gate",
            venue_address="Race Gate",
            starts_at=datetime(2030, 1, 1, tzinfo=UTC),
            ends_at=datetime(2030, 1, 2, tzinfo=UTC),
            timezone="UTC",
            capacity=1,
            reserved_quantity=0,
            sold_quantity=1,
            price=Decimal("10.00"),
            currency="BRL",
            published_at=utc_now(),
            movie_snapshot=MovieSnapshot(
                tmdb_id=abs(hash(str(uuid7()))) % 1_000_000 + 1,
                title="Validation Race",
                genres=[],
            ),
        )
        session.add_all([organizer, customer, gate, event])
        await session.flush()
        now = utc_now()
        reservation = Reservation(
            event_id=event.id,
            customer_id=customer.id,
            status=ReservationStatus.APPROVED,
            quantity=1,
            unit_price=event.price,
            total_amount=event.price,
            currency="BRL",
            expires_at=now + timedelta(minutes=15),
            completed_at=now,
            created_at=now,
            updated_at=now,
        )
        session.add(reservation)
        await session.flush()
        ticket_id = uuid7()
        qr = issue_qr_credential(ticket_id, event.id, issued_at=now)
        ticket = Ticket(
            id=ticket_id,
            reservation_id=reservation.id,
            event_id=event.id,
            owner_id=customer.id,
            ordinal=1,
            qr_credential=qr.token,
            qr_nonce_hash=qr.nonce_hash,
            qr_key_id=qr.key_id,
            status=TicketStatus.ACTIVE,
            issued_at=now,
        )
        session.add(ticket)
        await session.flush()
    return engine, factory, event, organizer, customer, gate, ticket


async def cleanup(
    factory: async_sessionmaker[AsyncSession],
    *,
    event: Event,
    organizer: User,
    customer: User,
    gate: User,
) -> None:
    async with factory.begin() as session:
        reservation_ids = select(Reservation.id).where(Reservation.event_id == event.id)
        await session.execute(delete(TicketValidation).where(TicketValidation.selected_event_id == event.id))
        await session.execute(delete(Ticket).where(Ticket.event_id == event.id))
        await session.execute(delete(Reservation).where(Reservation.id.in_(reservation_ids)))
        await session.execute(delete(MovieSnapshot).where(MovieSnapshot.event_id == event.id))
        await session.execute(delete(Event).where(Event.id == event.id))
        await session.execute(delete(User).where(User.id.in_([organizer.id, customer.id, gate.id])))


async def test_one_of_100_same_ticket_validations_consumes_exactly_once() -> None:
    engine, factory, event, organizer, customer, gate, ticket = await validation_fixture()

    async def attempt() -> TicketValidationResult:
        async with factory.begin() as session:
            outcome = await validate_ticket(
                session,
                selected_event_id=event.id,
                gate_user_id=gate.id,
                credential=ticket.qr_credential,
            )
        return outcome.result

    try:
        results = await asyncio.gather(*(attempt() for _ in range(100)))
        assert results.count(TicketValidationResult.VALID) == 1
        assert results.count(TicketValidationResult.ALREADY_USED) == 99
        async with factory() as session:
            stored = await session.get(Ticket, ticket.id)
            attempts = (
                await session.scalars(
                    select(TicketValidation).where(TicketValidation.ticket_id == ticket.id)
                )
            ).all()
            assert stored is not None
            assert stored.used_at is not None and stored.used_by_id == gate.id
            assert len(attempts) == 100
    finally:
        await cleanup(
            factory,
            event=event,
            organizer=organizer,
            customer=customer,
            gate=gate,
        )
        await engine.dispose()


async def test_cancellation_racing_validation_never_consumes_after_cancellation() -> None:
    engine, factory, event, organizer, customer, gate, ticket = await validation_fixture()
    started = asyncio.Event()

    async def validate() -> tuple[str, float]:
        await started.wait()
        try:
            async with factory.begin() as session:
                outcome = await validate_ticket(
                    session,
                    selected_event_id=event.id,
                    gate_user_id=gate.id,
                    credential=ticket.qr_credential,
                )
            return outcome.result.value, time.monotonic()
        except ConflictError:
            return "CONFLICT", time.monotonic()

    async def cancel() -> tuple[str, float]:
        started.set()
        async with factory.begin() as session:
            cancelled = await cancel_owned_event(
                session,
                event_id=event.id,
                organizer_id=organizer.id,
            )
        return cancelled.state.value, time.monotonic()

    try:
        validation_result, cancellation_result = await asyncio.gather(validate(), cancel())
        result, validation_completed = validation_result
        cancelled_state, cancellation_completed = cancellation_result
        assert cancelled_state == EventState.CANCELLED.value
        assert result in {TicketValidationResult.VALID.value, "CONFLICT"}
        assert not (
            result == TicketValidationResult.VALID.value
            and validation_completed > cancellation_completed
        )

        async with factory() as session:
            stored = await session.get(Ticket, ticket.id)
            assert stored is not None and stored.status is TicketStatus.CANCELLED
            used_at_after_race = stored.used_at

        async with factory.begin() as session:
            with pytest.raises(ConflictError):
                await validate_ticket(
                    session,
                    selected_event_id=event.id,
                    gate_user_id=gate.id,
                    credential=ticket.qr_credential,
                )
        async with factory() as session:
            stored = await session.get(Ticket, ticket.id)
            assert stored is not None and stored.used_at == used_at_after_race
    finally:
        await cleanup(
            factory,
            event=event,
            organizer=organizer,
            customer=customer,
            gate=gate,
        )
        await engine.dispose()
