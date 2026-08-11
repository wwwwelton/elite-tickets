import uuid
from datetime import datetime
from typing import Annotated, Literal, cast

from elite_tickets.auth.models import Role, User
from elite_tickets.auth.security import require_roles
from elite_tickets.db.session import get_session
from elite_tickets.shared.config import get_settings
from elite_tickets.shared.errors import ResourceNotFoundError
from elite_tickets.tickets.share_service import (
    SharedTicket,
    ShareExpiredError,
    create_or_get_ticket_share,
    get_shared_ticket,
)
from fastapi import APIRouter, Depends, Path, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(tags=["Tickets"])
PRIVATE_HEADERS = {
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
}


class TicketShareResponse(BaseModel):
    share_url: str


class SharedTicketResponse(BaseModel):
    id: uuid.UUID
    event_id: uuid.UUID
    event_title: str
    owner_name: str
    status: Literal["ACTIVE", "USED", "CANCELLED"]
    issued_at: datetime
    used_at: datetime | None
    qr_credential: str

    @classmethod
    def from_result(cls, result: SharedTicket) -> "SharedTicketResponse":
        ticket = result.ticket
        return cls(
            id=ticket.id,
            event_id=ticket.event_id,
            event_title=result.event_title,
            owner_name=result.owner_name,
            status=cast(
                Literal["ACTIVE", "USED", "CANCELLED"],
                ticket.display_status,
            ),
            issued_at=ticket.issued_at,
            used_at=ticket.used_at,
            qr_credential=ticket.qr_credential,
        )


@router.post(
    "/me/tickets/{ticketId}/share",
    response_model=TicketShareResponse,
    responses={
        403: {"description": "Ticket ownership or role is insufficient"},
        409: {"description": "Ticket is no longer shareable"},
    },
)
async def share_owned_ticket(
    ticket_id: Annotated[uuid.UUID, Path(alias="ticketId")],
    user: Annotated[User, Depends(require_roles(Role.CUSTOMER))],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TicketShareResponse:
    created = await create_or_get_ticket_share(
        session,
        ticket_id=ticket_id,
        owner_id=user.id,
    )
    web_origin = str(get_settings().cors_origins[0]).rstrip("/")
    return TicketShareResponse(
        share_url=f"{web_origin}/shared/tickets/{created.token}",
    )


@router.get(
    "/shared/tickets/{shareToken}",
    response_model=SharedTicketResponse,
    responses={
        404: {"description": "Share link not found", "headers": PRIVATE_HEADERS},
        410: {"description": "Share link expired", "headers": PRIVATE_HEADERS},
    },
)
async def shared_ticket(
    share_token: Annotated[
        str,
        Path(alias="shareToken", min_length=22, max_length=128),
    ],
    response: Response,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> SharedTicketResponse | JSONResponse:
    try:
        result = await get_shared_ticket(session, token=share_token)
    except ResourceNotFoundError:
        return _private_error(404, "not_found", "The requested resource was not found")
    except ShareExpiredError:
        return _private_error(410, "share_expired", "The shared ticket is no longer available")
    for name, value in PRIVATE_HEADERS.items():
        response.headers[name] = value
    return SharedTicketResponse.from_result(result)


def _private_error(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        headers=PRIVATE_HEADERS,
        content={"error": {"code": code, "message": message}},
    )
