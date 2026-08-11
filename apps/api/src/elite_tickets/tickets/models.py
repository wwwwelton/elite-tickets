from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    LargeBinary,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from elite_tickets.auth.models import User
from elite_tickets.db.base import Base, UUIDPrimaryKeyMixin, enum_type, utc_now
from elite_tickets.events.models import Event
from elite_tickets.reservations.models import Reservation


class TicketStatus(StrEnum):
    ACTIVE = "ACTIVE"
    CANCELLED = "CANCELLED"


class Ticket(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "tickets"
    __table_args__ = (
        CheckConstraint("ordinal > 0", name="positive_ordinal"),
        CheckConstraint("length(qr_credential) > 0", name="qr_credential_not_empty"),
        CheckConstraint("octet_length(qr_nonce_hash) = 32", name="sha256_nonce_hash"),
        CheckConstraint(
            "length(btrim(qr_key_id)) BETWEEN 1 AND 32",
            name="qr_key_id_length",
        ),
        CheckConstraint(
            "(used_at IS NULL AND used_by_id IS NULL) OR "
            "(used_at IS NOT NULL AND used_by_id IS NOT NULL)",
            name="usage_fields_coherent",
        ),
        UniqueConstraint(
            "reservation_id",
            "ordinal",
            name="uq_tickets_reservation_id_ordinal",
        ),
        UniqueConstraint("qr_credential", name="uq_tickets_qr_credential"),
        UniqueConstraint("qr_nonce_hash", name="uq_tickets_qr_nonce_hash"),
        Index("ix_tickets_owner_issued_at", "owner_id", "issued_at"),
        Index("ix_tickets_event_status_used_at", "event_id", "status", "used_at"),
    )

    reservation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("reservations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("events.id", ondelete="RESTRICT"),
        nullable=False,
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    ordinal: Mapped[int] = mapped_column(Integer, nullable=False)
    qr_credential: Mapped[str] = mapped_column(Text, nullable=False)
    qr_nonce_hash: Mapped[bytes] = mapped_column(LargeBinary(32), nullable=False)
    qr_key_id: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[TicketStatus] = mapped_column(
        enum_type(TicketStatus),
        default=TicketStatus.ACTIVE,
        server_default=TicketStatus.ACTIVE.value,
        nullable=False,
    )
    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    used_by_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT")
    )

    reservation: Mapped[Reservation] = relationship(lazy="raise")
    event: Mapped[Event] = relationship(lazy="raise")
    owner: Mapped[User] = relationship(foreign_keys=[owner_id], lazy="raise")
    used_by: Mapped[User | None] = relationship(foreign_keys=[used_by_id], lazy="raise")

    @property
    def display_status(self) -> str:
        if self.status is TicketStatus.CANCELLED:
            return TicketStatus.CANCELLED.value
        if self.used_at is not None:
            return "USED"
        return TicketStatus.ACTIVE.value
