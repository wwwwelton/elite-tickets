import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from elite_tickets.db.base import utc_now
from elite_tickets.events.models import Event, EventState, MovieSnapshot
from elite_tickets.shared.errors import DomainValidationError

TMDB_POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500"
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


class PublicEvent(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: uuid.UUID
    state: EventState
    title: str
    poster_url: str | None
    starts_at: datetime
    ends_at: datetime
    venue_name: str
    capacity: int
    sold_quantity: int
    available_quantity: int
    price: Decimal


class PublicEventPage(BaseModel):
    model_config = ConfigDict(frozen=True)

    items: list[PublicEvent]
    page: int
    total: int


def _poster_url(path: str | None) -> str | None:
    if not path:
        return None
    return f"{TMDB_POSTER_BASE_URL}/{path.lstrip('/')}"


def _projection(event: Event, snapshot: MovieSnapshot) -> PublicEvent:
    return PublicEvent(
        id=event.id,
        state=event.state,
        title=snapshot.title,
        poster_url=_poster_url(snapshot.poster_path),
        starts_at=event.starts_at,
        ends_at=event.ends_at,
        venue_name=event.venue_name,
        capacity=event.capacity,
        sold_quantity=event.sold_quantity,
        available_quantity=event.available_quantity,
        price=event.price,
    )


def _escaped_search(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


async def finalize_ended_events(
    session: AsyncSession,
    *,
    event_id: uuid.UUID | None = None,
    at: datetime | None = None,
) -> int:
    now = at or utc_now()
    conditions = [Event.state == EventState.PUBLISHED, Event.ends_at <= now]
    if event_id is not None:
        conditions.append(Event.id == event_id)
    result = await session.execute(
        update(Event)
        .where(*conditions)
        .values(state=EventState.FINISHED, updated_at=now)
    )
    return result.rowcount  # type: ignore[attr-defined, no-any-return]


async def list_published_events(
    session: AsyncSession,
    *,
    query: str | None = None,
    page: int = 1,
    page_size: int = DEFAULT_PAGE_SIZE,
) -> PublicEventPage:
    if page < 1 or not 1 <= page_size <= MAX_PAGE_SIZE:
        raise DomainValidationError("invalid public event pagination")

    await finalize_ended_events(session)
    filters = [Event.state == EventState.PUBLISHED]
    normalized_query = query.strip() if query else ""
    if normalized_query:
        pattern = f"%{_escaped_search(normalized_query)}%"
        filters.append(
            or_(
                MovieSnapshot.title.ilike(pattern, escape="\\"),
                Event.venue_name.ilike(pattern, escape="\\"),
            )
        )

    total = await session.scalar(
        select(func.count())
        .select_from(Event)
        .join(MovieSnapshot, MovieSnapshot.event_id == Event.id)
        .where(*filters)
    )
    rows = await session.execute(
        select(Event, MovieSnapshot)
        .join(MovieSnapshot, MovieSnapshot.event_id == Event.id)
        .where(*filters)
        .order_by(Event.starts_at, Event.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return PublicEventPage(
        items=[_projection(event, snapshot) for event, snapshot in rows.all()],
        page=page,
        total=total or 0,
    )


async def get_published_event(
    session: AsyncSession,
    event_id: uuid.UUID,
) -> PublicEvent | None:
    await finalize_ended_events(session, event_id=event_id)
    row = (
        await session.execute(
            select(Event, MovieSnapshot)
            .join(MovieSnapshot, MovieSnapshot.event_id == Event.id)
            .where(Event.id == event_id, Event.state == EventState.PUBLISHED)
        )
    ).one_or_none()
    if row is None:
        return None
    return _projection(*row)
