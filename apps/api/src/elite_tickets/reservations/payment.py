import uuid
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from elite_tickets.db.base import utc_now, uuid7
from elite_tickets.events.models import Event, EventState
from elite_tickets.reservations.models import (
    PaymentDecision,
    PaymentToken,
    Reservation,
    ReservationStatus,
    SimulatedPayment,
)
from elite_tickets.reservations.service import lock_event_and_reservation
from elite_tickets.shared.errors import (
    ConflictError,
    DomainValidationError,
    PermissionDeniedError,
    ResourceNotFoundError,
)
from elite_tickets.tickets.credentials import issue_qr_credential
from elite_tickets.tickets.models import Ticket, TicketStatus


@dataclass(frozen=True, slots=True)
class PaymentOutcome:
    reservation: Reservation
    decision: PaymentDecision
    tickets: tuple[Ticket, ...]


@dataclass(frozen=True, slots=True)
class PaymentConflict:
    reservation: Reservation
    message: str


async def _reservation_tickets(
    session: AsyncSession,
    reservation_id: uuid.UUID,
) -> tuple[Ticket, ...]:
    tickets = (
        await session.scalars(
            select(Ticket)
            .where(Ticket.reservation_id == reservation_id)
            .order_by(Ticket.ordinal)
        )
    ).all()
    return tuple(tickets)


def _release_reserved_inventory(
    event: Event,
    reservation: Reservation,
    *,
    now: datetime,
) -> None:
    if event.reserved_quantity < reservation.quantity:
        raise ConflictError("reserved inventory invariant violated during payment")
    event.reserved_quantity -= reservation.quantity
    event.updated_at = now


async def _existing_outcome(
    session: AsyncSession,
    reservation: Reservation,
    existing: SimulatedPayment,
    *,
    idempotency_key: str,
    token: PaymentToken,
) -> PaymentOutcome:
    if existing.idempotency_key != idempotency_key or existing.test_token is not token:
        raise ConflictError("idempotency key was reused with a different payload")
    tickets = (
        await _reservation_tickets(session, reservation.id)
        if existing.decision is PaymentDecision.APPROVED
        else ()
    )
    return PaymentOutcome(
        reservation=reservation,
        decision=existing.decision,
        tickets=tickets,
    )


async def process_simulated_payment(
    session: AsyncSession,
    *,
    reservation_id: uuid.UUID,
    customer_id: uuid.UUID,
    idempotency_key: str,
    payment_token: str,
    at: datetime | None = None,
) -> PaymentOutcome | PaymentConflict:
    normalized_key = idempotency_key.strip()
    if not 1 <= len(normalized_key) <= 128:
        raise DomainValidationError("invalid idempotency key")
    try:
        token = PaymentToken(payment_token)
    except ValueError:
        raise DomainValidationError("invalid simulated payment token") from None

    now = at or utc_now()
    locked = await lock_event_and_reservation(session, reservation_id)
    if locked is None:
        raise ResourceNotFoundError("reservation not found")
    event, reservation = locked
    if reservation.customer_id != customer_id:
        raise PermissionDeniedError("reservation belongs to another customer")

    existing = await session.scalar(
        select(SimulatedPayment)
        .where(SimulatedPayment.reservation_id == reservation.id)
        .with_for_update()
    )
    if existing is not None:
        return await _existing_outcome(
            session,
            reservation,
            existing,
            idempotency_key=normalized_key,
            token=token,
        )

    if reservation.status is not ReservationStatus.PENDING:
        raise ConflictError("reservation already reached a terminal state")
    if reservation.expires_at <= now:
        _release_reserved_inventory(event, reservation, now=now)
        reservation.status = ReservationStatus.EXPIRED
        reservation.completed_at = now
        reservation.updated_at = now
        await session.flush()
        return PaymentConflict(
            reservation=reservation,
            message="Reservation expired before payment",
        )
    if event.state is not EventState.PUBLISHED or event.ends_at <= now:
        _release_reserved_inventory(event, reservation, now=now)
        reservation.status = (
            ReservationStatus.CANCELLED
            if event.state is EventState.CANCELLED
            else ReservationStatus.EXPIRED
        )
        reservation.completed_at = now
        reservation.updated_at = now
        if event.state is EventState.PUBLISHED and event.ends_at <= now:
            event.state = EventState.FINISHED
        await session.flush()
        return PaymentConflict(
            reservation=reservation,
            message="Event is not eligible for payment",
        )

    decision = (
        PaymentDecision.APPROVED
        if token is PaymentToken.APPROVED
        else PaymentDecision.DECLINED
    )
    _release_reserved_inventory(event, reservation, now=now)
    reservation.status = ReservationStatus(decision.value)
    reservation.completed_at = now
    reservation.updated_at = now
    payment = SimulatedPayment(
        id=uuid7(),
        reservation_id=reservation.id,
        idempotency_key=normalized_key,
        test_token=token,
        decision=decision,
        processed_at=now,
    )
    session.add(payment)

    issued_tickets: list[Ticket] = []
    if decision is PaymentDecision.APPROVED:
        if event.sold_quantity + reservation.quantity > event.capacity:
            raise ConflictError("sold inventory would exceed event capacity")
        event.sold_quantity += reservation.quantity
        for ordinal in range(1, reservation.quantity + 1):
            ticket_id = uuid7()
            credential = issue_qr_credential(ticket_id, event.id, issued_at=now)
            ticket = Ticket(
                id=ticket_id,
                reservation_id=reservation.id,
                event_id=event.id,
                owner_id=reservation.customer_id,
                ordinal=ordinal,
                qr_credential=credential.token,
                qr_nonce_hash=credential.nonce_hash,
                qr_key_id=credential.key_id,
                status=TicketStatus.ACTIVE,
                issued_at=now,
            )
            session.add(ticket)
            issued_tickets.append(ticket)

    await session.flush()
    return PaymentOutcome(
        reservation=reservation,
        decision=decision,
        tickets=tuple(issued_tickets),
    )
