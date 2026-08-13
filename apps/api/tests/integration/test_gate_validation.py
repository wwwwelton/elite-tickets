import os
from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://elite_tickets:elite_tickets@localhost:5432/elite_tickets")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-with-at-least-32-bytes")
os.environ.setdefault("QR_SECRET", "different-test-qr-secret-at-least-32-bytes")
os.environ.setdefault("TMDB_API_KEY", "test-key")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from elite_tickets.auth.models import Role, User
from elite_tickets.auth.security import create_access_token
from elite_tickets.db.base import utc_now, uuid7
from elite_tickets.db.session import get_session
from elite_tickets.events.models import Event, EventState, MovieSnapshot
from elite_tickets.main import app
from elite_tickets.reservations.models import Reservation, ReservationStatus
from elite_tickets.shared.errors import ConflictError
from elite_tickets.tickets.credentials import issue_qr_credential
from elite_tickets.tickets.models import Ticket, TicketStatus
from elite_tickets.tickets.validation_models import (
    TicketValidation,
    TicketValidationResult,
)
from elite_tickets.tickets.validation_service import validate_ticket

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


async def gate_fixture(session: AsyncSession) -> tuple[Event, Event, User, User]:
    organizer = User(email=f"o-{uuid7()}@gate.test", password_hash="x", display_name="O", role=Role.ORGANIZER)
    customer = User(email=f"c-{uuid7()}@gate.test", password_hash="x", display_name="C", role=Role.CUSTOMER)
    gate = User(email=f"g-{uuid7()}@gate.test", password_hash="x", display_name="G", role=Role.GATE)
    event = _event(organizer, "Gate A", 910_001)
    other_event = _event(organizer, "Gate B", 910_002)
    session.add_all([organizer, customer, gate, event, other_event])
    await session.flush()
    return event, other_event, gate, customer


def _event(organizer: User, title: str, tmdb_id: int) -> Event:
    return Event(
        organizer=organizer,
        state=EventState.PUBLISHED,
        venue_name="Portaria",
        venue_address="Rua de Teste",
        starts_at=datetime(2030, 1, 1, tzinfo=UTC),
        ends_at=datetime(2030, 1, 2, tzinfo=UTC),
        timezone="UTC",
        capacity=20,
        reserved_quantity=0,
        sold_quantity=0,
        price=Decimal("10.00"),
        currency="BRL",
        published_at=utc_now(),
        movie_snapshot=MovieSnapshot(tmdb_id=tmdb_id, title=title, genres=[]),
    )


async def _ticket(
    session: AsyncSession,
    *,
    event: Event,
    customer: User,
    ordinal: int,
    used_by: User | None = None,
) -> Ticket:
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
        ordinal=ordinal,
        qr_credential=qr.token,
        qr_nonce_hash=qr.nonce_hash,
        qr_key_id=qr.key_id,
        status=TicketStatus.ACTIVE,
        issued_at=now,
        used_at=now if used_by else None,
        used_by_id=used_by.id if used_by else None,
    )
    session.add(ticket)
    await session.flush()
    return ticket


async def test_gate_routes_enforce_role_and_list_only_published_events(session: AsyncSession) -> None:
    event, other_event, gate, customer = await gate_fixture(session)
    other_event.state = EventState.CANCELLED
    other_event.cancelled_at = utc_now()
    await session.flush()

    async def session_override() -> AsyncIterator[AsyncSession]:
        yield session

    app.dependency_overrides[get_session] = session_override
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            forbidden = await client.get(
                "/api/v1/gate/events",
                headers={"Authorization": f"Bearer {create_access_token(customer)}"},
            )
            allowed = await client.get(
                "/api/v1/gate/events",
                headers={"Authorization": f"Bearer {create_access_token(gate)}"},
            )
    finally:
        app.dependency_overrides.pop(get_session, None)

    assert forbidden.status_code == 403
    assert allowed.status_code == 200
    listed_ids = {item["id"] for item in allowed.json()}
    assert str(event.id) in listed_ids
    assert str(other_event.id) not in listed_ids


async def test_all_results_are_audited_and_failures_do_not_consume(session: AsyncSession) -> None:
    event, other_event, gate, customer = await gate_fixture(session)
    valid = await _ticket(session, event=event, customer=customer, ordinal=1)
    already_used = await _ticket(session, event=event, customer=customer, ordinal=2, used_by=gate)
    wrong_event = await _ticket(session, event=other_event, customer=customer, ordinal=3)

    outcomes = [
        await validate_ticket(session, selected_event_id=event.id, gate_user_id=gate.id, credential=valid.qr_credential),
        await validate_ticket(session, selected_event_id=event.id, gate_user_id=gate.id, credential="not-a-credential"),
        await validate_ticket(session, selected_event_id=event.id, gate_user_id=gate.id, credential=already_used.qr_credential),
        await validate_ticket(session, selected_event_id=event.id, gate_user_id=gate.id, credential=wrong_event.qr_credential),
    ]

    assert [outcome.result for outcome in outcomes] == [
        TicketValidationResult.VALID,
        TicketValidationResult.INVALID,
        TicketValidationResult.ALREADY_USED,
        TicketValidationResult.WRONG_EVENT,
    ]
    await session.refresh(valid)
    await session.refresh(already_used)
    await session.refresh(wrong_event)
    assert valid.used_at is not None and valid.used_by_id == gate.id
    assert already_used.used_at is not None and already_used.used_by_id == gate.id
    assert wrong_event.used_at is None and wrong_event.used_by_id is None
    attempts = (
        await session.scalars(
            select(TicketValidation)
            .where(TicketValidation.gate_user_id == gate.id)
            .order_by(TicketValidation.attempted_at, TicketValidation.id)
        )
    ).all()
    assert len(attempts) == 4
    assert {attempt.result for attempt in attempts} == set(TicketValidationResult)
    assert sum(attempt.ticket_id is None for attempt in attempts) == 1


@pytest.mark.parametrize("state", [EventState.CANCELLED, EventState.FINISHED])
async def test_ineligible_selected_event_rejects_without_attempt_or_consumption(
    session: AsyncSession,
    state: EventState,
) -> None:
    event, _, gate, customer = await gate_fixture(session)
    ticket = await _ticket(session, event=event, customer=customer, ordinal=1)
    event.state = state
    if state is EventState.CANCELLED:
        event.cancelled_at = utc_now()
        ticket.status = TicketStatus.CANCELLED
    await session.flush()

    with pytest.raises(ConflictError):
        await validate_ticket(
            session,
            selected_event_id=event.id,
            gate_user_id=gate.id,
            credential=ticket.qr_credential,
        )

    await session.refresh(ticket)
    assert ticket.used_at is None and ticket.used_by_id is None
    assert (
        await session.scalar(
            select(func.count())
            .select_from(TicketValidation)
            .where(TicketValidation.selected_event_id == event.id)
        )
        == 0
    )
