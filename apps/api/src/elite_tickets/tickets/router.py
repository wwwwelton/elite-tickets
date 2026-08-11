import uuid
from datetime import datetime
from typing import Annotated, Literal, cast

from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from elite_tickets.auth.models import Role, User
from elite_tickets.auth.security import require_roles
from elite_tickets.db.session import get_session
from elite_tickets.tickets.models import Ticket

router = APIRouter(prefix="/me/tickets", tags=["Tickets"])


class TicketResponse(BaseModel):
    id: uuid.UUID
    event_id: uuid.UUID
    owner_name: str
    status: Literal["ACTIVE", "USED", "CANCELLED"]
    issued_at: datetime
    used_at: datetime | None
    qr_credential: str

    @classmethod
    def from_model(cls, ticket: Ticket, *, owner_name: str) -> "TicketResponse":
        return cls(
            id=ticket.id,
            event_id=ticket.event_id,
            owner_name=owner_name,
            status=cast(
                Literal["ACTIVE", "USED", "CANCELLED"],
                ticket.display_status,
            ),
            issued_at=ticket.issued_at,
            used_at=ticket.used_at,
            qr_credential=ticket.qr_credential,
        )


@router.get(
    "",
    response_model=list[TicketResponse],
    responses={403: {"description": "CUSTOMER role required"}},
)
async def list_my_tickets(
    response: Response,
    user: Annotated[User, Depends(require_roles(Role.CUSTOMER))],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[TicketResponse]:
    tickets = (
        await session.scalars(
            select(Ticket)
            .where(Ticket.owner_id == user.id)
            .order_by(Ticket.issued_at.desc(), Ticket.id)
        )
    ).all()
    response.headers["Cache-Control"] = "no-store"
    return [
        TicketResponse.from_model(ticket, owner_name=user.display_name)
        for ticket in tickets
    ]
