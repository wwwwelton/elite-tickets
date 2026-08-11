import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession

from elite_tickets.db.session import get_session
from elite_tickets.events.service import (
    PublicEvent,
    PublicEventPage,
    get_published_event,
    list_published_events,
)
from elite_tickets.shared.errors import ResourceNotFoundError

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("", response_model=PublicEventPage)
async def list_events(
    session: Annotated[AsyncSession, Depends(get_session)],
    query: Annotated[str | None, Query(max_length=200)] = None,
    page: Annotated[int, Query(ge=1)] = 1,
) -> PublicEventPage:
    return await list_published_events(session, query=query, page=page)


@router.get(
    "/{eventId}",
    response_model=PublicEvent,
    responses={404: {"description": "Resource not found or not publicly visible"}},
)
async def event_detail(
    event_id: Annotated[uuid.UUID, Path(alias="eventId")],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> PublicEvent:
    event = await get_published_event(session, event_id)
    if event is None:
        raise ResourceNotFoundError("published event not found")
    return event
