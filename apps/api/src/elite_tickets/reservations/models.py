from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from elite_tickets.auth.models import User
from elite_tickets.db.base import (
    Base,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
    enum_type,
    utc_now,
)
from elite_tickets.events.models import Event


class ReservationStatus(StrEnum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    DECLINED = "DECLINED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


TERMINAL_RESERVATION_STATUSES = frozenset(
    {
        ReservationStatus.APPROVED,
        ReservationStatus.DECLINED,
        ReservationStatus.EXPIRED,
        ReservationStatus.CANCELLED,
    }
)


class PaymentToken(StrEnum):
    APPROVED = "tok_approved"
    DECLINED = "tok_declined"


class PaymentDecision(StrEnum):
    APPROVED = "APPROVED"
    DECLINED = "DECLINED"


class Reservation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "reservations"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="positive_quantity"),
        CheckConstraint("unit_price >= 0", name="non_negative_unit_price"),
        CheckConstraint(
            "total_amount = quantity * unit_price",
            name="calculated_total_amount",
        ),
        CheckConstraint("currency = 'BRL'", name="brl_currency"),
        CheckConstraint("expires_at > created_at", name="expiry_after_creation"),
        CheckConstraint(
            "(status = 'PENDING' AND completed_at IS NULL) OR "
            "(status IN ('APPROVED', 'DECLINED', 'EXPIRED', 'CANCELLED') "
            "AND completed_at IS NOT NULL)",
            name="status_completion_coherent",
        ),
        Index("ix_reservations_status_expires_at", "status", "expires_at"),
        Index("ix_reservations_customer_created_at", "customer_id", "created_at"),
        Index("ix_reservations_event_status", "event_id", "status"),
    )

    event_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("events.id", ondelete="RESTRICT"),
        nullable=False,
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    status: Mapped[ReservationStatus] = mapped_column(
        enum_type(ReservationStatus),
        default=ReservationStatus.PENDING,
        server_default=ReservationStatus.PENDING.value,
        nullable=False,
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    event: Mapped[Event] = relationship(lazy="raise")
    customer: Mapped[User] = relationship(lazy="raise")
    payment: Mapped[SimulatedPayment | None] = relationship(
        back_populates="reservation",
        cascade="all, delete-orphan",
        single_parent=True,
        uselist=False,
        lazy="raise",
    )

    @property
    def is_terminal(self) -> bool:
        return self.status in TERMINAL_RESERVATION_STATUSES


class SimulatedPayment(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "simulated_payments"
    __table_args__ = (
        CheckConstraint(
            "length(btrim(idempotency_key)) BETWEEN 1 AND 128",
            name="idempotency_key_length",
        ),
        CheckConstraint(
            "(test_token = 'tok_approved' AND decision = 'APPROVED') OR "
            "(test_token = 'tok_declined' AND decision = 'DECLINED')",
            name="token_decision_coherent",
        ),
        UniqueConstraint("reservation_id", name="uq_simulated_payments_reservation_id"),
        Index("ix_simulated_payments_idempotency_key", "idempotency_key"),
    )

    reservation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("reservations.id", ondelete="CASCADE"),
        nullable=False,
    )
    idempotency_key: Mapped[str] = mapped_column(String(128), nullable=False)
    test_token: Mapped[PaymentToken] = mapped_column(
        enum_type(PaymentToken), nullable=False
    )
    decision: Mapped[PaymentDecision] = mapped_column(
        enum_type(PaymentDecision),
        nullable=False,
    )
    processed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    reservation: Mapped[Reservation] = relationship(
        back_populates="payment",
        lazy="raise",
    )
