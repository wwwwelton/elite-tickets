from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from elite_tickets.auth.models import User
from elite_tickets.db.base import (
    Base,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
    enum_type,
    utc_now,
)


class EventState(StrEnum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    CANCELLED = "CANCELLED"
    FINISHED = "FINISHED"


class Event(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "events"
    __table_args__ = (
        CheckConstraint("length(btrim(venue_name)) > 0", name="venue_name_not_empty"),
        CheckConstraint(
            "length(btrim(venue_address)) > 0",
            name="venue_address_not_empty",
        ),
        CheckConstraint("ends_at > starts_at", name="valid_time_window"),
        CheckConstraint("capacity > 0", name="positive_capacity"),
        CheckConstraint("reserved_quantity >= 0", name="non_negative_reserved"),
        CheckConstraint("sold_quantity >= 0", name="non_negative_sold"),
        CheckConstraint(
            "reserved_quantity + sold_quantity <= capacity",
            name="bounded_inventory",
        ),
        CheckConstraint("price >= 0", name="non_negative_price"),
        CheckConstraint("currency = 'BRL'", name="brl_currency"),
        CheckConstraint(
            "(state = 'DRAFT' AND published_at IS NULL AND cancelled_at IS NULL) OR "
            "(state = 'PUBLISHED' AND published_at IS NOT NULL AND cancelled_at IS NULL) OR "
            "(state = 'CANCELLED' AND published_at IS NOT NULL AND cancelled_at IS NOT NULL) OR "
            "(state = 'FINISHED' AND published_at IS NOT NULL AND cancelled_at IS NULL)",
            name="state_timestamps_coherent",
        ),
        Index("ix_events_state_starts_at", "state", "starts_at"),
        Index("ix_events_organizer_state", "organizer_id", "state"),
    )

    organizer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    state: Mapped[EventState] = mapped_column(
        enum_type(EventState),
        default=EventState.DRAFT,
        server_default=EventState.DRAFT.value,
        nullable=False,
    )
    venue_name: Mapped[str] = mapped_column(String(180), nullable=False)
    venue_address: Mapped[str] = mapped_column(String(300), nullable=False)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    reserved_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default="0",
        nullable=False,
    )
    sold_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default="0",
        nullable=False,
    )
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(
        String(3),
        default="BRL",
        server_default="BRL",
        nullable=False,
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    organizer: Mapped[User] = relationship(lazy="raise")
    movie_snapshot: Mapped[MovieSnapshot] = relationship(
        back_populates="event",
        cascade="all, delete-orphan",
        single_parent=True,
        uselist=False,
        lazy="raise",
    )

    @property
    def available_quantity(self) -> int:
        return self.capacity - self.reserved_quantity - self.sold_quantity


class MovieSnapshot(Base):
    __tablename__ = "movie_snapshots"
    __table_args__ = (
        CheckConstraint("tmdb_id > 0", name="positive_tmdb_id"),
        CheckConstraint("media_type = 'movie'", name="movie_media_type"),
        CheckConstraint("length(btrim(title)) > 0", name="title_not_empty"),
    )

    event_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"),
        primary_key=True,
    )
    external_source: Mapped[str] = mapped_column(
        String(32),
        default="ticketmaster",
        server_default="ticketmaster",
        nullable=False,
    )
    # Older locally seeded snapshots may not have provider provenance. New
    # Ticketmaster snapshots populate this field through the organizer flow.
    external_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    external_url: Mapped[str | None] = mapped_column(Text)
    tmdb_id: Mapped[int] = mapped_column(Integer, nullable=False)
    media_type: Mapped[str] = mapped_column(
        String(16),
        default="movie",
        server_default="movie",
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    overview: Mapped[str | None] = mapped_column(Text)
    poster_path: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(Text)
    backdrop_path: Mapped[str | None] = mapped_column(Text)
    release_date: Mapped[date | None] = mapped_column(Date)
    event_date: Mapped[date | None] = mapped_column(Date)
    original_language: Mapped[str | None] = mapped_column(String(16))
    category: Mapped[str | None] = mapped_column(String(120))
    venue_name: Mapped[str | None] = mapped_column(String(200))
    city: Mapped[str | None] = mapped_column(String(120))
    country_code: Mapped[str | None] = mapped_column(String(2))
    genres: Mapped[list[dict[str, object]]] = mapped_column(
        JSONB,
        default=list,
        server_default=text("'[]'::jsonb"),
        nullable=False,
    )
    snapshot_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        server_default=text("now()"),
        nullable=False,
    )

    event: Mapped[Event] = relationship(back_populates="movie_snapshot", lazy="raise")
