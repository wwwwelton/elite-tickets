import uuid
from datetime import datetime
from decimal import Decimal
from typing import Annotated, Literal, cast

from fastapi import APIRouter, Depends, Header, Path, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from elite_tickets.auth.models import Role, User
from elite_tickets.auth.security import require_roles
from elite_tickets.db.session import get_session
from elite_tickets.reservations.models import (
    PaymentDecision,
    Reservation,
    ReservationStatus,
)
from elite_tickets.reservations.payment import (
    PaymentConflict,
    PaymentOutcome,
    process_simulated_payment,
)
from elite_tickets.reservations.service import create_reservation
from elite_tickets.tickets.models import Ticket

router = APIRouter(tags=["Reservations"])


class ReservationRequest(BaseModel):
    quantity: int = Field(ge=1)


class ReservationResponse(BaseModel):
    id: uuid.UUID
    event_id: uuid.UUID
    status: ReservationStatus
    quantity: int
    total_amount: Decimal
    expires_at: datetime

    @classmethod
    def from_model(cls, reservation: Reservation) -> "ReservationResponse":
        return cls(
            id=reservation.id,
            event_id=reservation.event_id,
            status=reservation.status,
            quantity=reservation.quantity,
            total_amount=reservation.total_amount,
            expires_at=reservation.expires_at,
        )


class PaymentRequest(BaseModel):
    payment_token: Literal["tok_approved", "tok_declined"]


class PaymentTicketResponse(BaseModel):
    id: uuid.UUID
    event_id: uuid.UUID
    owner_name: str
    status: Literal["ACTIVE", "USED", "CANCELLED"]
    issued_at: datetime
    used_at: datetime | None
    qr_credential: str

    @classmethod
    def from_model(cls, ticket: Ticket, *, owner_name: str) -> "PaymentTicketResponse":
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


class PaymentResponse(BaseModel):
    reservation: ReservationResponse
    decision: PaymentDecision
    tickets: list[PaymentTicketResponse]


@router.post(
    "/events/{eventId}/reservations",
    response_model=ReservationResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        403: {"description": "CUSTOMER role required"},
        409: {"description": "Event state or inventory conflict"},
    },
)
async def reserve_event(
    event_id: Annotated[uuid.UUID, Path(alias="eventId")],
    payload: ReservationRequest,
    user: Annotated[User, Depends(require_roles(Role.CUSTOMER))],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ReservationResponse:
    reservation = await create_reservation(
        session,
        event_id=event_id,
        customer_id=user.id,
        quantity=payload.quantity,
    )
    return ReservationResponse.from_model(reservation)


@router.post(
    "/reservations/{reservationId}/payment",
    response_model=PaymentResponse,
    responses={
        403: {"description": "Reservation ownership or role is insufficient"},
        409: {"description": "Reservation state or idempotency conflict"},
    },
)
async def pay_reservation(
    reservation_id: Annotated[uuid.UUID, Path(alias="reservationId")],
    payload: PaymentRequest,
    idempotency_key: Annotated[
        str,
        Header(alias="Idempotency-Key", min_length=8, max_length=128),
    ],
    user: Annotated[User, Depends(require_roles(Role.CUSTOMER))],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> PaymentResponse | JSONResponse:
    result = await process_simulated_payment(
        session,
        reservation_id=reservation_id,
        customer_id=user.id,
        idempotency_key=idempotency_key,
        payment_token=payload.payment_token,
    )
    if isinstance(result, PaymentConflict):
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"error": {"code": "conflict", "message": result.message}},
        )
    return _payment_response(result, owner_name=user.display_name)


def _payment_response(result: PaymentOutcome, *, owner_name: str) -> PaymentResponse:
    return PaymentResponse(
        reservation=ReservationResponse.from_model(result.reservation),
        decision=result.decision,
        tickets=[
            PaymentTicketResponse.from_model(ticket, owner_name=owner_name)
            for ticket in result.tickets
        ],
    )
