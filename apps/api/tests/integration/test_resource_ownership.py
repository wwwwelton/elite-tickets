import os
from collections.abc import AsyncIterator
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+psycopg://elite_tickets:elite_tickets@localhost:5432/elite_tickets",
)
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-with-at-least-32-bytes")
os.environ.setdefault("QR_SECRET", "different-test-qr-secret-at-least-32-bytes")
os.environ.setdefault("TMDB_API_KEY", "test-key")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")

from elite_tickets.auth.models import Role, User
from elite_tickets.auth.security import create_access_token
from elite_tickets.db.base import utc_now, uuid7
from elite_tickets.db.session import get_session
from elite_tickets.events.models import Event, EventState, MovieSnapshot
from elite_tickets.main import app
from elite_tickets.reservations.models import Reservation
from elite_tickets.reservations.payment import PaymentOutcome, process_simulated_payment
from elite_tickets.reservations.service import create_reservation
from elite_tickets.tickets.models import Ticket

pytestmark = pytest.mark.integration


@dataclass(frozen=True)
class OwnershipFixture:
    organizer: User
    other_organizer: User
    customer: User
    other_customer: User
    gate: User
    organizer_event: Event
    other_event: Event
    reservation: Reservation
    ticket: Ticket


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


@pytest_asyncio.fixture
async def client(session: AsyncSession) -> AsyncIterator[AsyncClient]:
    async def session_override() -> AsyncIterator[AsyncSession]:
        yield session

    app.dependency_overrides[get_session] = session_override
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.pop(get_session, None)


@pytest_asyncio.fixture
async def resources(session: AsyncSession) -> OwnershipFixture:
    organizer = _user(Role.ORGANIZER, "organizer")
    other_organizer = _user(Role.ORGANIZER, "other-organizer")
    customer = _user(Role.CUSTOMER, "customer")
    other_customer = _user(Role.CUSTOMER, "other-customer")
    gate = _user(Role.GATE, "gate")
    organizer_event = _event(organizer, tmdb_id=950_001, title="Owned Event")
    other_event = _event(other_organizer, tmdb_id=950_002, title="Foreign Event")
    session.add_all(
        [
            organizer,
            other_organizer,
            customer,
            other_customer,
            gate,
            organizer_event,
            other_event,
        ]
    )
    await session.flush()

    reservation = await create_reservation(
        session,
        event_id=organizer_event.id,
        customer_id=customer.id,
        quantity=1,
    )
    paid_reservation = await create_reservation(
        session,
        event_id=organizer_event.id,
        customer_id=customer.id,
        quantity=1,
    )
    payment = await process_simulated_payment(
        session,
        reservation_id=paid_reservation.id,
        customer_id=customer.id,
        idempotency_key="ownership-approved-payment",
        payment_token="tok_approved",
    )
    assert isinstance(payment, PaymentOutcome)
    assert len(payment.tickets) == 1
    return OwnershipFixture(
        organizer=organizer,
        other_organizer=other_organizer,
        customer=customer,
        other_customer=other_customer,
        gate=gate,
        organizer_event=organizer_event,
        other_event=other_event,
        reservation=reservation,
        ticket=payment.tickets[0],
    )


async def test_organizer_can_list_but_not_mutate_another_organizers_event(
    client: AsyncClient,
    resources: OwnershipFixture,
) -> None:
    headers = _authorization(resources.organizer)

    listed = await client.get("/api/v1/organizer/events", headers=headers)
    foreign_publish = await client.post(
        f"/api/v1/events/{resources.other_event.id}/publish",
        headers=headers,
    )
    foreign_cancel = await client.post(
        f"/api/v1/events/{resources.other_event.id}/cancel",
        headers=headers,
    )

    assert listed.status_code == 200
    by_id = {item["id"]: item for item in listed.json()}
    assert {str(resources.organizer_event.id), str(resources.other_event.id)} <= by_id.keys()
    assert by_id[str(resources.organizer_event.id)]["is_owner"] is True
    assert by_id[str(resources.other_event.id)]["is_owner"] is False
    assert foreign_publish.status_code == foreign_cancel.status_code == 403
    assert resources.other_event.state is EventState.PUBLISHED
    assert resources.other_event.cancelled_at is None


async def test_customer_cannot_pay_list_or_share_another_customers_resources(
    client: AsyncClient,
    resources: OwnershipFixture,
) -> None:
    outsider_headers = _authorization(resources.other_customer)

    foreign_payment = await client.post(
        f"/api/v1/reservations/{resources.reservation.id}/payment",
        headers={**outsider_headers, "Idempotency-Key": "foreign-payment-attempt"},
        json={"payment_token": "tok_approved"},
    )
    outsider_tickets = await client.get(
        "/api/v1/me/tickets",
        headers=outsider_headers,
    )
    foreign_share = await client.post(
        f"/api/v1/me/tickets/{resources.ticket.id}/share",
        headers=outsider_headers,
    )
    owner_tickets = await client.get(
        "/api/v1/me/tickets",
        headers=_authorization(resources.customer),
    )

    assert foreign_payment.status_code == 403
    assert outsider_tickets.status_code == 200
    assert outsider_tickets.json() == []
    assert outsider_tickets.headers["cache-control"] == "no-store"
    assert foreign_share.status_code == 403
    assert owner_tickets.status_code == 200
    assert {item["id"] for item in owner_tickets.json()} == {str(resources.ticket.id)}


async def test_only_gate_can_select_events_and_validate_without_resource_ownership(
    client: AsyncClient,
    resources: OwnershipFixture,
    session: AsyncSession,
) -> None:
    for user in (resources.organizer, resources.customer):
        denied_list = await client.get(
            "/api/v1/gate/events",
            headers=_authorization(user),
        )
        denied_validation = await client.post(
            f"/api/v1/gate/events/{resources.organizer_event.id}/validate",
            headers={**_authorization(user), "Idempotency-Key": "wrong-role-attempt"},
            json={"credential": resources.ticket.qr_credential},
        )
        assert denied_list.status_code == denied_validation.status_code == 403
        assert resources.ticket.used_at is None

    gate_headers = _authorization(resources.gate)
    listed = await client.get("/api/v1/gate/events", headers=gate_headers)
    validated = await client.post(
        f"/api/v1/gate/events/{resources.organizer_event.id}/validate",
        headers={**gate_headers, "Idempotency-Key": "authorized-gate-attempt"},
        json={"credential": resources.ticket.qr_credential},
    )

    assert listed.status_code == 200
    assert {
        str(resources.organizer_event.id),
        str(resources.other_event.id),
    } <= {item["id"] for item in listed.json()}
    assert validated.status_code == 200
    assert validated.json()["result"] == "VALID"
    await session.refresh(resources.ticket)
    assert resources.ticket.used_by_id == resources.gate.id


def _user(role: Role, label: str) -> User:
    return User(
        email=f"{label}-{uuid7()}@ownership.test",
        password_hash="unused",
        display_name=label,
        role=role,
    )


def _event(organizer: User, *, tmdb_id: int, title: str) -> Event:
    return Event(
        organizer=organizer,
        state=EventState.PUBLISHED,
        venue_name="Ownership Venue",
        venue_address="Ownership Address",
        starts_at=datetime(2030, 1, 1, tzinfo=UTC),
        ends_at=datetime(2030, 1, 2, tzinfo=UTC),
        timezone="UTC",
        capacity=10,
        reserved_quantity=0,
        sold_quantity=0,
        price=Decimal("25.00"),
        currency="BRL",
        published_at=utc_now(),
        movie_snapshot=MovieSnapshot(tmdb_id=tmdb_id, title=title, genres=[]),
    )


def _authorization(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user)}"}
