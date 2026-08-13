import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Header, Path
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from elite_tickets.auth.models import Role, User
from elite_tickets.auth.security import require_roles
from elite_tickets.db.session import get_session
from elite_tickets.events.service import PublicEvent, list_published_events
from elite_tickets.tickets.validation_models import TicketValidationResult
from elite_tickets.tickets.validation_service import validate_ticket

router = APIRouter(prefix="/gate", tags=["Gate"])


class TicketValidationRequest(BaseModel):
    credential: str = Field(min_length=1)


class TicketValidationResponse(BaseModel):
    result: TicketValidationResult
    attempted_at: datetime


@router.get("/events", response_model=list[PublicEvent])
async def gate_events(
    _: Annotated[User, Depends(require_roles(Role.GATE))],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[PublicEvent]:
    page = await list_published_events(session, page=1, page_size=100)
    return page.items


@router.post(
    "/events/{eventId}/validate",
    response_model=TicketValidationResponse,
    responses={
        403: {"description": "GATE role required"},
        409: {"description": "Selected event is not eligible for validation"},
    },
)
async def gate_validate_ticket(
    event_id: Annotated[uuid.UUID, Path(alias="eventId")],
    payload: TicketValidationRequest,
    _: Annotated[
        str,
        Header(alias="Idempotency-Key", min_length=8, max_length=128),
    ],
    user: Annotated[User, Depends(require_roles(Role.GATE))],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TicketValidationResponse:
    outcome = await validate_ticket(
        session,
        selected_event_id=event_id,
        gate_user_id=user.id,
        credential=payload.credential,
    )
    return TicketValidationResponse(
        result=outcome.result,
        attempted_at=outcome.attempted_at,
    )
