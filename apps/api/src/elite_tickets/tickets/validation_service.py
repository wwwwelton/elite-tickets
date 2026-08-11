from __future__ import annotations

import hmac
import uuid
from dataclasses import dataclass
from datetime import datetime

from elite_tickets.db.base import utc_now, uuid7
from elite_tickets.events.models import Event, EventState
from elite_tickets.reservations.models import Reservation, ReservationStatus
from elite_tickets.shared.errors import ConflictError, ResourceNotFoundError
from elite_tickets.tickets.credentials import (
    InvalidQrCredential,
    VerifiedQrCredential,
    verify_qr_credential,
)
from elite_tickets.tickets.models import Ticket, TicketStatus
from elite_tickets.tickets.validation_models import (
    TicketValidation,
    TicketValidationResult,
)
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession


@dataclass(frozen=True, slots=True)
class TicketValidationOutcome:
    result: TicketValidationResult
    attempted_at: datetime


async def _record_attempt(
    session: AsyncSession,
    *,
    selected_event_id: uuid.UUID,
    gate_user_id: uuid.UUID,
    ticket_id: uuid.UUID | None,
    result: TicketValidationResult,
    attempted_at: datetime,
) -> TicketValidationOutcome:
    session.add(
        TicketValidation(
            id=uuid7(),
            selected_event_id=selected_event_id,
            gate_user_id=gate_user_id,
            ticket_id=ticket_id,
            result=result,
            attempted_at=attempted_at,
        )
    )
    await session.flush()
    return TicketValidationOutcome(result=result, attempted_at=attempted_at)


def _credential_matches_ticket(
    ticket: Ticket,
    verified: VerifiedQrCredential,
    credential: str,
) -> bool:
    return (
        ticket.id == verified.ticket_id
        and ticket.event_id == verified.event_id
        and ticket.qr_key_id == verified.key_id
        and hmac.compare_digest(ticket.qr_nonce_hash, verified.nonce_hash)
        and hmac.compare_digest(ticket.qr_credential, credential)
    )


async def _classify_non_consumed(
    session: AsyncSession,
    *,
    selected_event_id: uuid.UUID,
    verified: VerifiedQrCredential,
    credential: str,
    attempted_at: datetime,
) -> tuple[TicketValidationResult, uuid.UUID | None]:
    row = (
        await session.execute(
            select(Ticket, Reservation, Event)
            .join(Reservation, Reservation.id == Ticket.reservation_id)
            .join(Event, Event.id == Ticket.event_id)
            .where(Ticket.id == verified.ticket_id)
        )
    ).one_or_none()
    if row is None:
        return TicketValidationResult.INVALID, None

    ticket, reservation, ticket_event = row
    if not _credential_matches_ticket(ticket, verified, credential):
        return TicketValidationResult.INVALID, None
    if (
        ticket.status is not TicketStatus.ACTIVE
        or reservation.status is not ReservationStatus.APPROVED
        or ticket_event.state is not EventState.PUBLISHED
        or ticket_event.ends_at <= attempted_at
    ):
        return TicketValidationResult.INVALID, ticket.id
    if ticket.event_id != selected_event_id:
        return TicketValidationResult.WRONG_EVENT, ticket.id
    if ticket.used_at is not None:
        return TicketValidationResult.ALREADY_USED, ticket.id
    return TicketValidationResult.INVALID, ticket.id


async def validate_ticket(
    session: AsyncSession,
    *,
    selected_event_id: uuid.UUID,
    gate_user_id: uuid.UUID,
    credential: str,
    at: datetime | None = None,
) -> TicketValidationOutcome:
    attempted_at = at or utc_now()
    selected_event = await session.scalar(
        select(Event)
        .where(Event.id == selected_event_id)
        .with_for_update(read=True)
    )
    if selected_event is None:
        raise ResourceNotFoundError("selected event not found")
    if (
        selected_event.state is not EventState.PUBLISHED
        or selected_event.ends_at <= attempted_at
    ):
        raise ConflictError("selected event is not eligible for validation")

    try:
        verified = verify_qr_credential(credential)
    except InvalidQrCredential:
        return await _record_attempt(
            session,
            selected_event_id=selected_event_id,
            gate_user_id=gate_user_id,
            ticket_id=None,
            result=TicketValidationResult.INVALID,
            attempted_at=attempted_at,
        )

    if verified.event_id == selected_event_id:
        consumed_ticket_id = await session.scalar(
            update(Ticket)
            .where(
                Ticket.id == verified.ticket_id,
                Ticket.event_id == selected_event_id,
                Ticket.qr_credential == credential,
                Ticket.qr_nonce_hash == verified.nonce_hash,
                Ticket.qr_key_id == verified.key_id,
                Ticket.status == TicketStatus.ACTIVE,
                Ticket.used_at.is_(None),
                Ticket.reservation_id.in_(
                    select(Reservation.id).where(
                        Reservation.status == ReservationStatus.APPROVED
                    )
                ),
            )
            .values(used_at=attempted_at, used_by_id=gate_user_id)
            .returning(Ticket.id)
        )
        if consumed_ticket_id is not None:
            return await _record_attempt(
                session,
                selected_event_id=selected_event_id,
                gate_user_id=gate_user_id,
                ticket_id=consumed_ticket_id,
                result=TicketValidationResult.VALID,
                attempted_at=attempted_at,
            )

    result, ticket_id = await _classify_non_consumed(
        session,
        selected_event_id=selected_event_id,
        verified=verified,
        credential=credential,
        attempted_at=attempted_at,
    )
    return await _record_attempt(
        session,
        selected_event_id=selected_event_id,
        gate_user_id=gate_user_id,
        ticket_id=ticket_id,
        result=result,
        attempted_at=attempted_at,
    )
