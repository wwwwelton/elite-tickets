import uuid
from datetime import datetime
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, Path, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from elite_tickets.auth.models import Role, User
from elite_tickets.auth.security import require_roles
from elite_tickets.catalog.interfaces import CatalogProvider
from elite_tickets.catalog.router import get_ticketmaster_client
from elite_tickets.db.session import get_session
from elite_tickets.events.organizer_service import (
    OrganizerEvent,
    cancel_owned_event,
    create_event_from_catalog,
    list_events,
    publish_owned_event,
)

router = APIRouter(tags=["Events"])


class EventCreate(BaseModel):
    external_id: str = Field(min_length=1, max_length=255)
    venue_name: str = Field(min_length=1, max_length=180)
    venue_address: str = Field(min_length=1, max_length=300)
    starts_at: datetime
    ends_at: datetime
    timezone: str = Field(min_length=1, max_length=64)
    capacity: int = Field(gt=0)
    price: Decimal = Field(ge=0, decimal_places=2, max_digits=12)


@router.post(
    "/events",
    response_model=OrganizerEvent,
    status_code=status.HTTP_201_CREATED,
)
async def create_event(
    payload: EventCreate,
    user: Annotated[User, Depends(require_roles(Role.ORGANIZER))],
    session: Annotated[AsyncSession, Depends(get_session)],
    catalog: Annotated[CatalogProvider, Depends(get_ticketmaster_client)],
) -> OrganizerEvent:
    return await create_event_from_catalog(
        session,
        organizer_id=user.id,
        external_id=payload.external_id,
        venue_name=payload.venue_name,
        venue_address=payload.venue_address,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        timezone=payload.timezone,
        capacity=payload.capacity,
        price=payload.price,
        catalog=catalog,
    )


@router.get("/organizer/events", response_model=list[OrganizerEvent])
async def organizer_events(
    user: Annotated[User, Depends(require_roles(Role.ORGANIZER))],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[OrganizerEvent]:
    return await list_events(session, viewer_id=user.id)


@router.post("/events/{eventId}/publish", response_model=OrganizerEvent)
async def publish_event(
    event_id: Annotated[uuid.UUID, Path(alias="eventId")],
    user: Annotated[User, Depends(require_roles(Role.ORGANIZER))],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> OrganizerEvent:
    return await publish_owned_event(
        session,
        event_id=event_id,
        organizer_id=user.id,
    )


@router.post("/events/{eventId}/cancel", response_model=OrganizerEvent)
async def cancel_event(
    event_id: Annotated[uuid.UUID, Path(alias="eventId")],
    user: Annotated[User, Depends(require_roles(Role.ORGANIZER))],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> OrganizerEvent:
    return await cancel_owned_event(
        session,
        event_id=event_id,
        organizer_id=user.id,
    )
