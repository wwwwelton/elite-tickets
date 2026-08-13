import base64
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

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from elite_tickets.auth.models import Role, User
from elite_tickets.auth.security import create_access_token
from elite_tickets.db.base import utc_now, uuid7
from elite_tickets.db.session import get_session
from elite_tickets.events.models import Event, EventState, MovieSnapshot
from elite_tickets.main import app
from elite_tickets.reservations.models import Reservation, ReservationStatus
from elite_tickets.shared.logging import REDACTED, redact_path, redact_text
from elite_tickets.tickets.credentials import issue_qr_credential
from elite_tickets.tickets.models import Ticket, TicketStatus
from elite_tickets.tickets.share_service import create_or_get_ticket_share
from elite_tickets.tickets.validation_models import TicketValidationResult
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


async def sharing_fixture(
    session: AsyncSession,
) -> tuple[Event, User, User, User, list[Ticket]]:
    organizer = User(email=f"o-{uuid7()}@share.test", password_hash="x", display_name="O", role=Role.ORGANIZER)
    owner = User(email=f"c-{uuid7()}@share.test", password_hash="x", display_name="Owner", role=Role.CUSTOMER)
    other = User(email=f"c-{uuid7()}@share.test", password_hash="x", display_name="Other", role=Role.CUSTOMER)
    gate = User(email=f"g-{uuid7()}@share.test", password_hash="x", display_name="Gate", role=Role.GATE)
    event = Event(
        organizer=organizer,
        state=EventState.PUBLISHED,
        venue_name="Share Venue",
        venue_address="Share Address",
        starts_at=datetime(2030, 1, 1, tzinfo=UTC),
        ends_at=datetime(2030, 1, 2, tzinfo=UTC),
        timezone="UTC",
        capacity=3,
        reserved_quantity=0,
        sold_quantity=3,
        price=Decimal("10.00"),
        currency="BRL",
        published_at=utc_now(),
        movie_snapshot=MovieSnapshot(tmdb_id=920_001, title="Shared Movie", genres=[]),
    )
    session.add_all([organizer, owner, other, gate, event])
    await session.flush()
    tickets = [await _ticket(session, event=event, owner=owner, ordinal=index) for index in range(1, 4)]
    return event, owner, other, gate, tickets


async def _ticket(
    session: AsyncSession,
    *,
    event: Event,
    owner: User,
    ordinal: int,
) -> Ticket:
    now = utc_now()
    reservation = Reservation(
        event_id=event.id,
        customer_id=owner.id,
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
    credential = issue_qr_credential(ticket_id, event.id, issued_at=now)
    ticket = Ticket(
        id=ticket_id,
        reservation_id=reservation.id,
        event_id=event.id,
        owner_id=owner.id,
        ordinal=ordinal,
        qr_credential=credential.token,
        qr_nonce_hash=credential.nonce_hash,
        qr_key_id=credential.key_id,
        status=TicketStatus.ACTIVE,
        issued_at=now,
    )
    session.add(ticket)
    await session.flush()
    return ticket


async def test_share_tokens_are_hashed_idempotent_owner_only_and_not_qr_credentials(
    session: AsyncSession,
) -> None:
    event, owner, other, gate, tickets = await sharing_fixture(session)
    first = await create_or_get_ticket_share(session, ticket_id=tickets[0].id, owner_id=owner.id)
    repeated = await create_or_get_ticket_share(session, ticket_id=tickets[0].id, owner_id=owner.id)
    second = await create_or_get_ticket_share(session, ticket_id=tickets[1].id, owner_id=owner.id)

    assert first.token == repeated.token
    assert first.share.id == repeated.share.id
    assert first.token != second.token
    assert first.token != tickets[0].qr_credential
    decoded = base64.urlsafe_b64decode(first.token + "=" * (-len(first.token) % 4))
    assert len(decoded) == 32
    assert first.share.token_hash != first.token.encode()
    assert len(first.share.token_hash) == 32

    outcome = await validate_ticket(
        session,
        selected_event_id=event.id,
        gate_user_id=gate.id,
        credential=first.token,
    )
    assert outcome.result is TicketValidationResult.INVALID
    await session.refresh(tickets[0])
    assert tickets[0].used_at is None

    async def session_override() -> AsyncIterator[AsyncSession]:
        yield session

    app.dependency_overrides[get_session] = session_override
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            forbidden = await client.post(
                f"/api/v1/me/tickets/{tickets[0].id}/share",
                headers={"Authorization": f"Bearer {create_access_token(other)}"},
            )
            allowed = await client.post(
                f"/api/v1/me/tickets/{tickets[0].id}/share",
                headers={"Authorization": f"Bearer {create_access_token(owner)}"},
            )
            repeated_http = await client.post(
                f"/api/v1/me/tickets/{tickets[0].id}/share",
                headers={"Authorization": f"Bearer {create_access_token(owner)}"},
            )
    finally:
        app.dependency_overrides.pop(get_session, None)

    assert forbidden.status_code == 403
    assert allowed.status_code == repeated_http.status_code == 200
    assert allowed.json()["share_url"] == repeated_http.json()["share_url"]


async def test_anonymous_share_is_limited_private_and_expires_on_use_or_event_end(
    session: AsyncSession,
) -> None:
    event, owner, _, gate, tickets = await sharing_fixture(session)
    used_share = await create_or_get_ticket_share(session, ticket_id=tickets[0].id, owner_id=owner.id)
    ended_share = await create_or_get_ticket_share(session, ticket_id=tickets[1].id, owner_id=owner.id)
    active_share = await create_or_get_ticket_share(session, ticket_id=tickets[2].id, owner_id=owner.id)

    async def session_override() -> AsyncIterator[AsyncSession]:
        yield session

    app.dependency_overrides[get_session] = session_override
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            anonymous = await client.get(f"/api/v1/shared/tickets/{active_share.token}")
            missing = await client.get(f"/api/v1/shared/tickets/{'A' * 43}")

            original_owner = tickets[0].owner_id
            tickets[0].used_at = utc_now()
            tickets[0].used_by_id = gate.id
            await session.flush()
            used = await client.get(f"/api/v1/shared/tickets/{used_share.token}")

            event.starts_at = datetime(2025, 1, 1, tzinfo=UTC)
            event.ends_at = datetime(2025, 1, 2, tzinfo=UTC)
            await session.flush()
            ended = await client.get(f"/api/v1/shared/tickets/{ended_share.token}")
    finally:
        app.dependency_overrides.pop(get_session, None)

    assert anonymous.status_code == 200
    assert set(anonymous.json()) == {
        "id",
        "event_id",
        "event_title",
        "owner_name",
        "status",
        "issued_at",
        "used_at",
        "qr_credential",
    }
    assert "reservation_id" not in anonymous.text
    assert tickets[0].owner_id == original_owner
    for response in (anonymous, missing, used, ended):
        assert response.headers["cache-control"] == "no-store"
        assert response.headers["referrer-policy"] == "no-referrer"
    assert missing.status_code == 404
    assert used.status_code == ended.status_code == 410


def test_share_tokens_are_redacted_from_paths_and_text_logs() -> None:
    token = "sensitive-share-token-with-enough-entropy-123456"
    path = f"/api/v1/shared/tickets/{token}"
    assert redact_path(path) == f"/api/v1/shared/tickets/{REDACTED}"
    assert token not in redact_text(f"GET {path}")
