"""Organizer-owned event lifecycle and snapshot persistence."""

import uuid
from datetime import datetime
from decimal import Decimal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from elite_tickets.catalog.tmdb import MovieDetails, TmdbClient
from elite_tickets.db.base import utc_now
from elite_tickets.events.models import Event, EventState, MovieSnapshot
from elite_tickets.events.service import _poster_url, finalize_ended_events
from elite_tickets.reservations.models import Reservation, ReservationStatus
from elite_tickets.shared.errors import (
    ConflictError,
    DomainValidationError,
    PermissionDeniedError,
    ResourceNotFoundError,
)
from elite_tickets.tickets.models import Ticket, TicketStatus
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession


class OrganizerEvent(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: uuid.UUID
    state: EventState
    title: str
    poster_url: str | None
    starts_at: datetime
    ends_at: datetime
    timezone: str
    venue_name: str
    venue_address: str
    capacity: int
    reserved_quantity: int
    sold_quantity: int
    available_quantity: int
    price: Decimal


async def create_event_from_tmdb(
    session: AsyncSession,
    *,
    organizer_id: uuid.UUID,
    tmdb_id: int,
    venue_name: str,
    venue_address: str,
    starts_at: datetime,
    ends_at: datetime,
    timezone: str,
    capacity: int,
    price: Decimal,
    catalog: TmdbClient,
) -> OrganizerEvent:
    normalized = _validate_event_fields(
        venue_name=venue_name,
        venue_address=venue_address,
        starts_at=starts_at,
        ends_at=ends_at,
        timezone=timezone,
        capacity=capacity,
        price=price,
    )
    movie = await catalog.movie_details(tmdb_id)
    event = Event(
        organizer_id=organizer_id,
        state=EventState.DRAFT,
        venue_name=normalized[0],
        venue_address=normalized[1],
        starts_at=starts_at,
        ends_at=ends_at,
        timezone=timezone,
        capacity=capacity,
        reserved_quantity=0,
        sold_quantity=0,
        price=price,
        currency="BRL",
        movie_snapshot=_snapshot(movie),
    )
    session.add(event)
    await session.flush()
    return _projection(event, event.movie_snapshot)


async def list_owned_events(
    session: AsyncSession,
    *,
    organizer_id: uuid.UUID,
    at: datetime | None = None,
) -> list[OrganizerEvent]:
    await finalize_ended_events(session, at=at)
    rows = await session.execute(
        select(Event, MovieSnapshot)
        .join(MovieSnapshot)
        .where(Event.organizer_id == organizer_id)
        .order_by(Event.starts_at, Event.id)
    )
    return [_projection(event, snapshot) for event, snapshot in rows.all()]


async def get_owned_event(
    session: AsyncSession,
    *,
    event_id: uuid.UUID,
    organizer_id: uuid.UUID,
    at: datetime | None = None,
) -> OrganizerEvent:
    await finalize_ended_events(session, event_id=event_id, at=at)
    row = (
        await session.execute(
            select(Event, MovieSnapshot).join(MovieSnapshot).where(Event.id == event_id)
        )
    ).one_or_none()
    if row is None:
        raise ResourceNotFoundError("event not found")
    if row.Event.organizer_id != organizer_id:
        raise PermissionDeniedError("event belongs to another organizer")
    return _projection(*row)


async def publish_owned_event(
    session: AsyncSession,
    *,
    event_id: uuid.UUID,
    organizer_id: uuid.UUID,
    at: datetime | None = None,
) -> OrganizerEvent:
    now = at or utc_now()
    event = await _owned_event_for_update(session, event_id, organizer_id)
    if event.state is not EventState.DRAFT or event.ends_at <= now:
        raise ConflictError("only an active draft can be published")
    event.state = EventState.PUBLISHED
    event.published_at = now
    event.updated_at = now
    await session.flush()
    return _projection(event, await _snapshot_for(session, event.id))


async def cancel_owned_event(
    session: AsyncSession,
    *,
    event_id: uuid.UUID,
    organizer_id: uuid.UUID,
    at: datetime | None = None,
) -> OrganizerEvent:
    now = at or utc_now()
    event = await _owned_event_for_update(session, event_id, organizer_id)
    if event.state is EventState.PUBLISHED and event.ends_at <= now:
        event.state = EventState.FINISHED
        event.updated_at = now
    if event.state is not EventState.PUBLISHED:
        raise ConflictError("only a published event can be cancelled")

    reservations = (
        await session.scalars(
            select(Reservation)
            .where(
                Reservation.event_id == event.id,
                Reservation.status == ReservationStatus.PENDING,
            )
            .order_by(Reservation.id)
            .with_for_update()
        )
    ).all()
    released = sum(reservation.quantity for reservation in reservations)
    if event.reserved_quantity != released:
        raise ConflictError("reserved inventory invariant violated during cancellation")
    for reservation in reservations:
        reservation.status = (
            ReservationStatus.EXPIRED
            if reservation.expires_at <= now
            else ReservationStatus.CANCELLED
        )
        reservation.completed_at = now
        reservation.updated_at = now

    event.reserved_quantity = 0
    event.state = EventState.CANCELLED
    event.cancelled_at = now
    event.updated_at = now
    await session.execute(
        update(Ticket)
        .where(Ticket.event_id == event.id)
        .values(status=TicketStatus.CANCELLED)
    )
    await session.flush()
    return _projection(event, await _snapshot_for(session, event.id))


async def _owned_event_for_update(
    session: AsyncSession,
    event_id: uuid.UUID,
    organizer_id: uuid.UUID,
) -> Event:
    event = await session.scalar(
        select(Event).where(Event.id == event_id).with_for_update()
    )
    if event is None:
        raise ResourceNotFoundError("event not found")
    if event.organizer_id != organizer_id:
        raise PermissionDeniedError("event belongs to another organizer")
    return event


async def _snapshot_for(session: AsyncSession, event_id: uuid.UUID) -> MovieSnapshot:
    snapshot = await session.get(MovieSnapshot, event_id)
    if snapshot is None:
        raise ConflictError("event snapshot is missing")
    return snapshot


def _snapshot(movie: MovieDetails) -> MovieSnapshot:
    return MovieSnapshot(
        tmdb_id=movie.tmdb_id,
        title=movie.title,
        overview=movie.overview,
        poster_path=movie.poster_path,
        backdrop_path=movie.backdrop_path,
        release_date=movie.release_date,
        original_language=movie.original_language,
        genres=[genre.model_dump() for genre in movie.genres],
        snapshot_at=utc_now(),
    )


def _projection(event: Event, snapshot: MovieSnapshot) -> OrganizerEvent:
    return OrganizerEvent(
        id=event.id,
        state=event.state,
        title=snapshot.title,
        poster_url=_poster_url(snapshot.poster_path),
        starts_at=event.starts_at,
        ends_at=event.ends_at,
        timezone=event.timezone,
        venue_name=event.venue_name,
        venue_address=event.venue_address,
        capacity=event.capacity,
        reserved_quantity=event.reserved_quantity,
        sold_quantity=event.sold_quantity,
        available_quantity=event.available_quantity,
        price=event.price,
    )


def _validate_event_fields(
    *,
    venue_name: str,
    venue_address: str,
    starts_at: datetime,
    ends_at: datetime,
    timezone: str,
    capacity: int,
    price: Decimal,
) -> tuple[str, str]:
    name, address = venue_name.strip(), venue_address.strip()
    if not name or len(name) > 180 or not address or len(address) > 300:
        raise DomainValidationError("invalid venue")
    if starts_at.tzinfo is None or ends_at.tzinfo is None or ends_at <= starts_at:
        raise DomainValidationError("invalid event time window")
    try:
        ZoneInfo(timezone)
    except (ZoneInfoNotFoundError, ValueError):
        raise DomainValidationError("invalid event timezone") from None
    if capacity < 1:
        raise DomainValidationError("invalid event capacity")
    if price < 0 or price.as_tuple().exponent != -2 or price >= Decimal(10000000000):
        raise DomainValidationError("invalid event price")
    return name, address
