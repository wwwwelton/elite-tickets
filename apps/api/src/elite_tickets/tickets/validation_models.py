from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from elite_tickets.auth.models import User
from elite_tickets.db.base import Base, UUIDPrimaryKeyMixin, enum_type, utc_now
from elite_tickets.events.models import Event
from elite_tickets.tickets.models import Ticket


class TicketValidationResult(StrEnum):
    VALID = "VALID"
    INVALID = "INVALID"
    ALREADY_USED = "ALREADY_USED"
    WRONG_EVENT = "WRONG_EVENT"


class TicketValidation(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "ticket_validations"

    selected_event_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("events.id", ondelete="RESTRICT"),
        nullable=False,
    )
    gate_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    ticket_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("tickets.id", ondelete="RESTRICT")
    )
    result: Mapped[TicketValidationResult] = mapped_column(
        enum_type(TicketValidationResult),
        nullable=False,
    )
    attempted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        server_default=func.now(),
        nullable=False,
    )

    selected_event: Mapped[Event] = relationship(lazy="raise")
    gate_user: Mapped[User] = relationship(lazy="raise")
    ticket: Mapped[Ticket | None] = relationship(lazy="raise")
