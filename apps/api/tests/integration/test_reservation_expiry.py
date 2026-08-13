import os
from collections.abc import AsyncIterator
from datetime import timedelta

import pytest
import pytest_asyncio

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://elite_tickets:elite_tickets@localhost:5432/elite_tickets")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-with-at-least-32-bytes")
os.environ.setdefault("QR_SECRET", "different-test-qr-secret-at-least-32-bytes")
os.environ.setdefault("TMDB_API_KEY", "test-key")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from test_purchase_flow import commerce_fixture

from elite_tickets.db.base import utc_now
from elite_tickets.reservations.models import ReservationStatus
from elite_tickets.reservations.service import (
    EXPIRY_BATCH_SIZE,
    create_reservation,
    expire_pending_reservation,
    expire_pending_reservations,
)

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


async def test_expiry_releases_inventory_exactly_once(session: AsyncSession) -> None:
    event, customer, _ = await commerce_fixture(session)
    now = utc_now()
    reservation = await create_reservation(
        session, event_id=event.id, customer_id=customer.id, quantity=2, at=now
    )

    assert await expire_pending_reservation(
        session, reservation.id, at=now + timedelta(minutes=16)
    )
    assert not await expire_pending_reservation(
        session, reservation.id, at=now + timedelta(minutes=17)
    )
    assert reservation.status is ReservationStatus.EXPIRED
    assert event.reserved_quantity == 0


async def test_expiry_batch_is_bounded_for_minute_runner(session: AsyncSession) -> None:
    event, customer, _ = await commerce_fixture(session)
    now = utc_now()
    for _ in range(EXPIRY_BATCH_SIZE + 1):
        await create_reservation(
            session, event_id=event.id, customer_id=customer.id, quantity=1, at=now
        )
        event.capacity += 1
    event.capacity += EXPIRY_BATCH_SIZE

    first = await expire_pending_reservations(session, at=now + timedelta(minutes=16))
    second = await expire_pending_reservations(session, at=now + timedelta(minutes=16))
    third = await expire_pending_reservations(session, at=now + timedelta(minutes=16))
    assert (first, second, third) == (EXPIRY_BATCH_SIZE, 1, 0)
    assert event.reserved_quantity == 0
