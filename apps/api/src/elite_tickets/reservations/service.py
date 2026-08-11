import uuid
from datetime import datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from elite_tickets.db.base import utc_now, uuid7
from elite_tickets.events.models import Event, EventState
from elite_tickets.events.service import finalize_ended_events
from elite_tickets.reservations.models import Reservation, ReservationStatus
from elite_tickets.shared.errors import ConflictError, DomainValidationError

RESERVATION_TTL = timedelta(minutes=15)
EXPIRY_BATCH_SIZE = 100


async def create_reservation(
    session: AsyncSession,
    *,
    event_id: uuid.UUID,
    customer_id: uuid.UUID,
    quantity: int,
    at: datetime | None = None,
) -> Reservation:
    if quantity <= 0:
        raise DomainValidationError("reservation quantity must be positive")

    now = at or utc_now()
    await finalize_ended_events(session, event_id=event_id, at=now)
    inventory = (
        await session.execute(
            update(Event)
            .where(
                Event.id == event_id,
                Event.state == EventState.PUBLISHED,
                Event.ends_at > now,
                Event.reserved_quantity + Event.sold_quantity + quantity
                <= Event.capacity,
            )
            .values(
                reserved_quantity=Event.reserved_quantity + quantity, updated_at=now
            )
            .returning(Event.price, Event.currency)
        )
    ).one_or_none()
    if inventory is None:
        raise ConflictError("event is unavailable or has insufficient inventory")

    reservation = Reservation(
        id=uuid7(),
        event_id=event_id,
        customer_id=customer_id,
        status=ReservationStatus.PENDING,
        quantity=quantity,
        unit_price=inventory.price,
        total_amount=inventory.price * quantity,
        currency=inventory.currency,
        expires_at=now + RESERVATION_TTL,
        created_at=now,
        updated_at=now,
    )
    session.add(reservation)
    await session.flush()
    return reservation


async def lock_event_and_reservation(
    session: AsyncSession,
    reservation_id: uuid.UUID,
) -> tuple[Event, Reservation] | None:
    """Lock commerce rows in the global Event → Reservation order."""

    event_id = await session.scalar(
        select(Reservation.event_id).where(Reservation.id == reservation_id)
    )
    if event_id is None:
        return None

    event = await session.scalar(
        select(Event).where(Event.id == event_id).with_for_update()
    )
    if event is None:
        return None
    reservation = await session.scalar(
        select(Reservation).where(Reservation.id == reservation_id).with_for_update()
    )
    if reservation is None or reservation.event_id != event.id:
        return None
    return event, reservation


async def expire_pending_reservation(
    session: AsyncSession,
    reservation_id: uuid.UUID,
    *,
    at: datetime | None = None,
) -> bool:
    now = at or utc_now()
    locked = await lock_event_and_reservation(session, reservation_id)
    if locked is None:
        return False
    event, reservation = locked
    if (
        reservation.status is not ReservationStatus.PENDING
        or reservation.expires_at > now
    ):
        return False
    if event.reserved_quantity < reservation.quantity:
        raise ConflictError("reserved inventory invariant violated during expiry")

    event.reserved_quantity -= reservation.quantity
    event.updated_at = now
    reservation.status = ReservationStatus.EXPIRED
    reservation.completed_at = now
    reservation.updated_at = now
    await session.flush()
    return True


async def expire_pending_reservations(
    session: AsyncSession,
    *,
    at: datetime | None = None,
    batch_size: int = EXPIRY_BATCH_SIZE,
) -> int:
    if not 1 <= batch_size <= EXPIRY_BATCH_SIZE:
        raise DomainValidationError("invalid expiry batch size")
    now = at or utc_now()
    candidates = (
        await session.execute(
            select(Reservation.id)
            .where(
                Reservation.status == ReservationStatus.PENDING,
                Reservation.expires_at <= now,
            )
            .order_by(Reservation.event_id, Reservation.id)
            .limit(batch_size)
        )
    ).scalars()
    expired = 0
    for reservation_id in candidates:
        expired += await expire_pending_reservation(
            session,
            reservation_id,
            at=now,
        )
    return expired
