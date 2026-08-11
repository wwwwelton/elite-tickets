from __future__ import annotations

import uuid
from datetime import datetime

from elite_tickets.db.base import Base, UUIDPrimaryKeyMixin, utc_now
from elite_tickets.tickets.models import Ticket
from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    LargeBinary,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship


class TicketShare(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "ticket_shares"
    __table_args__ = (
        CheckConstraint("octet_length(token_hash) = 32", name="sha256_token_hash"),
        UniqueConstraint("ticket_id", name="uq_ticket_shares_ticket_id"),
        UniqueConstraint("token_hash", name="uq_ticket_shares_token_hash"),
    )

    ticket_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tickets.id", ondelete="RESTRICT"),
        nullable=False,
    )
    token_hash: Mapped[bytes] = mapped_column(LargeBinary(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        server_default=func.now(),
        nullable=False,
    )

    ticket: Mapped[Ticket] = relationship(lazy="raise")
