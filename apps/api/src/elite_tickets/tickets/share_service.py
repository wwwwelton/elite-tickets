from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import ClassVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from elite_tickets.auth.models import User
from elite_tickets.db.base import utc_now
from elite_tickets.events.models import Event, MovieSnapshot
from elite_tickets.shared.config import get_settings
from elite_tickets.shared.errors import (
    ConflictError,
    DomainError,
    PermissionDeniedError,
    ResourceNotFoundError,
)
from elite_tickets.tickets.models import Ticket, TicketStatus
from elite_tickets.tickets.share_models import TicketShare

SHARE_ID_BYTES = 16
SHARE_DOMAIN = b"elite-tickets:share:v1\x00"


class ShareExpiredError(DomainError):
    status_code: ClassVar[int] = 410
    code: ClassVar[str] = "share_expired"
    public_message: ClassVar[str] = "The shared ticket is no longer available"


@dataclass(frozen=True, slots=True)
class TicketShareToken:
    share: TicketShare
    token: str


@dataclass(frozen=True, slots=True)
class SharedTicket:
    ticket: Ticket
    owner_name: str
    event_title: str


def _share_key() -> bytes:
    secret = get_settings().qr_secret.get_secret_value().encode()
    return hmac.digest(secret, SHARE_DOMAIN + b"key", "sha256")


def _token_for_share_id(share_id: uuid.UUID) -> str:
    token_bytes = hmac.digest(_share_key(), SHARE_DOMAIN + share_id.bytes, "sha256")
    return base64.urlsafe_b64encode(token_bytes).rstrip(b"=").decode("ascii")


def _token_hash(token: str) -> bytes:
    return hashlib.sha256(token.encode("ascii")).digest()


def _new_share_id() -> uuid.UUID:
    return uuid.UUID(bytes=secrets.token_bytes(SHARE_ID_BYTES))


def _ensure_shareable(ticket: Ticket, event: Event, *, at: datetime) -> None:
    if (
        ticket.status is not TicketStatus.ACTIVE
        or ticket.used_at is not None
        or event.ends_at <= at
    ):
        raise ConflictError("ticket is no longer shareable")


async def create_or_get_ticket_share(
    session: AsyncSession,
    *,
    ticket_id: uuid.UUID,
    owner_id: uuid.UUID,
    at: datetime | None = None,
) -> TicketShareToken:
    now = at or utc_now()
    row = (
        await session.execute(
            select(Ticket, Event)
            .join(Event, Event.id == Ticket.event_id)
            .where(Ticket.id == ticket_id)
            .with_for_update(of=Ticket)
        )
    ).one_or_none()
    if row is None:
        raise ResourceNotFoundError("ticket not found")
    ticket, event = row
    if ticket.owner_id != owner_id:
        raise PermissionDeniedError("ticket belongs to another customer")
    _ensure_shareable(ticket, event, at=now)

    share = await session.scalar(
        select(TicketShare).where(TicketShare.ticket_id == ticket.id)
    )
    if share is None:
        share = TicketShare(
            id=_new_share_id(),
            ticket_id=ticket.id,
            token_hash=b"\x00" * 32,
            created_at=now,
        )
        token = _token_for_share_id(share.id)
        share.token_hash = _token_hash(token)
        session.add(share)
        await session.flush()
        return TicketShareToken(share=share, token=token)

    token = _token_for_share_id(share.id)
    if not hmac.compare_digest(share.token_hash, _token_hash(token)):
        raise ConflictError("stored ticket share cannot be recovered")
    return TicketShareToken(share=share, token=token)


async def get_shared_ticket(
    session: AsyncSession,
    *,
    token: str,
    at: datetime | None = None,
) -> SharedTicket:
    normalized = token.strip()
    if not 22 <= len(normalized) <= 128 or not normalized.isascii():
        raise ResourceNotFoundError("ticket share not found")
    row = (
        await session.execute(
            select(TicketShare, Ticket, User, Event, MovieSnapshot)
            .join(Ticket, Ticket.id == TicketShare.ticket_id)
            .join(User, User.id == Ticket.owner_id)
            .join(Event, Event.id == Ticket.event_id)
            .join(MovieSnapshot, MovieSnapshot.event_id == Event.id)
            .where(TicketShare.token_hash == _token_hash(normalized))
        )
    ).one_or_none()
    if row is None:
        raise ResourceNotFoundError("ticket share not found")
    _, ticket, owner, event, snapshot = row
    if (
        ticket.status is not TicketStatus.ACTIVE
        or ticket.used_at is not None
        or event.ends_at <= (at or utc_now())
    ):
        raise ShareExpiredError
    return SharedTicket(
        ticket=ticket,
        owner_name=owner.display_name,
        event_title=snapshot.title,
    )
